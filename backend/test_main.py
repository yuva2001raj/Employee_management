import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine,SQLModel
from sqlalchemy.pool import StaticPool

import main

@pytest.fixture
def client(monkeypatch):
    
    #Create a separate in-memory database for testing.
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Replace the application's database engine during tests.
    monkeypatch.setattr(main, "engine", test_engine)
    
    # Create the database tables in the test database.
    SQLModel.metadata.create_all(test_engine)
    
    # Start the app and provide a test client.
    with TestClient(main.app) as test_client:
        yield test_client
        
    test_engine.dispose()
    
    
def test_create_employee(client):
    response = client.post(
        "/employees/",
        json={
            "employee_name": "Arun kumar",
            "employee_id": "EMP101",
            "age": 25,
            "email": "arun@example.com",
        },
    )
    
    assert response.status_code == 201
    assert response.json()["employee_name"] == "Arun kumar"
    assert response.json()["employee_id"] == "EMP101"
    assert "id" in response.json()
    
def test_get_employee(client):
    # Create an employee first.
    client.post(
        "/employees/",
        json={
            "employee_name": "Arun kumar",
            "employee_id": "EMP101",
            "age": 25,
            "email": "arun@example.com",
        },
    )
    
    response = client.get("/employees")
    
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["employee_id"] == "EMP101"
    
    
def test_duplicate_employee_id(client):
    employee_data = {
        "employee_name": "Arun kumar",
        "employee_id": "EMP101",
        "age": 25,
        "email": "arun@example.com",
    }
    
    # The first employee should be created successfully.
    first_response = client.post(
        "/employees/",
        json=employee_data,
    )
    
    assert first_response.status_code == 201
    
    # The Same employee ID should be rejected.
    duplicate_response = client.post(
        "/employees/",
        json={
            **employee_data,
            "employee_name": "Another Employee",
            "email": "another@example.com,"
        },
    )
    
    assert duplicate_response.status_code == 409
    assert(
        duplicate_response.json()["detail"]
        == "An employee with this employee ID already exists."
    )
    
def test_update_employee(client):
    # create an employee.
    create_response = client.post(
        "/employees/",
        json={
            "employee_name": "Arun kumar",
            "employee_id": "EMP101",
            "age": 25,
            "email": "arun@example.com",
        },
        
    )
    
    assert create_response.status_code == 201

    employee_pk = create_response.json()["id"]

    # Update the employee's details.
    update_response = client.put(
        f"/employees/{employee_pk}",
        json={
            "employee_name": "Arun Updated",
            "age": 26,
        },
    )

    assert update_response.status_code == 200
    assert update_response.json()["employee_name"] == "Arun Updated"
    assert update_response.json()["age"] == 26
    assert update_response.json()["employee_id"] == "EMP101"

def test_update_duplicate_employee_id(client):
    # Create two employees with different IDs.
    for employee_id, name in [
        ("EMP101", "Arun kumar"),
        ("EMP103","Karthik kumar"),
    ]:
        response = client.post(
            "/employees/",
            json={
                "employee_name": name,
                "employee_id": employee_id,
                "age": 25,
                "email": f"{employee_id.lower()}@example.com",
            },
        )
        assert response.status_code == 201
    
    employees = client.get("/employees").json()
    first_employee = next(
        e for e in employees if e["employee_id"] == "EMP101"
    )
    second_employee = next(
        e for e in employees if e["employee_id"] == "EMP103"
    )
    
    # Try to change the second employee's ID to the first one's ID.
    response = client.put(
        f"/employees/{second_employee["id"]}",
        json={"employee_id": first_employee["employee_id"]},
    )
    assert response.status_code == 409
    
    # Verify that the original ID remains unchanged.
    updated_employee = client.get("/employees").json()
    second_after = next(
        e for e in updated_employee
        if e["id"] == second_employee["id"]
    )
    assert second_after["employee_id"] == "EMP103"
    

def test_delete_employee(client):
    # Create an employee.
    create_response = client.post(
            "/employees/",
            json={
                "employee_name": "Arun kumar",
                "employee_id": "EMP101",
                "age": 25,
                "email": "arun@example.com",
            },
    )
    assert create_response.status_code == 201
        
    employee_pk = create_response.json()["id"]
    
    # Delete the employee.
    delete_response = client.delete(
        f"/employees/{employee_pk}"
    )
    
    assert delete_response.status_code == 200
    assert delete_response.json() == {
        "message": "Employee deleted successfully."
    }
    
    # Confirm the employee is no longer in the database.
    employee_response = client.get("/employees")
    assert employee_response.status_code == 200
    assert employee_response.json() == []