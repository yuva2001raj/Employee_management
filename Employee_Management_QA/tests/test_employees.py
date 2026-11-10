import uuid

import pytest
from playwright.sync_api import expect


def _employee_row(page, employee_id):
    return page.locator("tbody tr").filter(has_text=employee_id)


def _fill_employee_form(page, payload):
    page.get_by_label("Employee Name").fill(payload["employee_name"])
    page.get_by_label("Employee ID").fill(payload["employee_id"])
    page.get_by_label("Employee Age").fill(str(payload["age"]))
    page.get_by_label("Email Address").fill(payload["email"])


@pytest.mark.feature("Employee listing and search")
def test_search_matches_employee_name_and_id(
    admin_page, employee_factory, application
):
    employee = employee_factory(name="QA Unique Search Person")
    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill("unique search")
    expect(_employee_row(admin_page, employee["employee_id"])).to_have_count(1)
    expect(admin_page.get_by_text("1 Employees")).to_be_visible()

    search = admin_page.get_by_placeholder("Search by employee name or ID...")
    search.fill(employee["employee_id"].lower())
    expect(_employee_row(admin_page, employee["employee_id"])).to_have_count(1)
    search.fill("no-such-employee")
    expect(admin_page.get_by_text("No employees found.")).to_be_visible()


@pytest.mark.feature("Employee listing and search")
def test_age_filters_include_group_boundaries(
    admin_page, employee_factory, application
):
    expected = {}
    for age in (18, 25, 26, 40, 41):
        employee = employee_factory(
            age=age, name=f"Filter Boundary QA {age}"
        )
        expected[age] = employee["employee_id"]

    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill("Filter Boundary QA")
    age_filter = admin_page.locator("select").first
    for value, included in (
        ("18-25", (18, 25)),
        ("26-40", (26, 40)),
        ("41+", (41,)),
    ):
        age_filter.select_option(value)
        rows = admin_page.locator("tbody tr")
        expect(rows).to_have_count(len(included))
        for age in included:
            expect(_employee_row(admin_page, expected[age])).to_have_count(1)


@pytest.mark.feature("Employee listing and search")
def test_pagination_page_size_and_filter_reset(
    admin_page, employee_factory, application
):
    for index in range(11):
        employee_factory(name=f"Pager QA {index}")

    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill("Pager QA")
    expect(admin_page.get_by_text("11 Employees")).to_be_visible()
    expect(admin_page.get_by_text("Page 1 of 3")).to_be_visible()
    admin_page.get_by_role("button", name="Next").click()
    expect(admin_page.get_by_text("Page 2 of 3")).to_be_visible()

    admin_page.locator("select").nth(1).select_option("10")
    expect(admin_page.get_by_text("Page 1 of 2")).to_be_visible()
    admin_page.get_by_role("button", name="Next").click()
    expect(admin_page.get_by_text("Page 2 of 2")).to_be_visible()
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill("Pager QA 0")
    expect(admin_page.get_by_text("Page 1 of 1")).to_be_visible()


@pytest.mark.feature("Employee create and validation")
def test_admin_can_create_employee_from_form(admin_page, application):
    suffix = uuid.uuid4().hex[:12]
    payload = {
        "employee_name": "QA Created Employee",
        "employee_id": f"QA{suffix}",
        "age": 32,
        "email": f"created-{suffix}@qa-example.test",
    }
    admin_page.goto(f"{application['frontend_url']}/employees/new")
    _fill_employee_form(admin_page, payload)
    admin_page.get_by_role("button", name="Save Employee").click()
    admin_page.wait_for_url("**/employees")
    expect(
        admin_page.get_by_role("status").get_by_text(
            "Employee added successfully!"
        )
    ).to_be_visible()
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill(payload["employee_id"])
    expect(_employee_row(admin_page, payload["employee_id"])).to_be_visible()


@pytest.mark.feature("Employee create and validation")
def test_form_rejects_invalid_name_and_age(admin_page, application):
    payload = {
        "employee_name": "QA123",
        "employee_id": f"QA{uuid.uuid4().hex[:12]}",
        "age": 17,
        "email": f"invalid-{uuid.uuid4().hex[:12]}@qa-example.test",
    }
    admin_page.goto(f"{application['frontend_url']}/employees/new")
    _fill_employee_form(admin_page, payload)
    expect(
        admin_page.get_by_text("Name must contain only letters and spaces.")
    ).to_be_visible()
    expect(
        admin_page.get_by_text(
            "Age must be a whole number between 18 and 100."
        )
    ).to_be_visible()
    admin_page.get_by_role("button", name="Save Employee").click()
    expect(admin_page.get_by_role("heading", name="Add Employee")).to_be_visible()
    assert admin_page.url.endswith("/employees/new")


@pytest.mark.feature("Employee create and validation")
def test_duplicate_employee_id_is_rejected_without_creating_duplicate(
    admin_page, employee_factory, application
):
    existing = employee_factory()
    admin_page.goto(f"{application['frontend_url']}/employees/new")
    _fill_employee_form(
        admin_page,
        {
            "employee_name": "QA Duplicate Attempt",
            "employee_id": existing["employee_id"],
            "age": 35,
            "email": f"duplicate-{uuid.uuid4().hex[:12]}@qa-example.test",
        },
    )
    admin_page.get_by_role("button", name="Save Employee").click()
    expect(
        admin_page.get_by_role("alert").get_by_text(
            "This Employee ID already exists. Use another ID."
        )
    ).to_be_visible()
    expect(admin_page.get_by_role("heading", name="Add Employee")).to_be_visible()


@pytest.mark.feature("Employee update")
def test_admin_can_edit_employee(admin_page, employee_factory, application):
    employee = employee_factory(name="QA Before Update")
    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill(employee["employee_id"])
    _employee_row(admin_page, employee["employee_id"]).get_by_role(
        "button", name="Edit"
    ).click()
    admin_page.wait_for_url("**/employees/edit/**")
    admin_page.get_by_label("Employee Name").fill("QA Updated Employee")
    admin_page.get_by_label("Employee Age").fill("38")
    admin_page.get_by_role("button", name="Update Employee").click()
    admin_page.wait_for_url("**/employees")
    expect(
        admin_page.get_by_role("status").get_by_text(
            "Employee updated successfully!"
        )
    ).to_be_visible()
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill(employee["employee_id"])
    expect(
        _employee_row(admin_page, employee["employee_id"]).get_by_text(
            "QA Updated Employee"
        )
    ).to_be_visible()


@pytest.mark.feature("Employee update")
def test_edit_missing_employee_shows_not_found(admin_page, application):
    admin_page.goto(f"{application['frontend_url']}/employees/edit/987654321")
    expect(
        admin_page.get_by_role("alert").get_by_text("Employee not found.")
    ).to_be_visible()


@pytest.mark.feature("Employee delete")
def test_delete_confirmation_cancel_keeps_employee(
    admin_page, employee_factory, application
):
    employee = employee_factory()
    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill(employee["employee_id"])
    row = _employee_row(admin_page, employee["employee_id"])
    row.get_by_role("button", name="Delete").click()
    expect(admin_page.get_by_role("heading", name="Delete Employee?")).to_be_visible()
    admin_page.get_by_role("button", name="Cancel").click()
    expect(admin_page.get_by_role("heading", name="Delete Employee?")).to_have_count(0)
    expect(_employee_row(admin_page, employee["employee_id"])).to_be_visible()


@pytest.mark.feature("Employee delete")
def test_confirm_delete_removes_only_selected_test_employee(
    admin_page, employee_factory, application
):
    employee = employee_factory()
    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill(employee["employee_id"])
    _employee_row(admin_page, employee["employee_id"]).get_by_role(
        "button", name="Delete"
    ).click()
    admin_page.get_by_role("heading", name="Delete Employee?").wait_for()
    admin_page.get_by_role("button", name="Delete", exact=True).last.click()
    expect(
        admin_page.get_by_role("status").get_by_text(
            "Employee deleted successfully!"
        )
    ).to_be_visible()
    expect(_employee_row(admin_page, employee["employee_id"])).to_have_count(0)


@pytest.mark.feature("Employee login creation")
def test_admin_can_create_employee_login(
    admin_page, employee_factory, application
):
    employee = employee_factory()
    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill(employee["employee_id"])
    _employee_row(admin_page, employee["employee_id"]).get_by_role(
        "button", name="Create Login"
    ).click()
    admin_page.get_by_role("heading", name="Create Employee Login").wait_for()
    login_email = f"ui-account-{uuid.uuid4().hex[:12]}@qa-example.test"
    admin_page.get_by_placeholder("Enter employee login email").fill(login_email)
    admin_page.get_by_placeholder("Enter a password").fill("EmployeePass!234")
    admin_page.get_by_role("button", name="Create Account").click()
    expect(
        admin_page.get_by_role("status").get_by_text(
            "Employee account created successfully."
        )
    ).to_be_visible()


@pytest.mark.feature("Employee login creation")
def test_create_login_form_cancel_closes_form(
    admin_page, employee_factory, application
):
    employee = employee_factory()
    admin_page.goto(f"{application['frontend_url']}/employees")
    admin_page.get_by_placeholder(
        "Search by employee name or ID..."
    ).fill(employee["employee_id"])
    _employee_row(admin_page, employee["employee_id"]).get_by_role(
        "button", name="Create Login"
    ).click()
    admin_page.get_by_role("heading", name="Create Employee Login").wait_for()
    admin_page.get_by_role("button", name="Cancel").click()
    expect(
        admin_page.get_by_role("heading", name="Create Employee Login")
    ).to_have_count(0)
