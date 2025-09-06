import {
    getPrescriptionManagementData,
    isThemeActive,
} from './prescriptionManagementService';
import {
    getAvailablePrescriptions,
    getHospitalPrescriptionStats,
    filterPrescriptionsBySearchTerm,
    type AvailablePrescription
} from './prescriptionSelectorService';

// ---------------------- Types ----------------------
export type PrescriptionType = 'Default' | 'Standard' | 'Custom';

export interface PrescriptionTypeConfig {
    type: PrescriptionType;
    title: string;
    description: string;
    themeKey: string; // Key used in hospital prescription themes
    keywords: string[]; // Keywords to identify prescriptions of this type
    isActive: boolean;
    prescriptionCount: number;
    isAvailable: boolean;
    prescriptions: AvailablePrescription[];
}

export interface PrescriptionTypeStats {
    totalTypes: number;
    activeTypes: number;
    availableTypes: number;
    totalPrescriptions: number;
    hospitalId: string | null;
}

// ---------------------- Configuration ----------------------
const PRESCRIPTION_TYPE_CONFIGS: Omit<PrescriptionTypeConfig, 'isActive' | 'prescriptionCount' | 'isAvailable' | 'prescriptions'>[] = [
    {
        type: 'Default',
        title: 'Default Prescription',
        description: 'Standard prescription format with essential medical fields and basic drug information',
        themeKey: 'Default',
        keywords: ['default', 'basic', 'standard', 'normal']
    },
    {
        type: 'Standard',
        title: 'Standard Prescription',
        description: 'Enhanced prescription format with detailed patient information and comprehensive drug details',
        themeKey: 'Standard',
        keywords: ['standard', 'enhanced', 'detailed', 'comprehensive']
    },
    {
        type: 'Custom',
        title: 'Custom Prescription',
        description: 'Fully customizable prescription format with drag-and-drop components and flexible layouts',
        themeKey: 'Custom',
        keywords: ['custom', 'customizable', 'flexible', 'personalized', 'template']
    }
];

// ---------------------- Service Functions ----------------------

/**
 * Categorize prescriptions by type based on keywords
 * @param prescriptions - Array of available prescriptions
 * @returns Record<PrescriptionType, AvailablePrescription[]>
 */
export const categorizePrescriptionsByType = (
    prescriptions: AvailablePrescription[]
): Record<PrescriptionType, AvailablePrescription[]> => {
    const categorized: Record<PrescriptionType, AvailablePrescription[]> = {
        'Default': [],
        'Standard': [],
        'Custom': []
    };

    prescriptions.forEach(prescription => {
        const prescriptionText = `${prescription.prescriptionName} ${prescription.description || ''}`.toLowerCase();

        // Check for custom keywords first (most specific)
        if (PRESCRIPTION_TYPE_CONFIGS[2].keywords.some(keyword => prescriptionText.includes(keyword))) {
            categorized.Custom.push(prescription);
        }
        // Then check for standard keywords
        else if (PRESCRIPTION_TYPE_CONFIGS[1].keywords.some(keyword => prescriptionText.includes(keyword))) {
            categorized.Standard.push(prescription);
        }
        // Default to Default type if no specific keywords found
        else {
            categorized.Default.push(prescription);
        }
    });

    return categorized;
};

/**
 * Get prescription type configurations with current availability
 * @returns Promise<PrescriptionTypeConfig[]>
 */
export const getPrescriptionTypeConfigs = async (): Promise<PrescriptionTypeConfig[]> => {
    try {
        console.log('🔍 Loading prescription type configurations...');

        // Get available prescriptions and theme status
        const [prescriptions, managementData] = await Promise.all([
            getAvailablePrescriptions(),
            getPrescriptionManagementData()
        ]);

        if (!managementData) {
            console.error('❌ No hospital management data available');
            return PRESCRIPTION_TYPE_CONFIGS.map(config => ({
                ...config,
                isActive: false,
                prescriptionCount: 0,
                isAvailable: false,
                prescriptions: []
            }));
        }

        // Categorize prescriptions by type
        const categorizedPrescriptions = categorizePrescriptionsByType(prescriptions);

        // Check theme activation status
        const themeStatuses = await Promise.all(
            PRESCRIPTION_TYPE_CONFIGS.map(config => isThemeActive(config.themeKey))
        );

        // Build configuration with real data
        const configs: PrescriptionTypeConfig[] = PRESCRIPTION_TYPE_CONFIGS.map((config, index) => {
            const typePrescriptions = categorizedPrescriptions[config.type];
            const isActive = themeStatuses[index];
            const prescriptionCount = typePrescriptions.length;
            const isAvailable = isActive && prescriptionCount > 0;

            return {
                ...config,
                isActive,
                prescriptionCount,
                isAvailable,
                prescriptions: typePrescriptions
            };
        });

        console.log('✅ Prescription type configurations loaded:', {
            configs: configs.map(c => ({
                type: c.type,
                isActive: c.isActive,
                prescriptionCount: c.prescriptionCount,
                isAvailable: c.isAvailable
            }))
        });

        return configs;
    } catch (error) {
        console.error('❌ Error loading prescription type configurations:', error);
        return PRESCRIPTION_TYPE_CONFIGS.map(config => ({
            ...config,
            isActive: false,
            prescriptionCount: 0,
            isAvailable: false,
            prescriptions: []
        }));
    }
};

/**
 * Get prescriptions for a specific type
 * @param type - Prescription type
 * @returns Promise<AvailablePrescription[]>
 */
export const getPrescriptionsByType = async (type: PrescriptionType): Promise<AvailablePrescription[]> => {
    try {
        const configs = await getPrescriptionTypeConfigs();
        const typeConfig = configs.find(config => config.type === type);

        return typeConfig?.prescriptions || [];
    } catch (error) {
        console.error(`❌ Error getting prescriptions for type ${type}:`, error);
        return [];
    }
};

/**
 * Check if a prescription type is available
 * @param type - Prescription type
 * @returns Promise<boolean>
 */
export const isPrescriptionTypeAvailable = async (type: PrescriptionType): Promise<boolean> => {
    try {
        const configs = await getPrescriptionTypeConfigs();
        const typeConfig = configs.find(config => config.type === type);

        return typeConfig?.isAvailable || false;
    } catch (error) {
        console.error(`❌ Error checking availability for type ${type}:`, error);
        return false;
    }
};

/**
 * Get prescription type statistics
 * @returns Promise<PrescriptionTypeStats>
 */
export const getPrescriptionTypeStats = async (): Promise<PrescriptionTypeStats> => {
    try {
        const [configs, hospitalStats] = await Promise.all([
            getPrescriptionTypeConfigs(),
            getHospitalPrescriptionStats()
        ]);

        const totalTypes = configs.length;
        const activeTypes = configs.filter(c => c.isActive).length;
        const availableTypes = configs.filter(c => c.isAvailable).length;
        const totalPrescriptions = configs.reduce((sum, c) => sum + c.prescriptionCount, 0);

        return {
            totalTypes,
            activeTypes,
            availableTypes,
            totalPrescriptions,
            hospitalId: hospitalStats?.hospitalId || null
        };
    } catch (error) {
        console.error('❌ Error getting prescription type stats:', error);
        return {
            totalTypes: 0,
            activeTypes: 0,
            availableTypes: 0,
            totalPrescriptions: 0,
            hospitalId: null
        };
    }
};

/**
 * Search prescriptions within a specific type
 * @param type - Prescription type
 * @param searchTerm - Search term
 * @returns Promise<AvailablePrescription[]>
 */
export const searchPrescriptionsByType = async (
    type: PrescriptionType,
    searchTerm: string
): Promise<AvailablePrescription[]> => {
    try {
        const typePrescriptions = await getPrescriptionsByType(type);

        if (!searchTerm.trim()) {
            return typePrescriptions;
        }

        return filterPrescriptionsBySearchTerm(typePrescriptions, searchTerm);
    } catch (error) {
        console.error(`❌ Error searching prescriptions for type ${type}:`, error);
        return [];
    }
};

/**
 * Get the most suitable prescription type based on available prescriptions
 * @returns Promise<PrescriptionType | null>
 */
export const getRecommendedPrescriptionType = async (): Promise<PrescriptionType | null> => {
    try {
        const configs = await getPrescriptionTypeConfigs();

        // Priority: Custom > Standard > Default (if available)
        const availableConfigs = configs.filter(c => c.isAvailable);

        if (availableConfigs.length === 0) {
            return null;
        }

        // Return the most feature-rich available type
        const priorityOrder: PrescriptionType[] = ['Custom', 'Standard', 'Default'];

        for (const type of priorityOrder) {
            const config = availableConfigs.find(c => c.type === type);
            if (config) {
                return config.type;
            }
        }

        // Fallback to first available
        return availableConfigs[0].type;
    } catch (error) {
        console.error('❌ Error getting recommended prescription type:', error);
        return null;
    }
};

/**
 * Validate prescription type selection
 * @param type - Selected prescription type
 * @returns Promise<{isValid: boolean, errors: string[]}>
 */
export const validatePrescriptionTypeSelection = async (type: PrescriptionType): Promise<{
    isValid: boolean;
    errors: string[];
}> => {
    const errors: string[] = [];

    try {
        const configs = await getPrescriptionTypeConfigs();
        const typeConfig = configs.find(config => config.type === type);

        if (!typeConfig) {
            errors.push(`Unknown prescription type: ${type}`);
            return { isValid: false, errors };
        }

        if (!typeConfig.isActive) {
            errors.push(`${type} prescription type is not active in your hospital`);
        }

        if (typeConfig.prescriptionCount === 0) {
            errors.push(`No ${type.toLowerCase()} prescriptions available`);
        }

        if (!typeConfig.isAvailable) {
            errors.push(`${type} prescription type is not available`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    } catch (error) {
        console.error(`❌ Error validating prescription type ${type}:`, error);
        return {
            isValid: false,
            errors: ['Failed to validate prescription type']
        };
    }
};

// Export types and configurations
export { PRESCRIPTION_TYPE_CONFIGS };