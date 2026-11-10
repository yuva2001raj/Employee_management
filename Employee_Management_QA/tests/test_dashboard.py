import json
from pathlib import Path

import pytest
from playwright.sync_api import expect


@pytest.mark.feature("Dashboard")
def test_dashboard_statistics_and_quick_actions(
    admin_page, employee_factory, api_context, admin_headers
):
    template_path = Path(__file__).resolve().parents[1] / "test_data" / "employee_templates.json"
    ages = json.loads(template_path.read_text(encoding="utf-8"))[
        "ages_for_dashboard"
    ]
    before = api_context.get("/employees", headers=admin_headers).json()
    created = []
    for index, age in enumerate(ages):
        created.append(
            employee_factory(name=f"Dashboard QA {index}", age=age)
        )
    all_ages = [employee["age"] for employee in before] + ages

    admin_page.reload()
    admin_page.get_by_role("heading", name="Workforce Overview").wait_for()

    total_card = admin_page.get_by_text("Total Employees", exact=True).locator(
        "xpath=../.."
    )
    expect(total_card.locator("p").nth(1)).to_have_text(str(len(all_ages)))
    average_card = admin_page.get_by_text("Average Age", exact=True).locator(
        "xpath=../.."
    )
    expected_average = f"{sum(all_ages) / len(all_ages):.1f}"
    expect(average_card.locator("p").nth(1)).to_have_text(expected_average)

    expect(admin_page.get_by_text("18-25 years", exact=True)).to_be_visible()
    expect(admin_page.get_by_text("26-40 years", exact=True)).to_be_visible()
    expect(admin_page.get_by_text("41+ years", exact=True)).to_be_visible()
    expect(admin_page.get_by_role("link", name="View Employees")).to_be_visible()
    expect(admin_page.get_by_role("link", name="Add New Employee")).to_be_visible()

    expected_recent_ids = [
        employee["employee_id"]
        for employee in sorted(
            before + created, key=lambda employee: employee["id"], reverse=True
        )[:5]
    ]
    recent_section = admin_page.get_by_role(
        "heading", name="Recent Employees", exact=True
    ).locator("xpath=ancestor::section[1]")
    actual_recent_ids = [
        row.locator("td").nth(1).inner_text()
        for row in recent_section.get_by_role("row").all()[1:]
    ]
    assert actual_recent_ids == expected_recent_ids


@pytest.mark.feature("Dashboard")
def test_dashboard_add_employee_action_opens_form(admin_page):
    admin_page.get_by_role("link", name="+ Add Employee").click()
    admin_page.wait_for_url("**/employees/new")
    expect(admin_page.get_by_role("heading", name="Add Employee")).to_be_visible()
