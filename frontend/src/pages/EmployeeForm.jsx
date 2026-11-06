import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from '../services/api'

import Button from '../components/Button'
import Input from '../components/Input'



function EmployeeForm() {
    const navigate = useNavigate()
    const { id } = useParams()

    //If an ID exists in the URL, this is edit mode.
    const isEditing = Boolean(id)

    // Employee form data.
    const [employee, setEmployee] = useState({
        employeeName: '',
        employeeId: '',
        age: '',
        email: '',
    })

    const[errors, setErrors] = useState({})
    const[message, setMessage] = useState('')
    const[isSaving, setIsSaving] = useState(false)
    const[isLoading, setIsLoading] = useState(isEditing)

    // Prevent accidental duplicate submissions.
    const submitLock = useRef(false)

    // Load existing employee details when editing.
    useEffect(() => {
        if (!isEditing) return

        let cancelled = false

        async function loadEmployee() {
            try {
                const response = await api.get('/employees')

                const selectedEmployee = response.data.find(
                    (item) => String(item.id) === String(id)
                )

                if (!selectedEmployee) {
                    setMessage('Employee not found.')
                    return
                }

                if (!cancelled) {
                    setEmployee({
                        employeeName:selectedEmployee.employee_name,
                        employeeId: selectedEmployee.employee_id,
                        age: String(selectedEmployee.age),
                        email: selectedEmployee.email,
                    })
                }
            } catch (error) {
                console.error('Error loading employee:', error)

                if (!cancelled) {
                    setMessage('Unable to load employee details. Check the backend.')
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        loadEmployee()

        return () => {
            cancelled = true
        }
    }, [id, isEditing])

    // validate individual fields.
    function validateField(name, value) {
        const trimmedValue = value.trim()

        if (name === 'employeeName') {
            if (!trimmedValue) {
                return 'Employee name is required.'
            }

            if (!/^[A-Za-z ]+$/.test(trimmedValue)) {
                return 'Name must contain only letters and spaces.'
            }
        }

        if (name === 'employeeId') {
            if(!trimmedValue) {
                return 'Employee ID is required.'
            }

            if (/\s/.test(trimmedValue)) {
                return 'Employee ID must not contain spaces.'
            }
        }

        if (name === 'age') {
            const age = Number(value)

            if (value === '') {
                return 'Age is required.'
            }

            if (!Number.isInteger(age) || age< 18 || age> 100) {
                return 'Age must be a whole number between 18 and 100.'
            }
        }

        if (name === 'email') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

            if (!trimmedValue) {
                return 'Email is required.'
            }

            if (!emailPattern.test(trimmedValue)) {
                return 'Enter a valid email address.'
            }
        }

        return ''
    }

    // Update form values when the user types.
    function handleChange(event) {
        const { name, value} = event.target

        setEmployee((previousEmployee) => ({
            ...previousEmployee,
            [name]: value,
        }))

        setErrors((previousErrors) => ({
            ...previousErrors,
            [name]: validateField(name, value),
        }))
    }

    // Validate all fields before submitting.
    function validateEmployee() {
        const validationErrors = {}

        Object.entries(employee).forEach(([name, value]) => {
            const error =  validateField(name, value)

            if(error) {
                validationErrors[name] = error
            }
        })

        return validationErrors
    }

    // Submit employee data to FastAPI.
    async function handleSubmit(event) {
        event.preventDefault()

        if (submitLock.current) return

        const validationErrors = validateEmployee()

        setErrors(validationErrors)

        if (Object.keys(validationErrors).length > 0) {
            setMessage('Please correct the invalid employee details.')
            return
        }

        submitLock.current = true
        setIsSaving(true)
        setMessage('')

        try {
            const employeeData = {
                employee_name: employee.employeeName.trim(),
                employee_id: employee.employeeId.trim(),
                age: Number(employee.age),
                email: employee.email.trim(),
            }

            if (isEditing) {
                // PUT: Update existing employee.
                await api.put(
                    `/employees/${id}`,
                    employeeData
                )
            } else {
                // Post: Create a new employee.
                await api.post(
                    `/employees/`,
                    employeeData
                )
            }

            // Return to the employee list after success.
            navigate('/employees', {
                state: {
                    message: isEditing
                        ? 'Employee updated successfully!'
                        : 'Employee added successfully!',
                    type: 'success'
                }
            })
        } catch (error) {
            console.error('Employee save error:', error)

            if (error.response?.status === 409) {
                setMessage('This Employee ID already exists. Use another ID.')
            } else if (error.response) {
                setMessage(
                    `Error ${error.response.status}: ${
                        error.response.data?.detail || 'Requested failed'
                    }`
                )
            } else {
                setMessage('Cannot connect to the backend. Check the server and network.')
            }
        } finally {
            submitLock.current =false
            setIsSaving(false)
        }
        
    }

    // Show Loading state while retrieving edit details.
    if (isLoading) {
        return (
            <p className="py-10 text-center text-slate-500">
                Loading employee details...
            </p>
        )
    }

    return (
        <div className="mx-auto max-w-2xl">

            {/* Form container */}
            <div className="rounded-xl border border-slate-200 bg-blue-50 p-5 shadow-lg sm:p-8">
                {/* Page heading */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">
                        {isEditing ? 'Edit Employee': 'Add Employee'}
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        {isEditing
                        ? 'Update the employee information below.'
                        : 'Enter the details to register a new employee.'}
                    </p>
                </div>

                {/* Employee form */}
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-5">
                        <div>  
                        <Input
                            id="employeeName"
                            name="employeeName"
                            label="Employee Name"
                            type="text"
                            placeholder="Enter employee name"
                            value={employee.employeeName}
                            onChange={handleChange}
                            required 
                        />
                        {errors.employeeName && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.employeeName}
                            </p>
                        )}

                        </div>

                        <div>
                        <Input
                            id="employeeId"
                            name="employeeId"
                            label="Employee ID"
                            type="text"
                            placeholder="Enter employee ID"
                            value={employee.employeeId}
                            onChange={handleChange}
                            required 
                        />

                        {errors.employeeId && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.employeeId}
                            </p>
                        )}
                        </div>

                        <div>
                        <Input
                            id="age"
                            name="age"
                            label="Employee Age"
                            type="number"
                            placeholder="Enter employee age"
                            value={employee.age}
                            onChange={handleChange}
                            min="18"
                            max="100"
                            required 
                        />

                        {errors.age && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.age}
                            </p>
                        )}
                        </div>

                        <div>
                        <Input
                            id="email"
                            name="email"
                            label="Email Address"
                            type="email"
                            placeholder="Enter employee email"
                            value={employee.email}
                            onChange={handleChange}
                            required 
                        />

                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.email}
                            </p>
                        )}

                        </div>

                        {/* Error message */ }
                        {message && (
                            <p 
                                role="alert"
                                className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                                    {message}
                            </p>
                        )}

                        {/* Form buttons */}
                        <div className="flex flex-wrap justify-end gap-3 pt-2">
                            <Button 
                                type="button"
                                onClick={() => navigate('/employees')}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving
                                ? 'Processing...'
                                : isEditing
                                    ? 'Update Employee'
                                    :'Save Employee'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EmployeeForm