import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import EmployeeForm from './pages/EmployeeForm'
import Employees from './pages/Employees'
function App() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/employees/new" element={<EmployeeForm />} />
                    <Route path="/employees/edit/:id" element={<EmployeeForm />} />
                    <Route path="/about" element={<About />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </main>
        </div>
    )
}

export default App