import api from "../utils/interceptor/axios.ts";
const baseUrl = import.meta.env.VITE_API_BASE_URL;

// ✅ Define the structure for creating an appointment
export interface CreateAppointment {
    patientName: string;
    patientNIC: string;
    patientEmail?: string;
    patientPhone: string;
    patientAge?: number;
    patientGender?: "MALE" | "FEMALE" | "OTHER";
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    patientAddress:string;
    duration?: number;
    appointmentType: "CONSULTATION" | "CHECKUP" | "FOLLOW_UP";
    priority?: "NORMAL" | "HIGH" | "LOW";
    symptoms?: string;
    notes?: string;
    channelNo: number;
    channelFee: number;
}

// ✅ Response type
export interface AppointmentCreateResponse {
    success: boolean;
    message: string;
    data: any; // You can define a more specific type if needed
}

// ✅ Channel number generation response
export interface ChannelNumberResponse {
    channelNo: number;
}

// ✅ Create Appointment Function
export const createAppointment = async (
    data: CreateAppointment,
    token: string
): Promise<AppointmentCreateResponse> => {
    const response = await api.post<AppointmentCreateResponse>(
        `${baseUrl}appointments/create`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

// ✅ Generate Channel Number
export const generateChannelNumber = async (
    doctorId: string,
    date: string,
    token: string
): Promise<number> => {
    const response = await api.get<ChannelNumberResponse>(
        `${baseUrl}appointments/generate-channel-no`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                doctorId,
                appointmentDate: date,
            },
        }
    );
    return response.data.channelNo;
};
