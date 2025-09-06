// src/services/generalReportDeleteService.ts

import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Delete General Report Response interface (matches backend response)
export interface DeleteGeneralReportResponse {
    message: string;
}

/**
 * Delete a general report by ID
 * @param reportId - The report's ID to delete
 * @returns Promise<DeleteGeneralReportResponse>
 */
export const deleteGeneralReport = async (
    reportId: string
): Promise<DeleteGeneralReportResponse> => {
    try {
        console.log('🗑️ Deleting general report:', reportId);

        // Make the API request
        const response: AxiosResponse<DeleteGeneralReportResponse> = await api.delete(
            `${baseUrl}patients-prescriptions-management/general-reports/${reportId}`
        );

        console.log('✅ General report deleted successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error deleting general report:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data;
            throw new Error(serverError.message || 'Failed to delete general report');
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred while deleting report');
        }
    }
};