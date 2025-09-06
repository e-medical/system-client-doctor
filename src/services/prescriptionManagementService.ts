import { getCurrentUserDetails } from './UserService.ts';
import { getHospitalDetails } from './hospitals/hospitalGetById.ts';
import { getLoggedInUser } from './authService.ts';
import Cookies from 'js-cookie';

// ---------------------- Types ----------------------
export interface PrescriptionTheme {
    theme: string;
    isActive: boolean;
}

export interface HospitalSummary {
    businessName: string;
    logoUrl: string;
    address: string;
}

export interface PrescriptionManagementData {
    hospitalSummary: HospitalSummary;
    activeThemes: PrescriptionTheme[];
    allThemes: PrescriptionTheme[];
}

// ---------------------- Service Functions ----------------------

/**
 * Get user's hospital ID using multiple fallback methods
 * @returns Promise<string | null>
 */
export const getUserHospitalId = async (): Promise<string | null> => {
    try {
        console.log('🔍 Attempting to get user hospital ID...');

        // Method 1: Try getting from current user details API
        const userDetails = await getCurrentUserDetails();
        if (userDetails?.hospital) {
            console.log('✅ Found hospital ID from user details API:', userDetails.hospital);
            return userDetails.hospital;
        }

        // Method 2: Try getting from logged-in user service
        const loggedInUser = getLoggedInUser();
        if (loggedInUser?.id) {
            console.log('✅ Found user ID from auth service, fetching details...');
            const userDetailsById = await getCurrentUserDetails();
            if (userDetailsById?.hospital) {
                console.log('✅ Found hospital ID from user details by ID:', userDetailsById.hospital);
                return userDetailsById.hospital;
            }
        }

        // Method 3: Try getting from cookies (fallback)
        const currentUserString = Cookies.get('currentUser');
        if (currentUserString) {
            try {
                const currentUser = JSON.parse(currentUserString);
                const hospitalId = currentUser?.hospital?._id || currentUser?.hospital;
                if (hospitalId) {
                    console.log('✅ Found hospital ID from cookies:', hospitalId);
                    return hospitalId;
                }
            } catch (err) {
                console.error('❌ Failed to parse currentUser cookie:', err);
            }
        }

        console.warn('⚠️ No hospital ID found through any method');
        return null;
    } catch (error) {
        console.error('❌ Error getting user hospital ID:', error);
        return null;
    }
};

/**
 * Fetch hospital details and extract relevant data
 * @param hospitalId - Hospital ID to fetch details for
 * @returns Promise<PrescriptionManagementData | null>
 */
export const getHospitalPrescriptionData = async (hospitalId: string): Promise<PrescriptionManagementData | null> => {
    try {
        console.log('🏥 Fetching hospital details for ID:', hospitalId);

        const hospitalResponse = await getHospitalDetails(hospitalId);

        if (!hospitalResponse) {
            console.error('❌ Failed to fetch hospital details');
            return null;
        }

        console.log('✅ Hospital details fetched successfully:', hospitalResponse);

        // Extract hospital summary
        const hospitalSummary: HospitalSummary = {
            businessName: hospitalResponse.businessName || '',
            logoUrl: '', // Add logo URL if available in your hospital response
            address: hospitalResponse.address || '',
        };

        // Extract prescription themes
        const allThemes: PrescriptionTheme[] = hospitalResponse.prescriptionTheme || [];
        const activeThemes: PrescriptionTheme[] = allThemes.filter(theme => theme.isActive === true);

        console.log('📋 All prescription themes:', allThemes);
        console.log('✅ Active prescription themes:', activeThemes);

        return {
            hospitalSummary,
            activeThemes,
            allThemes
        };
    } catch (error) {
        console.error('❌ Error fetching hospital prescription data:', error);
        return null;
    }
};

/**
 * Save hospital data to cookies for caching
 * @param data - Hospital prescription data to cache
 */
export const cacheHospitalData = (data: PrescriptionManagementData): void => {
    try {
        // Save hospital summary to cookies
        Cookies.remove('hospitalSummary');
        Cookies.set('hospitalSummary', JSON.stringify(data.hospitalSummary), { expires: 7 });
        console.log('✅ Saved hospital summary to cookies:', data.hospitalSummary);

        // Save prescription themes to cookies
        Cookies.remove('prescriptionThemes');
        Cookies.set('prescriptionThemes', JSON.stringify(data.allThemes), { expires: 7 });
        console.log('✅ Saved prescription themes to cookies:', data.allThemes);

        // Save active themes separately for quick access
        Cookies.remove('activePrescriptionThemes');
        Cookies.set('activePrescriptionThemes', JSON.stringify(data.activeThemes), { expires: 7 });
        console.log('✅ Saved active prescription themes to cookies:', data.activeThemes);
    } catch (error) {
        console.error('❌ Error caching hospital data:', error);
    }
};

/**
 * Get cached hospital data from cookies
 * @returns PrescriptionManagementData | null
 */
export const getCachedHospitalData = (): PrescriptionManagementData | null => {
    try {
        const hospitalSummaryString = Cookies.get('hospitalSummary');
        const prescriptionThemesString = Cookies.get('prescriptionThemes');
        const activeThemesString = Cookies.get('activePrescriptionThemes');

        if (hospitalSummaryString && prescriptionThemesString) {
            const hospitalSummary: HospitalSummary = JSON.parse(hospitalSummaryString);
            const allThemes: PrescriptionTheme[] = JSON.parse(prescriptionThemesString);
            const activeThemes: PrescriptionTheme[] = activeThemesString
                ? JSON.parse(activeThemesString)
                : allThemes.filter(theme => theme.isActive === true);

            console.log('✅ Retrieved cached hospital data');
            return {
                hospitalSummary,
                activeThemes,
                allThemes
            };
        }

        return null;
    } catch (error) {
        console.error('❌ Error retrieving cached hospital data:', error);
        return null;
    }
};

/**
 * Main function to get prescription management data
 * Uses cache first, then fetches fresh data if needed
 * @param forceRefresh - Whether to force refresh from API
 * @returns Promise<PrescriptionManagementData | null>
 */
export const getPrescriptionManagementData = async (forceRefresh: boolean = false): Promise<PrescriptionManagementData | null> => {
    try {
        console.log('🚀 Getting prescription management data...');

        // Try cache first unless force refresh is requested
        if (!forceRefresh) {
            const cachedData = getCachedHospitalData();
            if (cachedData) {
                console.log('✅ Using cached hospital data');
                return cachedData;
            }
        }

        // Get hospital ID
        const hospitalId = await getUserHospitalId();
        if (!hospitalId) {
            console.error('❌ Could not determine user hospital ID');
            return null;
        }

        // Fetch fresh data
        const data = await getHospitalPrescriptionData(hospitalId);
        if (data) {
            // Cache the data
            cacheHospitalData(data);
            return data;
        }

        return null;
    } catch (error) {
        console.error('❌ Error in getPrescriptionManagementData:', error);
        return null;
    }
};

/**
 * Check if a specific prescription theme is active
 * @param themeName - Name of the theme to check
 * @returns Promise<boolean>
 */
export const isThemeActive = async (themeName: string): Promise<boolean> => {
    try {
        const data = await getPrescriptionManagementData();
        if (data) {
            return data.activeThemes.some(theme =>
                theme.theme.toLowerCase() === themeName.toLowerCase()
            );
        }
        return false;
    } catch (error) {
        console.error(`❌ Error checking if theme '${themeName}' is active:`, error);
        return false;
    }
};

/**
 * Get only active prescription themes
 * @returns Promise<PrescriptionTheme[]>
 */
export const getActiveThemes = async (): Promise<PrescriptionTheme[]> => {
    try {
        const data = await getPrescriptionManagementData();
        return data?.activeThemes || [];
    } catch (error) {
        console.error('❌ Error getting active themes:', error);
        return [];
    }
};

/**
 * Refresh hospital data and clear cache
 * @returns Promise<PrescriptionManagementData | null>
 */
export const refreshHospitalData = async (): Promise<PrescriptionManagementData | null> => {
    try {
        console.log('🔄 Refreshing hospital data...');

        // Clear existing cache
        Cookies.remove('hospitalSummary');
        Cookies.remove('prescriptionThemes');
        Cookies.remove('activePrescriptionThemes');

        // Fetch fresh data
        return await getPrescriptionManagementData(true);
    } catch (error) {
        console.error('❌ Error refreshing hospital data:', error);
        return null;
    }
};

// Export types for use in components
