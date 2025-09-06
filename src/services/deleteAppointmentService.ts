import api from "../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Response interface for delete appointment
export interface DeleteAppointmentResponse {
    success: boolean;
    message: string;
}

// Error response interface
export interface DeleteAppointmentErrorResponse {
    success: false;
    message: string;
}

class DeleteAppointmentService {
    private readonly endpoint = `${baseUrl}appointments`;

    /**
     * Delete (soft delete) an appointment
     * Matches: DELETE /appointments/:id
     *
     * This performs a soft delete by setting activeStatus to false
     * and status to CANCELLED, then sends a cancellation email
     */
    async deleteAppointment(appointmentId: string): Promise<DeleteAppointmentResponse> {
        if (!appointmentId?.trim()) {
            throw new Error('Appointment ID is required');
        }

        try {
            const response = await api.delete<DeleteAppointmentResponse>(
                `${this.endpoint}/${appointmentId}`
            );

            console.log('Appointment deleted successfully:', response.data);
            return response.data;

        } catch (error: any) {
            console.error('Error deleting appointment:', error);

            // Handle different error scenarios
            if (error.response?.status === 404) {
                throw new Error('Appointment not found or has already been cancelled');
            } else if (error.response?.status === 403) {
                const errorMessage = error.response.data?.message ||
                    'Access denied. You do not have permission to cancel this appointment';
                throw new Error(errorMessage);
            } else if (error.response?.status === 500) {
                throw new Error('Server error occurred while cancelling appointment');
            } else {
                const errorMessage = error.response?.data?.message ||
                    error.message ||
                    'Failed to cancel appointment';
                throw new Error(errorMessage);
            }
        }
    }

    /**
     * Cancel appointment (alias for deleteAppointment for better readability)
     * Since the backend performs soft delete, this is essentially a cancellation
     */
    async cancelAppointment(appointmentId: string): Promise<DeleteAppointmentResponse> {
        return this.deleteAppointment(appointmentId);
    }

    /**
     * Bulk delete multiple appointments
     * Useful for batch operations
     */
    async deleteMultipleAppointments(appointmentIds: string[]): Promise<{
        successful: string[];
        failed: { id: string; error: string }[];
    }> {
        if (!appointmentIds || appointmentIds.length === 0) {
            throw new Error('At least one appointment ID is required');
        }

        const successful: string[] = [];
        const failed: { id: string; error: string }[] = [];

        // Process deletions sequentially to avoid overwhelming the server
        for (const appointmentId of appointmentIds) {
            try {
                await this.deleteAppointment(appointmentId);
                successful.push(appointmentId);
            } catch (error: any) {
                failed.push({
                    id: appointmentId,
                    error: error.message || 'Failed to delete appointment'
                });
            }
        }

        return { successful, failed };
    }

    /**
     * Check if user can delete appointment (client-side validation)
     * This should match the backend permission logic
     */
    canDeleteAppointment(userRoles: string[], appointmentDoctorId?: string, currentUserId?: string): {
        canDelete: boolean;
        reason?: string;
    } {
        // Check if user has required roles (Admin or Doctor)
        const hasRequiredRole = userRoles.includes('ADMIN') || userRoles.includes('DOCTOR');

        if (!hasRequiredRole) {
            return {
                canDelete: false,
                reason: 'Only Admin and Doctor can cancel appointments'
            };
        }

        // If user is a doctor (but not admin), they can only cancel their own appointments
        if (userRoles.includes('DOCTOR') && !userRoles.includes('ADMIN')) {
            if (appointmentDoctorId && currentUserId && appointmentDoctorId !== currentUserId) {
                return {
                    canDelete: false,
                    reason: 'You can only cancel your own appointments'
                };
            }
        }

        return { canDelete: true };
    }

    /**
     * Get confirmation message for deletion
     * Provides user-friendly confirmation text
     */
    getDeleteConfirmationMessage(patientName?: string, appointmentDate?: string): string {
        const baseMessage = 'Are you sure you want to cancel this appointment?';

        if (patientName && appointmentDate) {
            const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `${baseMessage}\n\nPatient: ${patientName}\nDate: ${formattedDate}\n\nThis action will:\n• Set the appointment status to CANCELLED\n• Send a cancellation email to the patient\n• This action cannot be undone`;
        }

        return `${baseMessage}\n\nThis will cancel the appointment and send a notification email to the patient.`;
    }

    /**
     * Validate appointment before deletion
     * Client-side validation before making API call
     */
    validateAppointmentForDeletion(appointment: any): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (!appointment) {
            errors.push('Appointment data is required');
            return { isValid: false, errors };
        }

        if (!appointment.id && !appointment._id) {
            errors.push('Appointment ID is missing');
        }

        if (appointment.activeStatus === false) {
            errors.push('Appointment is already cancelled');
        }

        if (appointment.status === 'CANCELLED') {
            errors.push('Appointment is already cancelled');
        }

        if (appointment.status === 'COMPLETED') {
            errors.push('Cannot cancel a completed appointment');
        }

        // Check if appointment is in the past (optional validation)
        if (appointment.appointmentDate) {
            const appointmentDate = new Date(appointment.appointmentDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (appointmentDate < today) {
                errors.push('Cannot cancel past appointments');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Format delete success message
     */
    getSuccessMessage(patientName?: string): string {
        if (patientName) {
            return `Appointment for ${patientName} has been cancelled successfully. A cancellation email has been sent to the patient.`;
        }
        return 'Appointment cancelled successfully. A cancellation email has been sent to the patient.';
    }

    /**
     * Get deletion reasons for logging/audit purposes
     */
    getDeletionReasons(): { value: string; label: string }[] {
        return [
            { value: 'patient_request', label: 'Patient requested cancellation' },
            { value: 'doctor_unavailable', label: 'Doctor unavailable' },
            { value: 'emergency', label: 'Emergency situation' },
            { value: 'rescheduled', label: 'Appointment rescheduled' },
            { value: 'no_show', label: 'Patient no-show' },
            { value: 'medical_emergency', label: 'Medical emergency' },
            { value: 'system_error', label: 'System error correction' },
            { value: 'other', label: 'Other reason' }
        ];
    }

    /**
     * Get appointment statuses that can be cancelled
     */
    getCancellableStatuses(): string[] {
        return ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'];
    }

    /**
     * Check if appointment status allows cancellation
     */
    isStatusCancellable(status: string): boolean {
        return this.getCancellableStatuses().includes(status);
    }
}

// Export singleton instance
export const deleteAppointmentService = new DeleteAppointmentService();

// Export the class as well for testing or custom instances
export default DeleteAppointmentService;