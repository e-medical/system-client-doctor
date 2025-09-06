import { useState, useEffect } from "react";
import { deletePatient } from '../services/patient/patientDeleteService.ts';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    patientId?: string;
    patientData?: {
        name?: string;
        nic?: string;
        id?: string;
    };
    message?: string;
    adminRequestMode?: boolean; // New prop to control admin request behavior
}

export default function DeleteConfirmationModal({
                                                    isOpen,
                                                    onClose,
                                                    onConfirm,
                                                    patientId,
                                                    patientData,
                                                    message,
                                                    adminRequestMode = false // Default to false for backward compatibility
                                                }: DeleteConfirmationModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deletionStep, setDeletionStep] = useState<'confirm' | 'processing' | 'result'>('confirm');

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccess(null);
            setDeletionStep('confirm');
            setLoading(false);
        }
    }, [isOpen, patientId, adminRequestMode]);

    const handleConfirm = async () => {
        // If in admin request mode, just call the original onConfirm
        if (adminRequestMode) {
            onConfirm();
            return;
        }

        // Check if patient ID exists
        if (!patientId) {
            setError('No patient selected for deletion');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);
        setDeletionStep('processing');

        try {
            // Attempt to delete the patient
            const response = await deletePatient(patientId);

            setSuccess(response.message || 'Patient deleted successfully');
            setDeletionStep('result');

            // Call the parent's onConfirm after successful deletion
            setTimeout(() => {
                onConfirm();
                onClose();
            }, 2000); // Show success message for 2 seconds

        } catch (err: any) {
            const errorMessage = err.message || 'Failed to delete patient';
            setError(errorMessage);
            setDeletionStep('result');

            // If the error is about active records, suggest admin request
            if (errorMessage.includes('active records') || errorMessage.includes('active medical records')) {
                // Auto-switch to admin request mode if deletion fails due to active records
                setTimeout(() => {
                    setError(null);
                    setDeletionStep('confirm');
                }, 3000);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAdminRequest = () => {
        // This would typically send a request to admin or create a ticket
        console.log('🎫 Admin deletion request created for patient:', patientId);

        setSuccess('Admin deletion request submitted successfully. You will be notified when the request is processed.');
        setDeletionStep('result');

        // Call parent's onConfirm and close after showing success
        setTimeout(() => {
            onConfirm();
            onClose();
        }, 3000);
    };

    if (!isOpen) return null;

    // Get confirmation message
    const getConfirmationMessage = (): string => {
        if (patientData) {
            const patientName = patientData.name || 'Unknown Patient';
            const patientNIC = patientData.nic || patientData.id || 'Unknown ID';
            return `Are you sure you want to delete the patient record for "${patientName}" (NIC: ${patientNIC})?`;
        }
        return message || "Are you sure you want to delete this patient?";
    };

    const confirmationMessage = getConfirmationMessage();

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl"
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                {/* Content based on deletion step */}
                {deletionStep === 'confirm' && (
                    <>
                        <div className="text-left mb-6">
                            {adminRequestMode ? (
                                <div>
                                    <h2 className="text-lg font-medium text-gray-800 mb-4">
                                        Request Admin Deletion
                                    </h2>
                                    <p className="text-sm text-gray-600 mb-4">
                                        This patient cannot be deleted directly due to active medical records.
                                        Would you like to request an admin to review and process this deletion?
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <h2 className="text-lg font-medium text-gray-800 mb-4">
                                        Confirm Patient Deletion
                                    </h2>
                                    <div className="text-sm text-gray-600 mb-4">
                                        <p>{confirmationMessage}</p>
                                    </div>

                                    {/* Simple deletion info */}
                                    <div className="mb-4 p-3 bg-blue-50 rounded border">
                                        <h4 className="font-semibold text-sm text-blue-800 mb-2">
                                            Deletion Type: SOFT DELETE
                                        </h4>
                                        <p className="text-xs text-blue-700 mb-2">
                                            Patient will be marked as inactive rather than permanently removed.
                                        </p>
                                        <ul className="text-xs text-blue-600 space-y-1">
                                            <li>• Patient will be hidden from active patient lists</li>
                                            <li>• All medical history and records are preserved</li>
                                            <li>• Cannot be deleted if patient has active medical records</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                                <p className="text-red-600 text-sm">{error}</p>
                                {error.includes('active records') && (
                                    <div className="mt-2">
                                        <button
                                            onClick={handleAdminRequest}
                                            className="text-blue-600 text-sm underline hover:text-blue-800"
                                        >
                                            Request admin deletion instead
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {deletionStep === 'processing' && (
                    <div className="text-center mb-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <h2 className="text-lg font-medium text-gray-800 mb-2">
                            Processing Deletion...
                        </h2>
                        <p className="text-sm text-gray-600">
                            Please wait while we process your request.
                        </p>
                    </div>
                )}

                {deletionStep === 'result' && (
                    <div className="text-center mb-6">
                        {success ? (
                            <div>
                                <div className="text-green-500 text-4xl mb-4">✓</div>
                                <h2 className="text-lg font-medium text-green-800 mb-2">
                                    Success
                                </h2>
                                <p className="text-sm text-green-600">{success}</p>
                            </div>
                        ) : error ? (
                            <div>
                                <div className="text-red-500 text-4xl mb-4">✗</div>
                                <h2 className="text-lg font-medium text-red-800 mb-2">
                                    Deletion Failed
                                </h2>
                                <p className="text-sm text-red-600 mb-4">{error}</p>

                                {error.includes('active records') && (
                                    <button
                                        onClick={handleAdminRequest}
                                        className="text-blue-600 text-sm underline hover:text-blue-800"
                                    >
                                        Request admin deletion instead
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Buttons - only show during confirm step */}
                {deletionStep === 'confirm' && (
                    <div className="flex gap-4">
                        {adminRequestMode ? (
                            <>
                                <button
                                    onClick={handleAdminRequest}
                                    disabled={loading}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Processing...' : 'Request Admin'}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-50 py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Deleting...' : 'Delete Patient'}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 border border-red-500 text-red-500 hover:bg-red-50 py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Alternative action during result step */}
                {deletionStep === 'result' && error && error.includes('active records') && (
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                setError(null);
                                setDeletionStep('confirm');
                            }}
                            className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md font-medium transition-colors text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}