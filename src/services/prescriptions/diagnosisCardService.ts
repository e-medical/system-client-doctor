import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Interface for creating a diagnosis card - matches your backend
 */
export interface CreateDiagnosisCardRequest {
    patientId: string; // Patient propertyId (required)
    diagnosisCardPdf: File; // Required PDF file upload
    diagnosis?: string; // Optional diagnosis text
    notes?: string; // Optional notes
    expiryDate?: string; // Optional expiry date in ISO string format
    prescriptionImage?: File; // Optional prescription image upload
    appointmentId?: string; // Optional appointment ID
}

/**
 * Interface for diagnosis card response
 */
export interface DiagnosisCard {
    _id: string;
    patientId: string;
    appointmentId?: string;
    diagnosis: string;
    notes?: string;
    diagnosisCardUrl?: string;
    prescriptionImageUrl?: string;
    expiryDate?: string;
    createdBy: string;
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Interface for create diagnosis card response
 */
export interface CreateDiagnosisCardResponse {
    message: string;
    card: DiagnosisCard;
}

/**
 * Create a new diagnosis card
 * @param data - Diagnosis card data including PDF file
 * @returns Promise<CreateDiagnosisCardResponse>
 */
export const createDiagnosisCard = async (data: CreateDiagnosisCardRequest): Promise<CreateDiagnosisCardResponse> => {
    try {
        // Create FormData for file upload
        const formData = new FormData();

        // Append required fields
        formData.append("patientId", data.patientId);
        formData.append("diagnosisCardPdf", data.diagnosisCardPdf);

        // Append optional fields if they exist
        if (data.diagnosis) {
            formData.append("diagnosis", data.diagnosis);
        }

        if (data.notes) {
            formData.append("notes", data.notes);
        }

        if (data.expiryDate) {
            formData.append("expiryDate", data.expiryDate);
        }

        if (data.prescriptionImage) {
            formData.append("prescriptionImage", data.prescriptionImage);
        }

        if (data.appointmentId) {
            formData.append("appointmentId", data.appointmentId);
        }

        const response = await api.post(`${baseUrl}patients-prescriptions-management/diagnosis-cards`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message || "Failed to create diagnosis card"
        );
    }
};