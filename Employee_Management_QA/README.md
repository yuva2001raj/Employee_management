# Employee Management QA Suite

This directory contains a Python, pytest, and Playwright acceptance and API
test suite for the Employee Management application. It does not modify the
frontend or backend source.

## Safety and isolation

The test harness launches the existing backend on `127.0.0.1:8000` and the
existing Vite frontend on `localhost:5173`. The frontend currently has its API
URL and allowed CORS origin fixed to those addresses, so the suite checks that
the ports are free before starting either service.

The backend process runs with a temporary working directory created inside
this QA folder. The application's relative `employees.db` file is therefore
created only in that temporary directory and removed when the test session
ends. Test accounts and employees are generated for the isolated database;
the existing application database and real employee records are not used.
The seeded administrator credentials are test-only and supplied through
environment variables to the child backend process.
Test data uses unique IDs and addresses within the run. The temporary database
is discarded when pytest stops, including employee accounts that the
application does not expose a deletion endpoint for.

## Setup

From this directory, install the QA dependencies:

```powershell
python -m pip install -r requirements.txt
python -m playwright install chromium
```

The frontend dependencies must already be installed in `frontend`:

```powershell
cd ..\frontend
npm install
cd ..\Employee_Management_QA
```

The test fixture starts and stops both application services automatically.
Run all tests with:

```powershell
python -m pytest
```

To run one area:

```powershell
python -m pytest tests\test_employees.py
```

## Test areas

- Authentication, employee-account creation, and role-based authorization
- Public/protected navigation
- Dashboard statistics and quick actions
- Employee list, search, age filters, and pagination
- Employee create, update, delete, and form validation
- Employee self-profile and profile update rules
- API validation, authorization, CRUD, and database persistence
- Responsive list/navigation behavior at desktop, tablet, and mobile widths

## Reports

Pytest generates `reports\pytest-report.html` and a concise
`reports\test-summary.md` / `reports\test-results.json` summary. Failed browser
tests capture screenshots under `reports\screenshots`. The summary distinguishes
test failures from confirmed bugs; failures require triage before being called
application defects.
