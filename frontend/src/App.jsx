import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthProvider'
import About from './pages/About'
import Dashboard from './pages/Dashboard'
import EmployeeForm from './pages/EmployeeForm'
import Employees from './pages/Employees'
import Login from './pages/Login'
import Profile from './pages/Profile'

function App() {
    return (
        <AuthProvider>
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login/>} />
                    <Route path="/about" element={<About/>} />
                    {/* Admin-only routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employees"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <Employees />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employees/new"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <EmployeeForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/employees/edit/:id"
                        element={
                            <ProtectedRoute allowedRoles={["admin"]}>
                                <EmployeeForm />
                            </ProtectedRoute>
                        }
                    />
                    {/* employee profile placeholder */}
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute allowedRoles={["employee"]}>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    {/* Default routes */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />}/>
                    <Route path="*" element={<Navigate to="/" replace />}/>
                </Routes>
            </main>
        </div>
        </AuthProvider>
    )
}

export default App