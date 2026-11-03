# Employee Management System

A full-stack Employee Management System built with **React, Tailwind CSS, FastAPI, and SQLite**. This application allows users to manage employee records through a clean, responsive interface.

## 1. Project Overview

The Employee Management System is a web application designed to simplify employee record management.

Users can add, view, search, update, and delete employee information. The dashboard provides an overview of employee statistics and recent employee records.

## 2. Features

- **Dashboard:** View employee statistics and summaries.
- **Add Employee:** Register new employees.
- **View Employees:** Display all employee records.
- **Edit Employee:** Update existing employee information.
- **Delete Employee:** Remove employee records with a confirmation dialog.
- **Search:** Search employees by name or employee ID.
- **Age Filtering:** Filter employees by age groups.
- **Pagination:** Navigate employee records with configurable page sizes.
- **Form Validation:** Validate employee details before submission.
- **Notifications:** Display success and error messages.
- **Responsive Design:** Supports desktop and mobile screens.

## 3. Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Tailwind CSS | Styling and responsive design |
| JavaScript | Frontend functionality |
| Axios | API communication |
| React Router | Frontend navigation |
| Python | Backend programming |
| FastAPI | REST API development |
| SQLModel | Database models and ORM |
| SQLite | Database storage |
| Git & GitHub | Version control and source code hosting |

## 4. Project Structure

```text
employee-management/
│
├── backend/
│   ├── main.py
│   └── test_main.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.jsx
│   │   │   ├── DeleteModal.jsx
│   │   │   ├── Input.jsx
│   │   │   └── Navbar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── About.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EmployeeForm.jsx
│   │   │   └── Employees.jsx
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## 5. Installation Instructions

### Prerequisites

Install the following before running the project:

- Python 3
- Node.js and npm
- Git

### Clone the Repository

```bash
git clone https://github.com/yuva2001raj/Employee_management.git
```

Navigate to the project directory:

```bash
cd Employee_management
```

### 6. How to Run the Application

The backend and frontend must run in separate terminals.

#### A. Start the Backend

Navigate to the backend folder:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment on Windows:

```powershell
.\venv\Scripts\Activate
```

Install the backend dependencies:

```bash
pip install fastapi uvicorn sqlmodel
```

Start the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

Backend API:

```text
http://127.0.0.1:8000
```

FastAPI interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

#### B. Start the Frontend

Open a second terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the frontend application using the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/employees` | Retrieve all employees |
| POST | `/employees/` | Add a new employee |
| PUT | `/employees/{employee_pk}` | Update an employee |
| DELETE | `/employees/{employee_pk}` | Delete an employee |

## Employee Information

The application manages the following employee details:

- Employee ID
- Employee Name
- Age
- Email

## Author

**Yuvaraj R**

## Repository

[Employee Management System – GitHub](https://github.com/yuva2001raj/Employee_management)

---

*Built with React, FastAPI, and SQLite.*