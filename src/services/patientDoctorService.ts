import api from "../utils/interceptor/axios";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Patient interface (reusing from patient service)
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

// Pagination interface
export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// Response interface for patients by doctor
export interface PatientsByDoctorResponse {
    message: string;
    patients: Patient[];
    pagination: PaginationInfo;
}

/**
 * Get patients by doctor ID with optional search functionality
 * @param doctorId - Doctor ID to fetch patients for
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param searchTerm - Search term for filtering patients (optional)
 * @returns Promise<PatientsByDoctorResponse>
 */
export const getPatientsByDoctorId = async (
    doctorId: string,
    page: number = 1,
    limit: number = 10,
    searchTerm?: string
): Promise<PatientsByDoctorResponse> => {
    try {
        console.log('🔍 Fetching patients:', { doctorId, page, limit, searchTerm });

        if (!doctorId) {
            throw new Error('Doctor ID is required');
        }

        if (page < 1) {
            throw new Error('Page number must be greater than 0');
        }

        if (limit < 1 || limit > 100) {
            throw new Error('Limit must be between 1 and 100');
        }

        // Build params object conditionally
        const params: Record<string, any> = {
            page,
            limit
        };

        // Only add search parameter if searchTerm is provided and not empty
        if (searchTerm && searchTerm.trim()) {
            params.search = searchTerm.trim();
        }

        const response: AxiosResponse<PatientsByDoctorResponse> = await api.get(
            `${baseUrl}patients-prescriptions-management/patients/doctor/${doctorId}`,
            { params }
        );

        console.log('✅ Patients fetched successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error fetching patients by doctor:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data;
            throw new Error(serverError.message || 'Failed to fetch patients');
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred while fetching patients');
        }
    }
};