import pytest
from playwright.sync_api import expect


@pytest.mark.feature("Employee form validation")
def test_add_employee_with_empty_fields_is_blocked(admin_page, application):
    admin_page.goto(f"{application['frontend_url']}/employees/new")

    for label in (
        "Employee Name",
        "Employee ID",
        "Employee Age",
        "Email Address",
    ):
        field = admin_page.get_by_label(label)
        expect(field).to_be_visible()
        assert field.evaluate("(element) => element.required")

    admin_page.get_by_role("button", name="Save Employee").click()
    assert admin_page.url.endswith("/employees/new")
    assert not admin_page.locator("form").evaluate(
        "(form) => form.checkValidity()"
    )


@pytest.mark.feature("Employee form validation")
def test_add_employee_rejects_invalid_email(admin_page, application):
    admin_page.goto(f"{application['frontend_url']}/employees/new")
    admin_page.get_by_label("Employee Name").fill("QA Invalid Email")
    admin_page.get_by_label("Employee ID").fill("QAInvalidEmail")
    admin_page.get_by_label("Employee Age").fill("35")
    email = admin_page.get_by_label("Email Address")
    email.fill("not-an-email")

    assert email.evaluate("(element) => element.validity.typeMismatch")
    admin_page.get_by_role("button", name="Save Employee").click()
    assert admin_page.url.endswith("/employees/new")


@pytest.mark.feature("Responsive layout")
@pytest.mark.parametrize(
    "width,height",
    [(1440, 1000), (768, 1024), (390, 844)],
    ids=["desktop", "tablet", "mobile"],
)
def test_employee_list_layout_at_supported_viewports(
    admin_page, application, width, height
):
    admin_page.set_viewport_size({"width": width, "height": height})
    admin_page.goto(f"{application['frontend_url']}/employees")

    expect(
        admin_page.get_by_role("heading", name="Employees", exact=True)
    ).to_be_visible()
    expect(
        admin_page.get_by_placeholder("Search by employee name or ID...")
    ).to_be_visible()
    assert admin_page.evaluate(
        "() => document.documentElement.scrollWidth <= "
        "document.documentElement.clientWidth"
    )

    menu_button = admin_page.get_by_role(
        "button", name="Open navigation menu"
    )
    if width < 768:
        expect(menu_button).to_be_visible()
        menu_button.click()
        expect(
            admin_page.locator("#mobile-navigation").get_by_role(
                "link", name="Employees", exact=True
            )
        ).to_be_visible()
    else:
        expect(menu_button).to_be_hidden()
        expect(
            admin_page.get_by_role("link", name="Employees", exact=True)
        ).to_be_visible()


@pytest.mark.feature("Navigation")
def test_admin_can_navigate_between_about_dashboard_and_employees(admin_page):
    admin_page.get_by_role("link", name="About", exact=True).click()
    expect(admin_page.get_by_role("heading", name="Project Overview")).to_be_visible()

    admin_page.get_by_role("link", name="Dashboard", exact=True).click()
    expect(admin_page.get_by_role("heading", name="Workforce Overview")).to_be_visible()

    admin_page.get_by_role("link", name="Employees", exact=True).click()
    expect(admin_page.get_by_role("heading", name="All Employees")).to_be_visible()
