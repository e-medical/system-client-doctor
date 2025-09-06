import type { DrugItem, ExtractedData } from "../types/prescription.ts"

export const MOCK_INVENTORY: DrugItem[] = [
    { id: crypto.randomUUID(), brand: "PharmaCo", drug: "Paracetamol", strength: "500mg", dosage: "1T" },
    { id: crypto.randomUUID(), brand: "MediCorp", drug: "Amoxicillin", strength: "250mg", dosage: "1C" },
    { id: crypto.randomUUID(), brand: "HealthPlus", drug: "Ibuprofen", strength: "200mg", dosage: "1T" },
    { id: crypto.randomUUID(), brand: "ZenithPharma", drug: "Metformin", strength: "500mg", dosage: "1T" },
]

export const MOCK_EXTRACTED_DATA: ExtractedData = {
    patientName: "John Smith",
    nic: "199012345678",
    age: 45,
    contact: "+94701234567",
    email: "john.smith@email.com",
    address: "123 Main Street, Colombo",
    dateOfVisit: "2025-07-01",
    medications: [
        {
            brandName: "MediCorp",
            drugName: "Amoxicillin",
            strength: "500mg",
            dosage: "1C",
            frequency: "3 times daily",
            duration: "7 days",
            issuedQty: "21",
            instructions: "Take with food",
        },
        {
            brandName: "PharmaCo",
            drugName: "Paracetamol",
            strength: "500mg",
            dosage: "1T",
            frequency: "Every 6 hours",
            duration: "As needed",
            issuedQty: "10",
            instructions: "Take when needed for pain",
        },
    ],
}
