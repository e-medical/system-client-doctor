import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Testimonial interfaces
export interface TestimonialData {
    date: string;
    message: string;
}

export interface DoctorTestimonialInfo {
    id: string;
    propertyId: string;
    doctorName: string;
    testimonial: TestimonialData;
}

// Extended doctor interface for testimonials list
export interface DoctorWithTestimonial {
    _id: string;
    propertyId: string;
    doctorName: string;
    firstName: string;
    lastName: string;
    specialization: string;
    qualification: string;
    experience: number;
    contactNumber: string;
    email: string;
    slmcNumber: string;
    channelFee: number;
    isActive: boolean;
    testimonial: TestimonialData;
    hospitalBranchId?: {
        branchName: string;
        location: string;
    };
    applicationUserId?: {
        firstName: string;
        lastName: string;
        userEmail: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Pagination interface
export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

// Request payload interface
export interface AddTestimonialPayload {
    applicationUserId: string;
    message: string;
}

// Get testimonials query parameters
export interface GetTestimonialsParams {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string;
    isActive?: boolean;
    sortBy?: 'createdAt' | 'updatedAt' | 'doctorName' | 'specialization' | 'experience';
    sortOrder?: 'asc' | 'desc';
}

// API Response interface for add testimonial
export interface TestimonialResponse {
    success: boolean;
    message: string;
    data: {
        doctor: DoctorTestimonialInfo;
    };
}

// API Response interface for get testimonials
export interface TestimonialsListResponse {
    success: boolean;
    message: string;
    data: {
        doctors: DoctorWithTestimonial[];
        pagination: PaginationInfo;
    };
}

// Error response interface
export interface TestimonialErrorResponse {
    success: false;
    message: string;
}

/**
 * Get doctors with testimonials (paginated and filterable)
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise<TestimonialsListResponse>
 */
export const getDoctorsWithTestimonials = async (
    params: GetTestimonialsParams = {}
): Promise<TestimonialsListResponse> => {
    const response: AxiosResponse<TestimonialsListResponse> = await api.get(
        `${baseUrl}doctors/with-testimonials`,
        { params }
    );

    return response.data;
};

/**
 * Get doctors with testimonials with default parameters
 * @returns Promise<TestimonialsListResponse>
 */
export const getAllDoctorsWithTestimonials = async (): Promise<TestimonialsListResponse> => {
    return getDoctorsWithTestimonials({
        page: 1,
        limit: 100, // Get more testimonials by default
        sortBy: 'createdAt',
        sortOrder: 'desc',
        isActive: true
    });
};

/**
 * Search doctors with testimonials
 * @param searchTerm - Search term to filter doctors
 * @param options - Additional filter options
 * @returns Promise<TestimonialsListResponse>
 */
export const searchDoctorsWithTestimonials = async (
    searchTerm: string,
    options: Partial<GetTestimonialsParams> = {}
): Promise<TestimonialsListResponse> => {
    return getDoctorsWithTestimonials({
        search: searchTerm,
        page: 1,
        limit: 50,
        sortBy: 'doctorName',
        sortOrder: 'asc',
        ...options
    });
};

/**
 * Get doctors with testimonials by specialization
 * @param specialization - Medical specialization to filter by
 * @param options - Additional filter options
 * @returns Promise<TestimonialsListResponse>
 */
export const getDoctorsWithTestimonialsBySpecialization = async (
    specialization: string,
    options: Partial<GetTestimonialsParams> = {}
): Promise<TestimonialsListResponse> => {
    return getDoctorsWithTestimonials({
        specialization,
        page: 1,
        limit: 50,
        sortBy: 'doctorName',
        sortOrder: 'asc',
        isActive: true,
        ...options
    });
};

/**
 * Get paginated doctors with testimonials
 * @param page - Page number
 * @param limit - Items per page
 * @param options - Additional filter options
 * @returns Promise<TestimonialsListResponse>
 */
export const getPaginatedDoctorsWithTestimonials = async (
    page: number,
    limit: number = 10,
    options: Partial<GetTestimonialsParams> = {}
): Promise<TestimonialsListResponse> => {
    return getDoctorsWithTestimonials({
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...options
    });
};

/**
 * Add testimonial for a doctor
 * @param payload - Contains applicationUserId and message
 * @returns Promise<TestimonialResponse>
 */
export const addDoctorTestimonial = async (
    payload: AddTestimonialPayload
): Promise<TestimonialResponse> => {
    // Validate payload before sending
    if (!payload.applicationUserId || !payload.message) {
        throw new Error('Application User ID and message are required');
    }

    if (payload.message.trim().length < 10 || payload.message.trim().length > 1000) {
        throw new Error('Message must be between 10 and 1000 characters');
    }

    const response: AxiosResponse<TestimonialResponse> = await api.post(
        `${baseUrl}doctors/testimonial`,
        {
            applicationUserId: payload.applicationUserId,
            message: payload.message.trim()
        }
    );

    return response.data;
};

/**
 * Add testimonial for the currently logged-in doctor
 * @param message - Testimonial message
 * @param loggedInUserId - Currently logged-in user's ID
 * @returns Promise<TestimonialResponse>
 */
export const addCurrentDoctorTestimonial = async (
    message: string,
    loggedInUserId: string
): Promise<TestimonialResponse> => {
    return addDoctorTestimonial({
        applicationUserId: loggedInUserId,
        message: message
    });
};

/**
 * Validate testimonial message
 * @param message - Message to validate
 * @returns Object with validation result and error message if any
 */
export const validateTestimonialMessage = (message: string): {
    isValid: boolean;
    error?: string;
} => {
    if (!message || message.trim().length === 0) {
        return {
            isValid: false,
            error: 'Testimonial message is required'
        };
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length < 10) {
        return {
            isValid: false,
            error: 'Message must be at least 10 characters long'
        };
    }

    if (trimmedMessage.length > 1000) {
        return {
            isValid: false,
            error: 'Message must not exceed 1000 characters'
        };
    }

    return {
        isValid: true
    };
};

/**
 * Format testimonial date for display
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatTestimonialDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
};

/**
 * Get character count info for testimonial message
 * @param message - Current message
 * @returns Object with character count info
 */
export const getMessageCharacterInfo = (message: string): {
    current: number;
    remaining: number;
    max: number;
    isValid: boolean;
} => {
    const trimmed = message.trim();
    const current = trimmed.length;
    const max = 1000;
    const remaining = max - current;
    const isValid = current >= 10 && current <= max;

    return {
        current,
        remaining,
        max,
        isValid
    };
};

/**
 * Get unique specializations from doctors with testimonials
 * @returns Promise<string[]>
 */
export const getTestimonialSpecializations = async (): Promise<string[]> => {
    try {
        const response = await getDoctorsWithTestimonials({
            page: 1,
            limit: 1000, // Get all to extract specializations
            isActive: true
        });

        const specializations = response.data.doctors
            .map(doctor => doctor.specialization)
            .filter((spec, index, arr) => arr.indexOf(spec) === index) // Remove duplicates
            .sort();

        return specializations;
    } catch (error) {
        console.error('Error fetching specializations:', error);
        return [];
    }
};

/**
 * Get testimonial statistics
 * @returns Promise with testimonial stats
 */
export const getTestimonialStats = async (): Promise<{
    totalTestimonials: number;
    totalSpecializations: number;
    activeTestimonials: number;
}> => {
    try {
        const [allResponse, activeResponse] = await Promise.all([
            getDoctorsWithTestimonials({ page: 1, limit: 1 }), // Just get count
            getDoctorsWithTestimonials({ page: 1, limit: 1, isActive: true })
        ]);

        const specializations = await getTestimonialSpecializations();

        return {
            totalTestimonials: allResponse.data.pagination.totalCount,
            totalSpecializations: specializations.length,
            activeTestimonials: activeResponse.data.pagination.totalCount
        };
    } catch (error) {
        console.error('Error fetching testimonial stats:', error);
        return {
            totalTestimonials: 0,
            totalSpecializations: 0,
            activeTestimonials: 0
        };
    }
};

// Export all types for use in components
export type {
    // TestimonialData,
    // DoctorTestimonialInfo,
    // DoctorWithTestimonial,
    // PaginationInfo,
    // AddTestimonialPayload,
    // GetTestimonialsParams,
    // TestimonialResponse,
    // TestimonialsListResponse,
    // TestimonialErrorResponse
};
