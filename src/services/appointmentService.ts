import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// --- Existing Interfaces ---
export interface Appointment {
    _id: string;
    propertyId: string;
    channelNo: number;
    patientName: string;
    patientNIC: string;
    patientEmail: string;
    patientPhone: string;
    patientAge: number;
    patientGender: 'MALE' | 'FEMALE' | 'OTHER';
    patientAddress: string;
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    appointmentType: 'CONSULTATION' | string;
    priority: 'NORMAL' | 'URGENT' | 'LOW';
    status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW' | 'IN_PROGRESS';
    symptoms: string;
    notes: string;
    channelFee: number;
    createdBy: string;
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
    updatedBy?: string;
}

export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    size: number;
}

export interface AppointmentListResponse {
    success: boolean;
    data: Appointment[];
    pagination?: PaginationInfo;
}

export interface GetAppointmentsParams {
    doctorId: string;
    page?: number;
    size?: number;
    search?: string;
    sortBy?: 'appointmentTime' | 'patientName' | 'status' | "appointmentDate";
    sortOrder?: 'asc' | 'desc';
}

// --- New Interfaces for Creating Appointments ---
export interface CreateAppointmentPayload {
    patientName: string;
    patientNIC: string;
    patientEmail?: string;
    patientPhone: string;
    patientAge?: number;
    patientGender?: "MALE" | "FEMALE" | "OTHER";
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    patientAddress:string;
    duration?: number;
    appointmentType: "CONSULTATION" | "CHECKUP" | "FOLLOW_UP";
    priority?: "NORMAL" | "HIGH" | "LOW";
    symptoms?: string;
    notes?: string;
    channelNo: number;
    channelFee: number;
}

export interface AppointmentCreateResponse {
    success: boolean;
    message: string;
    data: any;
}

interface ChannelNumberResponse {
    channelNo: number;
}


// --- Service Functions ---

// ✅ GET Appointments (Existing)
export const getAppointmentsByDoctor = async (
    params: GetAppointmentsParams
): Promise<AppointmentListResponse> => {
    const response: AxiosResponse<AppointmentListResponse> = await api.get(
        `${baseUrl}appointments/doctor-appointments`,
        { params }
    );
    return response.data;
};

// ✅ POST Create Appointment (New & Improved)
export const createAppointment = async (
    data: CreateAppointmentPayload
): Promise<AppointmentCreateResponse> => {
    // No need to pass the token manually; the interceptor handles it.
    const response = await api.post<AppointmentCreateResponse>(
        `${baseUrl}appointments/create`,
        data
    );
    return response.data;
};

// ✅ GET Generate Channel Number (New & Improved)
export const generateChannelNumber = async (
    doctorId: string,
    date: string
): Promise<number> => {
    // The interceptor also handles auth for GET requests.
    const response = await api.get<ChannelNumberResponse>(
        `${baseUrl}appointments/generate-channel-no`,
        {
            params: {
                doctorId,
                appointmentDate: date,
            },
        }
    );
    return response.data.channelNo;
};

// ✅ PUT Update Appointment (Existing)
export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
    const response: AxiosResponse<{ success: boolean; data: Appointment }> = await api.put(
        `${baseUrl}appointments/${id}`,
        updates
    );
    return response.data.data;
};

// ✅ DELETE Appointment (Existing)
export const deleteAppointment = async (id: string): Promise<void> => {
    await api.delete(`${baseUrl}appointments/${id}`);
};
