export interface DrugItem {
    id: string
    brand: string
    drug: string
    strength: string
    dosage: string
}

export interface PatientInfo {
    name: string
    nic: string
    age: number
    contact: string
    email: string
    address: string
    dateOfVisit: string | Date
}

export interface Drug {
    brandName: string
    drugName: string
    strength: string
    dosage: string
    frequency: string
    duration: string
    issuedQty: string
}

export interface CreatePrescriptionRequest {
    prescriptionImage?: File
    patientInfo: PatientInfo
    drugs: Drug[]
}

export interface PrescriptionFormData {
    prescriptionId: string
    patientName: string
    nic: string
    age: string
    contact: string
    email: string
    address: string
    dateOfVisit: string
    drugName: string
    strength: string
    dosage: string
    brand: string
    frequency: string
    duration: string
    issuedQty: string
    instructions: string
}

export interface ExtractedData {
    patientName: string
    nic: string
    age: number
    contact: string
    email: string
    address: string
    dateOfVisit: string
    medications: Array<{
        brandName: string
        drugName: string
        strength: string
        dosage: string
        frequency: string
        duration: string
        issuedQty: string
        instructions: string
    }>
}
