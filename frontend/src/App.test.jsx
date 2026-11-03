import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
// Mock Axios so the test does not need a running backend.
jest.mock('axios')

beforeEach(() => {
    jest.clearAllMocks()

    axios.get.mockResolvedValue({
        data: [],
    })
})

test('renders the Employee Management heading',async () => {
    render(<MemoryRouter><App /></MemoryRouter>)

    expect(
        screen.getByRole('heading', {
            name: 'Dashboard',
        })
    ).toBeInTheDocument()

    // Wait until the initial employee request finishes.
    await waitFor(() => {
        expect(axios.get).toHaveBeenCalled()
    })
})


test('shows validation errors when the form is submitted empty', async () => {
    render(
    <MemoryRouter initialEntries={['/employees/new']}>
    <App />
    </MemoryRouter>
)
    

   /*  // wait for the employee-loading request to finish.
    await waitFor(() => {
        expect(axios.get).toHaveBeenCalled()
    }) */
    
    // Find the form and bypass browser-native validation
    // So we can test our custom React validation.
    const form = document.querySelector('form')
    form.noValidate = true

    const user = userEvent.setup()

    await user.click(
        screen.getByRole('button', { name: /save employee/i})
    )
    // Verify the validation messages.
    expect(
        await screen.findByText('Employee name is required.')
    ).toBeInTheDocument()

    expect(
        screen.getByText('Employee ID is required.')
    ).toBeInTheDocument()

    expect(
        screen.getByText('Email is required.')
    ).toBeInTheDocument()

})


test('submits valid employee details to the API', async () => {
    const user = userEvent.setup()

    // Mock the initial employee loading request.
    axios.get.mockResolvedValue({ data: [] })

    //Mock the successful employee creation response.
    axios.post.mockResolvedValue({
        data: {
            id: 1,
            employeeName: 'Arun kumar',
            employeeId: 'EMP001',
            age: 25,
            email: 'arun@example.com',
        },
    })

    render(
    <MemoryRouter initialEntries={['/employees/new']}>
    <App />
    </MemoryRouter>
)

    // Enter valid employee details.
    await user.type(
        screen.getByLabelText(/employee name/i),
        'Arun kumar'
    )

    await user.type(
        screen.getByPlaceholderText('Enter employee ID'),
        'EMP101'
    )

    await user.type(
        screen.getByLabelText(/employee age/i),
        '25'
    )

    await user.type(
        screen.getByLabelText(/email address/i),
        'arun@example.com'
    )

    // Submit the form.
    await user.click(
        screen.getByRole('button', { name: /save employee/i })
    )

    // Verify that the API received the employee details.
    await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
            'http://127.0.0.1:8000/employees/',

            expect.objectContaining({
                employee_name: 'Arun kumar',
                employee_id: 'EMP101',
                age: 25,
                email: 'arun@example.com'
            })
        )
    })
})


test('displays employees returned by the API', async () => {
    // Arrange: Mock the employees returned by the backend.
    axios.get.mockResolvedValue({
        data: [
            {
                id: 1,
                employee_name: 'Arun kumar',
                employee_id: 'EMP101',
                age: 25,
                email: 'arun@example.com',
            },
        ],
    })

    // Act: Render the React application.
    render(
    <MemoryRouter initialEntries={['/employees']}>
    <App />
    </MemoryRouter>
)

    // Assert: Verify that the employee appears in the list.
    expect(await screen.findByText('Arun kumar')).toBeInTheDocument()
    expect(screen.getByText('EMP101')).toBeInTheDocument()
    expect(screen.getByText('arun@example.com')).toBeInTheDocument()
})

test('loads employee details into the form when Edit is clicked', async () => {
    // Arrange: Return one employee from the mocked API.
    axios.get.mockResolvedValue({
        data: [
            {
                id: 1,
                employee_name: 'Arun kumar',
                employee_id: 'EMP101',
                age: 25,
                email: 'arun@example.com',

            },
        ],
    })

    render(
    <MemoryRouter initialEntries={['/employees']}>
    <App />
    </MemoryRouter>
)

    // wait until the employee is displayed.
    await screen.findByText('Arun kumar')

    // Act: Click the Edit button.
    await userEvent.setup().click(
        screen.getByRole('button', { name: 'Edit' })
        )

        // Assert: Check that the form contains the employee's details.
        expect(screen.getByLabelText(/employee name/i)).toHaveValue('Arun kumar')
        expect(screen.getByLabelText(/employee id/i)).toHaveValue('EMP101')
        expect(screen.getByLabelText(/employee age/i)).toHaveValue(25)
        expect(screen.getByLabelText(/email address/i)).toHaveValue('arun@example.com')

        // The form should now be in edit mode.
        expect(
            screen.getByRole('button', { name: /update employee/i})
        ).toBeInTheDocument()
})

test('updates an existing employee', async () => {
    const user = userEvent.setup()

    const employee = {
        id: 1,
        employee_name: 'Arun kumar',
        employee_id: 'EMP101',
        age: 25,
        email: 'arun@example.com',
    }

    axios.get.mockResolvedValue({ data: [employee] })

    // The PUT request returns the updated employee.
    axios.put.mockResolvedValue({
        data: { ...employee,age: 26},      
    })

    render(
    <MemoryRouter initialEntries={['/employees']}>
    <App />
    </MemoryRouter>
)

    // Wait for the employee to appear.
    await screen.findByText('Arun kumar')

    // Click Edit.
    await user.click(screen.getByRole('button', { name: /edit/i}))

    // Change the employee's age.
    const ageInput = screen.getByLabelText(/employee age/i)
    await user.clear(ageInput)
    await user.type(ageInput, '26')

    //Submit the update.
    await user.click(
        screen.getByRole('button', { name: /update employee/i})
    )

    // Verify the PUT request.
    await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
            'http://127.0.0.1:8000/employees/1',
            {
                employee_name: 'Arun kumar',
                employee_id: 'EMP101',
                age: 26,
                email: 'arun@example.com',
            }
        )
    })

    // Verify the success message.
    expect(
        await screen.findByText('Employee updated successfully!')
    ).toBeInTheDocument()
})

test('deletes an existing employee',async () => {
    const user = userEvent.setup()

    const employee = {
        id: 1,
        employee_name: 'Arun kumar',
        employee_id: 'EMP101',
        age: 25,
        email: 'arun@example.com',
    }

    // Return the employee list for every GET request.
    axios.get.mockResolvedValue({ data: [employee] })

    // Mock a successful DELETE response.
    axios.delete.mockResolvedValue({
        data: { message:'Employee deleted successfully'},
    })

    // Automatically confirm the browser confirmation dialog.
    const confirmSpy = jest
        .spyOn(window, 'confirm')
        .mockReturnValue(true)
    try{
        render(
    <MemoryRouter initialEntries={['/employees']}>
    <App />
    </MemoryRouter>
)

        // Wait until the employee appears.
        await screen.findByText('Arun kumar')

        // Open the delete confirmation modal.
        await user.click(
            screen.getByRole('button', { name: 'Delete' })
        )

        // Confirm deletion in the modal.
        const deleteButtons = screen.getAllByRole('button', {
            name: 'Delete'
        })

        await user.click(deleteButtons[deleteButtons.length - 1])

        // Verify that the correct employee was deleted.
        await waitFor(() => {
            expect(axios.delete).toHaveBeenCalledWith(
                'http://127.0.0.1:8000/employees/1'
            )
        })

        // Verify the success message.
        expect(
            await screen.findByText('Employee deleted successfully!')
        ).toBeInTheDocument()

        } finally  {
        // Restore the original browser confirmation function.
        confirmSpy.mockRestore()
        }
})

test('prevents duplicate API requests during repeated form submission', async () => {
    const user = userEvent.setup()
    
    // keep the POST request pending until we explicitly resolve it.
    let resolvePost

    axios.post.mockImplementation(() => 
        new Promise((resolve) => {
            resolvePost = resolve
        })
    )

    // The initial Load and the post-save refresh return an empty list.
    axios.get.mockResolvedValue({ data: [] })

    render(
    <MemoryRouter initialEntries={['/employees/new']}>
    <App />
    </MemoryRouter>
)

    // Enter valid employee details.
    await user.type(
        screen.getByLabelText(/employee name/i),
        'Arun kumar'
    )

    await user.type(
        screen.getByPlaceholderText('Enter employee ID'),
        'EMP101'
    )

    await user.type(
        screen.getByLabelText(/employee age/i),
        '25'
    )

    await user.type(
        screen.getByLabelText(/email address/i),
        'arun@example.com'
    )

    const form = document.querySelector('form')

    // Submit twice synchronously while first request is pending.
    await act(async () => {
        fireEvent.submit(form)
        fireEvent.submit(form)
    })

    // The lock must allow only one POST request.
    expect(axios.post).toHaveBeenCalledTimes(1)

    //Complete the first request.
    await act(async () => {
        resolvePost({
            data: { id: 101},
        })
    })

    // Wait for the save operation to finish.
    expect(
        await screen.findByText(
            'Employee added successfully!'
        )
    ).toBeInTheDocument()


    // Confirm that no duplicate request was sent.
    expect(axios.post).toHaveBeenCalledTimes(1)
})

test('displays an error when the employee ID already exists', async () => {
    const user = userEvent.setup()

    axios.post.mockRejectedValue({
        response: {
            status: 409,
            data: {
                detail: 'An employee with this employee ID already exists.',
            },
        },
    })

    axios.get.mockResolvedValue({ data: [] })
    
    render(
    <MemoryRouter initialEntries={['/employees/new']}>
    <App />
    </MemoryRouter>)

    await user.type(
        screen.getByLabelText(/employee name/i),
        'Arun kumar'
    )

    await user.type(
        screen.getByPlaceholderText('Enter employee ID'),
        'EMP101'
    )

    await user.type(
        screen.getByLabelText(/employee age/i),
        '25'
    )

    await user.type(
        screen.getByLabelText(/email address/i),
        'arun@example.com'
    )

    await user.click(
        screen.getByRole('button', { name: /save employee/i })
    )

    expect(
        await screen.findByText(
            'This Employee ID already exists. Use another ID.'
        )
    ).toBeInTheDocument()
    expect(axios.post).toHaveBeenCalledTimes(1)
})

test('displays a connection error and unlocks the form when the backend is unavailable', async () => {
    const user = userEvent.setup()

    // Simulate a network failure: the request receives no HTTP response.
    axios.post.mockRejectedValue(new Error('Network Error'))
    axios.get.mockResolvedValue({ data: [] })

    render(
    <MemoryRouter initialEntries={['/employees/new']}>
    <App />
    </MemoryRouter>
)

    // Enter valid employee details.
    await user.type(
        screen.getByLabelText(/employee name/i),
        'Arun kumar'
    )

    await user.type(
        screen.getByPlaceholderText('Enter employee ID'),
        'EMP101'
    )

    await user.type(
        screen.getByLabelText(/employee age/i),
        '25'
    )

    await user.type(
        screen.getByLabelText(/email address/i),
        'arun@example.com'
    )

    // Submit the form.
    await user.click(
        screen.getByRole('button', { name: /save employee/i })
    )

    // Verify that the connection error is displayed.
    expect(
        await screen.findByText(
            'Cannot connect to the backend. Check the server and network.'
        )
    ).toBeInTheDocument()

    // Verify that the Save button is unable again.
    expect(
        screen.getByRole('button', { name: /save employee/i})
    ).toBeEnabled()

    // Verify that only one request was attempted.
    expect(axios.post).toHaveBeenCalledTimes(1)
})

test('displays the server error message when the backend returns HTTP 500', async () => {
    const user = userEvent.setup()

    // Simulate a server error from FastAPI.
    axios.post.mockRejectedValue({
        response: {
            status: 500,
            data: {
                detail: 'Internal Server Error',
            },
        },
    })

    // Employee list loads successfully.
    axios.get.mockRejectedValue({ data: [] })

    render(
    <MemoryRouter initialEntries={['/employees/new']}>
    <App />
    </MemoryRouter>
)

    // Enter valid employee details.
    await user.type(
        screen.getByLabelText(/employee name/i),
        'Arun kumar'
    )

    await user.type(
        screen.getByPlaceholderText('Enter employee ID'),
        'EMP101'
    )

    await user.type(
        screen.getByLabelText(/employee age/i),
        '25'
    )

    await user.type(
        screen.getByLabelText(/email address/i),
        'arun@example.com'
    )

    // Submit the form.
    await user.click(
        screen.getByRole('button', { name: /save employee/i})
    )

    // Verify that the Server error is displayed.
    expect(
        await screen.findByText('Error 500: Internal Server Error')
    ).toBeInTheDocument()
    
    // Verify that the Save button becomes usable again.
    expect(
        screen.getByRole('button', { name: /save employee/i})
    ).toBeEnabled()

    expect(axios.post).toHaveBeenCalledTimes(1)
})
