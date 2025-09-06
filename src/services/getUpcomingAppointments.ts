// src/services/getUpcomingAppointments.ts

import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Upcoming appointment data structure based on your API response
export interface UpcomingAppointmentData {
    _id: string;
    propertyId: string;
    channelNo: number;
    patientName: string;
    patientNIC: string;
    patientEmail?: string;
    patientPhone: string;
    patientAge?: number;
    patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
    patientAddress?: string;
    doctorId: string; // This matches doctor.propertyId, not doctor.id
    doctorName: string;
    doctorSpecialty: string;
    appointmentDate: string; // "2025-07-28T00:00:00.000Z"
    appointmentTime: string; // "22:30"
    duration: number;
    appointmentType: string;
    priority: string;
    status: string;
    symptoms?: string;
    notes?: string;
    channelFee: number;
    createdBy: string;
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

// API Response structure for upcoming appointments
export interface UpcomingAppointmentsResponse {
    success: boolean;
    data: UpcomingAppointmentData[];
}

// Query parameters interface
export interface UpcomingAppointmentsQuery {
    doctorId: string; // Should be doctor.propertyId
    date: string; // Format: YYYY-MM-DD
}

/**
 * Get upcoming appointments by doctor and date
 * @param params - Query parameters containing doctorId (should be doctor.propertyId) and date
 * @param token - Authentication token (optional, will be retrieved from localStorage if not provided)
 * @returns Promise<UpcomingAppointmentsResponse>
 */
export const getUpcomingAppointments = async (
    params: UpcomingAppointmentsQuery,
    token?: string
): Promise<UpcomingAppointmentsResponse> => {
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('doctorId', params.doctorId);
    queryParams.append('date', params.date);

    // If token is not provided, try to get it from localStorage
    const authToken = token || localStorage.getItem("token") || "";

    const response: AxiosResponse<UpcomingAppointmentsResponse> = await api.get(
        `${baseUrl}appointments/upcoming?${queryParams.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${authToken}`
            }
        }
    );

    return response.data;
};

/**
 * Get upcoming appointments data only (without success wrapper)
 * @param params - Query parameters containing doctorId (should be doctor.propertyId) and date
 * @param token - Authentication token (optional)
 * @returns Promise<UpcomingAppointmentData[]>
 */
export const getUpcomingAppointmentsData = async (
    params: UpcomingAppointmentsQuery,
    token?: string
): Promise<UpcomingAppointmentData[]> => {
    const response = await getUpcomingAppointments(params, token);
    return response.data;
};

/**
 * Get upcoming appointments for a specific doctor on today's date
 * @param doctorPropertyId - Doctor's propertyId (not id)
 * @param token - Authentication token (optional)
 * @returns Promise<UpcomingAppointmentData[]>
 */
export const getTodayUpcomingAppointments = async (
    doctorPropertyId: string,
    token?: string
): Promise<UpcomingAppointmentData[]> => {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    return getUpcomingAppointmentsData({
        doctorId: doctorPropertyId,
        date: today
    }, token);
};

/**
 * Get upcoming appointments count for a doctor on a specific date
 * @param params - Query parameters
 * @param token - Authentication token (optional)
 * @returns Promise<number>
 */
export const getUpcomingAppointmentsCount = async (
    params: UpcomingAppointmentsQuery,
    token?: string
): Promise<number> => {
    const appointments = await getUpcomingAppointmentsData(params, token);
    return appointments.length;
};