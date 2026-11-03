# FastAPI tools for building API endpoints and returning errors.
from fastapi import FastAPI, HTTPException

# Allows the React fronted to communicate with this backend.
from fastapi.middleware.cors import CORSMiddleware

#SQLModel tools for database tables and database sessions.
from sqlmodel import SQLModel, Field, Session, create_engine, select

# Handles database errors, such as duplicate employee IDs.
from sqlalchemy.exc import IntegrityError


# ----------------------------------------
# 1. DATABASE CONFIGURATION
# ----------------------------------------

#SQLite stores our employee records in this local file.
sqlite_file_name = "employees.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# Allow SQLite to work with requests from FastAPI.
connect_args = {"check_same_thread": False}

# Create the database engine.
engine = create_engine(
    sqlite_url, 
    connect_args=connect_args
    )


# ----------------------------------------
# 2. EMPLOYEE MoDELS
# ----------------------------------------

# Common fields shared by employee input and output models.
class EmployeeBase(SQLModel):
    employee_name: str = Field(min_length=1, max_length=100)
    employee_id: str = Field(min_length=1, max_length=30)
    age: int = Field(ge=18, le=100)
    email: str = Field(min_length=3, max_length=255)
    

# Represents the actual employee table in SQLite.
class Employee(EmployeeBase, table=True):
    # The database automatically generates a unique primary key.
    id: int | None = Field(default=None, primary_key=True)
    
    # Employee IDs must be unique in the database.
    employee_id: str = Field(
        index=True, 
        unique=True,
        min_length=1, 
        max_length=30)


# Data accepted when creating a new employee record.
class EmployeeCreate(EmployeeBase):
    pass

# Data returned to the fronted, including th databse ID.
class EmployeeRead(EmployeeBase):
    id: int
    
# Fields that can be updated individually.
class EmployeeUpdate(SQLModel):
    employee_name: str | None = Field(default=None, min_length=1, max_length=100)
    employee_id: str | None = Field(default=None, min_length=1, max_length=30)
    age: int | None = Field(default=None, ge=18, le=100)
    email: str | None = Field(default=None, min_length=3, max_length=255)

# ----------------------------------------
# 3. CREATE THE FASTAPI APPLICATION
# ----------------------------------------

app = FastAPI(title="Employee Management API")


# Allow Requests from our React development server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create the database table when the backend starts.
@app.on_event("startup")
def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
    
# Give each API request a database session.
def get_session():
    with Session(engine) as session:
        yield session
        
        
# ----------------------------------------
# 4. HOME ENDPOINT
# ----------------------------------------

# Visit this endpoint to check if the backend is running.
@app.get("/")
def home():
    return {"message": "Employee Management API is running!"}

# ----------------------------------------
# 5. CREATE AN EMPLOYEE
# ----------------------------------------

@app.post("/employees/", response_model=EmployeeRead, status_code=201)
def create_employee(employee_data: EmployeeCreate):
    # Open a Connection to the database.
    with Session(engine) as session:
        # Convert the incoming data into a database object.
        employee = Employee.model_validate(employee_data)
        
        # Add the employee to the database session.
        session.add(employee)
        
        
        try:
            # Save the new employee permanently.
            session.commit()
        except IntegrityError:
            # Undo the failed transaction if the ID already exists.
            session.rollback()
            raise HTTPException(
                status_code=409,
                detail="An employee with this employee ID already exists."
            )
            
        # Reload the employee so its generated ID is available.
        session.refresh(employee)
        
        return employee
    
# ----------------------------------------
# 6. READ ALL EMPLOYEES
# ----------------------------------------

@app.get("/employees", response_model=list[EmployeeRead])
def get_employees():
    with Session(engine) as session:
        # Select every employee from the database.
        statement = select(Employee)
        employees = session.exec(statement).all()
        return employees
    
# ----------------------------------------
# 7. UPDATE AN EMPLOYEE
# ----------------------------------------

@app.put("/employees/{employee_pk}", response_model=EmployeeRead)
def update_employee(employee_pk: int, employee_data: EmployeeUpdate):
    with Session(engine) as session:
        # Find the employee using the database primary key.
        employee = session.get(Employee, employee_pk)
        
        # Return an error if the employee does not exist.
        if employee is None:
            raise HTTPException(
                status_code=404,
                detail="Employee not found."
            )
            
        # Include only fields supplied in the request.
        update_data = employee_data.model_dump(exclude_unset=True)
        
        # Apply the supplied changes.
        for field_name, field_value in update_data.items():
            setattr(employee, field_name, field_value)
        
            
        try:
            # Save the updated employee permanently.
            session.add(employee)
            session.commit()
        except IntegrityError:
            # Undo the failed transaction if the ID already exists.
            session.rollback()
            raise HTTPException(
                status_code=409,
                detail="That employee ID is already in use."
            )
            
        # Reload the employee so its updated data is available.
        session.refresh(employee)
        
        return employee
    
# ----------------------------------------
# 8. DELETE AN EMPLOYEE
# ----------------------------------------

@app.delete("/employees/{employee_pk}")
def delete_employee(employee_pk: int):
    with Session(engine) as session:
        # Find the employee using the database primary key.
        employee = session.get(Employee, employee_pk)
        
        # Return an error if the employee does not exist.
        if employee is None:
            raise HTTPException(
                status_code=404,
                detail="Employee not found."
            )
            
        # Remove the employee and commit the change.
        session.delete(employee)
        session.commit()
        
        return {"message": "Employee deleted successfully."}