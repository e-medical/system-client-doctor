import api from "../../utils/interceptor/axios.ts";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export interface UpdatePrescriptionRequest {
    medications?: Medication[];
    diagnosis?: string;
    notes?: string;
    expiryDate?: string | Date;
    status?: string;
    patientInfo?: any;
    clinicalInfo?: any;
    examinationFindings?: any;
    diagnosisDetails?: any;
    treatmentPlan?: any;
    doctorSignature?: any;
    prescriptionImage?: File;
}

export interface Medication {
    _id?: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity?: number;
}

export interface UpdatePrescriptionResponse {
    message: string;
    prescription: any;
}

export interface DeletePrescriptionResponse {
    message: string;
}

class PrescriptionUpdateService {

    async updatePrescription(
        prescriptionId: string,
        updateData: UpdatePrescriptionRequest
    ): Promise<UpdatePrescriptionResponse> {
        try {
            const formData = new FormData();

            if (updateData.medications !== undefined) {
                formData.append('medications', JSON.stringify(updateData.medications));
            }
            if (updateData.diagnosis !== undefined) {
                formData.append('diagnosis', updateData.diagnosis);
            }
            if (updateData.notes !== undefined) {
                formData.append('notes', updateData.notes);
            }
            if (updateData.expiryDate !== undefined) {
                const expiryDate = updateData.expiryDate instanceof Date
                    ? updateData.expiryDate.toISOString()
                    : updateData.expiryDate;
                formData.append('expiryDate', expiryDate);
            }
            if (updateData.status !== undefined) {
                formData.append('status', updateData.status);
            }
            if (updateData.patientInfo !== undefined) {
                formData.append('patientInfo', JSON.stringify(updateData.patientInfo));
            }
            if (updateData.clinicalInfo !== undefined) {
                formData.append('clinicalInfo', JSON.stringify(updateData.clinicalInfo));
            }
            if (updateData.examinationFindings !== undefined) {
                formData.append('examinationFindings', JSON.stringify(updateData.examinationFindings));
            }
            if (updateData.diagnosisDetails !== undefined) {
                formData.append('diagnosisDetails', JSON.stringify(updateData.diagnosisDetails));
            }
            if (updateData.treatmentPlan !== undefined) {
                formData.append('treatmentPlan', JSON.stringify(updateData.treatmentPlan));
            }
            if (updateData.doctorSignature !== undefined) {
                formData.append('doctorSignature', JSON.stringify(updateData.doctorSignature));
            }
            if (updateData.prescriptionImage) {
                formData.append('prescriptionImage', updateData.prescriptionImage);
            }

            const response = await api.put(
                `${baseUrl}patients-prescriptions-management/prescriptions/${prescriptionId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            return response.data;

        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update prescription');
        }
    }

    async deletePrescription(prescriptionId: string): Promise<DeletePrescriptionResponse> {
        try {
            const response = await api.delete(
                `${baseUrl}patients-prescriptions-management/prescriptions/${prescriptionId}`
            );

            return response.data;

        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete prescription');
        }
    }
}

export const prescriptionUpdateService = new PrescriptionUpdateService();
export default PrescriptionUpdateService;