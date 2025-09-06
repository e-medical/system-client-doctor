import api from "../../utils/interceptor/axios";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// ---------------------- Types ----------------------
export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW'
}

export interface ChangeStatusResponse {
    success: boolean;
    message: string;
    data?: {
        _id: string;
        propertyId: string;
        status: AppointmentStatus;
        patientName?: string;
        doctorName?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        [key: string]: any;
    };
}

// ---------------------- API Functions ----------------------

/**
 * Changes the status of an appointment
 * @param appointmentId - ID of the appointment to update
 * @param status - New status for the appointment
 * @returns Promise<ChangeStatusResponse>
 */
export const changeAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
): Promise<ChangeStatusResponse> => {
    try {
        console.log('🔄 Changing appointment status:', { appointmentId, status });

        const response: AxiosResponse<ChangeStatusResponse> = await api.get(
            `${baseUrl}appointments/change-status`,
            {
                params: {
                    appointmentId,
                    status
                }
            }
        );

        console.log('✅ Appointment status changed successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error changing appointment status:', error);

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        throw new Error('Failed to change appointment status');
    }
};

// ---------------------- Helper Functions ----------------------

/**
 * Get user-friendly status display name
 */
export const getStatusDisplayName = (status: AppointmentStatus | string): string => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
        case AppointmentStatus.SCHEDULED:
            return 'Scheduled';
        case AppointmentStatus.CONFIRMED:
            return 'Confirmed';
        case AppointmentStatus.IN_PROGRESS:
            return 'In Progress';
        case AppointmentStatus.COMPLETED:
            return 'Completed';
        case AppointmentStatus.CANCELLED:
            return 'Cancelled';
        case AppointmentStatus.NO_SHOW:
            return 'No Show';
        default:
            return 'Unknown';
    }
};

/**
 * Get status color class for UI styling
 */
export const getStatusColorClass = (status: AppointmentStatus | string): string => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
        case AppointmentStatus.SCHEDULED:
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case AppointmentStatus.CONFIRMED:
            return 'bg-green-100 text-green-800 border-green-200';
        case AppointmentStatus.IN_PROGRESS:
            return 'bg-purple-100 text-purple-800 border-purple-200';
        case AppointmentStatus.COMPLETED:
            return 'bg-green-100 text-green-800 border-green-200';
        case AppointmentStatus.CANCELLED:
            return 'bg-red-100 text-red-800 border-red-200';
        case AppointmentStatus.NO_SHOW:
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

// ---------------------- Quick Action Functions ----------------------
export const confirmAppointment = (appointmentId: string) =>
    changeAppointmentStatus(appointmentId, AppointmentStatus.CONFIRMED);

export const startAppointment = (appointmentId: string) =>
    changeAppointmentStatus(appointmentId, AppointmentStatus.IN_PROGRESS);

export const completeAppointment = (appointmentId: string) =>
    changeAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED);

export const cancelAppointment = (appointmentId: string) =>
    changeAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED);

export const markNoShow = (appointmentId: string) =>
    changeAppointmentStatus(appointmentId, AppointmentStatus.NO_SHOW);