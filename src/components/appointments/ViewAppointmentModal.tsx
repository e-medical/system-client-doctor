import { type Appointment } from '../../services/appointmentService.ts'; // Import the Appointment type

// Define the props for the modal, now using the correct Appointment type
interface ViewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPatient: Appointment | null; // Use the Appointment type here
}

export default function ViewAppointmentModal({ isOpen, onClose, selectedPatient }: ViewAppointmentModalProps) {
    if (!isOpen || !selectedPatient) return null;

    // Map the API data to a display-friendly format
    const details = [
        { label: "Patient Name", value: selectedPatient.patientName },
        { label: "NIC", value: selectedPatient.patientNIC },
        { label: "Contact Number", value: selectedPatient.patientPhone },
        { label: "Address", value: selectedPatient.patientAddress },
        { label: "Email Address", value: selectedPatient.patientEmail || "N/A" },
        { label: "Channel Number", value: `CN${String(selectedPatient.channelNo).padStart(3, "0")}` },
        { label: "Doctor", value: selectedPatient.doctorName },
        { label: "Schedule Time", value: selectedPatient.appointmentTime },
        { label: "Schedule Date", value: selectedPatient.appointmentDate.split("T")[0] },
        { label: "Channel Fee (LKR)", value: selectedPatient.channelFee.toString() },
        { label: "Age", value: selectedPatient.patientAge.toString() },
        { label: "Status", value: selectedPatient.status },
        { label: "Verified By", value: selectedPatient.createdBy || "N/A" }, // Assuming createdBy is the verifier
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-md w-full max-w-2xl shadow-lg relative">
                <button
                    className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                    type="button"
                    aria-label="Close"
                >
                    &times;
                </button>
                <h2 className="text-xl font-semibold mb-4">Appointment Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[16px]">
                    {details.map(({ label, value }) => (
                        <div key={label}>
                            <label className="block text-gray-700 text-[14px] mb-1">{label}</label>
                            <input
                                type="text"
                                value={value}
                                disabled
                                readOnly
                                className="border border-gray-300 px-3 py-2 rounded w-full text-sm bg-gray-100 cursor-not-allowed"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
