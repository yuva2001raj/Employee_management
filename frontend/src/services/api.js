import axios from "axios"

// Base URl of our FastAPI backend.
const API_BASE_URL = "http://127.0.0.1:8000"

// Create a reusable Axios instance.
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "content-Type":"application/json",
    },
})

// Automatically attach the JWT token to outgoing requests...
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token")

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default api