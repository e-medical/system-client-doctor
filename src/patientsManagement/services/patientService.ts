// src/services/patientService.ts

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

// Adjusted to expect a single patient or null
export interface GetPatientResponse {
    success: boolean;
    data: {
        patients: Patient[]; // The API might return an array even for a single query
    };
}

/**
 * Get a single patient by their NIC
 * @param patientNIC - The NIC of the patient to find
 * @returns Promise<Patient | null>
 */
export const getPatientByNIC = async (
    patientNIC: string
): Promise<Patient | null> => {
    try {
        const response: AxiosResponse<GetPatientResponse> = await api.get(
            `${baseUrl}patients-prescriptions-management/patients/nic?nic=${patientNIC}`
        );

        // If the patients array has at least one result, return the first one
        if (response.data?.data?.patients?.length > 0) {
            return response.data.data.patients[0];
        }

        return null; // Return null if no patient is found
    } catch (error) {
        console.error("Failed to fetch patient by NIC:", error);
        return null; // Treat errors as "not found" for simplicity
    }
};


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