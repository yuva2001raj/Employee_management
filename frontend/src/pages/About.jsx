import { Link } from 'react-router-dom'

function About() {
    const technologies = [
        {
            name: 'React',
            category: 'Frontend',
            description: 'Builds the interactive user interfaces.',
            icon:'⚛️',
            color: 'bg-blue-100 text-blue-700'
        },
        {
            name: 'Tailwind CSS',
            category: 'Styling',
            description: 'Creates responsive and modern designs.',
            icon:'🎨',
            color: 'bg-cyan-100 text-cyan-700'
        },
        {
            name: 'FastAPI',
            category: 'Backend',
            description: 'Handles Api requests and business logic.',
            icon:'⚡',
            color: 'bg-green-100 text-green-700'
        },
        {
            name: 'Python',
            category: 'Programming',
            description: 'Powers the backend application.',
            icon:'🐍',
            color: 'bg-yellow-100 text-yellow-700'
        },
        {
            name: 'SQLite',
            category: 'Database',
            description: 'Stores employee information and records.',
            icon:'🗄️',
            color: 'bg-purple-100 text-purple-700'
        }
    ]

    const features = [
        {
            number: '01',
            title: 'Employee Management',
            description: 'Add, View, update, and delete employee records.'
        },
        {
            number: '02',
            title: 'Search Employees',
            description: 'Find employees using their name or employee ID.'
        },
        {
            number: '03',
            title: 'Age Filtering',
            description: 'Filter employee records according to age groups.'
        },
        {
            number: '04',
            title: 'Dashboard Statistics',
            description: 'View employee counts, average age and age-group statistics.'
        },
        {
            number: '05',
            title: 'Pagination',
            description: 'Navigate employee records across multiple pages.'
        }
    ]

    return (
        <div className="space-y-10">

            {/* Page Header */}
            <section className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 px-8 py-12 text-white shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
                    About Our Project
                    </p>
                    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                        Employee Management System
                    </h1>
                    <p className="mt-4 max-w-2xl leading-7 text-blue-100">
                        A web-based application designed to simplify employee
                        record management through a clean interface and
                        organized backend system.
                    </p>

                    <Link
                        to="/dashboard"
                        className="mt-7 inline-block rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">
                            Explore Dashboard →
                    </Link>
            </section>

            {/* Project Overview */}
            <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800">
                    Project Overview
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                    The Employee Management System helps manage employee
                    information in one place. Users can create employee
                    records, view existing information, update details,
                    search records and remove employees when necessary.
                </p>
                <p className="mt-3 leading-7 text-slate-600">
                    The application uses React for the frontend,
                    FastAPI for backend services and SQLite for
                    database storage.
                </p>
            </section>
            {/* Technology Stack */}
            <section>
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-slate-800">
                        Technology Stack
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Technologies used to build this application.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {technologies.map((tech) => (
                        <div
                            key={tech.name}
                            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                            <div className="flex items-center justify-between">
                                <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${tech.color}`}>
                                    {tech.icon}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {tech.category}
                                </span>
                            </div>
                            <h3 className="mt-5 text-lg font-bold text-slate-800">
                                {tech.name}
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                {tech.description}
                            </p>
                        </div>
                    ))}
                </div>            
            </section>
            {/* Main Features */}
            <section>
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-slate-800">
                        Key Features
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        What you can do with this application.
                    </p>
                </div>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {features.map((feature, index) => (
                        <div
                            key={feature.number}
                            className={`flex gap-5 p-6 ${
                                index !== features.length - 1 
                                ? 'border-b border-slate-100' 
                                : ''
                                }`}
                            >
                                <span className="text-lg font-bold text-blue-600">
                                    {feature.number}
                                </span>
                                <div>
                                    <h3 className=" font-semibold text-slate-800">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-6 text-slate-500">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                    ))}
                </div>
            </section>
            {/* System Architecture */}
            <section className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-800">
                    System Architecture
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    How the different parts of the application communicate.
                </p>
                <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-5 text-center sm:w-1/3">
                        <div className="text-2xl">🖥️</div>
                        <h3 className="mt-2 font-bold text-slate-800">
                            Frontend
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                            React + Tailwind CSS
                        </p>
                    </div>
                    <span className="rotate-90 text-2xl font-bold text-slate-400 sm:rotate-0">
                        →
                    </span>

                    <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-5 text-center sm:w-1/3">
                        <div className="text-2xl">⚙️</div>
                        <h3 className="mt-2 font-bold text-slate-800">
                            Backend
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                            FastAPI + Python
                        </p>
                    </div>
                    <span className="rotate-90 text-2xl font-bold text-slate-400 sm:rotate-0">
                        →
                    </span>

                    <div className="w-full rounded-xl border border-blue-200 bg-blue-50 p-5 text-center sm:w-1/3">
                        <div className="text-2xl">🗄️</div>
                        <h3 className="mt-2 font-bold text-slate-800">
                            Database
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                            SQLite
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <section className="rounded-xl bg-slate-800 px-6 py-8 text-center text-white">
                <h2 className="text-xl font-bold">
                    Employee Management System
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                    A simple and organized approach to employee management.
                </p>

                <p className="mt-5 text-sm text-slate-400">
                    Built with React, FastAPI and SQLite.
                </p>
            </section>
        </div>
    )

}

export default About