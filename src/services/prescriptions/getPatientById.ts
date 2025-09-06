import type { AxiosResponse } from "axios";
import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Interface for a single Patient object (can be shared across services)
export interface Patient {
    id: string; // Changed from _id to id based on your API response
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
    createdBy: {
        id: string;
        name: string;
        role: string;
    };
    updatedBy?: string;
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

// Interface for the expected response from the getPatientByNIC endpoint
export interface GetPatientByNICResponse {
    patientName: string;
    _id: boolean;
    patient: Patient;
}

/**
 * Get a single patient by their NIC number.
 * @param nic - The NIC of the patient to retrieve.
 * @returns Promise<GetPatientByNICResponse> - The response object with patient data.
 */
export const getPatientByNIC = async (
    nic: string
): Promise<GetPatientByNICResponse> => {
    try {
        // The endpoint expects the NIC to be part of the URL path.
        const url = `${baseUrl}patients-prescriptions-management/patients/nic/${nic}`;

        const response: AxiosResponse<GetPatientByNICResponse> = await api.get(url);

        // The backend returns an object { patient: Patient }
        return response.data;

    } catch (error: any) {
        // If the API returns a 404 or other error, we can assume the patient was not found.
        console.error(`Failed to fetch patient with NIC ${nic}:`, error.message);
        // For 404 errors, throw a specific error
        if (error.response?.status === 404) {
            throw new Error('Patient not found with the provided NIC.');
        }
        // For other errors, re-throwing might be better to signal a server/network problem.
        throw new Error(error?.response?.data?.message || 'An unexpected error occurred while fetching the patient.');
    }
};