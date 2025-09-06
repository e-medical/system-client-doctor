
interface ViewFeedbackModalProps {
    open: boolean;
    onClose: () => void;
    doctorName: string;
    doctorRole: string;
    feedback: string;
}

export default function ViewFeedbackModal({
                                              open,
                                              onClose,
                                              doctorName,
                                              doctorRole,
                                              feedback,
                                          }: ViewFeedbackModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">View Feedback</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                    >
                        &times;
                    </button>
                </div>

                {/* Profile Info */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        <span className="material-symbols-outlined text-gray-400 text-3xl">
                            account_circle
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">{doctorName}</h3>
                        <p className="text-xs text-gray-500">{doctorRole}</p>
                    </div>
                </div>

                {/* Feedback Display */}
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50 text-gray-700 whitespace-pre-wrap">
                    {feedback || "No feedback provided."}
                </div>

                {/* Action */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
