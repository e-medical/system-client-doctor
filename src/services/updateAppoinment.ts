// src/services/appointmentUpdateService.ts

import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Appointment Status enum (matching backend)
export enum AppointmentStatus {
    SCHEDULED = 'SCHEDULED',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW',
    IN_PROGRESS = 'IN_PROGRESS'
}

// Gender enum (matching backend)
export enum PatientGender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
    OTHER = 'OTHER'
}

// Update Appointment Request interface (matches backend)
export interface UpdateAppointmentRequest {
    patientName?: string;
    patientNIC?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientAddress?: string;
    patientAge?: number;
    patientGender?: PatientGender;
    status?: AppointmentStatus;
}

// Updated Appointment Response interface (matches backend response)
export interface UpdateAppointmentResponse {
    success: boolean;
    message: string;
    data: {
        _id: string;
        propertyId: string;
        channelNo: number;
        patientName: string;
        patientNIC: string;
        patientEmail?: string;
        patientPhone: string;
        patientAge?: number;
        patientGender?: PatientGender;
        patientAddress?: string;
        doctorId: string;
        doctorName: string;
        doctorSpecialty: string;
        appointmentDate: string;
        appointmentTime: string;
        duration: number;
        appointmentType: string;
        priority: string;
        status: AppointmentStatus;
        symptoms?: string;
        notes?: string;
        channelFee: number;
        activeStatus: boolean;
        createdAt: string;
        updatedAt: string;
        createdBy: {
            _id: string;
            firstName: string;
            lastName: string;
            userEmail: string;
        };
        updatedBy: {
            _id: string;
            firstName: string;
            lastName: string;
            userEmail: string;
        };
    };
}

// Error response interface
export interface AppointmentUpdateError {
    success: false;
    message: string;
    errors?: Record<string, string>;
}

/**
 * Update an appointment's information
 * @param appointmentId - The appointment's ID
 * @param updateData - The data to update
 * @returns Promise<UpdateAppointmentResponse>
 */
export const updateAppointment = async (
    appointmentId: string,
    updateData: UpdateAppointmentRequest
): Promise<UpdateAppointmentResponse> => {
    try {
        console.log('🔄 Updating appointment:', { appointmentId, updateData });

        // Validate required parameters
        if (!appointmentId) {
            throw new Error('Appointment ID is required');
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            throw new Error('Update data is required');
        }

        // Clean and prepare the update data
        const cleanedData: UpdateAppointmentRequest = {};

        // Only include defined values in the request
        if (updateData.patientName !== undefined) {
            cleanedData.patientName = updateData.patientName.trim();
        }
        if (updateData.patientNIC !== undefined) {
            cleanedData.patientNIC = updateData.patientNIC.trim().toUpperCase();
        }
        if (updateData.patientPhone !== undefined) {
            cleanedData.patientPhone = updateData.patientPhone.trim();
        }
        if (updateData.patientEmail !== undefined) {
            cleanedData.patientEmail = updateData.patientEmail.toLowerCase().trim();
        }
        if (updateData.patientAddress !== undefined) {
            cleanedData.patientAddress = updateData.patientAddress?.trim();
        }
        if (updateData.patientAge !== undefined) {
            cleanedData.patientAge = updateData.patientAge;
        }
        if (updateData.patientGender !== undefined) {
            cleanedData.patientGender = updateData.patientGender;
        }
        if (updateData.status !== undefined) {
            cleanedData.status = updateData.status;
        }

        console.log('📤 Sending cleaned data:', cleanedData);

        // Make the API request
        const response: AxiosResponse<UpdateAppointmentResponse> = await api.put(
            `${baseUrl}appointments/${appointmentId}`,
            cleanedData
        );

        console.log('✅ Appointment updated successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error updating appointment:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data as AppointmentUpdateError;

            // Handle specific error cases
            if (error.response.status === 403) {
                throw new Error('Access denied. You do not have permission to update this appointment.');
            } else if (error.response.status === 404) {
                throw new Error('Appointment not found or may have been deleted.');
            } else {
                throw new Error(serverError.message || 'Failed to update appointment');
            }
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred');
        }
    }
};

/**
 * Update only basic appointment information (commonly edited fields)
 * @param appointmentId - The appointment's ID
 * @param basicData - Basic appointment data to update
 * @returns Promise<UpdateAppointmentResponse>
 */
export const updateBasicAppointmentInfo = async (
    appointmentId: string,
    basicData: {
        patientName?: string;
        patientNIC?: string;
        patientPhone?: string;
        patientEmail?: string;
        patientAddress?: string;
        patientAge?: number | string;
        patientGender?: string;
        status?: string;
    }
): Promise<UpdateAppointmentResponse> => {
    // Convert the basic data format to the backend format
    const updateData: UpdateAppointmentRequest = {};

    if (basicData.patientName !== undefined) {
        updateData.patientName = basicData.patientName;
    }
    if (basicData.patientNIC !== undefined) {
        updateData.patientNIC = basicData.patientNIC;
    }
    if (basicData.patientPhone !== undefined) {
        updateData.patientPhone = basicData.patientPhone;
    }
    if (basicData.patientEmail !== undefined && basicData.patientEmail !== 'N/A') {
        updateData.patientEmail = basicData.patientEmail;
    }
    if (basicData.patientAddress !== undefined && basicData.patientAddress !== 'N/A') {
        updateData.patientAddress = basicData.patientAddress;
    }
    if (basicData.patientAge !== undefined) {
        updateData.patientAge = typeof basicData.patientAge === 'string'
            ? parseInt(basicData.patientAge, 10)
            : basicData.patientAge;
    }
    if (basicData.patientGender !== undefined) {
        updateData.patientGender = basicData.patientGender as PatientGender;
    }
    if (basicData.status !== undefined) {
        updateData.status = basicData.status as AppointmentStatus;
    }

    return updateAppointment(appointmentId, updateData);
};

/**
 * Update only appointment status
 * @param appointmentId - The appointment's ID
 * @param status - New status
 * @returns Promise<UpdateAppointmentResponse>
 */
export const updateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus
): Promise<UpdateAppointmentResponse> => {
    return updateAppointment(appointmentId, { status });
};

/**
 * Confirm an appointment (sets status to CONFIRMED)
 * @param appointmentId - The appointment's ID
 * @returns Promise<UpdateAppointmentResponse>
 */
export const confirmAppointment = async (
    appointmentId: string
): Promise<UpdateAppointmentResponse> => {
    return updateAppointmentStatus(appointmentId, AppointmentStatus.CONFIRMED);
};

/**
 * Cancel an appointment (sets status to CANCELLED)
 * @param appointmentId - The appointment's ID
 * @returns Promise<UpdateAppointmentResponse>
 */
export const cancelAppointment = async (
    appointmentId: string
): Promise<UpdateAppointmentResponse> => {
    return updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED);
};

/**
 * Complete an appointment (sets status to COMPLETED)
 * @param appointmentId - The appointment's ID
 * @returns Promise<UpdateAppointmentResponse>
 */
export const completeAppointment = async (
    appointmentId: string
): Promise<UpdateAppointmentResponse> => {
    return updateAppointmentStatus(appointmentId, AppointmentStatus.COMPLETED);
};

/**
 * Mark appointment as no-show (sets status to NO_SHOW)
 * @param appointmentId - The appointment's ID
 * @returns Promise<UpdateAppointmentResponse>
 */
export const markAppointmentNoShow = async (
    appointmentId: string
): Promise<UpdateAppointmentResponse> => {
    return updateAppointmentStatus(appointmentId, AppointmentStatus.NO_SHOW);
};

/**
 * Validate appointment update data before sending to API
 * @param updateData - The data to validate
 * @returns Object with isValid boolean and errors array
 */
export const validateAppointmentUpdateData = (updateData: UpdateAppointmentRequest): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    // Validate patient name
    if (updateData.patientName !== undefined) {
        if (!updateData.patientName.trim()) {
            errors.push('Patient name is required');
        } else if (updateData.patientName.trim().length < 2) {
            errors.push('Patient name must be at least 2 characters');
        } else if (updateData.patientName.trim().length > 100) {
            errors.push('Patient name must not exceed 100 characters');
        }
    }

    // Validate NIC
    if (updateData.patientNIC !== undefined) {
        const nicPattern = /^(\d{9}[VXvx]|\d{12})$/;
        if (!updateData.patientNIC.trim()) {
            errors.push('NIC is required');
        } else if (!nicPattern.test(updateData.patientNIC.trim())) {
            errors.push('Invalid NIC format. Use XXXXXXXXXV or XXXXXXXXXXXX');
        }
    }

    // Validate phone
    if (updateData.patientPhone !== undefined) {
        const phonePattern = /^\d{10}$/;
        if (!updateData.patientPhone.trim()) {
            errors.push('Phone number is required');
        } else if (!phonePattern.test(updateData.patientPhone.trim())) {
            errors.push('Phone number must be 10 digits');
        }
    }

    // Validate email
    if (updateData.patientEmail !== undefined && updateData.patientEmail.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(updateData.patientEmail.trim())) {
            errors.push('Invalid email format');
        }
    }

    // Validate age
    if (updateData.patientAge !== undefined) {
        if (updateData.patientAge < 0 || updateData.patientAge > 150) {
            errors.push('Age must be between 0 and 150');
        }
    }

    // Validate gender
    if (updateData.patientGender !== undefined) {
        const validGenders = Object.values(PatientGender);
        if (!validGenders.includes(updateData.patientGender)) {
            errors.push('Gender must be MALE, FEMALE, or OTHER');
        }
    }

    // Validate status
    if (updateData.status !== undefined) {
        const validStatuses = Object.values(AppointmentStatus);
        if (!validStatuses.includes(updateData.status)) {
            errors.push('Invalid appointment status');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Convert frontend appointment data to backend UpdateAppointmentRequest
 * @param appointment - Frontend appointment object
 * @returns UpdateAppointmentRequest object
 */
export const convertAppointmentToUpdateRequest = (appointment: {
    name?: string;
    nic?: string;
    email?: string;
    contact?: string;
    age?: string | number;
    gender?: string;
    address?: string;
    status?: string;
}): UpdateAppointmentRequest => {
    const updateData: UpdateAppointmentRequest = {};

    if (appointment.name !== undefined) {
        updateData.patientName = appointment.name;
    }
    if (appointment.nic !== undefined) {
        updateData.patientNIC = appointment.nic;
    }
    if (appointment.email !== undefined && appointment.email !== 'N/A') {
        updateData.patientEmail = appointment.email;
    }
    if (appointment.contact !== undefined) {
        updateData.patientPhone = appointment.contact;
    }
    if (appointment.age !== undefined) {
        updateData.patientAge = typeof appointment.age === 'string'
            ? parseInt(appointment.age, 10)
            : appointment.age;
    }
    if (appointment.gender !== undefined) {
        updateData.patientGender = appointment.gender as PatientGender;
    }
    if (appointment.address !== undefined && appointment.address !== 'N/A') {
        updateData.patientAddress = appointment.address;
    }
    if (appointment.status !== undefined) {
        updateData.status = appointment.status as AppointmentStatus;
    }

    return updateData;
};

/**
 * Batch update multiple appointments (if needed in the future)
 * @param updates - Array of appointment updates
 * @returns Promise<UpdateAppointmentResponse[]>
 */
export const batchUpdateAppointments = async (
    updates: Array<{
        appointmentId: string;
        updateData: UpdateAppointmentRequest;
    }>
): Promise<UpdateAppointmentResponse[]> => {
    const results: UpdateAppointmentResponse[] = [];
    const errors: Array<{ appointmentId: string; error: string }> = [];

    // Process updates sequentially to avoid overwhelming the server
    for (const { appointmentId, updateData } of updates) {
        try {
            const result = await updateAppointment(appointmentId, updateData);
            results.push(result);
        } catch (error: any) {
            errors.push({
                appointmentId,
                error: error.message
            });
        }
    }

    if (errors.length > 0) {
        console.warn('Some appointment updates failed:', errors);
        // You might want to handle partial failures differently
    }

    return results;
};

/**
 * Get available status transitions for an appointment
 * @param currentStatus - Current appointment status
 * @returns Array of valid next statuses
 */
export const getValidStatusTransitions = (currentStatus: AppointmentStatus): AppointmentStatus[] => {
    const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
        [AppointmentStatus.SCHEDULED]: [
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.CANCELLED,
            AppointmentStatus.IN_PROGRESS
        ],
        [AppointmentStatus.CONFIRMED]: [
            AppointmentStatus.IN_PROGRESS,
            AppointmentStatus.COMPLETED,
            AppointmentStatus.NO_SHOW,
            AppointmentStatus.CANCELLED
        ],
        [AppointmentStatus.IN_PROGRESS]: [
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELLED
        ],
        [AppointmentStatus.COMPLETED]: [], // Final state
        [AppointmentStatus.CANCELLED]: [
            AppointmentStatus.SCHEDULED
        ], // Can reschedule
        [AppointmentStatus.NO_SHOW]: [
            AppointmentStatus.SCHEDULED
        ] // Can reschedule
    };

    return transitions[currentStatus] || [];
};

/**
 * Check if a status transition is valid
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns boolean indicating if transition is valid
 */
export const isValidStatusTransition = (
    fromStatus: AppointmentStatus,
    toStatus: AppointmentStatus
): boolean => {
    const validTransitions = getValidStatusTransitions(fromStatus);
    return validTransitions.includes(toStatus);
};