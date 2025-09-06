
import api from "../utils/interceptor/axios.ts";


const baseUrl = import.meta.env.VITE_API_BASE_URL;


export interface Hospital {
    _id: string;
    propertyId: string;
    applicationUserId: {
        _id: string;
        firstName: string;
        lastName: string;
        userEmail: string;
        roles: string[];
    };
    businessName: string;
    adminEmail: string;
    address?: string;
    logo?: { url: string; publicId?: string; alt?: string };
    registrationNumber?: string;
    hospitalType?: string;
    adminName?: string;
    adminContact?: string;
    website?: { url: string; title?: string };
    socialLinks?: { facebook?: string; twitter?: string; instagram?: string; linkedin?: string; youtube?: string };
    pricingPlan: {
        planId: {
            _id: string;
            name: string;
            monthlyPrice: number;
            yearlyPrice: number;
            staticFeatures: string[];
            subFeatures: string[];
        };
        billingType: string;
        paymentType: string;
        paymentSlip?: { url: string; key: string };
        basePrice: number;
        addOns: { system: string; additionalPrice: number }[];
        activeSystems: { system: string; isActive: boolean }[];
    };
    status: boolean;
    disabled: boolean;
    verificationNotes?: string;
    verifiedBy?: {
        _id: string;
        firstName: string;
        lastName: string;
        userEmail: string;
    };
    verifiedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface HospitalResponse {
    success: boolean;
    data: Hospital;
    message?: string;
}

export interface ToggleSystemRequest {
    hospitalId: string;
    system: string;
    isActive: boolean;
}

export interface ToggleSystemResponse {
    success: boolean;
    message: string;
    data: { system: string; isActive: boolean }[];
    errors?: string[];
}

export interface UpdateHospitalDetailsRequest {
    businessName?: string;
    registrationNumber?: string;
    adminContact?: string;
    address?: string;
}

export interface UpdateHospitalDetailsResponse {
    success: boolean;
    message: string;
    hospital: {
        businessName?: string;
        registrationNumber?: string;
        adminContact?: string;
        address?: string;
    };
    error?: string;
}

export interface UploadHospitalLogoResponse {
    success: boolean;
    message: string;
    data: {
        hospitalId: string;
        logo: { url: string; publicId?: string; alt?: string };
    };
    error?: string;
}

export interface AccountApprovalResponse {
    success: boolean;
    message?: string;
    approval?: boolean;
}

// ✅ New types for prescription theme config
export interface PrescriptionThemeConfigRequest {
    hospitalId: string;
    theme: {
        primaryColor: string;
        secondaryColor?: string;
        headerLogo?: string;
        footerNote?: string;
    };
}

export interface PrescriptionThemeConfigResponse {
    success: boolean;
    message: string;
    data?: any;
    error?: string;
}

// ========================== API Functions ==========================

// Get hospital by ID
export const getHospitalById = async (hospitalId: string): Promise<HospitalResponse> => {
    const response = await api.get(`${baseUrl}/hospitals/${hospitalId}`);
    return response.data;
};

// Toggle system status
export const toggleSystemStatus = async (data: ToggleSystemRequest): Promise<ToggleSystemResponse> => {
    const response = await api.post('/hospitals/toggle-system', data);
    return response.data;
};

// Update hospital details
export const updateHospitalDetails = async (
    data: UpdateHospitalDetailsRequest
): Promise<UpdateHospitalDetailsResponse> => {
    const response = await api.put('/hospitals/update', data);
    return response.data;
};

// Upload hospital logo
export const uploadHospitalLogo = async (file: File, alt?: string): Promise<UploadHospitalLogoResponse> => {
    const formData = new FormData();
    formData.append('logo', file);
    if (alt) formData.append('alt', alt);

    const response = await api.patch('/hospitals/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// Get hospital metrics
export const getHospitalMetrics = async (): Promise<any> => {
    const response = await api.get('/hospitals/get-hospital-stats');
    return response.data;
};

// Get monthly revenue stats
export const getMonthlyRevenueByYear = async (year: number): Promise<any> => {
    const response = await api.get('/hospitals/monthly-revenue', {
        params: { year },
    });
    return response.data;
};

// Check hospital account approval
export const checkAccountApproval = async (): Promise<AccountApprovalResponse> => {
    const response = await api.get('/hospitals/check-account-approval');
    return response.data;
};

// Configure prescription theme using query parameters
export const configPrescriptionTheme = async (
    isActive: boolean,
    theme: string
): Promise<PrescriptionThemeConfigResponse> => {
    const response = await api.patch(`/hospitals/config-prescription-theme?isActive=${isActive}&theme=${theme}`);
    return response.data;
};

