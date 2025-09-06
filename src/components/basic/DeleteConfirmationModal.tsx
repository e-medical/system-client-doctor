
export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm }: any) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg mx-4">
                {/* Close button */}
                <div className="flex justify-end mb-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="text-left mb-12">
                    <h2 className="text-lg font-medium text-gray-800 mb-2">
                        Are Your Sure The Delete This ? Please Request The Admin.
                    </h2>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-md font-medium transition-colors"
                    >
                        Request To Admin
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 border border-red-500 text-red-500 hover:bg-red-50 py-3 px-4 rounded-md font-medium transition-colors"
                    >
                        Cancel Now
                    </button>
                </div>
            </div>
        </div>
    );
}
