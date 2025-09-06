import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Interface for creating a general report - matches your backend
 */
export interface CreateGeneralReportRequest {
    patientId: string; // Patient propertyId
    heartRate?: number;
    bloodPressure?: string;
    bodyMassIndex?: number;
    bloodSugar?: number;
    weight?: number;
    height?: number;
}

/**
 * Interface for general report response
 */
export interface GeneralReport {
    _id: string;
    patientId: string;
    heartRate?: number;
    bloodPressure?: string;
    bodyMassIndex?: number;
    bloodSugar?: number;
    weight?: number;
    height?: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Interface for create general report response
 */
export interface CreateGeneralReportResponse {
    message: string;
    report: GeneralReport;
}

/**
 * Create a new general report
 * @param data - Report data
 * @returns Promise<CreateGeneralReportResponse>
 */
export const createGeneralReport = async (data: CreateGeneralReportRequest): Promise<CreateGeneralReportResponse> => {
    try {
        const response = await api.post(`${baseUrl}patients-prescriptions-management/general-reports`, data, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message || "Failed to create general report"
        );
    }
};