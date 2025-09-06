// src/services/eventService.ts

import api from "../utils/interceptor/axios.ts";
import type { AxiosResponse } from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;


export interface EventData {
    id: string;
    propertyId: string;
    title: string;
    description: string;
    department: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
    eventType: string;
    priority: string;
    location: string;
    organizer: string;
    attendees: string[];
    hospitalBranch: any;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    isRecurring: boolean;
    recurringPattern?: {
        frequency: string;
        interval: number;
        endDate: string;
    };
    reminderSettings: {
        enabled: boolean;
        reminderTime: number;
    };
    status: string;
    notes: string;
    attachments: any[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// --- Pagination Type ---
export interface Pagination {
    current: number;
    pages: number;
    total: number;
    limit: number;
}

// --- API Response Format ---
export interface EventListResponse {
    success: boolean;
    data: EventData[];
    pagination?: Pagination;
}

// ✅ Fetch all events with query params
export const getAllEvents = async (): Promise<EventListResponse> => {
    const response: AxiosResponse<EventListResponse> = await api.get(`${baseUrl}events`);
    return response.data;
};
