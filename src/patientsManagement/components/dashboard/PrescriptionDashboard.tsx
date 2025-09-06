"use client"

import { useState, useEffect } from "react"
// Restoring the hook from react-router-dom
import { useSearchParams } from "react-router-dom"
// Restoring your actual components
import AutoCapture from "../capture/AutoCapture"
import PrescriptionForm from "../forms/PrescriptionForm"
//import CustomInventory from "../inventory/CustomInventory"
import type { ExtractedData } from "../../types/prescription"


export default function PrescriptionDashboard() {
    // LOGICAL CHANGE: Renamed state for clarity. This does not affect the UI.
    // 'capture' mode shows the AutoCapture component.
    // 'form' mode shows the PrescriptionForm component.
    const [activeMode, setActiveMode] = useState<"capture" | "form">("capture")
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
    const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null)

    // Restoring the real useSearchParams hook
    const [searchParams] = useSearchParams();

    const doctorId = searchParams.get('doctorId');
    const appointmentId = searchParams.get('appointmentId');
    const patientNIC = searchParams.get('patientNIC');

    useEffect(() => {
        if (doctorId || appointmentId || patientNIC) {
            console.log("Data received in PrescriptionDashboard:");
            console.log("Doctor ID:", doctorId);
            console.log("Appointment ID:", appointmentId);
            console.log("Patient NIC:", patientNIC);
        }
    }, [doctorId, appointmentId, patientNIC]);


    const handleExtractedData = (data: ExtractedData, imageFile?: File) => {
        setExtractedData(data)
        if (imageFile) {
            setPrescriptionImage(imageFile)
        }
        // LOGICAL CHANGE: After data is extracted, switch to the form view.
        setActiveMode("form")
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="flex flex-col lg:flex-row h-screen">

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {/* Header: Mode Switcher - UI is unchanged */}
                    <header className="flex-shrink-0 flex justify-center mb-4">
                        <div className="flex bg-white p-1 rounded-full shadow-md border border-gray-200">
                            <button
                                className={`px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium transition-colors duration-300 ${
                                    activeMode === "capture" ? "bg-blue-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                                }`}
                                // LOGICAL CHANGE: Set mode to 'capture'
                                onClick={() => setActiveMode("capture")}
                            >
                                Auto Capture
                            </button>
                            <button
                                className={`px-4 sm:px-6 py-2 rounded-full text-sm sm:text-base font-medium transition-colors duration-300 ${
                                    activeMode === "form" ? "bg-blue-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-100"
                                }`}
                                // LOGICAL CHANGE: Set mode to 'form'
                                onClick={() => setActiveMode("form")}
                            >
                                Manual Form
                            </button>
                        </div>
                    </header>

                    {/* Content Display */}
                    <div className="flex-1 w-full max-w-7xl mx-auto">
                        {/* LOGICAL CHANGE: Use state to show the correct component. */}
                        {activeMode === "capture" ? (
                            // Using your actual AutoCapture component
                            <AutoCapture
                                onExtractedData={handleExtractedData}
                                doctorId={doctorId}
                                appointmentId={appointmentId}
                                patientNIC={patientNIC}
                            />
                        ) : (
                            // Using your actual PrescriptionForm component
                            <PrescriptionForm
                                autoExtractedData={extractedData || undefined}
                                prescriptionImage={prescriptionImage || undefined}
                                doctorId={doctorId}
                                appointmentId={appointmentId}
                                patientNIC={patientNIC}
                            />
                        )}
                    </div>
                </main>

                {/* Inventory Sidebar: Conditionally rendered and responsive */}
                {/* LOGICAL CHANGE: Show sidebar when the form is active. */}
                {/*{activeMode === "form" && (*/}
                {/*    <aside className="w-full lg:w-1/3 xl:w-1/4 h-1/2 lg:h-full flex-shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 p-4 sm:p-6">*/}
                {/*        /!* Using your actual CustomInventory component *!/*/}
                {/*        <CustomInventory />*/}
                {/*    </aside>*/}
                {/*)}*/}
            </div>
        </div>
    )
}
