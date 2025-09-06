"use client"

import type React from "react"

import { useState } from "react"
import type { PrescriptionFormData, ExtractedData } from "../types/prescription"
import { createPrescription } from "../services/prescriptionService"

const initialFormData: PrescriptionFormData = {
    prescriptionId: "",
    patientName: "",
    nic: "",
    age: "",
    contact: "",
    email: "",
    address: "",
    dateOfVisit: "",
    drugName: "",
    strength: "",
    dosage: "",
    brand: "",
    frequency: "",
    duration: "",
    issuedQty: "",
    instructions: "",
}

export const usePrescriptionForm = () => {
    const [formData, setFormData] = useState<PrescriptionFormData>(initialFormData)
    const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
    const [submitMessage, setSubmitMessage] = useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const updateFromExtractedData = (data: ExtractedData) => {
        const firstMedication = data.medications?.[0] || {}
        setFormData((prev) => ({
            ...prev,
            patientName: data.patientName || prev.patientName,
            nic: data.nic || prev.nic,
            age: data.age?.toString() || prev.age,
            contact: data.contact || prev.contact,
            email: data.email || prev.email,
            address: data.address || prev.address,
            dateOfVisit: data.dateOfVisit || prev.dateOfVisit,
            drugName: firstMedication.drugName || prev.drugName,
            strength: firstMedication.strength || prev.strength,
            dosage: firstMedication.dosage || prev.dosage,
            brand: firstMedication.brandName || prev.brand,
            frequency: firstMedication.frequency || prev.frequency,
            duration: firstMedication.duration || prev.duration,
            issuedQty: firstMedication.issuedQty || prev.issuedQty,
            instructions: firstMedication.instructions || prev.instructions,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus("idle")

        try {
            const prescriptionRequest: any = {
                prescriptionImage: prescriptionImage || undefined,
                patientInfo: {
                    name: formData.patientName,
                    nic: formData.nic,
                    age: Number.parseInt(formData.age) || 0,
                    contact: formData.contact,
                    email: formData.email,
                    address: formData.address,
                    dateOfVisit: formData.dateOfVisit,
                },
                drugs: [
                    {
                        brandName: formData.brand,
                        drugName: formData.drugName,
                        strength: formData.strength,
                        dosage: formData.dosage,
                        frequency: formData.frequency,
                        duration: formData.duration,
                        issuedQty: formData.issuedQty,
                    },
                ],
            }

            await createPrescription(prescriptionRequest)
            setSubmitStatus("success")
            setSubmitMessage("Prescription created successfully!")

            // Reset form after successful submission
            setTimeout(() => {
                setFormData(initialFormData)
                setPrescriptionImage(null)
                setSubmitStatus("idle")
            }, 3000)
        } catch (error: any) {
            setSubmitStatus("error")
            setSubmitMessage(error.message || "Failed to create prescription")
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData(initialFormData)
        setPrescriptionImage(null)
        setSubmitStatus("idle")
        setSubmitMessage("")
    }

    return {
        formData,
        prescriptionImage,
        isSubmitting,
        submitStatus,
        submitMessage,
        handleChange,
        updateFromExtractedData,
        handleSubmit,
        resetForm,
        setPrescriptionImage,
    }
}
