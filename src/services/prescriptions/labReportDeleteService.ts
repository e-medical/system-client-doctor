import api from "../../utils/interceptor/axios";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Delete Lab Report Response interface (matches backend response)
export interface DeleteLabReportResponse {
    message: string;
}

/**
 * Delete a lab report by ID (soft delete - sets activeStatus to false)
 * @param reportId - The lab report's ID to delete
 * @returns Promise<DeleteLabReportResponse>
 */
export const deleteLabReport = async (
    reportId: string
): Promise<DeleteLabReportResponse> => {
    try {
        console.log('🗑️ Deleting lab report:', reportId);

        // Make the API request
        const response: AxiosResponse<DeleteLabReportResponse> = await api.delete(
            `${baseUrl}patients-prescriptions-management/lab-reports/${reportId}`
        );

        console.log('✅ Lab report deleted successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error deleting lab report:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data;
            throw new Error(serverError.message || 'Failed to delete lab report');
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred while deleting lab report');
        }
    }
};