import { useEffect, useRef, useState } from "react"
import { NavLink } from "react-router-dom"
function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false)
    const navbarRef = useRef(null)
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
            document.removeEventListener('krydown', handleEscapseKey)
        }
    }, [menuOpen])

    return (
        <nav ref={navbarRef} className="border-b border-slate-200 bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header: Logo and Mobile Menu Button */}
                <div className="flex items-center justify-between py-4">


                    {/* Application logo and title */}
                    <NavLink to="/dashboard" onClick={closeMenu} className="flex items-center gap-3">
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
                {/* Hamburger button - Mobile only */}
                <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                    aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-navigation">
                    {menuOpen ? (
                        // Close icon
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


                {/* Desktop navigation */}
                <div className="hidden items-center gap-2 md:flex">
                    <NavLink to="/dashboard" className={getLinkClass}>
                        Dashboard
                    </NavLink>

                    <NavLink to="/employees" className={getLinkClass}>
                        Employees
                    </NavLink>

                    <NavLink to="/employees/new" className={getLinkClass}>
                        EmployeeForm
                    </NavLink>

                    <NavLink to="/about" className={getLinkClass}>
                        About
                    </NavLink>
                </div>
            </div>

            {/* Mobile navigation with slide-down animation */}
            <div
                id="mobile-navigation" 
                className={`grid transition-all duration-300 ease-in-out md:hidden ${
                    menuOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0'
                }`}>
                <div className="overflow-hidden">
                    <div className="flex flex-col gap-2 pb-4">
                        <NavLink
                            to="/dashboard"
                            onClick={closeMenu}
                            className={getLinkClass}>
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/employees"
                            onClick={closeMenu}
                            className={getLinkClass}>
                            Employees
                        </NavLink>
                        <NavLink
                            to="/employees/new"
                            onClick={closeMenu}
                            className={getLinkClass}>
                            EmployeeForm
                        </NavLink>
                        <NavLink
                            to="/about"
                            onClick={closeMenu}
                            className={getLinkClass}>
                            About
                        </NavLink>
                    </div>
                </div>
            </div>

        </div>
    </nav>
    )
}

export default Navbar