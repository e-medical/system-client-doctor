
import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Update General Report Request interface (matches backend)
export interface UpdateGeneralReportRequest {
    heartRate?: string;
    bloodPressure?: string;
    bodyMassIndex?: string;
    bloodSugar?: string;
    weight?: string;
    height?: string;
}

// Update General Report Response interface (matches backend response)
export interface UpdateGeneralReportResponse {
    message: string;
    report: {
        id: string;
        patientId: string;
        heartRate: string;
        bloodPressure: string;
        bodyMassIndex: string;
        bloodSugar: string;
        weight: string;
        height: string;
        updatedAt: string;
        createdBy: {
            id: string;
            name: string;
            role: string;
        };
        createdAt: string;
    };
}

/**
 * Update a general report by ID
 * @param reportId - The report's ID to update
 * @param updateData - The data to update
 * @returns Promise<UpdateGeneralReportResponse>
 */
export const updateGeneralReport = async (
    reportId: string,
    updateData: UpdateGeneralReportRequest
): Promise<UpdateGeneralReportResponse> => {
    try {
        console.log('🔄 Updating general report:', reportId, updateData);

        // Make the API request
        const response: AxiosResponse<UpdateGeneralReportResponse> = await api.put(
            `${baseUrl}patients-prescriptions-management/general-reports/${reportId}`,
            updateData
        );

        console.log('✅ General report updated successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error updating general report:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data;
            throw new Error(serverError.message || 'Failed to update general report');
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred while updating report');
        }
    }
};