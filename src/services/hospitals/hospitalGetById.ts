import api from "../../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

// The base URL for the API, fetched from environment variables.
const baseUrl = import.meta.env.VITE_API_BASE_URL;

// --- INTERFACE DEFINITIONS ---

/**
 * @interface PricingPlan
 * Describes the structure of the pricingPlan object within the hospital details.
 * MODIFIED: This now reflects the flat structure from the new API response.
 */
interface PricingPlan {
    plan: string;
    type: string;
    price: number;
    billing: string;
    addOns: any[]; // Use a more specific type if the structure of addOns is known
    activeSystems: any[]; // Use a more specific type if the structure is known
}

/**
 * @interface ApplicationUser
 * Describes the populated user details linked to the hospital.
 * This structure remains correct.
 */
interface ApplicationUser {
    _id: string;
    firstName: string;
    lastName: string;
    userEmail: string;
    roles: string[];
}

/**
 * @interface PrescriptionTheme
 * Describes the structure of an object in the prescriptionTheme array.
 */
interface PrescriptionTheme {
    theme: string;
    isActive: boolean;
}

/**
 * @interface HospitalDetails
 * Describes the complete structure of the hospital data object received from the API.
 * MODIFIED: Expanded to include all fields from the new API response.
 */
export interface HospitalDetails {
    _id: string;
    propertyId: string;
    applicationUserId: ApplicationUser;
    pricingPlan: PricingPlan;
    businessName: string;
    address: string;
    hospitalType: string;
    accountType: string;
    adminName: string;
    adminContact: string;
    adminEmail: string;
    status: boolean;
    disabled: boolean;
    createdAt: string; // ISO date-time string
    updatedAt: string; // ISO date-time string
    addOnRequests: any[]; // Use a more specific type if the structure is known
    prescriptionTheme: PrescriptionTheme[];
}

/**
 * @interface GetHospitalResponse
 * Describes the full API response structure for a single hospital.
 */
export interface GetHospitalResponse {
    success: boolean;
    data: HospitalDetails;
    message?: string; // Optional message for errors
}


// --- SERVICE FUNCTIONS ---

/**
 * Fetches details for a specific hospital by its ID.
 * The function logic remains the same, but it now returns the updated HospitalDetails type.
 *
 * @param {string} hospitalId - The unique identifier of the hospital to fetch.
 * @returns {Promise<HospitalDetails | null>} A promise that resolves to the hospital's details on success, or null on failure.
 *
 * @example
 * const hospital = await getHospitalDetails("some-hospital-id");
 * if (hospital) {
 * console.log(hospital.businessName);
 * }
 */
export const getHospitalDetails = async (hospitalId: string): Promise<HospitalDetails | null> => {
    // Validate the input to prevent unnecessary API calls
    if (!hospitalId) {
        console.error("getHospitalDetails requires a valid hospitalId.");
        return null;
    }

    try {

        const response: AxiosResponse<GetHospitalResponse> = await api.get(
            `${baseUrl}hospitals/${hospitalId}` // Adjust this path if your route is different
        );

        // Check for a successful response and return the data
        if (response.data && response.data.success) {
            return response.data.data;
        } else {
            // Handle cases where the API returns a success:false status
            console.error('API indicated failure in fetching hospital details:', response.data.message);
            return null;
        }
    } catch (error) {
        // Catch any network or other errors during the API call
        console.error(`Error while fetching hospital with ID ${hospitalId}:`, error);
        return null;
    }
};
