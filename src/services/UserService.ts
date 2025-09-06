import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// User profile interfaces
export interface UserProfileData {
    firstName: string;
    lastName: string;
    contact: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    dob: string; // ISO date string (YYYY-MM-DD)
}

// User details interface (from getUserDetails)
export interface UserDetails {
    hospital: string;
    _id: string;
    firstName: string;
    lastName: string;
    userEmail: string;
    contact?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dob?: string;
    roles: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    avatarUrl:string;
}

export interface UpdateUserProfilePayload {
    firstName?: string;
    lastName?: string;
    contact?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    dob?: string; // ISO date string (YYYY-MM-DD)

}

export interface UserProfileResponse {
    message: string;
    user: UserProfileData;
}

// Get user details response interface
export interface GetUserDetailsResponse {
    status: boolean;
    data: UserDetails;
}

export interface UserProfileErrorResponse {
    error: string;
}

export interface UserDetailsErrorResponse {
    status: false;
    message: string;
}

/**
 * Get current user details
 * @returns Promise<GetUserDetailsResponse>
 */
export const getUserDetails = async (): Promise<GetUserDetailsResponse> => {
    const response: AxiosResponse<GetUserDetailsResponse> = await api.get(
        `${baseUrl}users/get-user-detail`
    );

    return response.data;
};

/**
 * Get user details with error handling
 * @returns Promise<UserDetails | null>
 */
export const getCurrentUserDetails = async (): Promise<UserDetails | null> => {
    try {
        const response = await getUserDetails();

        if (response.status && response.data) {
            return response.data;
        }

        console.error('Failed to get user details:', response);
        return null;
    } catch (error) {
        console.error('Error fetching user details:', error);
        return null;
    }
};

/**
 * Get specific user profile fields
 * @returns Promise with basic profile info
 */
export const getUserProfileInfo = async (): Promise<{
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
} | null> => {
    try {
        const userDetails = await getCurrentUserDetails();

        if (userDetails) {
            return {
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                email: userDetails.userEmail,
                fullName: `${userDetails.firstName} ${userDetails.lastName}`
            };
        }

        return null;
    } catch (error) {
        console.error('Error getting user profile info:', error);
        return null;
    }
};

/**
 * Check if user has specific role
 * @param role - Role to check for
 * @returns Promise<boolean>
 */
export const hasUserRole = async (role: string): Promise<boolean> => {
    try {
        const userDetails = await getCurrentUserDetails();
        return userDetails?.roles?.includes(role) || false;
    } catch (error) {
        console.error('Error checking user role:', error);
        return false;
    }
};

/**
 * Get user roles
 * @returns Promise<string[]>
 */
export const getUserRoles = async (): Promise<string[]> => {
    try {
        const userDetails = await getCurrentUserDetails();
        return userDetails?.roles || [];
    } catch (error) {
        console.error('Error getting user roles:', error);
        return [];
    }
};

/**
 * Refresh user details and return updated data
 * @returns Promise<UserDetails | null>
 */
export const refreshUserDetails = async (): Promise<UserDetails | null> => {
    try {
        // Force fresh API call
        const response = await getUserDetails();

        if (response.status && response.data) {
            console.log('✅ User details refreshed:', response.data);
            return response.data;
        }

        return null;
    } catch (error) {
        console.error('❌ Error refreshing user details:', error);
        return null;
    }
};

/**
 * Update user profile details
 * @param payload - User profile data to update
 * @returns Promise<UserProfileResponse>
 */
export const updateUserProfile = async (
    payload: UpdateUserProfilePayload
): Promise<UserProfileResponse> => {
    // Validate payload
    if (!payload || Object.keys(payload).length === 0) {
        throw new Error('At least one field (firstName, lastName, contact, gender, dob) must be provided');
    }

    // Validate required fields if provided
    if (payload.firstName && payload.firstName.trim().length === 0) {
        throw new Error('First name cannot be empty');
    }

    if (payload.lastName && payload.lastName.trim().length === 0) {
        throw new Error('Last name cannot be empty');
    }

    if (payload.contact && payload.contact.trim().length === 0) {
        throw new Error('Contact cannot be empty');
    }

    if (payload.gender && !['MALE', 'FEMALE', 'OTHER'].includes(payload.gender)) {
        throw new Error('Gender must be MALE, FEMALE, or OTHER');
    }

    if (payload.dob && !isValidDate(payload.dob)) {
        throw new Error('Date of birth must be a valid date');
    }

    const response: AxiosResponse<UserProfileResponse> = await api.put(
        `${baseUrl}users/update`,
        payload
    );

    return response.data;
};

/**
 * Update profile and refresh user details
 * @param payload - User profile data to update
 * @returns Promise with updated user details
 */
export const updateProfileAndRefresh = async (
    payload: UpdateUserProfilePayload
): Promise<{
    profileResponse: UserProfileResponse;
    updatedUserDetails: UserDetails | null;
}> => {
    try {
        // Update profile
        const profileResponse = await updateUserProfile(payload);

        // Refresh user details to get updated data
        const updatedUserDetails = await refreshUserDetails();

        return {
            profileResponse,
            updatedUserDetails
        };
    } catch (error) {
        console.error('Error updating profile and refreshing details:', error);
        throw error;
    }
};

/**
 * Update only basic profile information (name and contact)
 * @param firstName - First name
 * @param lastName - Last name
 * @param contact - Contact number
 * @returns Promise<UserProfileResponse>
 */
export const updateBasicProfile = async (
    firstName: string,
    lastName: string,
    contact: string
): Promise<UserProfileResponse> => {
    return updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        contact: contact.trim(),
    });
};

/**
 * Update user name only
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Promise<UserProfileResponse>
 */
export const updateUserName = async (
    firstName: string,
    lastName: string
): Promise<UserProfileResponse> => {
    return updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),

    });
};

/**
 * Update user contact information
 * @param contact - Contact number
 * @returns Promise<UserProfileResponse>
 */
export const updateUserContact = async (
    contact: string
): Promise<UserProfileResponse> => {
    return updateUserProfile({
        contact: contact.trim(),

    });
};

/**
 * Update user gender
 * @param gender - User gender
 * @returns Promise<UserProfileResponse>
 */
export const updateUserGender = async (
    gender: 'MALE' | 'FEMALE' | 'OTHER'
): Promise<UserProfileResponse> => {
    return updateUserProfile({
        gender,

    });
};

/**
 * Update user date of birth
 * @param dob - Date of birth in YYYY-MM-DD format
 * @returns Promise<UserProfileResponse>
 */
export const updateUserDateOfBirth = async (
    dob: string
): Promise<UserProfileResponse> => {
    return updateUserProfile({
        dob,

    });
};

/**
 * Validate date string
 * @param dateString - Date string to validate
 * @returns boolean indicating if date is valid
 */
export const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Format date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

/**
 * Format date for input field (YYYY-MM-DD)
 * @param dateString - ISO date string or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForInput = (dateString: string | Date): string => {
    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
    }
};

/**
 * Validate user profile form data
 * @param data - Form data to validate
 * @returns Object with validation result and errors
 */
export const validateUserProfileForm = (data: UpdateUserProfilePayload): {
    isValid: boolean;
    errors: Record<string, string>;
} => {
    const errors: Record<string, string> = {};

    // Validate first name
    if (data.firstName !== undefined) {
        if (!data.firstName || data.firstName.trim().length === 0) {
            errors.firstName = 'First name is required';
        } else if (data.firstName.trim().length < 2) {
            errors.firstName = 'First name must be at least 2 characters';
        } else if (data.firstName.trim().length > 50) {
            errors.firstName = 'First name must not exceed 50 characters';
        }
    }

    // Validate last name
    if (data.lastName !== undefined) {
        if (!data.lastName || data.lastName.trim().length === 0) {
            errors.lastName = 'Last name is required';
        } else if (data.lastName.trim().length < 2) {
            errors.lastName = 'Last name must be at least 2 characters';
        } else if (data.lastName.trim().length > 50) {
            errors.lastName = 'Last name must not exceed 50 characters';
        }
    }

    // Validate contact
    if (data.contact !== undefined) {
        if (!data.contact || data.contact.trim().length === 0) {
            errors.contact = 'Contact number is required';
        } else if (!/^\d{10,15}$/.test(data.contact.replace(/\s+/g, ''))) {
            errors.contact = 'Contact number must be 10-15 digits';
        }
    }

    // Validate gender
    if (data.gender !== undefined) {
        if (!['MALE', 'FEMALE', 'OTHER'].includes(data.gender)) {
            errors.gender = 'Please select a valid gender';
        }
    }

    // Validate date of birth
    if (data.dob !== undefined) {
        if (!data.dob) {
            errors.dob = 'Date of birth is required';
        } else if (!isValidDate(data.dob)) {
            errors.dob = 'Please enter a valid date';
        } else {
            const birthDate = new Date(data.dob);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();

            if (birthDate > today) {
                errors.dob = 'Date of birth cannot be in the future';
            } else if (age > 120) {
                errors.dob = 'Please enter a valid date of birth';
            }
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth string
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string): number => {
    try {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    } catch (error) {
        console.error('Error calculating age:', error);
        return 0;
    }
};

/**
 * Get gender display text
 * @param gender - Gender enum value
 * @returns Human readable gender text
 */
export const getGenderDisplayText = (gender: 'MALE' | 'FEMALE' | 'OTHER'): string => {
    switch (gender) {
        case 'MALE':
            return 'Male';
        case 'FEMALE':
            return 'Female';
        case 'OTHER':
            return 'Other';
        default:
            return 'Not specified';
    }
};

/**
 * Create a complete user profile payload from form data
 * @param formData - Raw form data
 * @returns Cleaned and validated payload
 */
export const createUserProfilePayload = (formData: any): UpdateUserProfilePayload => {
    const payload: UpdateUserProfilePayload = {

    };

    if (formData.firstName && formData.firstName.trim()) {
        payload.firstName = formData.firstName.trim();
    }

    if (formData.lastName && formData.lastName.trim()) {
        payload.lastName = formData.lastName.trim();
    }

    if (formData.contact && formData.contact.trim()) {
        payload.contact = formData.contact.trim();
    }

    if (formData.gender && ['MALE', 'FEMALE', 'OTHER'].includes(formData.gender)) {
        payload.gender = formData.gender;
    }

    if (formData.dob && isValidDate(formData.dob)) {
        payload.dob = formatDateForInput(formData.dob);
    }

    return payload;
};

// Export all types for use in components
export type {
    // UserProfileData,
    // UserDetails,
    // UpdateUserProfilePayload,
    // UserProfileResponse,
    // GetUserDetailsResponse,
    // UserProfileErrorResponse,
    // UserDetailsErrorResponse
};
