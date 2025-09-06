// src/services/patientUpdateService.ts

import api from "../../utils/interceptor/axios.ts";
import type {AxiosResponse} from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// Update Patient Request interface (matches backend)
export interface UpdatePatientRequest {
    patientName?: string;
    patientNIC?: string;
    patientEmail?: string;
    patientPhone?: string;
    patientAge?: number;
    patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
    patientAddress?: string;
    dateOfBirth?: string; // ISO date string
    medicalHistory?: string;
}

// Updated Patient Response interface (matches backend response)
export interface UpdatePatientResponse {
    message: string;
    patient: {
        _id: string;
        propertyId: string;
        patientName: string;
        patientNIC: string;
        patientEmail?: string;
        patientPhone: string;
        patientAge?: number;
        patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
        patientAddress?: string;
        dateOfBirth?: string;
        medicalHistory?: string;
        activeStatus: boolean;
        createdAt: string;
        updatedAt: string;
        updatedBy: string;
    };
}

// Error response interface
export interface PatientUpdateError {
    message: string;
    errors?: Record<string, string>;
}

/**
 * Update a patient's information
 * @param patientId - The patient's ID
 * @param updateData - The data to update
 * @returns Promise<UpdatePatientResponse>
 */
export const updatePatient = async (
    patientId: string,
    updateData: UpdatePatientRequest
): Promise<UpdatePatientResponse> => {
    try {
        console.log('🔄 Updating patient:', {patientId, updateData});

        // Validate required parameters
        if (!patientId) {
            throw new Error('Patient ID is required');
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            throw new Error('Update data is required');
        }

        // Clean and prepare the update data
        const cleanedData: UpdatePatientRequest = {};

        // Only include defined values in the request
        if (updateData.patientName !== undefined) {
            cleanedData.patientName = updateData.patientName.trim();
        }
        if (updateData.patientNIC !== undefined) {
            cleanedData.patientNIC = updateData.patientNIC.trim().toUpperCase();
        }
        if (updateData.patientEmail !== undefined) {
            cleanedData.patientEmail = updateData.patientEmail.toLowerCase().trim();
        }
        if (updateData.patientPhone !== undefined) {
            cleanedData.patientPhone = updateData.patientPhone.trim();
        }
        if (updateData.patientAge !== undefined) {
            cleanedData.patientAge = updateData.patientAge;
        }
        if (updateData.patientGender !== undefined) {
            cleanedData.patientGender = updateData.patientGender;
        }
        if (updateData.patientAddress !== undefined) {
            cleanedData.patientAddress = updateData.patientAddress?.trim();
        }
        if (updateData.dateOfBirth !== undefined) {
            cleanedData.dateOfBirth = updateData.dateOfBirth;
        }
        if (updateData.medicalHistory !== undefined) {
            cleanedData.medicalHistory = updateData.medicalHistory?.trim();
        }

        console.log('📤 Sending cleaned data:', cleanedData);

        // Make the API request
        const response: AxiosResponse<UpdatePatientResponse> = await api.put(
            `${baseUrl}patients-prescriptions-management/patients/${patientId}`,
            cleanedData
        );

        console.log('✅ Patient updated successfully:', response.data);
        return response.data;

    } catch (error: any) {
        console.error('❌ Error updating patient:', error);

        // Handle different types of errors
        if (error.response) {
            // Server responded with error status
            const serverError = error.response.data as PatientUpdateError;
            throw new Error(serverError.message || 'Failed to update patient');
        } else if (error.request) {
            // Request was made but no response received
            throw new Error('Network error. Please check your connection and try again.');
        } else {
            // Something else happened
            throw new Error(error.message || 'An unexpected error occurred');
        }
    }
};

/**
 * Update only basic patient information (commonly edited fields)
 * @param patientId - The patient's ID
 * @param basicData - Basic patient data to update
 * @returns Promise<UpdatePatientResponse>
 */
export const updateBasicPatientInfo = async (
    patientId: string,
    basicData: {
        name?: string;
        nic?: string;
        contact?: string;
        email?: string;
        age?: string;
        gender?: string;
        address?: string;
        medicalHistory?: string;
        isActive?: boolean;
    }
): Promise<UpdatePatientResponse> => {
    // Convert the basic data format to the backend format
    const updateData: UpdatePatientRequest = {};

    if (basicData.name !== undefined) {
        updateData.patientName = basicData.name;
    }
    if (basicData.nic !== undefined) {
        updateData.patientNIC = basicData.nic;
    }
    if (basicData.contact !== undefined) {
        updateData.patientPhone = basicData.contact;
    }
    if (basicData.email !== undefined && basicData.email !== 'N/A') {
        updateData.patientEmail = basicData.email;
    }
    if (basicData.age !== undefined) {
        updateData.patientAge = parseInt(basicData.age, 10);
    }
    if (basicData.gender !== undefined) {
        updateData.patientGender = basicData.gender as 'MALE' | 'FEMALE' | 'OTHER';
    }
    if (basicData.address !== undefined && basicData.address !== 'N/A') {
        updateData.patientAddress = basicData.address;
    }
    if (basicData.medicalHistory !== undefined) {
        updateData.medicalHistory = basicData.medicalHistory;
    }

    return updatePatient(patientId, updateData);
};

/**
 * Validate patient update data before sending to API
 * @param updateData - The data to validate
 * @returns Object with isValid boolean and errors array
 */
export const validatePatientUpdateData = (updateData: UpdatePatientRequest): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    // Validate patient name
    if (updateData.patientName !== undefined) {
        if (!updateData.patientName.trim()) {
            errors.push('Patient name is required');
        } else if (updateData.patientName.trim().length < 2) {
            errors.push('Patient name must be at least 2 characters');
        } else if (updateData.patientName.trim().length > 100) {
            errors.push('Patient name must not exceed 100 characters');
        }
    }

    // Validate NIC
    if (updateData.patientNIC !== undefined) {
        const nicPattern = /^(\d{9}[VXvx]|\d{12})$/;
        if (!updateData.patientNIC.trim()) {
            errors.push('NIC is required');
        } else if (!nicPattern.test(updateData.patientNIC.trim())) {
            errors.push('Invalid NIC format. Use XXXXXXXXXV or XXXXXXXXXXXX');
        }
    }

    // Validate phone
    if (updateData.patientPhone !== undefined) {
        const phonePattern = /^\d{10}$/;
        if (!updateData.patientPhone.trim()) {
            errors.push('Phone number is required');
        } else if (!phonePattern.test(updateData.patientPhone.trim())) {
            errors.push('Phone number must be 10 digits');
        }
    }

    // Validate email
    if (updateData.patientEmail !== undefined && updateData.patientEmail.trim()) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(updateData.patientEmail.trim())) {
            errors.push('Invalid email format');
        }
    }

    // Validate age
    if (updateData.patientAge !== undefined) {
        if (updateData.patientAge < 0 || updateData.patientAge > 150) {
            errors.push('Age must be between 0 and 150');
        }
    }

    // Validate gender
    if (updateData.patientGender !== undefined) {
        const validGenders = ['MALE', 'FEMALE', 'OTHER'];
        if (!validGenders.includes(updateData.patientGender)) {
            errors.push('Gender must be MALE, FEMALE, or OTHER');
        }
    }

    // Validate date of birth
    if (updateData.dateOfBirth !== undefined) {
        const date = new Date(updateData.dateOfBirth);
        if (isNaN(date.getTime())) {
            errors.push('Invalid date of birth');
        } else if (date > new Date()) {
            errors.push('Date of birth cannot be in the future');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Convert frontend Patient interface to backend UpdatePatientRequest
 * @param patient - Frontend patient object
 * @returns UpdatePatientRequest object
 */
export const convertPatientToUpdateRequest = (patient: {
    name: string;
    nic: string;
    email: string;
    contact: string;
    age: string;
    gender: string;
    address: string;
    medicalHistory: string;
}): UpdatePatientRequest => {
    return {
        patientName: patient.name,
        patientNIC: patient.nic,
        patientEmail: patient.email !== 'N/A' ? patient.email : undefined,
        patientPhone: patient.contact,
        patientAge: parseInt(patient.age, 10),
        patientGender: patient.gender as 'MALE' | 'FEMALE' | 'OTHER',
        patientAddress: patient.address !== 'N/A' ? patient.address : undefined,
        medicalHistory: patient.medicalHistory
    };
};

/**
 * Batch update multiple patients (if needed in the future)
 * @param updates - Array of patient updates
 * @returns Promise<UpdatePatientResponse[]>
 */
export const batchUpdatePatients = async (
    updates: Array<{
        patientId: string;
        updateData: UpdatePatientRequest;
    }>
): Promise<UpdatePatientResponse[]> => {
    const results: UpdatePatientResponse[] = [];
    const errors: Array<{ patientId: string; error: string }> = [];

    // Process updates sequentially to avoid overwhelming the server
    for (const {patientId, updateData} of updates) {
        try {
            const result = await updatePatient(patientId, updateData);
            results.push(result);
        } catch (error: any) {
            errors.push({
                patientId,
                error: error.message
            });
        }
    }

    if (errors.length > 0) {
        console.warn('Some patient updates failed:', errors);
        // You might want to handle partial failures differently
    }

    return results;
};