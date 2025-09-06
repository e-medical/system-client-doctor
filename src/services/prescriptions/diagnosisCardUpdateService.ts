import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Update Diagnosis Card Request interface (matches backend)
export interface UpdateDiagnosisCardRequest {
    diagnosis?: string;
    notes?: string;
    expiryDate?: Date | string;
    diagnosisCardPdf?: File;
    prescriptionImage?: File;
    patientId?: string;
}

// Update Diagnosis Card Response interface (matches backend response)
export interface UpdateDiagnosisCardResponse {
    message: string;
    card: {
        _id: string;
        diagnosis: string;
        notes?: string;
        expiryDate?: string;
        diagnosisCardUrl?: string;
        prescriptionImageUrl?: string;
        patientId: string;
        createdBy: {
            _id: string;
            name: string;
            role: string;
        };
        updatedBy?: string;
        activeStatus: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

/**
 * Update a diagnosis card by ID
 * @param cardId - The diagnosis card's ID to update
 * @param updateData - The data to update
 * @returns Promise<UpdateDiagnosisCardResponse>
 */
export const updateDiagnosisCard = async (
    cardId: string,
    updateData: UpdateDiagnosisCardRequest
): Promise<UpdateDiagnosisCardResponse> => {
    try {
        console.log('🔄 Updating diagnosis card:', cardId, updateData);

        const formData = new FormData();

        if (updateData.diagnosis) formData.append('diagnosis', updateData.diagnosis);
        if (updateData.notes) formData.append('notes', updateData.notes);
        if (updateData.expiryDate) formData.append('expiryDate', updateData.expiryDate.toString());
        if (updateData.patientId) formData.append('patientId', updateData.patientId);
        if (updateData.diagnosisCardPdf) formData.append('diagnosisCardPdf', updateData.diagnosisCardPdf);
        if (updateData.prescriptionImage) formData.append('prescriptionImage', updateData.prescriptionImage);

        // Make the API request
        const response: AxiosResponse<UpdateDiagnosisCardResponse> = await api.put(
            `${baseUrl}patients-prescriptions-management/diagnosis-cards/${cardId}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        console.log('✅ Diagnosis card updated successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error updating diagnosis card:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data;
            throw new Error(serverError.message || 'Failed to update diagnosis card');
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred while updating diagnosis card');
        }
    }
};