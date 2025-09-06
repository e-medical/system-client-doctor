import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;


export interface DeletePatientResponse {
    message: string;
    success?: boolean;
}


export interface PatientDeleteError {
    message: string;
    success?: false;
    errors?: Record<string, string>;
}

export const deletePatient = async (
    patientId: string
): Promise<DeletePatientResponse> => {
    try {
        console.log('🗑️ Deleting patient:', patientId);

        // Make the API request
        const response: AxiosResponse<DeletePatientResponse> = await api.delete(
            `${baseUrl}patients-prescriptions-management/patients/${patientId}`
        );

        console.log('✅ Patient deleted successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error deleting patient:', error);


        if (error.response) {

            const serverError = error.response.data as PatientDeleteError;
            throw new Error(serverError.message || 'Failed to delete patient');
        } else if (error.request) {

            throw new Error('Network error. Please check your connection and try again.');
        } else {

            throw new Error(error.message || 'An unexpected error occurred while deleting patient');
        }
    }
};