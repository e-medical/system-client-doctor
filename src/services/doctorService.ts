// src/services/doctorService.ts

import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

// System User interface (nested in Doctor)
export interface SystemUser {
    id: string;
    propertyId: string;
    name: string;
    email: string;
    roles: string[];
}

// Hospital Branch interface (if needed)
export interface HospitalBranch {
    // Add properties as needed based on your actual response
    [key: string]: any;
}

export interface Doctor {
    id: string;
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
    addDigitalTextPrescription: boolean;
    addManualPrescription: boolean;
    hospitalBranch: HospitalBranch;
    systemUser: SystemUser; // This contains the user information
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    // Optional fields that might not always be present
    testimonial?: string;

    // Legacy field - keeping for backward compatibility but use systemUser.id instead
    applicationUserId?: string;
}

// Pagination type (if server supports paginated doctor fetch)
export interface Pagination {
    current: number;
    pages: number;
    total: number;
    limit: number;
}

// API Response structure
interface DoctorListResponse {
    success: boolean;
    data: Doctor[];
    pagination?: Pagination;
}

// ✅ Fetch all doctors
export const getAllDoctors = async (): Promise<DoctorListResponse> => {
    const response: AxiosResponse<DoctorListResponse> = await api.get(`${baseUrl}doctors`);
    return response.data;
};