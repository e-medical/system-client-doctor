import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Interface for creating a lab report - matches your backend
 */
export interface CreateLabReportRequest {
    patientId: string; // Patient propertyId
    labReportFile: File; // Required file upload
    reportDate: string; // Date in ISO string format
    notes?: string; // Optional notes
}

/**
 * Interface for lab report response
 */
export interface LabReport {
    _id: string;
    patientId: string;
    labReportUrl: string;
    reportDate: string;
    notes?: string;
    createdBy: string;
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Interface for create lab report response
 */
export interface CreateLabReportResponse {
    message: string;
    report: LabReport;
}

/**
 * Create a new lab report
 * @param data - Lab report data including file
 * @returns Promise<CreateLabReportResponse>
 */
export const createLabReport = async (data: CreateLabReportRequest): Promise<CreateLabReportResponse> => {
    try {
        // Create FormData for file upload
        const formData = new FormData();

        // Append required fields
        formData.append("patientId", data.patientId);
        formData.append("labReportFile", data.labReportFile);
        formData.append("reportDate", data.reportDate);

        // Append optional fields if they exist
        if (data.notes) {
            formData.append("notes", data.notes);
        }

        const response = await api.post(`${baseUrl}patients-prescriptions-management/lab-reports`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message || "Failed to create lab report"
        );
    }
};