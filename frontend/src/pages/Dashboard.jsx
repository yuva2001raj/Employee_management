import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'


function Dashboard() {
    const [employees, setEmployees] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    //Fetch employee records from FastAPI backend
    useEffect(() => {
        let cancelled = false

        async function loadEmployees() {
            try {
                const response = await api.get('/employees')
                if (!cancelled) {
                    setEmployees(response.data)
                    setError('')
                }
            } catch (err) {
                console.error('Dahboard error:', err)
                
                if (!cancelled) {
                    setError('Unable to load dashboard data. Please check the backend.')
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }
        

        loadEmployees()

        return () => {
            cancelled = true
        }
    }, [])
    // Calculate employee statistics
    const totalEmployees = employees.length

    const averageAge = totalEmployees > 0
        ? (
            employees.reduce((total, employee) => total + Number(employee.age || 0), 
        0
    ) / totalEmployees
).toFixed(1)
: 0
    
    const age18to25 = employees.filter(
        employee => Number(employee.age) >= 18 && Number(employee.age) <= 25
    ).length

    const age26to40 = employees.filter(
        employee => Number(employee.age) >= 26 && Number(employee.age) <= 40
    ).length

    const age41plus = employees.filter(
        employee => Number(employee.age) >= 41
    ).length

    // Get the Latest 5 employees
    const recentEmployees = [...employees]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, 5)

    // Dashboard statistic cards
    const statistics = [
        {
            title: 'Total Employees',
            value: totalEmployees,
            description: 'Registered employees',
            icon:'👥',
            color: 'bg-blue-50 text-blue-600',
            accent: 'border-l-blue-500'
        },
        {
            title: 'Average Age',
            value: averageAge,
            description: 'Average employees age',
            icon:'📊',
            color: 'bg-purple-50 text-purple-600',
            accent:'border-l-purple-500'
        },
        {
            title: 'Age 18-25',
            value: age18to25,
            description: 'Employees in this age group',
            icon:'🎓',
            color: 'bg-green-50 text-green-600',
            accent:'border-l-green-500'
        },
        {
            title: 'Age 26-40',
            value: age26to40,
            description: 'Employees in this age group',
            icon:'💼',
            color: 'bg-orange-50 text-orange-600',
            accent:'border-l-orange-500'
        },
        {
            title: 'Age 41+',
            value: age41plus,
            description: 'Employees in this age group',
            icon:'⭐',
            color: 'bg-pink-50 text-pink-600',
            accent:'border-l-pink-500'
        }
    ]
   
    // Age distribution
    const ageGroups = [
        {
            label:'18-25 years',
            count: age18to25,
            color:'bg-green-500'
        },
        {
            label:'26-40 years',
            count: age26to40,
            color:'bg-blue-500'
        },
        {
            label:'41+ years',
            count: age41plus,
            color:'bg-purple-500'
        },
    ]
    return (
        <div className="space-y-8">

            {/* Dashboard Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to indigo-700 p-7 text-white shadow-lg sm:p-9">
                <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium text-blue-100">
                            EMPLOYEE MANAGEMENT SYSTEM
                        </p>
                        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                            Dashboard
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                            Welcome back! Manage your employee records
                            and monitor your workforce from one place.
                        </p>
                    </div>
            
                <Link
                    to="/employees/new"
                    className="inline-flex item-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:-translate-y-1 hover:bg-blue-50 sm:self-center">
                    <span className='text-lg'></span>
                    + Add Employee
                </Link>
            </div>
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10"/>
            <div className="absolute -bottom-28 -right-36 h-64 w-64 rounded-full bg-white/10"/>
        </div>

            {/*Loading State*/}
            {isLoading && (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"/>
                    <p className="py-10 text-center text-gray-500">
                        Loading dashboard data...
                    </p>
                </div>
            )}

            {/* Error Message */}
            {!isLoading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    <p className="font-semibold">Somting went wrong</p>
                    <p className="mt-1">{error}</p>
                </div>
            )}

            {/* Dashboard Content */}
            {!isLoading && !error && (
                <>
                    {/* Statistics Cards */}
                    <section>
                        <div className="mb-5">
                            <h2 className="text-xl font-bold text-slate-800">
                                Workforce Overview
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                A quick overview of your employee statistics.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            {statistics.map((item) => (
                                <div
                                    key={item.title}
                                    className={`rounded-xl border border-slate-200 border1-4 ${item.accent} bg-white p-5 shadow-sm  transition  duration-200 hover:-translate-y-1 hover:shadow-md`}>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-gray-500">
                                            {item.title}
                                        </p>

                                        <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${item.color}`}>
                                            {item.icon}
                                        </span>
                                    </div>
                                    <p className="mt-5 text-3xl font-bold text-slate-800">
                                        {item.value}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-400">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>


                    {/* Age Distribution and Quick Actions */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Age Distribution */}
                        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-800">
                                Age Distribution
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Employee distribution by age group.
                            </p>
                            <div className="mt-7 space-y-6">
                                {ageGroups.map((group) => {
                                    const percentage = totalEmployees > 0
                                        ? (group.count / totalEmployees) * 100
                                        : 0
                                    return (
                                        <div key={group.label}>
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-600">
                                                    {group.label}
                                                </span>
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {group.count} ({percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${group.color}`}
                                                    style={{ width: `${percentage}%`}}/>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="mt-7 border-t border-slate-100 pt-4 text-xs text-slate-400">
                                Based on {totalEmployees} registered employees.
                            </p>

                        </section>
                    </div>
                    {/* Quick Actions */}
                    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm ">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Quick Actions
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Quickly access your employee management tools.
                        </p>

                        <div className="mt-6 space-y-4">
                            <Link
                                to="/employees"
                                className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                                <div className="flex items-center gap-4">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-xl">
                                        👥
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            View Employees
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Browse and manage employee records.
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600">
                                    →
                                </span>
                            </Link>

                            <Link
                                to="/employees/new"
                                className="group flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
                                <div className="flex items-center gap-4">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-xl">
                                        +
                                    </span>
                                    <div>
                                        <p className="font-semibold text-slate-800">
                                            Add New Employee
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Register a new employee.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600">
                                    →
                                </span>
                                
                            </Link>
                        </div>
                    </section>

                    {/* Recent Employees */}
                    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Recent Employees
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Your latest 5 employee records.
                                </p>
                            </div>

                            <Link
                                to="/employees"
                                className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                                View All Employees →
                            </Link>
                        </div>

                        {recentEmployees.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-4xl">👥</div>

                                <p className="mt-1 font-semibold text-slate-700">
                                    No employee yet
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Add your first employee to get started.
                                </p>

                                <Link
                                    to="/employees/new"
                                    className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700">
                                    Add Employee
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4">Name</th>
                                            <th className="px-6 py-4">Employee ID</th>
                                            <th className="px-6 py-4">Age</th>
                                            <th className="px-6 py-4">Email</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {recentEmployees.map((employee) => (
                                            <tr
                                                key={employee.id}
                                                className="transition hover:bg-blue-50/50">
                                                <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-800">
                                                    {employee.employee_name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                                                    {employee.employee_id}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">
                                                    {employee.age}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                                                    {employee.email}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>                            
                            </table>
                        </div>
                    )}
                </section>
            </>
        )}
    </div>
    )

}


export default Dashboard
