import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Delete Diagnosis Card Response interface (matches backend response)
export interface DeleteDiagnosisCardResponse {
    message: string;
}

/**
 * Delete a diagnosis card by ID (soft delete - sets activeStatus to false)
 * @param cardId - The diagnosis card's ID to delete
 * @returns Promise<DeleteDiagnosisCardResponse>
 */
export const deleteDiagnosisCard = async (
    cardId: string
): Promise<DeleteDiagnosisCardResponse> => {
    try {
        console.log('🗑️ Deleting diagnosis card:', cardId);

        // Make the API request
        const response: AxiosResponse<DeleteDiagnosisCardResponse> = await api.delete(
            `${baseUrl}patients-prescriptions-management/diagnosis-cards/${cardId}`
        );

        console.log('✅ Diagnosis card deleted successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error deleting diagnosis card:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data;
            throw new Error(serverError.message || 'Failed to delete diagnosis card');
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred while deleting diagnosis card');
        }
    }
};