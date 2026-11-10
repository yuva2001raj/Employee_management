import os
import json
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import pytest
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import Page, Playwright, sync_playwright


QA_DIR = Path(__file__).resolve().parent
PROJECT_DIR = QA_DIR.parent
BACKEND_DIR = PROJECT_DIR / "backend"
FRONTEND_DIR = PROJECT_DIR / "frontend"
FRONTEND_URL = "http://localhost:5173"
API_URL = "http://127.0.0.1:8000"
ADMIN_EMAIL = "qa-admin@qa-example.test"
ADMIN_PASSWORD = "QaAdminPass!234"


def _assert_port_available(port: int, host: str) -> None:
    with socket.socket() as sock:
        try:
            sock.bind((host, port))
        except OSError as exc:
            raise RuntimeError(
                f"Required QA port {host}:{port} is already in use. "
                "Stop the other service and rerun pytest."
            ) from exc


def _wait_for_url(
    url: str, process: subprocess.Popen, service: str, log_path: Path
) -> None:
    deadline = time.monotonic() + 45
    last_error = None

    while time.monotonic() < deadline:
        if process.poll() is not None:
            output = log_path.read_text(encoding="utf-8", errors="replace")
            raise RuntimeError(
                f"{service} exited before becoming ready "
                f"(exit code {process.returncode}).\n{output}"
            )

        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status < 500:
                    return
        except (OSError, urllib.error.URLError) as exc:
            last_error = exc
        time.sleep(0.25)

    raise RuntimeError(
        f"{service} did not become ready at {url}. Last error: {last_error}"
    )


def _stop_process(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=10)


@pytest.fixture(scope="session")
def application():
    if not BACKEND_DIR.is_dir() or not FRONTEND_DIR.is_dir():
        raise RuntimeError("Expected project backend and frontend directories.")

    node = shutil.which("node")
    vite_cli = FRONTEND_DIR / "node_modules" / "vite" / "bin" / "vite.js"
    if not node or not vite_cli.is_file():
        raise RuntimeError(
            "Node.js and frontend dependencies are required. "
            "Install the existing frontend dependencies with npm install."
        )

    _assert_port_available(8000, "127.0.0.1")
    _assert_port_available(5173, "127.0.0.1")

    runtime_dir = tempfile.TemporaryDirectory(
        prefix="employee-qa-runtime-", dir=QA_DIR
    )
    backend_env = os.environ.copy()
    backend_env.update(
        {
            "JWT_SECRET_KEY": "qa-only-secret-key-not-for-production",
            "ADMIN_EMAIL": ADMIN_EMAIL,
            "ADMIN_PASSWORD": ADMIN_PASSWORD,
        }
    )

    backend_process = None
    frontend_process = None
    backend_log = Path(runtime_dir.name) / "backend.log"
    frontend_log = Path(runtime_dir.name) / "frontend.log"
    backend_log_handle = backend_log.open("w", encoding="utf-8")
    frontend_log_handle = frontend_log.open("w", encoding="utf-8")
    try:
        backend_process = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "main:app",
                "--app-dir",
                str(BACKEND_DIR),
                "--host",
                "127.0.0.1",
                "--port",
                "8000",
            ],
            cwd=runtime_dir.name,
            env=backend_env,
            stdout=backend_log_handle,
            stderr=subprocess.STDOUT,
        )
        _wait_for_url(
            f"{API_URL}/", backend_process, "FastAPI backend", backend_log
        )

        frontend_process = subprocess.Popen(
            [
                node,
                str(vite_cli),
                "--host",
                "0.0.0.0",
                "--port",
                "5173",
                "--strictPort",
            ],
            cwd=FRONTEND_DIR,
            env=os.environ.copy(),
            stdout=frontend_log_handle,
            stderr=subprocess.STDOUT,
        )
        _wait_for_url(
            FRONTEND_URL, frontend_process, "Vite frontend", frontend_log
        )
        yield {
            "frontend_url": FRONTEND_URL,
            "api_url": API_URL,
        }
    finally:
        _stop_process(frontend_process)
        _stop_process(backend_process)
        frontend_log_handle.close()
        backend_log_handle.close()
        runtime_dir.cleanup()


@pytest.fixture(scope="session")
def playwright_instance(application) -> Playwright:
    with sync_playwright() as playwright:
        yield playwright


@pytest.fixture(scope="session")
def browser(playwright_instance):
    browser_instance = playwright_instance.chromium.launch(headless=True)
    yield browser_instance
    browser_instance.close()


@pytest.fixture
def context(browser):
    browser_context = browser.new_context(
        viewport={"width": 1440, "height": 1000}
    )
    yield browser_context
    browser_context.close()


@pytest.fixture
def page(context) -> Page:
    return context.new_page()


@pytest.fixture
def api_context(playwright_instance, application):
    request_context = playwright_instance.request.new_context(
        base_url=application["api_url"]
    )
    yield request_context
    request_context.dispose()


@pytest.fixture
def admin_headers(api_context):
    response = api_context.post(
        "/auth/login",
        data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert response.status == 200, response.text()
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def employee_factory(api_context, admin_headers):
    template_path = QA_DIR / "test_data" / "employee_templates.json"
    template = json.loads(template_path.read_text(encoding="utf-8"))["employee"]

    def create_employee(*, name=None, age=None, employee_id=None, email=None):
        suffix = uuid.uuid4().hex[:12]
        payload = {
            "employee_name": name or template["employee_name"],
            "employee_id": employee_id or f"QA{suffix}",
            "age": age if age is not None else template["age"],
            "email": email or f"employee-{suffix}@{template['email_domain']}",
        }
        response = api_context.post(
            "/employees/", data=payload, headers=admin_headers
        )
        assert response.status == 201, response.text()
        return response.json()

    return create_employee


@pytest.fixture
def admin_page(page, application):
    page.goto(f"{application['frontend_url']}/login")
    page.get_by_label("Email Address").fill(ADMIN_EMAIL)
    page.get_by_label("Password").fill(ADMIN_PASSWORD)
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url("**/dashboard")
    return page


@pytest.fixture
def employee_account_factory(api_context, admin_headers, employee_factory):
    def create_employee_account(employee=None):
        employee = employee or employee_factory()
        suffix = uuid.uuid4().hex[:12]
        account = {
            "email": f"account-{suffix}@qa-example.test",
            "password": "EmployeePass!234",
            "employee_id": employee["id"],
        }
        response = api_context.post(
            "/auth/create-employee",
            data=account,
            headers=admin_headers,
        )
        assert response.status == 200, response.text()
        return employee, account

    return create_employee_account


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    reports = getattr(item, "_reports", {})
    reports[report.when] = report
    item._reports = reports
    if report.when != "call" or not report.failed:
        return

    page = item.funcargs.get("page")
    if page is None:
        return

    screenshot_dir = QA_DIR / "reports" / "screenshots"
    screenshot_dir.mkdir(parents=True, exist_ok=True)
    screenshot_path = screenshot_dir / (
        f"{item.nodeid.replace('::', '_').replace('/', '_')}.png"
    )
    try:
        page.screenshot(path=str(screenshot_path), full_page=True)
        item._failure_screenshot = screenshot_path.relative_to(QA_DIR)
    except (PlaywrightError, OSError):
        item._failure_screenshot = None


def pytest_sessionfinish(session, exitstatus):
    reports_dir = QA_DIR / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    tests = []
    for item in session.items:
        reports = getattr(item, "_reports", {})
        call_report = reports.get("call")
        if call_report is None:
            continue
        feature_marker = item.get_closest_marker("feature")
        feature = feature_marker.args[0] if feature_marker else "Uncategorized"
        tests.append(
            {
                "nodeid": item.nodeid,
                "feature": feature,
                "outcome": call_report.outcome,
                "screenshot": (
                    str(item._failure_screenshot)
                    if getattr(item, "_failure_screenshot", None)
                    else None
                ),
                "longrepr": str(call_report.longrepr) if call_report.failed else "",
            }
        )

    counts = {
        outcome: sum(test["outcome"] == outcome for test in tests)
        for outcome in ("passed", "failed", "skipped")
    }
    features = sorted({test["feature"] for test in tests})
    failures = [test for test in tests if test["outcome"] == "failed"]
    failure_screenshots = [
        test["screenshot"] for test in failures if test["screenshot"]
    ]
    lines = [
        "# Employee Management QA Test Report",
        "",
        f"- **Total test cases:** {len(tests)}",
        f"- **Passed:** {counts['passed']}",
        f"- **Failed:** {counts['failed']}",
        f"- **Skipped:** {counts['skipped']}",
        f"- **Features tested:** {', '.join(features) if features else 'None'}",
        "- **API testing:** Included in the API-marked test cases.",
        (
            "- **Failure screenshots:** "
            + (
                ", ".join(f"`{path}`" for path in failure_screenshots)
                if failure_screenshots
                else "None captured in this run."
            )
        ),
        "",
        "## Failure and bug triage",
        "",
    ]
    if failures:
        lines.append(
            "The following tests failed. Each failure requires triage before "
            "being classified as an application bug; environment and "
            "automation failures are not reported as confirmed bugs."
        )
        lines.append("")
        for failure in failures:
            lines.append(f"- `{failure['nodeid']}`")
            if failure["screenshot"]:
                lines.append(f"  - Screenshot: `{failure['screenshot']}`")
            detail = failure["longrepr"].splitlines()
            if detail:
                lines.append(f"  - Failure: {detail[-1][:500]}")
    else:
        lines.append("No failing test cases were recorded in this run.")

    lines.extend(["", "## Bugs identified", ""])
    if failures:
        lines.append(
            "No defects are confirmed automatically. Investigate the failures "
            "above and classify each as an application, automation, or "
            "environment issue."
        )
    else:
        lines.append("No bugs were identified by this automated test run.")

    lines.extend(
        [
            "",
            "## Recommendations",
            "",
            "- Manually review visual styling and interactions on real "
            "touchscreen devices; the responsive checks use Chromium viewport "
            "emulation.",
            "- Run additional browser-engine coverage (Firefox and WebKit) "
            "before release.",
            "- Keep the QA backend database isolated from application data.",
            "",
            "Detailed per-test results are in `pytest-report.html`.",
        ]
    )
    (reports_dir / "test-summary.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )
    (reports_dir / "test-results.json").write_text(
        json.dumps(
            {
                "exit_status": exitstatus,
                "counts": counts,
                "features": features,
                "tests": [
                    {key: value for key, value in test.items() if key != "longrepr"}
                    for test in tests
                ],
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
