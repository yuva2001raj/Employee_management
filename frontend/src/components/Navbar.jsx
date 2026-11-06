import { useEffect, useRef, useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"
function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const navbarRef = useRef(null)

    const { user, role, logout, loading } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // Apply different styles to active and inactive navigation links.
    const getLinkClass = ({ isActive }) => 
        `block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isActive
                ? 'bg-blue-600 text-white'
                :'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
        }`

    // Close the mobile menu after selecting a link.
    const closeMenu = () => {
        setMenuOpen(false)
    }

    // Logout the current user.
    const handleLogout = () => {
        logout()
        closeMenu()
        navigate("/login", {replace: true })
    }

    useEffect(() => {
        if (!menuOpen) return

        const handleOutsideClick = (event) => {
            if (
                navbarRef.current &&
                !navbarRef.current.contains(event.target)
            ) {
                setMenuOpen(false)
            }
        }
        const handleEscapseKey = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        document.addEventListener('keydown', handleEscapseKey)

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
            document.removeEventListener('keydown', handleEscapseKey)
        }
    }, [menuOpen])

    // Define navigation links according to the user's role.
    const navigationItems =
        role === "admin"
            ? [
                { label: "Dashboard", path: "/dashboard", end: true },
                { label: "Employees", path: "/employees"},
                { label: "Add Employee", path: "/employees/new"},
                { label: "About", path: "/about"},
            ]
            : role === "employee"
                ? [
                    { label: "My Profile", path:"/profile" },
                    { label: "About", path:"/about" },
                ]
                :[]

    // Determine where the application logo should navigate.
    const homePath = 
        role === "admin"
            ? "/dashboard"
            :role === "employee"
                ? "/profile"
                : "login"

    // Hide navigation links while checking the session and on login.
    const showNavigation = 
        !loading && user && location.pathname !== "/login"

    return (
        <nav ref={navbarRef} className="border-b border-slate-200 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header: Logo and Mobile Menu Button */}
                <div className="flex items-center justify-between py-4">


                    {/* Application logo and title */}
                    <NavLink to={homePath} onClick={closeMenu} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <span className="text-lg font-bold">E</span>
                        </div>

                    <div>
                        <h1 className="text-lg font-bold text-slate-800">
                            Employee Manager
                        </h1>
                        <p className="text-xs text-slate-500">
                            Employee Management System
                        </p>
                    </div>
                </NavLink>

                {/* Desktop navigation */}
                {showNavigation && (
                    <div className="hidden items-center gap-2 md:flex">
                        {navigationItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                className={getLinkClass}>
                                {item.label}
                            </NavLink>
                        ))}

                        {/* User Information*/}
                        <div className="ml-3 border-l border-slate-200 pl-4">
                            <p className="text-xs text-slate-500">
                                {user.email}
                            </p>
                            <p className="text-xs font-semibold capitalize text-blue-600">
                                {role}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="ml-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100">
                            Logout
                        </button>
                    </div>
                )}
                {/* Mobile menu button */}
                {showNavigation && (
                    <button 
                        type="button"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                        aria-label={
                            menuOpen
                                ? "Close navigation menu"
                                : "Open navigation menu"
                        }
                        aria-expanded={menuOpen}
                        aria-controls="mobile-navigation"
                        >
                        {menuOpen ? (
                            <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                    ) : (
                        // Hamburger icon
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                        )}
                    </button>
                )}
            </div>
            {/* Mobile navigation */}
            {showNavigation && (
                <div
                    id="mobile-navigation"
                    className={`grid transition-all duration-300 ease-in-out md:hidden ${
                        menuOpen
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                    }`}
                >
                    <div className="overflow-hidden">
                        <div className="flex flex-col gap-2 pb-4">

                            {navigationItems.map((item) => (
                                <NavLink 
                                    key={item.path}
                                    to={item.path}
                                    end={item.end}
                                    onClick={closeMenu}
                                    className={getLinkClass}>
                                    {item.label}
                                </NavLink>
                            ))}
                            
                            {/* Mobile User Information */}
                            <div className="px-4 py-2">
                                <p className="text-sm text-slate-600">
                                    {user.email}
                                </p>
                                <p className="text-xs font-semibold capitalize text-blue-600">
                                    {role}
                                </p>
                            </div>

                            <button 
                                type="button"
                                onClick={handleLogout}
                                className="rounded-lg bg-red-50 px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-100">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </nav>
    )
}

export default Navbar