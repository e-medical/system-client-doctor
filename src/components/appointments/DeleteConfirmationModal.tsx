import React, {useState, useEffect} from 'react';
import {deleteAppointmentService} from '../../services/deleteAppointmentService.ts';
import {getLoggedInUser} from '../../services/authService.ts';
import { Snackbar, Alert } from '@mui/material';

interface DeleteConfirmationModalProps {
    isOpen: boolean,
    onClose: () => void,
    onConfirm?: (appointmentId: string) => void,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void,
    selectedPatientAppointmentId?: string;
    appointment?: {
        id?: string;
        _id?: string;
        patientName?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        status?: string;
        doctorId?: string;
    };
    propCurrentUser?: {
        id?: string;
        _id?: string;
        roles?: string[];
    };
}

export default function DeleteConfirmationModal({
                                                    isOpen,
                                                    onClose,
                                                    onConfirm,
                                                    onSuccess,
                                                    onError,
                                                    selectedPatientAppointmentId,
                                                    appointment,
                                                    propCurrentUser
                                                }: DeleteConfirmationModalProps) {
    console.log("appointmentId", selectedPatientAppointmentId);

    const [isDeleting, setIsDeleting] = useState(false);
    const [canDelete, setCanDelete] = useState(true);
    const [permissionMessage, setPermissionMessage] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<{
        id?: string;
        _id?: string;
        roles?: string[];
    } | null>(null);

    // Snackbar states
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

    // Get current user data on component mount
    useEffect(() => {
        if (propCurrentUser) {
            setCurrentUser(propCurrentUser);
        } else {
            const loggedInUser = getLoggedInUser();
            if (loggedInUser) {
                setCurrentUser({
                    id: loggedInUser.id,
                    _id: loggedInUser.id,
                    roles: loggedInUser.roles
                });
            } else {
                setCurrentUser(null);
                console.warn('No logged-in user found for delete permission check');
            }
        }
    }, [propCurrentUser]);

    useEffect(() => {
        if (isOpen && appointment && currentUser) {
            // Validate appointment for deletion
            const validation = deleteAppointmentService.validateAppointmentForDeletion(appointment);
            setValidationErrors(validation.errors);

            if (!validation.isValid) {
                setCanDelete(false);
                setPermissionMessage(validation.errors[0]);
                return;
            }

            // Check user permissions
            if (currentUser.roles) {
                const userId = currentUser.id || currentUser._id;

                const permission = deleteAppointmentService.canDeleteAppointment(
                    currentUser.roles,
                    appointment.doctorId,
                    userId
                );

                setCanDelete(permission.canDelete);
                if (!permission.canDelete) {
                    setPermissionMessage(permission.reason || 'You do not have permission to delete this appointment');
                } else {
                    // Generate confirmation message
                    const message = deleteAppointmentService.getDeleteConfirmationMessage(
                        appointment.patientName,
                        appointment.appointmentDate
                    );
                    setConfirmationMessage(message);
                }
            }
        } else if (isOpen && appointment && !currentUser) {
            setCanDelete(false);
            setPermissionMessage('Unable to verify user permissions. Please log in again.');
        }
    }, [isOpen, appointment, currentUser]);

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbarMessage(`${message} (ID: ${selectedPatientAppointmentId})`);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const handleConfirm = async () => {
        const appointmentId = selectedPatientAppointmentId || appointment?.id || appointment?._id;

        if (!appointmentId) {
            const errorMsg = 'Appointment ID is missing';
            onError?.(errorMsg);
            showSnackbar(errorMsg, 'error');
            return;
        }

        // If user doesn't have permission, show snackbar and trigger onConfirm
        if (!canDelete) {
            showSnackbar('Admin approval requested for appointment cancellation', 'info');
            onConfirm?.(appointmentId);
            return;
        }

        setIsDeleting(true);

        try {
            await deleteAppointmentService.deleteAppointment(appointmentId);

            const successMessage = deleteAppointmentService.getSuccessMessage(
                appointment?.patientName || 'Patient'
            );

            onSuccess?.(successMessage);
            showSnackbar('Appointment cancelled successfully', 'success');
            onClose();
            onConfirm?.(appointmentId);

        } catch (error: any) {
            console.error('Error deleting appointment:', error);
            const errorMsg = error.message || 'Failed to cancel appointment';
            onError?.(errorMsg);
            showSnackbar(errorMsg, 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const getButtonText = () => {
        if (isDeleting) return 'Cancelling...';
        if (!canDelete) return 'Request To Admin';
        return 'Cancel Appointment';
    };

    const getModalTitle = () => {
        if (!canDelete) {
            return 'Permission Required - Please Request Admin Approval';
        }
        return 'Cancel Appointment Confirmation';
    };

    const getModalContent = () => {
        if (!canDelete) {
            return permissionMessage || 'You do not have permission to cancel this appointment. Please request admin approval.';
        }

        if (validationErrors.length > 0) {
            return validationErrors.join(' ');
        }

        if (confirmationMessage) {
            return confirmationMessage;
        }

        return 'Are you sure you want to cancel this appointment?';
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white w-full max-w-md rounded-lg p-6 shadow-lg mx-4">
                    {/* Close button */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                            disabled={isDeleting}
                        >
                            ×
                        </button>
                    </div>

                    {/* Content */}
                    <div className="text-left mb-6">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">
                            {getModalTitle()}
                        </h2>

                        {/*/!* Appointment ID Display *!/*/}
                        {/*{selectedPatientAppointmentId && (*/}
                        {/*    <div className="bg-blue-50 rounded-lg p-3 mb-4">*/}
                        {/*        <div className="flex justify-between">*/}
                        {/*            <span className="font-medium text-gray-600">Appointment ID:</span>*/}
                        {/*            <span className="text-gray-800 font-mono text-sm">{selectedPatientAppointmentId}</span>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*)}*/}

                        {/* Appointment Details */}
                        {appointment && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                {appointment.patientName && (
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-gray-600">Patient:</span>
                                        <span className="text-gray-800">{appointment.patientName}</span>
                                    </div>
                                )}
                                {appointment.appointmentDate && (
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-gray-600">Date:</span>
                                        <span className="text-gray-800">
                                            {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                                {appointment.appointmentTime && (
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium text-gray-600">Time:</span>
                                        <span className="text-gray-800">{appointment.appointmentTime}</span>
                                    </div>
                                )}
                                {appointment.status && (
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-600">Status:</span>
                                        <span className={`text-gray-800 ${
                                            appointment.status === 'COMPLETED' ? 'text-red-600 font-medium' : ''
                                        }`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Message */}
                        <div className={`text-sm ${
                            !canDelete ? 'text-amber-700 bg-amber-50 p-3 rounded-lg' : 'text-gray-600'
                        }`}>
                            {getModalContent()}
                        </div>

                        {/* Additional Info for Cancellation */}
                        {canDelete && (
                            <div className="mt-4 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                                <strong>Note:</strong> This action will:
                                <ul className="list-disc list-inside mt-1 space-y-1">
                                    <li>Set the appointment status to CANCELLED</li>
                                    <li>Send a cancellation email to the patient</li>
                                    <li>This action cannot be undone</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className={`flex-1 ${
                                canDelete
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-amber-500 hover:bg-amber-600'
                            } text-white py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                        >
                            {isDeleting && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {getButtonText()}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className={`flex-1 border ${
                                canDelete
                                    ? 'border-red-500 text-red-500 hover:bg-red-50'
                                    : 'border-gray-500 text-gray-500 hover:bg-gray-50'
                            } py-3 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* MUI Snackbar */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </>
    );
}