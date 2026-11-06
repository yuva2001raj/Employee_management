import { useEffect, useState } from "react"
import api from "../services/api"
import { AuthContext } from "./AuthContext"


export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Login using the FastAPI authentication endpoint.
    const login = async (email, password) => {
        const response = await api.post("/auth/login", {
            email, 
            password,
        })

        const token = response.data.access_token

        // Store the JWT token after successful login.
        localStorage.setItem("access_token", token)


        try {
            // Get the Logged-in user's information.
            const userResponse = await api.get("/auth/me")

            setUser(userResponse.data)

            return userResponse.data
        } catch {
            // Remove the token if user information cannot be loaded.
            localStorage.removeItem("access_token")
            setUser(null)
            throw new Error("Unable to retrieve user information.")
        }

    }

    // Logout the current user.
    const logout = () => {
        localStorage.removeItem("access_token")
        setUser(null)
    }

    // Check whether a valid login session exists when the app starts.
    useEffect(() => {
        const checkLoginSession = async () => {
            const token = localStorage.getItem("access_token")

            if (!token){
                setLoading(false)
            return
            }
            try {
                const response = await api.get("/auth/me")
                setUser(response.data)
            } catch {
                // Remove an invalid or expired token.
                localStorage.removeItem("access_token")
                setUser(null)
            } finally {
                setLoading(false)
            }
        
        }

        checkLoginSession()

    }, [])

    // Share authentication information with child components.
    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
                isAuthenticated: !!user,
                role: user?.role
            }}
            >
            {children}
        </AuthContext.Provider>
    )
}

