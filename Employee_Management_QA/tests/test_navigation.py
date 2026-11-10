import pytest
from playwright.sync_api import expect


@pytest.mark.feature("Navigation and access control")
def test_about_page_is_public_and_renders_project_details(page, application):
    page.goto(f"{application['frontend_url']}/about")
    expect(page.get_by_role("heading", name="Project Overview")).to_be_visible()
    expect(page.get_by_role("heading", name="Technology Stack")).to_be_visible()
    expect(page.get_by_role("heading", name="Key Features")).to_be_visible()


@pytest.mark.feature("Navigation and access control")
@pytest.mark.parametrize(
    "path",
    [
        "/dashboard",
        "/employees",
        "/employees/new",
        "/employees/edit/1",
        "/profile",
    ],
)
def test_protected_routes_redirect_anonymous_user(page, application, path):
    page.goto(f"{application['frontend_url']}{path}")
    page.wait_for_url("**/login")
    expect(page.get_by_role("heading", name="Welcome Back")).to_be_visible()


@pytest.mark.feature("Navigation and access control")
def test_admin_navigation_links_are_available(admin_page):
    for label in ("Dashboard", "Employees", "Add Employee", "About"):
        expect(admin_page.get_by_role("link", name=label, exact=True)).to_be_visible()


@pytest.mark.feature("Navigation and access control")
def test_unknown_route_returns_to_login_for_anonymous_user(page, application):
    page.goto(f"{application['frontend_url']}/not-a-real-route")
    page.wait_for_url("**/login")
    expect(page.get_by_role("heading", name="Welcome Back")).to_be_visible()
