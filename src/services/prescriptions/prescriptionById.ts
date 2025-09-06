import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export interface PrescriptionResponse {
    _id: string;
    propertyId: string;
    patientId: string;
    appointmentId?: string;
    doctorId: string;
    medications: Medication[];
    prescriptionImageUrl?: string;
    issuedDate: string;
    expiryDate: string;
    status: string;
    activeStatus: boolean;
    createdBy: UserInfo;
    updatedBy?: UserInfo;
    patientInfo?: {
        dateOfVisit: string;
    };
    clinicalInfo?: {
        pastMedicalHistory: {
            diabetes: boolean;
            hypertension: boolean;
            asthma: boolean;
            heartDisease: boolean;
        };
    };
    examinationFindings?: {
        investigationsOrdered: {
            cbc: boolean;
            xray: boolean;
            ecg: boolean;
            bloodSugar: boolean;
            mri: boolean;
        };
    };
    doctorSignature?: {
        signatureDate: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Medication {
    _id?: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
}

export interface UserInfo {
    _id: string;
    firstName: string;
    lastName: string;
    userEmail: string;
    roles: string[];
}

class PrescriptionService {

    /**
     * Get prescription by ID
     * Matches: GET /prescriptions/:id
     */
    async getPrescriptionById(id: string): Promise<PrescriptionResponse> {
        try {
            const response = await api.get(`${baseUrl}patients-prescriptions-management/prescriptions/${id}`);
            console.log('🔍 Full API Response:', response.data);

            // Handle different response structures
            if (response.data.status && response.data.data && Array.isArray(response.data.data)) {
                // Response comes as: { status: true, data: [prescription] }
                const prescription = response.data.data[0];
                if (!prescription) {
                    throw new Error('Prescription not found');
                }
                return prescription;
            } else if (response.data.prescription) {
                // Response comes as: { prescription: {...} }
                return response.data.prescription;
            } else if (response.data._id) {
                // Response is direct prescription object
                return response.data;
            } else {
                console.error('❌ Unexpected response structure:', response.data);
                throw new Error('Unexpected response format');
            }
        } catch (error: any) {
            console.error('Error fetching prescription:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch prescription');
        }
    }
}

// Export singleton instance
export const prescriptionService = new PrescriptionService();

// Export the class as well for testing or custom instances
export default PrescriptionService;