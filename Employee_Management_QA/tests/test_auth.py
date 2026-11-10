import uuid

import pytest
from playwright.sync_api import expect


@pytest.mark.feature("Authentication and authorization")
def test_admin_can_sign_in_and_sign_out(admin_page):
    expect(admin_page.get_by_role("heading", name="Dashboard")).to_be_visible()
    expect(admin_page.get_by_text("qa-admin@qa-example.test").first).to_be_visible()
    admin_page.get_by_role("button", name="Logout").click()
    admin_page.wait_for_url("**/login")
    assert admin_page.evaluate("localStorage.getItem('access_token')") is None


@pytest.mark.feature("Authentication and authorization")
def test_invalid_credentials_show_error(page, application):
    page.goto(f"{application['frontend_url']}/login")
    page.get_by_label("Email Address").fill("missing@qa-example.test")
    page.get_by_label("Password").fill("incorrect-password")
    page.get_by_role("button", name="Sign In").click()
    expect(
        page.get_by_role("alert").get_by_text("Invalid email or password.")
    ).to_be_visible()


@pytest.mark.feature("Authentication and authorization")
def test_api_rejects_invalid_credentials(api_context):
    response = api_context.post(
        "/auth/login",
        data={
            "email": "missing@qa-example.test",
            "password": "incorrect-password",
        },
    )
    assert response.status == 401


@pytest.mark.feature("Authentication and authorization")
def test_employee_role_is_limited_to_own_profile(
    api_context, employee_account_factory, application, page
):
    employee, account = employee_account_factory()
    login_response = api_context.post("/auth/login", data=account)
    assert login_response.status == 200
    employee_headers = {
        "Authorization": f"Bearer {login_response.json()['access_token']}"
    }

    assert api_context.get("/employees", headers=employee_headers).status == 403
    profile_response = api_context.get("/employees/me", headers=employee_headers)
    assert profile_response.status == 200
    assert profile_response.json()["id"] == employee["id"]

    page.goto(f"{application['frontend_url']}/login")
    page.get_by_label("Email Address").fill(account["email"])
    page.get_by_label("Password").fill(account["password"])
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url("**/profile")
    page.goto(f"{application['frontend_url']}/dashboard")
    page.wait_for_url("**/profile")
    expect(page.get_by_role("heading", name="My Profile")).to_be_visible()


@pytest.mark.feature("Authentication and authorization")
@pytest.mark.parametrize(
    "headers",
    [{}, {"Authorization": "Bearer invalid-token"}],
    ids=["missing-token", "invalid-token"],
)
def test_employee_api_requires_valid_bearer_token(api_context, headers):
    response = api_context.get("/employees/me", headers=headers)
    assert response.status in (401, 403)


@pytest.mark.feature("Authentication and authorization")
def test_account_creation_rejects_unknown_employee(api_context, admin_headers):
    response = api_context.post(
        "/auth/create-employee",
        data={
            "email": f"unknown-{uuid.uuid4().hex}@qa-example.test",
            "password": "EmployeePass!234",
            "employee_id": 987654321,
        },
        headers=admin_headers,
    )
    assert response.status == 404


@pytest.mark.feature("Authentication and authorization")
def test_duplicate_employee_login_is_rejected(
    api_context, admin_headers, employee_account_factory
):
    employee, account = employee_account_factory()
    response = api_context.post(
        "/auth/create-employee",
        data={
            "email": f"another-{uuid.uuid4().hex}@qa-example.test",
            "password": "EmployeePass!234",
            "employee_id": employee["id"],
        },
        headers=admin_headers,
    )
    assert response.status == 400
    assert "already has a login account" in response.json()["detail"]


@pytest.mark.feature("Authentication and authorization")
def test_duplicate_login_email_is_rejected(
    api_context, admin_headers, employee_factory
):
    first_employee = employee_factory()
    second_employee = employee_factory()
    email = f"shared-{uuid.uuid4().hex}@qa-example.test"
    for employee in (first_employee, second_employee):
        response = api_context.post(
            "/auth/create-employee",
            data={
                "email": email,
                "password": "EmployeePass!234",
                "employee_id": employee["id"],
            },
            headers=admin_headers,
        )
    assert response.status == 400
    assert "already registered" in response.json()["detail"]
