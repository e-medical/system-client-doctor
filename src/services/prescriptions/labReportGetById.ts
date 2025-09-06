import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export interface LabReportResponse {
    id: string;
    patientId: string;
    labReportUrl: string;
    reportDate: string;
    notes: string;
    createdBy: {
        id: string;
        name: string;
        role: string;
    };
    activeStatus: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LabReportsListResponse {
    reports: LabReportResponse[];
}

class LabReportsService {
    private readonly endpoint = `${baseUrl}patients-prescriptions-management/patients/lab-reports`;

    /**
     * Get lab reports by patient ID
     * Matches: GET /patients/lab-reports/:patientId
     */
    async getLabReports(patientId: string): Promise<LabReportResponse[]> {
        if (!patientId?.trim()) {
            throw new Error('Patient ID is required');
        }

        try {
            const response = await api.get<LabReportsListResponse>(
                `${this.endpoint}/${patientId}`
            );

            console.log('Lab Reports API Response:', response.data);

            // Handle the response structure: { reports: [...] }
            if (response.data.reports && Array.isArray(response.data.reports)) {
                return response.data.reports;
            } else if (Array.isArray(response.data)) {
                // Fallback if response is direct array
                return response.data;
            } else {
                console.error('Unexpected response structure:', response.data);
                throw new Error('Unexpected response format');
            }
        } catch (error: any) {
            console.error('Error fetching lab reports:', error);
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to fetch lab reports';
            throw new Error(errorMessage);
        }
    }
}

// Export singleton instance
export const labReportsService = new LabReportsService();

// Export the class as well for testing or custom instances
export default LabReportsService;