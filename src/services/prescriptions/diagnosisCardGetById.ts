import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export interface DiagnosisCardResponse {
    id: string;
    patientId: string;
    diagnosis: string;
    notes: string;
    diagnosisCardUrl: string;
    issuedDate: string;
    expiryDate: string;
    createdBy: {
        id: string;
        name: string;
        role: string;
    };
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

class DiagnosisCardsService {

    /**
     * Get diagnosis cards by patient ID
     * Matches: GET /patients/diagnosis-cards/:patientId
     */
    async getDiagnosisCards(patientId: string): Promise<DiagnosisCardResponse[]> {
        try {
            const response = await api.get(`${baseUrl}patients-prescriptions-management/patients/diagnosis-cards/${patientId}`);
            console.log('Diagnosis Cards API Response:', response.data);

            // Handle the response structure: { cards: [...] }
            if (response.data.cards && Array.isArray(response.data.cards)) {
                return response.data.cards;
            } else if (Array.isArray(response.data)) {
                // Fallback if response is direct array
                return response.data;
            } else {
                console.error('Unexpected response structure:', response.data);
                throw new Error('Unexpected response format');
            }
        } catch (error: any) {
            console.error('Error fetching diagnosis cards:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch diagnosis cards');
        }
    }
}

// Export singleton instance
export const diagnosisCardsService = new DiagnosisCardsService();

// Export the class as well for testing or custom instances
export default DiagnosisCardsService;