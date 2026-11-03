import axios from 'axios'
import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import DeleteModal from '../components/DeleteModal'



const API_URL = 'http://127.0.0.1:8000'

function Employees() {
    const navigate = useNavigate()

    // Store employees received from the backend.
    const [employees, setEmployees] = useState([])

    // Search and filter states.
    const [search, setSearch] = useState('')
    const [ageFilter, setAgeFilter] = useState('all')

    // Pagination states.
    const [currentPage,setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

    // Loading and message states.
    const [isLoading, setIsLoading] = useState(true)
    const [message, setMessage] = useState('')

    //Store the employee selected for deletion.
    // If null, the delete confirmation modal stays closed.
    const [employeeToDelete, setEmployeeToDelete] = useState(null)
    // Tracks whether the employee deletion API request is in progress.
    const [isDeleting, setIsDeleting] = useState(false)

    const location = useLocation()
    //Success notification from Add or Update.
    const [successNotice, setSuccessNotice ] = useState(
        location.state?.message || ''
    )

    // Automatically dismiss success notification after 4 seconds.
    useEffect(() => {
        if (!successNotice) return

        const timer = setTimeout(() => {
            setSuccessNotice('')
        }, 4000)

        return () => clearTimeout(timer)
    }, [successNotice])

    // Load employees from FastAPI.
    async function loadEmployees() {
        try {
            const response = await axios.get(`${API_URL}/employees`)
            setEmployees(response.data)
            setMessage('')
        } catch (error) {
            console.error('Error loading employees:', error)
            setMessage('Unable to load employees. check the backend.')
        } finally {
            setIsLoading(false)
        }
        
    }

    // Load employees when this page first opens.
    useEffect(() => {
        let cancelled = false

        axios
            .get(`${API_URL}/employees`)
            .then ((response) => {
                if (!cancelled) {
                    setEmployees(response.data)
                    setMessage('')
                }
            })
            .catch((error) => {
                console.error('Error loading employees:', error)

                if (!cancelled) {
                    setMessage('Unable to load employees. Check the backend.')
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false)
                }
            })

            return () => {
                cancelled = true
            }
            
    }, [])

    // Search and filter employees.
    const filteredEmployees = useMemo(() => {
        return employees.filter((employee) => {
            const searchText = search.toLowerCase().trim()

            const matchesSearch = 
                employee.employee_name.toLowerCase().includes(searchText) ||
                employee.employee_id.toLowerCase().includes(searchText)
            
            const matchesAge = 
                ageFilter === 'all' ||
                (ageFilter === '18-25' && employee.age >= 18 && employee.age <= 25) ||
                (ageFilter === '26-40' && employee.age >= 26 && employee.age <= 40) ||
                (ageFilter === '41+' && employee.age >= 41)
            
            return matchesSearch && matchesAge

        })
    }, [employees, search, ageFilter])

    // Calculate pagination.
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)

    const startIndex = (currentPage - 1) * itemsPerPage

    const currentEmployees = filteredEmployees.slice(
        startIndex,
        startIndex + itemsPerPage
    )

    // Reset to page 1 when searching or filtering.
    function handleSearch(value) {
        setSearch(value)
        setCurrentPage(1)
    }

    function handleAgeFilter(value) {
        setAgeFilter(value)
        setCurrentPage(1)
    }

    // Navigate to the employee form for editing.
    function handleEdit(id) {
        navigate(`/employees/edit/${id}`)
    }
    // Opens the delete confirmation modal for the selected employee.
    function handleDelete(employee) {
        //Store the selected employee details.
        // This makes the confirmation modal visible.
        setEmployeeToDelete(employee)
    }

    // Deletes the selected employee after confirmation.
    async function confirmDelete() {

        // Prevent duplicate delete requests.
        if (isDeleting) return

        // Start the deleting process.
        setIsDeleting(true)

        try {
            // Send DELETE request to the FastAPI backend
            await axios.delete(`${API_URL}/employees/${employeeToDelete.id}`)
            setEmployeeToDelete(null)
            setCurrentPage(1)
            await loadEmployees()
            setSuccessNotice('Employee deleted successfully!')
        } catch (error) {
            console.error('Error deleting employee:', error)
            setMessage('Failed to delete employee.')
        } finally {
            // Reset deleting state after the request finishes.
            setIsDeleting(false)
        }
        
    }

    return (
        <div className="space-y-6">

            {/* Page heading and Add Employee button */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Employees
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage and view all employee records.
                    </p>
                </div>

                <Link 
                    to="/employees/new"
                    className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
                        + Add Employee
                </Link>
            </div>
        {/* Success and error message */}
        {(successNotice || message) && (
            <div 
                role="status"
                className={`rounded-lg border p-4 text-sm font-medium ${
                    successNotice || message === 'Employee deleted successfully!'
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-blue-200 bg-blue-50 text-blue-700'
                }`}>
                {successNotice || message}
            </div>
        )}

        {/* Employee table section */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

            {/* Table heading */}
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <h2 className="text-lg font-semibold text-slate-800">
                    All Employees
                </h2>

                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    {filteredEmployees.length} Employees
                </span>
            </div>

            {/* Search and age filter */}
            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                <input
                    type="text"
                    placeholder="Search by employee name or ID..."
                    value={search}
                    onChange={(event) => handleSearch(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-2 focus:ring-blue-100"/>
                
                <select
                    value={ageFilter}
                    onChange={(event) => handleAgeFilter(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-2 focus:ring-blue-100">
                        <option value="all">All Ages</option>
                        <option value="18-25">All 18-25</option>
                        <option value="26-40">All 26-40</option>
                        <option value="41+">All 41 and above</option>
                </select>
            </div>

            {/* Employee table */ }
            {isLoading ? (
                <p className="py-10 text-center text-slate-500">
                    Loading employees...
                </p>
            ) : filteredEmployees.length === 0 ? (
                <p className="py-10 text-center text-slate-500">
                    No employees found.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] border-collapse text-left">

                        <thead>
                            <tr className="bg-blue-50 text-sm text-slate-600">
                                <th className="p-3">Database ID</th>
                                <th className="p-3">Employee Name</th>
                                <th className="p-3">Employee ID</th>
                                <th className="p-3">Age</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentEmployees.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b border-slate-100 text-sm hover:bg-blue-50/50">
                                        <td className="p-3">{item.id}</td>
                                        <td className="p-3 font-medium text-slate-800">
                                            {item.employee_name}
                                        </td>

                                        <td className="p-3">{item.employee_id}</td>
                                        <td className="p-3">{item.age}</td>
                                        <td className="p-3">{item.email}</td>

                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEdit(item.id)}
                                                    className="rounded-md bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-200">
                                                        Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item)}
                                                    className="rounded-md bg-blue-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-blue-200">
                                                        Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            )}

            {/* Pagination */}
            {!isLoading && filteredEmployees.length > 0 && (
                <div className="mt-5 flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span>Rows per page:</span>

                        <select
                            value={itemsPerPage}
                            onChange={(event) => {
                                setItemsPerPage(Number(event.target.value))
                                setCurrentPage(1)
                            }}
                            className="rounded-md border border-slate-300 px-2 py-1">
                            
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((page) => page - 1)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                                Previous
                        </button>

                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((page) => page + 1)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40">
                                Next
                        </button>
                    </div>
                </div>
            )}
            </div>

            {/* Delete confirmation modal */}
            <DeleteModal
                employee={employeeToDelete}
                onCancel={() => setEmployeeToDelete(null)}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}/>
        </div>
    )

}

export default Employees