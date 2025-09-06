import api from "../utils/interceptor/axios";
import { getUserHospitalId } from "./prescriptionManagementService";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// ---------------------- Types ----------------------
export interface AvailablePrescription {
    _id: string;
    prescriptionName: string;
    description?: string;
    drugDetails: {
        drugName: string;
        strength: string;
        dosage: string;
        brand: string;
        frequency: string;
        duration: string;
        issuedQty: string;
        instructions?: string;
    };
    doctorId: string;
    hospitalId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface PrescriptionsResponse {
    success: boolean;
    data: AvailablePrescription[];
    message?: string;
}

export interface PatientFormData {
    patientName: string;
    nic: string;
    age: string;
    contact: string;
    email: string;
    address: string;
    dateOfVisit: string;
}

export interface SelectedPrescriptionData extends PatientFormData {
    selectedPrescription: AvailablePrescription | null;
    hospitalId: string;
    drugName: string;
    strength: string;
    dosage: string;
    brand: string;
    frequency: string;
    duration: string;
    issuedQty: string;
    instructions: string;
}

// Cache for prescriptions to avoid repeated API calls
let prescriptionsCache: {
    data: AvailablePrescription[];
    hospitalId: string | null;
    timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ---------------------- API Functions ----------------------

/**
 * Get all prescriptions and filter by user's hospital on frontend
 * @returns Promise<AvailablePrescription[]>
 */
export const getAvailablePrescriptions = async (): Promise<AvailablePrescription[]> => {
    try {
        console.log('🏥 Fetching prescriptions for user hospital...');

        // Get user's hospital ID
        const hospitalId = await getUserHospitalId();
        if (!hospitalId) {
            console.error('❌ No hospital ID found for user');
            return [];
        }

        console.log('🏥 Found hospital ID:', hospitalId);

        // Check cache first
        if (prescriptionsCache &&
            prescriptionsCache.hospitalId === hospitalId &&
            Date.now() - prescriptionsCache.timestamp < CACHE_DURATION) {
            console.log('✅ Using cached hospital prescriptions');
            return prescriptionsCache.data;
        }

        // Fetch all prescriptions from existing endpoint
        const response: AxiosResponse<PrescriptionsResponse> = await api.get(
            `${baseUrl}prescriptions`
        );

        if (response.data.success && response.data.data) {
            // Filter by hospital ID and active status on frontend
            const hospitalPrescriptions = response.data.data.filter(prescription =>
                prescription.hospitalId === hospitalId && prescription.isActive
            );

            console.log('✅ Found prescriptions for hospital:', {
                total: response.data.data.length,
                hospitalFiltered: hospitalPrescriptions.length,
                hospitalId
            });

            // Update cache
            prescriptionsCache = {
                data: hospitalPrescriptions,
                hospitalId,
                timestamp: Date.now()
            };

            return hospitalPrescriptions;
        }

        console.log('⚠️ No prescriptions found');
        return [];
    } catch (error) {
        console.error('❌ Error fetching prescriptions:', error);
        return [];
    }
};

/**
 * Get prescriptions by hospital ID (frontend filtering)
 * @param hospitalId - Hospital's ID
 * @returns Promise<AvailablePrescription[]>
 */
export const getPrescriptionsByHospital = async (hospitalId: string): Promise<AvailablePrescription[]> => {
    try {
        console.log('🏥 Fetching prescriptions for hospital:', hospitalId);

        // Use existing endpoint and filter
        const response: AxiosResponse<PrescriptionsResponse> = await api.get(
            `${baseUrl}prescriptions`
        );

        if (response.data.success && response.data.data) {
            const hospitalPrescriptions = response.data.data.filter(prescription =>
                prescription.hospitalId === hospitalId && prescription.isActive
            );

            console.log('✅ Found prescriptions for hospital:', hospitalPrescriptions.length);
            return hospitalPrescriptions;
        }

        return [];
    } catch (error) {
        console.error('❌ Error fetching prescriptions by hospital:', error);
        return [];
    }
};

/**
 * Get prescriptions by doctor within the current hospital (frontend filtering)
 * @param doctorId - Doctor's ID
 * @returns Promise<AvailablePrescription[]>
 */
export const getPrescriptionsByDoctor = async (doctorId: string): Promise<AvailablePrescription[]> => {
    try {
        // Get hospital ID first
        const hospitalId = await getUserHospitalId();
        if (!hospitalId) {
            console.error('❌ No hospital ID found for user');
            return [];
        }

        // Use existing endpoint and filter by both hospital and doctor
        const response: AxiosResponse<PrescriptionsResponse> = await api.get(
            `${baseUrl}prescriptions`
        );

        if (response.data.success && response.data.data) {
            const doctorPrescriptions = response.data.data.filter(prescription =>
                prescription.hospitalId === hospitalId &&
                prescription.doctorId === doctorId &&
                prescription.isActive
            );

            return doctorPrescriptions;
        }

        return [];
    } catch (error) {
        console.error('❌ Error fetching prescriptions by doctor:', error);
        return [];
    }
};

/**
 * Search prescriptions within the current hospital (frontend filtering)
 * @param searchTerm - Search term
 * @returns Promise<AvailablePrescription[]>
 */
export const searchPrescriptions = async (searchTerm: string): Promise<AvailablePrescription[]> => {
    try {
        if (!searchTerm.trim()) {
            return await getAvailablePrescriptions();
        }

        console.log('🔍 Searching hospital prescriptions for:', searchTerm);

        // Get all hospital prescriptions first
        const hospitalPrescriptions = await getAvailablePrescriptions();

        // Frontend search filtering
        const searchResults = filterPrescriptionsBySearchTerm(hospitalPrescriptions, searchTerm);

        console.log('✅ Search results:', searchResults.length);
        return searchResults;
    } catch (error) {
        console.error('❌ Error searching hospital prescriptions:', error);
        return [];
    }
};

/**
 * Get prescription by ID (with hospital verification)
 * @param prescriptionId - Prescription ID
 * @returns Promise<AvailablePrescription | null>
 */
export const getPrescriptionById = async (prescriptionId: string): Promise<AvailablePrescription | null> => {
    try {
        const response: AxiosResponse<{ success: boolean; data: AvailablePrescription }> = await api.get(
            `${baseUrl}prescriptions/${prescriptionId}`
        );

        if (response.data.success && response.data.data) {
            // Verify prescription belongs to user's hospital
            const userHospitalId = await getUserHospitalId();
            if (userHospitalId && response.data.data.hospitalId === userHospitalId) {
                return response.data.data;
            } else {
                console.error('❌ Prescription does not belong to user hospital');
                return null;
            }
        }

        return null;
    } catch (error) {
        console.error('❌ Error fetching prescription by ID:', error);
        return null;
    }
};

/**
 * Get hospital prescription statistics (frontend calculation)
 * @returns Promise with hospital prescription stats
 */
export const getHospitalPrescriptionStats = async (): Promise<{
    hospitalId: string | null;
    totalPrescriptions: number;
    activePrescriptions: number;
    doctorCount: number;
    topDrugs: string[];
} | null> => {
    try {
        const hospitalId = await getUserHospitalId();
        if (!hospitalId) {
            return null;
        }

        const prescriptions = await getPrescriptionsByHospital(hospitalId);
        const activePrescriptions = prescriptions.filter(p => p.isActive);

        // Get unique doctors
        const doctors = new Set(prescriptions.map(p => p.doctorId));

        // Get top drugs
        const drugCounts: Record<string, number> = {};
        prescriptions.forEach(p => {
            drugCounts[p.drugDetails.drugName] = (drugCounts[p.drugDetails.drugName] || 0) + 1;
        });

        const topDrugs = Object.entries(drugCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([drug]) => drug);

        return {
            hospitalId,
            totalPrescriptions: prescriptions.length,
            activePrescriptions: activePrescriptions.length,
            doctorCount: doctors.size,
            topDrugs
        };
    } catch (error) {
        console.error('❌ Error getting hospital prescription stats:', error);
        return null;
    }
};

// ---------------------- Helper Functions ----------------------

/**
 * Filter prescriptions by search term (enhanced frontend filtering)
 * @param prescriptions - Array of prescriptions
 * @param searchTerm - Search term
 * @returns AvailablePrescription[]
 */
export const filterPrescriptionsBySearchTerm = (
    prescriptions: AvailablePrescription[],
    searchTerm: string
): AvailablePrescription[] => {
    if (!searchTerm.trim()) return prescriptions;

    const term = searchTerm.toLowerCase();
    return prescriptions.filter(prescription =>
        prescription.prescriptionName.toLowerCase().includes(term) ||
        prescription.drugDetails.drugName.toLowerCase().includes(term) ||
        prescription.drugDetails.brand.toLowerCase().includes(term) ||
        prescription.drugDetails.strength.toLowerCase().includes(term) ||
        prescription.drugDetails.dosage.toLowerCase().includes(term) ||
        prescription.drugDetails.frequency.toLowerCase().includes(term) ||
        prescription.description?.toLowerCase().includes(term) ||
        prescription.drugDetails.instructions?.toLowerCase().includes(term)
    );
};

/**
 * Filter prescriptions by drug name
 * @param prescriptions - Array of prescriptions
 * @param drugName - Drug name to filter by
 * @returns AvailablePrescription[]
 */
export const filterPrescriptionsByDrug = (
    prescriptions: AvailablePrescription[],
    drugName: string
): AvailablePrescription[] => {
    if (!drugName.trim()) return prescriptions;

    return prescriptions.filter(prescription =>
        prescription.drugDetails.drugName.toLowerCase().includes(drugName.toLowerCase())
    );
};

/**
 * Filter prescriptions by doctor
 * @param prescriptions - Array of prescriptions
 * @param doctorId - Doctor ID to filter by
 * @returns AvailablePrescription[]
 */
export const filterPrescriptionsByDoctorId = (
    prescriptions: AvailablePrescription[],
    doctorId: string
): AvailablePrescription[] => {
    if (!doctorId.trim()) return prescriptions;

    return prescriptions.filter(prescription => prescription.doctorId === doctorId);
};

/**
 * Group prescriptions by drug name
 * @param prescriptions - Array of prescriptions
 * @returns Record<string, AvailablePrescription[]>
 */
export const groupPrescriptionsByDrug = (
    prescriptions: AvailablePrescription[]
): Record<string, AvailablePrescription[]> => {
    return prescriptions.reduce((groups, prescription) => {
        const drugName = prescription.drugDetails.drugName;
        if (!groups[drugName]) {
            groups[drugName] = [];
        }
        groups[drugName].push(prescription);
        return groups;
    }, {} as Record<string, AvailablePrescription[]>);
};

/**
 * Group prescriptions by doctor (for hospital admin view)
 * @param prescriptions - Array of prescriptions
 * @returns Record<string, AvailablePrescription[]>
 */
export const groupPrescriptionsByDoctor = (
    prescriptions: AvailablePrescription[]
): Record<string, AvailablePrescription[]> => {
    return prescriptions.reduce((groups, prescription) => {
        const doctorId = prescription.doctorId;
        if (!groups[doctorId]) {
            groups[doctorId] = [];
        }
        groups[doctorId].push(prescription);
        return groups;
    }, {} as Record<string, AvailablePrescription[]>);
};

/**
 * Create form data from selected prescription
 * @param prescription - Selected prescription
 * @param patientData - Patient information
 * @returns SelectedPrescriptionData
 */
export const createPrescriptionFormData = async (
    prescription: AvailablePrescription,
    patientData: PatientFormData
): Promise<SelectedPrescriptionData> => {
    const hospitalId = await getUserHospitalId() || prescription.hospitalId;

    return {
        ...patientData,
        selectedPrescription: prescription,
        hospitalId,
        drugName: prescription.drugDetails.drugName,
        strength: prescription.drugDetails.strength,
        dosage: prescription.drugDetails.dosage,
        brand: prescription.drugDetails.brand,
        frequency: prescription.drugDetails.frequency,
        duration: prescription.drugDetails.duration,
        issuedQty: prescription.drugDetails.issuedQty,
        instructions: prescription.drugDetails.instructions || '',
    };
};

/**
 * Validate prescription selection with hospital verification
 * @param prescription - Prescription to validate
 * @returns Object with validation result
 */
export const validatePrescriptionSelection = async (prescription: AvailablePrescription | null): Promise<{
    isValid: boolean;
    errors: string[];
}> => {
    const errors: string[] = [];

    if (!prescription) {
        errors.push('Please select a prescription');
        return { isValid: false, errors };
    }

    if (!prescription.isActive) {
        errors.push('Selected prescription is not active');
    }

    // Verify prescription belongs to user's hospital
    const userHospitalId = await getUserHospitalId();
    if (userHospitalId && prescription.hospitalId !== userHospitalId) {
        errors.push('Selected prescription does not belong to your hospital');
    }

    if (!prescription.drugDetails.drugName) {
        errors.push('Prescription must have a drug name');
    }

    if (!prescription.drugDetails.strength) {
        errors.push('Prescription must have strength information');
    }

    if (!prescription.drugDetails.dosage) {
        errors.push('Prescription must have dosage information');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Refresh hospital prescriptions cache
 * @returns Promise<AvailablePrescription[]>
 */
export const refreshHospitalPrescriptions = async (): Promise<AvailablePrescription[]> => {
    try {
        console.log('🔄 Refreshing hospital prescriptions cache...');

        // Clear cache
        prescriptionsCache = null;

        // Fetch fresh data
        const prescriptions = await getAvailablePrescriptions();

        console.log('✅ Refreshed hospital prescriptions:', prescriptions.length);
        return prescriptions;
    } catch (error) {
        console.error('❌ Error refreshing hospital prescriptions:', error);
        return [];
    }
};

/**
 * Clear prescriptions cache
 */
export const clearPrescriptionsCache = (): void => {
    prescriptionsCache = null;
    console.log('🗑️ Prescriptions cache cleared');
};

/**
 * Get cache info for debugging
 */
export const getCacheInfo = (): {
    hasCache: boolean;
    hospitalId: string | null;
    itemCount: number;
    age: number;
} => {
    return {
        hasCache: !!prescriptionsCache,
        hospitalId: prescriptionsCache?.hospitalId || null,
        itemCount: prescriptionsCache?.data?.length || 0,
        age: prescriptionsCache ? Date.now() - prescriptionsCache.timestamp : 0
    };
};

