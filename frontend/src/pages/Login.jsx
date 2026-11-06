import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"

function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)
    
    const handleSumbmit = async (event) => {
        event.preventDefault()

        setError("")
        setSubmitting(true)

        try {
            const loggedInUser = await login(email, password)

            // Redirect users based on their role.
            if (loggedInUser.role === "admin") {
                navigate("/dashboard", { replace:true })
            } else {
                navigate("/profile", { relative: true})
            }
        } catch (error) {
            const message = error.response?.data?.detail
            setError(message || "Login failed. Please check your credentials.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold text-white">
                        E
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800">
                        Welcome Back
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Sign in to your Employee Management account.
                    </p>
                </div>

                <form onSubmit={handleSumbmit} className="space-y-5">
                    <div>
                        <label 
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-700">
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Enter you email"
                            required
                            autoComplete="username"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-2 block text-sm font-medium text-slate-700">
                                Password
                        </label>

                        <input 
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    {error && (
                        <div 
                            role="alert"
                            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disable:opacity-60">
                        {submitting ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-xs text-slate-400">
                    Employee Management System
                </p>
            </div>
        </div>
    )
}

export default Login