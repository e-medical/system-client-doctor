// Simplified prescriptionService.ts - only required fields

import api from "../../utils/interceptor/axios.ts";
const baseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Simplified interface with only required fields
 */
export interface CreatePrescriptionRequest {
    // Required fields only
    patientId: string;
    appointmentId: string;
    doctorId: string;
    prescriptionImage: File;

    // All other fields are optional (removed from payload)
    // medications?: any[];
    // patientInfo?: any;
    // clinicalInfo?: any;
    // examinationFindings?: any;
    // diagnosisDetails?: any;
    // treatmentPlan?: any;
    // doctorSignature?: any;
    // diagnosis?: string;
    // notes?: string;
    // expiryDate?: string;
}

export const createPrescription = async (data: CreatePrescriptionRequest) => {
    try {
        const formData = new FormData();

        // Append only the 4 required fields
        formData.append("patientId", data.patientId);
        formData.append("appointmentId", data.appointmentId);
        formData.append("doctorId", data.doctorId);
        formData.append("prescriptionImage", data.prescriptionImage);

        // No other fields are sent

        const response = await api.post(`${baseUrl}patients-prescriptions-management/prescriptions`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message || "Failed to create prescription"
        );
    }
};