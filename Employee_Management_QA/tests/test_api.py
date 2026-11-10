import uuid

import pytest


@pytest.mark.feature("API and database")
def test_health_endpoint_returns_service_message(api_context):
    response = api_context.get("/")
    assert response.status == 200
    assert response.json()["message"] == "Employee Management API is running!"


@pytest.mark.feature("API and database")
def test_employee_crud_persists_data_in_isolated_database(
    api_context, admin_headers
):
    suffix = uuid.uuid4().hex[:12]
    employee_data = {
        "employee_name": "QA API Employee",
        "employee_id": f"API{suffix}",
        "age": 29,
        "email": f"api-{suffix}@qa-example.test",
    }
    create_response = api_context.post(
        "/employees/", data=employee_data, headers=admin_headers
    )
    assert create_response.status == 201
    employee = create_response.json()

    read_response = api_context.get("/employees", headers=admin_headers)
    assert read_response.status == 200
    assert employee in read_response.json()

    update_response = api_context.put(
        f"/employees/{employee['id']}",
        data={"employee_name": "QA API Updated", "age": 31},
        headers=admin_headers,
    )
    assert update_response.status == 200
    assert update_response.json()["employee_name"] == "QA API Updated"

    persisted = api_context.get("/employees", headers=admin_headers).json()
    assert next(item for item in persisted if item["id"] == employee["id"])[
        "age"
    ] == 31

    delete_response = api_context.delete(
        f"/employees/{employee['id']}", headers=admin_headers
    )
    assert delete_response.status == 200
    remaining = api_context.get("/employees", headers=admin_headers).json()
    assert all(item["id"] != employee["id"] for item in remaining)


@pytest.mark.feature("API and database")
@pytest.mark.parametrize("age", [17, 101])
def test_api_rejects_out_of_range_employee_age(
    api_context, admin_headers, age
):
    suffix = uuid.uuid4().hex[:12]
    response = api_context.post(
        "/employees/",
        data={
            "employee_name": "QA Invalid Age",
            "employee_id": f"BAD{suffix}",
            "age": age,
            "email": f"bad-age-{suffix}@qa-example.test",
        },
        headers=admin_headers,
    )
    assert response.status == 422


@pytest.mark.feature("API and database")
def test_duplicate_employee_id_is_rejected_and_original_record_remains(
    api_context, admin_headers, employee_factory
):
    original = employee_factory()
    suffix = uuid.uuid4().hex[:12]
    duplicate = api_context.post(
        "/employees/",
        data={
            "employee_name": "QA Duplicate API",
            "employee_id": original["employee_id"],
            "age": 40,
            "email": f"dup-api-{suffix}@qa-example.test",
        },
        headers=admin_headers,
    )
    assert duplicate.status == 409
    records = api_context.get("/employees", headers=admin_headers).json()
    assert sum(item["employee_id"] == original["employee_id"] for item in records) == 1


@pytest.mark.feature("API and database")
def test_update_and_delete_missing_employee_return_not_found(
    api_context, admin_headers
):
    update = api_context.put(
        "/employees/987654321",
        data={"employee_name": "QA Missing"},
        headers=admin_headers,
    )
    delete = api_context.delete(
        "/employees/987654321", headers=admin_headers
    )
    assert update.status == 404
    assert delete.status == 404


@pytest.mark.feature("API and database")
def test_employee_profile_update_keeps_employee_id_unchanged(
    api_context, employee_account_factory
):
    employee, account = employee_account_factory()
    login = api_context.post("/auth/login", data=account)
    assert login.status == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = api_context.put(
        "/employees/me",
        data={
            "employee_name": "QA Self Updated",
            "employee_id": "QA_FORGED",
        },
        headers=headers,
    )
    assert response.status == 200
    assert response.json()["employee_id"] == employee["employee_id"]
