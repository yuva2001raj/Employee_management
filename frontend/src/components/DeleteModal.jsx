function DeleteModal ({ employee, onCancel, onConfirm, isDeleting }) {
    if (!employee) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

            {/* Modal container */}
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                {/* Warning icon */}
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                    <span className="text-3xl text-red-600">!</span>
                </div>

                {/* Modal heading */}
                <h2 className="text-center text-xl font-bold text-slate-800">
                    Delete Employee?
                </h2>

                {/* Confirmation message */}
                <p className="mt-3 text-center text-sm leading-6 text-slate-600">
                    Are you sure you want to delete
                    <span className="font-semibold text-slate-800">
                        {' '}{employee.employee_name}
                    </span>
                    ? This action cannot be undone.
                </p>

                {/* Action buttons */}
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">
                            Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                            {isDeleting ? 'Deleting...': 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteModal