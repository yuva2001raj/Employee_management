// Create a reusable Input component.
// We can use this component for Employee Name, Employee ID,
// Age, Email, and other form fields.
function Input({ label, ...props}) {
    return (
        // Arrange the label and textbox vertically.
        // gap-2 adds space between them.
        <div className="flex flex-col gap-2">
             {/* Display the field name above the textbox. */}
            <label
            htmlFor={props.id} 
            className="text-sm font-medium text-gray-700">
                {label}
            </label>
            {/*
        Create the textbox.

        {...props} passes properties such as:
        type="text"
        placeholder="Enter employee name"
        value={employeeName}
        onChange={handleChange}

        className defines our standard textbox design.
        It comes after {...props}, so a className supplied
        by the caller cannot replace this className.
      */}

            <input
            {...props}
            className="w-full rounded-lg border border-red-400 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-200"/>
        </div>
    )

}

// Export the component so other files can import and reuse it.
export default Input