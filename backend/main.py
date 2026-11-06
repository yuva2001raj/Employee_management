# Used to read Admin credentials from environment variables.
import os
#JWT token creation and verification.
import jwt
#Used to calculate token expiration time.
from datetime import datetime, timedelta, timezone
# Used to securely hash passwords and verify login passwords.
from pwdlib import PasswordHash
# FastAPI tools for building API endpoints, handling errors and reading request headers.
from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Allows the React fronted to communicate with this backend.
from fastapi.middleware.cors import CORSMiddleware

#SQLModel tools for database tables and database sessions.
from sqlmodel import SQLModel, Field, Session, create_engine, select

# Handles database errors, such as duplicate employee IDs.
from sqlalchemy.exc import IntegrityError

# ----------------------------------------
# PASSWORD HASHING CONFIGURATION
# ----------------------------------------

# Create a password hashing instance using the recommended secure algorithm.
# Actual passwords will never be stored directly in the database.
password_hash = PasswordHash.recommended()

# ----------------------------------------
# JWT AUTHENTICATION CONFIGURATION
# ----------------------------------------

# Secret key used to sign and verify JWT tokens.
# Keep this value private and store it in an environment variable.
SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Algorithm used to sign JWT tokens.
ALGORITHM = "HS256"

# JWT access token validity period.
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ----------------------------------------
# JWT BEARER TOKEN CONFIGURATION
# ----------------------------------------

# Tells FastAPI to expect a Bearer token in the Authorization header.
security = HTTPBearer()

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
# USER MODEL
# ----------------------------------------

# Represents the user accounts stored in the SQLite database.
class User(SQLModel, table=True):
    # The database automatically generates a unique use Id.
    id:int | None = Field(default=None, primary_key=True)
    
    #Email address used by the user to log in.
    #Each user must have a unique email address.
    email: str = Field(
        unique=True,
        index=True,
        max_length=255
    )
    
    # Stores the hashed password instead of the original passward.
    hashed_password: str
    
    # Defines the user's role: admin or employee.
    # New accounts are employees by default.
    role: str = Field(default="employee")
    
    #Links an employee account to an existing employee record.
    #Admin accounts do not need an employee ID.
    employee_id: int | None = Field(
        default=None,
        foreign_key="employee.id",
        unique=True

    )
    
    
# ----------------------------------------
# LOGIN REQUEST AND RESPONSE MODELS
# ----------------------------------------

# Data received when a user attempts to log in.
class LoginRequest(SQLModel):
    email: str
    password: str
    
# Data required by Admin to create an Employee login account
class EmployeeAccountCreate(SQLModel):
    email: str
    password: str
    employee_id: int


# Data returned after successful authentication.
class TokenResponse(SQLModel):
    access_token: str
    token_type: str
    
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

# ----------------------------------------
# DATABASE TABLE CREATION AND ADMIN INITIALIZATION
# ----------------------------------------

# Runs automatically when the FastAPI application starts.
@app.on_event("startup")
def create_db_and_tables():

    # Create all database tables that do not already exist.
    SQLModel.metadata.create_all(engine)

    # Read the initial Admin email from environment variables.
    admin_email = os.getenv("ADMIN_EMAIL")

    # Read the initial Admin password from environment variables.
    admin_password = os.getenv("ADMIN_PASSWORD")

    # Stop Admin initialization if credentials are not configured.
    if not admin_email or not admin_password:
        print("WARNING: Admin account not initialized.")
        return

    # Open a database session to check and create the Admin account.
    with Session(engine) as session:

        # Search for an existing user with the configured Admin email.
        statement = select(User).where(
            User.email == admin_email
        )

        existing_admin = session.exec(statement).first()

        # Create the Admin account only if it does not already exist.
        if existing_admin is None:

            # Create a new Admin account with a securely hashed password.
            admin = User(
                email=admin_email,
                hashed_password=password_hash.hash(admin_password),
                role="admin"
            )

            # Add the Admin account to the database session.
            session.add(admin)

            # Save the Admin account permanently in SQLite.
            session.commit()

            print("Initial Admin account created successfully.")

        else:
            # Avoid creating duplicate Admin accounts on server restarts.
            print("Admin account already exists.")
        


# ----------------------------------------
# 4. USER LOGIN AND JWT TOKEN GENERATION
# ----------------------------------------

@app.post("/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest):

    # Make sure the JWT secret key is configured.
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT secret key is not configured."
        )

    with Session(engine) as session:

        # Find the user using the submitted email.
        statement = select(User).where(
            User.email == login_data.email
        )

        user = session.exec(statement).first()

        # Reject login if the email does not exist.
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Verify the submitted password against the stored password hash.
        if not password_hash.verify(
            login_data.password,
            user.hashed_password
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )

        # Calculate when the access token should expire.
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

        # Create the JWT token payload.
        token_data = {
            "sub": str(user.id),
            "role": user.role,
            "exp": expire
        }

        # Generate the signed JWT access token.
        access_token = jwt.encode(
            token_data,
            SECRET_KEY,
            algorithm=ALGORITHM
        )

        # Return the token to the frontend.
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
# ----------------------------------------
# JWT TOKEN VERIFICATION
# ----------------------------------------

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Make sure the JWT secret key is configured.
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="JWT secret key is not configured."
        )

    # Extract the JWT token from the Authorization header.
    token = credentials.credentials

    try:
        # Verify the token signature and expiration time.
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Read the user ID stored in the token.
        user_id = payload.get("sub")

        # Reject tokens without a user ID.
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token."
            )

        # Convert the user ID into an integer.
        user_id = int(user_id)

    except (jwt.InvalidTokenError, ValueError):
        # Reject expired, invalid or incorrectly formatted tokens.
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # Find the user associated with the token.
    with Session(engine) as session:
        user = session.get(User, user_id)

        # Reject the token if its user account no longer exists.
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="User account not found."
            )

        return user
    
# Check whether the logged-in user is an Admin
def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )

    return current_user

# Admin-only API to create an Employee login account
@app.post("/auth/create-employee")
def create_employee_account(
    account_data: EmployeeAccountCreate,
    current_user: User = Depends(require_admin)
):
    with Session(engine) as session:

        # Check whether the employee record exists
        employee = session.get(Employee, account_data.employee_id)

        if employee is None:
            raise HTTPException(
                status_code=404,
                detail="Employee record not found."
            )

        # Check whether this employee already has a login account
        existing_employee_account = session.exec(
            select(User).where(User.employee_id == account_data.employee_id)
        ).first()

        if existing_employee_account:
            raise HTTPException(
                status_code=400,
                detail="This employee already has a login account."
            )

        # Check whether the email is already registered
        existing_email = session.exec(
            select(User).where(User.email == account_data.email)
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email address is already registered."
            )

        # Hash the password before storing it
        new_user = User(
            email=account_data.email,
            hashed_password=password_hash.hash(account_data.password),
            role="employee",
            employee_id=account_data.employee_id
        )

        session.add(new_user)

        try:
            session.commit()
            session.refresh(new_user)
        except IntegrityError:
            session.rollback()
            raise HTTPException(
                status_code=400,
                detail="Could not create employee account. Check for duplicate details."
            )

        return {
            "message": "Employee account created successfully.",
            "user_id": new_user.id,
            "email": new_user.email,
            "role": new_user.role,
            "employee_id": new_user.employee_id
        }

# ----------------------------------------
# ROLE-BASED AUTHORIZATION
# ----------------------------------------

# Allows access only to users with the Admin role.
def require_admin(
    current_user: User = Depends(get_current_user)
):
    # Check whether the logged-in user is an Admin.
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )

    # Return the authenticated Admin.
    return current_user

# ----------------------------------------
# TEMPORARY AUTHENTICATION TEST
# ----------------------------------------

@app.get("/auth/me")
def get_my_account(
    current_user: User = Depends(get_current_user)
):
    # Return basic details of the authenticated user.
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }
    
# Employee can view only their own profile
@app.get("/employees/me", response_model=EmployeeRead)
def get_my_employee_profile(
    current_user: User = Depends(get_current_user)
):
    if current_user.employee_id is None:
        raise HTTPException(
            status_code=404,
            detail="No employee profile is linked to this account."
        )

    with Session(engine) as session:
        employee = session.get(Employee, current_user.employee_id)

        if employee is None:
            raise HTTPException(
                status_code=404,
                detail="Employee profile not found."
            )

        return employee
    
# Employee can update only their own profile
@app.put("/employees/me", response_model=EmployeeRead)
def update_my_employee_profile(
    employee_data: EmployeeUpdate,
    current_user: User = Depends(get_current_user)
):
    # Check whether this account is linked to an employee record
    if current_user.employee_id is None:
        raise HTTPException(
            status_code=404,
            detail="No employee profile is linked to this account."
        )

    with Session(engine) as session:

        # Find the employee's own record
        employee = session.get(Employee, current_user.employee_id)

        if employee is None:
            raise HTTPException(
                status_code=404,
                detail="Employee profile not found."
            )

        # Find the corresponding login account
        user = session.get(User, current_user.id)

        # Get submitted fields, but never allow employee_id to change
        update_data = employee_data.model_dump(
            exclude_unset=True,
            exclude={"employee_id"}
        )

        # If email is changing, check that another account isn't using it
        if "email" in update_data:
            existing_user = session.exec(
                select(User).where(
                    User.email == update_data["email"],
                    User.id != current_user.id
                )
            ).first()

            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail="Email address is already registered."
                )

            # Keep the login email and employee profile email synchronized
            user.email = update_data["email"]

        # Update only the permitted employee fields
        for field, value in update_data.items():
            setattr(employee, field, value)

        session.add(employee)
        session.add(user)
        session.commit()
        session.refresh(employee)

        return employee

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
def create_employee(employee_data: EmployeeCreate, current_user: User = Depends(require_admin)):
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
def get_employees(current_user: User = Depends(require_admin)):
    with Session(engine) as session:
        # Select every employee from the database.
        statement = select(Employee)
        employees = session.exec(statement).all()
        return employees
    
# ----------------------------------------
# 7. UPDATE AN EMPLOYEE
# ----------------------------------------

@app.put("/employees/{employee_pk}", response_model=EmployeeRead)
def update_employee(employee_pk: int, employee_data: EmployeeUpdate, current_user: User = Depends(require_admin)):
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
def delete_employee(employee_pk: int, current_user: User = Depends(require_admin)):
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