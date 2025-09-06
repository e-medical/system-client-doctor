import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Basic patient interfaces
export interface CreatePatientRequest {
    patientName: string;
    patientNIC: string;
    patientEmail?: string;
    patientPhone: string;
    patientAge?: number;
    patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
    patientAddress?: string;
    dateOfBirth?: string;
    medicalHistory?: string;
}

export interface Patient {
    _id: string;
    propertyId: string;
    patientName: string;
    patientNIC: string;
    patientEmail?: string;
    patientPhone: string;
    patientAge?: number;
    patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
    patientAddress?: string;
    dateOfBirth?: string;
    medicalHistory?: string;
    createdBy: string;
    updatedBy?: string;
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePatientResponse {
    message: string;
    patient: Patient;
}

export interface GetPatientsResponse {
    success: boolean;
    data: {
        patients: Patient[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalCount: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    };
}

/**
 * Create a new patient
 * @param patientData - Patient information to create
 * @returns Promise<CreatePatientResponse>
 */
export const createPatient = async (
    patientData: CreatePatientRequest
): Promise<CreatePatientResponse> => {
    const response: AxiosResponse<CreatePatientResponse> = await api.post(
        `${baseUrl}patients-prescriptions-management/patients/create`,
        patientData
    );

    return response.data;
};
