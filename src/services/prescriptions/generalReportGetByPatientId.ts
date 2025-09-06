import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export interface GeneralReportResponse {
    id: string;
    patientId: string;
    heartRate: string;
    bloodPressure: string;
    bodyMassIndex: string;
    bloodSugar: string;
    weight: string;
    height: string;
    updatedAt: string;
    createdBy: {
        id: string;
        name: string;
        role: string;
    };
    createdAt: string;
}

export interface UserInfo {
    _id: string;
    firstName: string;
    lastName: string;
    userEmail: string;
    roles: string[];
}

class GeneralReportsService {

    /**
     * Get general reports by patient ID
     * Matches: GET /patients/general-reports/:patientId
     */
    async getGeneralReports(patientId: string): Promise<GeneralReportResponse[]> {
        try {
            const response = await api.get(`${baseUrl}patients-prescriptions-management/patients/general-reports/${patientId}`);
            console.log('General Reports API Response:', response.data);

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
            console.error('Error fetching general reports:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch general reports');
        }
    }
}

// Export singleton instance
export const generalReportsService = new GeneralReportsService();

// Export the class as well for testing or custom instances
export default GeneralReportsService;