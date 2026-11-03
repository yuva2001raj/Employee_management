import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from "./Navbar"

const renderNavbar = () => {
    return render (
    <MemoryRouter initialEntries={['/dashboard']}>
        <Navbar />
    </MemoryRouter>
    )
}

describe('Navbar Component', () => {
    test('renders the application title and navigation links', () => {
        renderNavbar()
        expect(screen.getByText('Employee Manager')).toBeInTheDocument()
        expect(screen.getAllByRole('link', {name: 'Dashboard'}).length).toBeGreaterThan(0)
        expect(screen.getAllByRole('link', {name: 'Employees'}).length).toBeGreaterThan(0)
        expect(screen.getAllByRole('link', {name: 'About'}).length).toBeGreaterThan(0)
    })
test('opens the mobile navigation menu', () => {
    renderNavbar()
    const openButton = screen.getByRole('button', {
        name: 'Open navigation menu'
    })

    fireEvent.click(openButton)

    expect(screen.getByRole('button', {
        name: 'Close navigation menu'
    })).toHaveAttribute('aria-expanded', 'true')
})

test('closes the mobile menu when Escape is pressed', () => {
    renderNavbar()
    fireEvent.click(screen.getByRole('button',{
        name:'Open navigation menu'
    }))

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.getByRole('button', {
        name:'Open navigation menu'
    })).toHaveAttribute('aria-expanded', 'false')

})

test('closes the mobile menu when clicking outside', () => {
    renderNavbar()
    fireEvent.click(screen.getByRole('button',{
        name:'Open navigation menu'
    }))

    fireEvent.mouseDown(document.body)

    expect(screen.getByRole('button', {
        name:'Open navigation menu'
    })).toHaveAttribute('aria-expanded', 'false')
    
})

test('closes the mobile menu after selecting a navigation link', () => {
    renderNavbar()
    fireEvent.click(screen.getByRole('button',{
        name:'Open navigation menu'
    }))

    const mobileNavigation = document.getElementById('mobile-navigation')
    const employeesLink = within(mobileNavigation).getByRole('link', {
        name:'Employees'
    })
    fireEvent.click(employeesLink)

    expect(screen.getByRole('button', {
        name:'Open navigation menu'
    })).toHaveAttribute('aria-expanded', 'false')
})

test('toggles the mobile menu closed when the close button is clicked', () => {
    renderNavbar()
    fireEvent.click(screen.getByRole('button',{
        name:'Open navigation menu'
    }))
    fireEvent.click(screen.getByRole('button',{
        name:'Close navigation menu'
    }))
    expect(screen.getByRole('button', {
        name:'Open navigation menu'
    })).toHaveAttribute('aria-expanded', 'false')
    })

})
