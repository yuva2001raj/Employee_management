import uuid

import pytest
from playwright.sync_api import expect


@pytest.mark.feature("Employee profile")
def test_employee_can_update_own_profile_and_changes_persist(
    page, application, employee_account_factory, api_context
):
    employee, account = employee_account_factory()
    page.goto(f"{application['frontend_url']}/login")
    page.get_by_label("Email Address").fill(account["email"])
    page.get_by_label("Password").fill(account["password"])
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url("**/profile")
    expect(page.get_by_label("Employee ID")).to_have_value(employee["employee_id"])

    new_name = "QA Profile Updated"
    page.get_by_label("Employee Name").fill(new_name)
    page.get_by_label("Age").fill("44")
    page.get_by_label("Email Address").fill(
        f"profile-{uuid.uuid4().hex[:12]}@qa-example.test"
    )
    page.get_by_role("button", name="Save Changes").click()
    expect(
        page.get_by_role("status").get_by_text(
            "Your profile has been updated successfully."
        )
    ).to_be_visible()

    token_response = api_context.post(
        "/auth/login",
        data={
            "email": page.get_by_label("Email Address").input_value(),
            "password": account["password"],
        },
    )
    assert token_response.status == 200
    headers = {
        "Authorization": f"Bearer {token_response.json()['access_token']}"
    }
    profile_response = api_context.get("/employees/me", headers=headers)
    assert profile_response.status == 200
    assert profile_response.json()["employee_name"] == new_name
    assert profile_response.json()["age"] == 44
    assert profile_response.json()["employee_id"] == employee["employee_id"]


@pytest.mark.feature("Employee profile")
def test_employee_profile_id_is_not_mutable(
    page, application, employee_account_factory
):
    employee, account = employee_account_factory()
    page.goto(f"{application['frontend_url']}/login")
    page.get_by_label("Email Address").fill(account["email"])
    page.get_by_label("Password").fill(account["password"])
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url("**/profile")

    employee_id_field = page.get_by_label("Employee ID")
    original_id = employee_id_field.input_value()
    employee_id_field.fill("QA_CHANGED")
    page.get_by_role("button", name="Save Changes").click()
    expect(
        page.get_by_role("status").get_by_text(
            "Your profile has been updated successfully."
        )
    ).to_be_visible()
    expect(employee_id_field).to_have_value(original_id)
    assert employee["employee_id"] == original_id


@pytest.mark.feature("Employee profile")
def test_employee_profile_update_rejects_duplicate_account_email(
    page, application, employee_account_factory
):
    employee_account_factory()
    employee, account = employee_account_factory()
    page.goto(f"{application['frontend_url']}/login")
    page.get_by_label("Email Address").fill(account["email"])
    page.get_by_label("Password").fill(account["password"])
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_url("**/profile")
    page.get_by_label("Email Address").fill("qa-admin@qa-example.test")
    page.get_by_role("button", name="Save Changes").click()
    expect(
        page.get_by_role("alert").get_by_text(
            "Email address is already registered."
        )
    ).to_be_visible()
    assert employee["id"] > 0
