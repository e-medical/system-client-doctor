import  { useState, useEffect } from "react";

interface UpdateFeedbackModal {
    open: boolean;
    onClose: () => void;
    doctorName: string;
    doctorRole: string;
    feedback: string;
    onUpdate: (updatedFeedback: string) => void;
}

export default function UpdateFeedbackModal({
                                                open,
                                                onClose,
                                                doctorName,
                                                doctorRole,
                                                feedback,
                                                onUpdate,
                                            }: UpdateFeedbackModal) {
    const [newFeedback, setFeedback] = useState(feedback);

    useEffect(() => {
        setFeedback(newFeedback); // reset when modal opens
    }, [feedback, open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center px-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Update FeedBack</h2>
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
                            photo_camera
                        </span>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">{doctorName}</h3>
                        <p className="text-xs text-gray-500">{doctorRole}</p>
                    </div>
                </div>

                {/* Feedback Textarea */}
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Write updated feedback here..."
                    rows={5}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/50"
                />

                {/* Actions */}
                <div className="flex justify-end mt-6 gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onUpdate(feedback)}
                        className="px-4 py-2 bg-secondary text-white rounded-md transition"
                    >
                        Update
                    </button>
                </div>
            </div>
        </div>
    );
}
