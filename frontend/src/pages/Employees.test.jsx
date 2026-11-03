
import { fireEvent, render, screen } from '@testing-library/react'
import axios from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Employees from './Employees'

jest.mock('axios')

const mockEmployees = [
    {
        id: 1,
        employee_name: 'Arun Kumar',
        employee_id: 'EMP101',
        age: 24,
        email: 'arun@example.com'
    },
    {
        id: 2,
        employee_name: 'Priya Sharma',
        employee_id: 'EMP102',
        age: 30,
        email: 'priya@example.com'
    },
    {
        id: 3,
        employee_name: 'Rahul Kumar',
        employee_id: 'EMP103',
        age: 45,
        email: 'rahul@example.com'
    }
]


const paginationEmployees = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    employee_name: `Employee ${index + 1}`,
    employee_id: `EMP${101 + index}`,
    age: 25 + index,
    email: `employee${index + 1}@example.com`
}))


const renderEmployees = () => {
    return render(
        <MemoryRouter initialEntries={['/employees']}>
            <Routes>
                <Route path="/employees" element={<Employees />} />
            </Routes>
        </MemoryRouter>
    )
}

describe('Employee Search Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        axios.get.mockResolvedValue({
            data: mockEmployees
        })
    })

    test('searches employees by employee name', async () => {
        renderEmployees()

        await screen.findByText('Arun Kumar')

        const searchInput = screen.getByPlaceholderText(
            'Search by employee name or ID...'
        )

        fireEvent.change(searchInput, {
            target: { value: 'Priya' }
        })

        expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
        expect(screen.queryByText('Arun Kumar')).not.toBeInTheDocument()
        expect(screen.queryByText('Rahul Kumar')).not.toBeInTheDocument()
    })

    test('searches employees by employee ID', async () => {
        renderEmployees()

        await screen.findByText('Arun Kumar')

        const searchInput = screen.getByPlaceholderText(
            'Search by employee name or ID...'
        )

        fireEvent.change(searchInput, {
            target: { value: 'EMP102' }
        })

        expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
        expect(screen.queryByText('Arun Kumar')).not.toBeInTheDocument()
        expect(screen.queryByText('Rahul Kumar')).not.toBeInTheDocument()
    })

    test('search is case-insensitive', async () => {
        renderEmployees()

        await screen.findByText('Arun Kumar')

        const searchInput = screen.getByPlaceholderText(
            'Search by employee name or ID...'
        )

        fireEvent.change(searchInput, {
            target: { value: 'arun kumar' }
        })

        expect(screen.getByText('Arun Kumar')).toBeInTheDocument()
        expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument()
    })

    test('ignores extra spaces in the search text', async () => {
        renderEmployees()

        await screen.findByText('Arun Kumar')

        const searchInput = screen.getByPlaceholderText(
            'Search by employee name or ID...'
        )

        fireEvent.change(searchInput, {
            target: { value: '  arun kumar  ' }
        })

        expect(screen.getByText('Arun Kumar')).toBeInTheDocument()
        expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument()
    })

    test('displays a message when no employee matches the search', async () => {
        renderEmployees()

        await screen.findByText('Arun Kumar')

        const searchInput = screen.getByPlaceholderText(
            'Search by employee name or ID...'
        )

        fireEvent.change(searchInput, {
            target: { value: 'XYZ999' }
        })

        expect(screen.getByText('No employees found.')).toBeInTheDocument()
    })

    
test('filters employees aged 18 to 25', async () => {
    renderEmployees()

    await screen.findByText('Arun Kumar')

    fireEvent.change(screen.getByDisplayValue('All Ages'), {
        target: { value: '18-25' }
    })

    expect(screen.getByText('Arun Kumar')).toBeInTheDocument()
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument()
    expect(screen.queryByText('Rahul Kumar')).not.toBeInTheDocument()
})

test('filters employees aged 26 to 40', async () => {
    renderEmployees()

    await screen.findByText('Arun Kumar')

    fireEvent.change(screen.getByDisplayValue('All Ages'), {
        target: { value: '26-40' }
    })

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
    expect(screen.queryByText('Arun Kumar')).not.toBeInTheDocument()
    expect(screen.queryByText('Rahul Kumar')).not.toBeInTheDocument()
})

test('filters employees aged 41 and above', async () => {
    renderEmployees()

    await screen.findByText('Arun Kumar')

    fireEvent.change(screen.getByDisplayValue('All Ages'), {
        target: { value: '41+' }
    })

    expect(screen.getByText('Rahul Kumar')).toBeInTheDocument()
    expect(screen.queryByText('Arun Kumar')).not.toBeInTheDocument()
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument()
})

test('displays all employees when All Ages is selected', async () => {
    renderEmployees()

    await screen.findByText('Arun Kumar')

    fireEvent.change(screen.getByDisplayValue('All Ages'), {
        target: { value: '18-25' }
    })

    fireEvent.change(screen.getByDisplayValue('All 18-25'), {
        target: { value: 'all' }
    })

    expect(screen.getByText('Arun Kumar')).toBeInTheDocument()
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
    expect(screen.getByText('Rahul Kumar')).toBeInTheDocument()
})

})


describe('Employee Pagination Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        axios.get.mockResolvedValue({
            data: paginationEmployees
        })
    })

    test('displays 5 employees per page by default', async () => {
        renderEmployees()

        await screen.findByText('Employee 1')

        expect(screen.getByText('Employee 5')).toBeInTheDocument()
        expect(screen.queryByText('Employee 6')).not.toBeInTheDocument()
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    test('moves to the next page', async () => {
        renderEmployees()

        await screen.findByText('Employee 1')

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))

        expect(screen.getByText('Employee 6')).toBeInTheDocument()
        expect(screen.queryByText('Employee 1')).not.toBeInTheDocument()
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
    })

    test('moves to the previous page', async () => {
        renderEmployees()

        await screen.findByText('Employee 1')

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        fireEvent.click(screen.getByRole('button', { name: 'Previous' }))

        expect(screen.getByText('Employee 1')).toBeInTheDocument()
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    test('disables Previous on the first page', async () => {
        renderEmployees()

        await screen.findByText('Employee 1')

        expect(screen.getByRole('button', {
            name: 'Previous'
        })).toBeDisabled()
    })

    test('disables Next on the last page', async () => {
        renderEmployees()

        await screen.findByText('Employee 1')

        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        fireEvent.click(screen.getByRole('button', { name: 'Next' }))

        expect(screen.getByText('Page 3 of 3')).toBeInTheDocument()

        expect(screen.getByRole('button', {
            name: 'Next'
        })).toBeDisabled()
    })

    test('displays 10 employees when rows per page is changed to 10', async () => {
        renderEmployees()

        await screen.findByText('Employee 1')

        fireEvent.change(screen.getByDisplayValue('5'), {
            target: { value: '10' }
        })

        expect(screen.getByText('Employee 10')).toBeInTheDocument()
        expect(screen.queryByText('Employee 11')).not.toBeInTheDocument()
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    })
})
