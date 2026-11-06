import { useEffect, useState } from "react"
import api from "../services/api"

function Profile(){
    const [profile, setProfile] = useState(null)
    const [formData, setFormData] = useState({
        employee_name: "",
        employee_id: "",
        age: "",
        email: "",
    })

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    // Fetch the logged-in employee's profile.
    useEffect(() => {
        const fethProfile = async () => {
            try {
                const response = await api.get("/employees/me")

                setProfile(response.data)
                setFormData({
                    employee_name: response.data.employee_name,
                    employee_id: response.data.employee_id,
                    age: response.data.age,
                    email: response.data.email,
                })

            } catch (error) {
                setError(
                    error.response?.data?.detail ||
                    "Unable to load your profile."
                )
            } finally {
                setLoading(false)
            }
        }

        fethProfile()
    }, [])

    // Update the form whenever an input changes.
    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((previousData) => ({
            ...previousData,
            [name]: value,
        }))

        setError("")
        setSuccess("")
    }

    // Save the updated employee profile.
    const handleSubmit = async (event) => {
        event.preventDefault()

        setSaving(true)
        setError("")
        setSuccess("")

        try {
            const response = await api.put("/employees/me", {
                employee_name: formData.employee_name,
                employee_id: Number(formData.employee_id),
                age: Number(formData.age),
                email:formData.email,
            })

            setProfile(response.data)
            setFormData({
                employee_name: response.data.employee_name,
                employee_id: response.data.employee_id,
                age: response.data.age,
                email: response.data.email,
            })
            setSuccess("Your profile has been updated successfully.")
        } catch (error) {
            setError(
                error.response?.data?.detail ||
                "Unable to update your profile."
            )

        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="py-12 text-center text-slate-500">
                Loading your profile...
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
                {error || "Employee profile not found."}
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-3xl">
            {/* Profile heading */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">
                    My Profile
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    View and update your personal information.
                </p>
            </div>

            {/* Profile form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Employee Name*/}
                    <div>
                        <label
                            htmlFor="employee_name"
                            className="mb-2 block text-sm font-medium text-slate-700">
                            Employee Name
                        </label>

                        <input 
                            id="employee_name"
                            name="employee_name"
                            type="text"
                            value={formData.employee_name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    {/* Employee ID*/}
                    <div>
                        <label
                            htmlFor="employee_id"
                            className="mb-2 block text-sm font-medium text-slate-700">
                            Employee ID
                        </label>

                        <input 
                            id="employee_id"
                            name="employee_id"
                            type="text"
                            value={formData.employee_id}
                            onChange={handleChange}
                            required
                            className="w-full cursor-not-allowed rounded-lg border border-slate-200 px-4 py-3 text-slate-500"/>
                    </div>

                    {/* Age */}
                    <div>
                        <label
                            htmlFor="age"
                            className="mb-2 block text-sm font-medium text-slate-700">
                            Age
                        </label>

                        <input
                            id="age"
                            name="age"
                            type="number"
                            min = "18"
                            max="100"
                            value={formData.age}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    {/* Email*/}
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-700">
                            Email Address
                        </label>

                        <input 
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"/>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div 
                            role="alert"
                            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div
                            role="status"
                            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-green-700">
                            {success}    
                        </div>
                    )}
                    {/* Submit button */}
                    <div className="flex justify-end pt-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                            {saving ? "Saving... ": "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Profile