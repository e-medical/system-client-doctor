import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export interface UpdateLabReportResponse {
    message: string;
    report: {
        _id: string;
        labReportUrl?: string;
        reportDate: string;
        notes?: string;
        patientId: string;
        updatedBy: string;
        activeStatus: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

/**
 * Update a lab report by ID using FormData for file uploads.
 * @param reportId - The lab report's ID to update
 * @param formData - The FormData object containing the file and other fields to update.
 * @returns Promise<UpdateLabReportResponse>
 */
export const updateLabReport = async (
    reportId: string,
    formData: FormData
): Promise<UpdateLabReportResponse> => {
    try {
        console.log('🔄 Updating lab report with FormData:', reportId);

        const response: AxiosResponse<UpdateLabReportResponse> = await api.put(
            `${baseUrl}patients-prescriptions-management/lab-reports/${reportId}`,
            formData
        );

        console.log('✅ Lab report updated successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error updating lab report:', error);

        if (error.response) {
            const serverError = error.response.data;
            throw new Error(serverError.message || 'Failed to update lab report');
        } else if (error.request) {
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            throw new Error(error.message || 'An unexpected error occurred while updating lab report');
        }
    }
};