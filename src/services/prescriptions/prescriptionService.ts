 // Adjust path as needed

import api from "../../utils/interceptor/axios.ts";

 export interface CreatePrescriptionRequest {
    prescriptionImage?: File;
    patientInfo: {
        name: string;
        nic: string;
        age: number;
        contact: string;
        email: string;
        address: string;
        dateOfVisit: string | Date;
    };
    drugs: {
        brandName: string;
        drugName: string;
        strength: string;
        dosage: string;
        frequency: string;
        duration: string;
        issuedQty: string;
    }[];
}

export const createPrescription = async (data: CreatePrescriptionRequest) => {
    try {
        const formData = new FormData();

        if (data.prescriptionImage) {
            formData.append("prescriptionImage", data.prescriptionImage);
        }

        // Convert patientInfo and drugs to JSON string since they are nested
        formData.append("patientInfo", JSON.stringify(data.patientInfo));
        formData.append("drugs", JSON.stringify(data.drugs));

        const response = await api.post(`/prescriptions`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.message || "Failed to create prescription"
        );
    }
};
