function Button({ children, type = 'button',onClick, disabled = false}) {
  // A reusable button with a consistent design.
  // children represents the text displayed inside the button.
  // type controls whether it is a normal button or a submit button.
  // onClick is the function called when the user clicks it.

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50">
            {children}
        </button>
    )
}

//Allow other files to import this component.
export default Button