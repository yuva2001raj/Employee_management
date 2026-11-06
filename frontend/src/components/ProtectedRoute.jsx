import { Navigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"

function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, role, loading } = useAuth()

    // Wait until the login session check is complete.
    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <p className="text-slate-600">Checking authentication...</p>
            </div>
        )
    }

    // Redirect user who are not logged in.
    if (!isAuthenticated) {
        return<Navigate to="/login" replace/>
    }

    // Check whether the user's role is permitted.
    if (allowedRoles && !allowedRoles.includes(role)) {
        const redirectPath = 
            role === "admin" ? "/dashboard" : "/profile"
        return <Navigate to={redirectPath} replace/>
    }

    // Allow access when all checks pass.
    return children
}

export default ProtectedRoute