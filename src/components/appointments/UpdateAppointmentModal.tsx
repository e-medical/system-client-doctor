import { useEffect, useState } from "react";
import type { Doctor } from "../../services/doctorService.ts";
import Snackbar from "@mui/material/Snackbar";
import { getAllDoctors } from "../../services/doctorService.ts";
import {
    generateChannelNumber,
} from "../../services/appointmentService.ts";
import {
    updateAppointment,
    validateAppointmentUpdateData,
    AppointmentStatus,
    PatientGender,
    type UpdateAppointmentRequest
} from "../../services/updateAppoinment.ts";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import React from "react";
import { z, ZodError } from "zod";

// Zod schema for form validation
const updateAppointmentSchema = z.object({
    patientName: z.string().min(1, "Patient Name is required"),
    patientNIC: z.string().min(1, "Patient NIC is required"),
    patientPhone: z.string().min(1, "Contact Number is required"),
    appointmentDate: z.string().min(1, "Appointment Date is required"),
    appointmentTime: z.string().min(1, "Appointment Time is required"),
    channelFee: z.string().min(1, "Channel Fee is required (select a doctor)"),
    patientEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
    status: z.string().min(1, "Status is required"),
});

// Centralized status color function
const getStatusColor = (status: string) => {
    switch (status) {
        case "SCHEDULED":
            return "bg-[#64DBE1] text-[#056B70]";
        case "CONFIRMED":
            return "bg-blue-200 text-blue-700";
        case "COMPLETED":
            return "bg-green-200 text-green-700";
        case "CANCELLED":
            return "bg-red-200 text-red-700";
        case "NO_SHOW":
            return "bg-yellow-200 text-yellow-700";
        case "IN_PROGRESS":
            return "bg-purple-200 text-purple-700";
        default:
            return "bg-gray-200 text-gray-700";
    }
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface UpdateAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPatient: any;
    onUpdate: (updatedAppointment: any) => void;
}

export default function UpdateAppointmentModal({
                                                   isOpen,
                                                   onClose,
                                                   selectedPatient,
                                                   onUpdate
                                               }: UpdateAppointmentModalProps) {
    const [formData, setFormData] = useState({
        channelFee: "",
        channelNo: "",
        patientName: "",
        patientNIC: "",
        patientGender: "",
        patientAge: "",
        patientPhone: "",
        patientAddress: "",
        patientEmail: "",
        doctor: "",
        appointmentTime: "",
        appointmentDate: "",
        status: "",
        updatedBy: "",
    });

    const [originalChannelNo, setOriginalChannelNo] = useState("");
    const [doctorSuggestions, setDoctorSuggestions] = useState<Doctor[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(false);
    const [snack, setSnack] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

    useEffect(() => {
        if (!isOpen) {
            setFormErrors({});
            return;
        }

        getAllDoctors()
            .then((res) => setDoctors(res.data || []))
            .catch((err) => console.error("Failed to load doctors:", err));
    }, [isOpen]);

    useEffect(() => {
        if (selectedPatient && isOpen) {
            // Format date to yyyy-MM-dd format for HTML date input
            const formatDateForInput = (dateString: string) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            const user = JSON.parse(localStorage.getItem("user") || "{}");
            const fullName =
                user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : "Unknown";

            setFormData({
                patientName: selectedPatient.patientName || "",
                patientNIC: selectedPatient.patientNIC || "",
                patientAge: selectedPatient.patientAge?.toString() || "",
                patientEmail: selectedPatient.patientEmail || "",
                patientPhone: selectedPatient.patientPhone || "",
                patientAddress: selectedPatient.patientAddress || "",
                patientGender: selectedPatient.patientGender || "",
                doctor: selectedPatient.doctorName || "",
                appointmentTime: selectedPatient.appointmentTime || "",
                appointmentDate: formatDateForInput(selectedPatient.appointmentDate || ""),
                status: selectedPatient.status || "",
                channelNo: selectedPatient.channelNo?.toString() || "",
                channelFee: selectedPatient.channelFee?.toString() || "",
                updatedBy: fullName,
            });
            setOriginalChannelNo(selectedPatient.channelNo?.toString() || "");
        }
    }, [selectedPatient, isOpen]);

    useEffect(() => {
        const fetchChannelNumber = async () => {
            const selectedDoctor = doctors.find(
                (d) => d.doctorName === formData.doctor
            );

            if (!selectedDoctor || !formData.appointmentDate) return;

            // Format both dates for proper comparison
            const formatDateForComparison = (dateString: string) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            const originalDate = formatDateForComparison(selectedPatient?.appointmentDate || "");
            const currentDate = formatDateForComparison(formData.appointmentDate);

            // Only generate new channel number if doctor or date changed from original
            const doctorChanged = selectedPatient?.doctorName !== formData.doctor;
            const dateChanged = originalDate !== currentDate;

            if (doctorChanged || dateChanged) {
                try {
                    const generated = await generateChannelNumber(
                        selectedDoctor.propertyId,
                        currentDate
                    );
                    setFormData((prev) => ({ ...prev, channelNo: generated.toString() }));
                } catch (err) {
                    console.error("Failed to generate channel number:", err);
                    // Keep original channel number if generation fails
                    setFormData((prev) => ({ ...prev, channelNo: originalChannelNo }));
                }
            }
        };

        // Also update channel fee when doctor changes
        const selectedDoctor = doctors.find((d) => d.doctorName === formData.doctor);
        if (selectedDoctor && formData.doctor) {
            setFormData((prev) => ({ ...prev, channelFee: selectedDoctor.channelFee.toString() }));
        }

        if (doctors.length > 0 && formData.doctor && formData.appointmentDate) {
            fetchChannelNumber();
        }
    }, [formData.doctor, formData.appointmentDate, doctors, originalChannelNo, selectedPatient]);

    // Add useEffect to handle doctor search filtering
    useEffect(() => {
        if (formData.doctor && formData.doctor.length > 0) {
            const filtered = doctors.filter(doctor =>
                doctor.doctorName.toLowerCase().includes(formData.doctor.toLowerCase()) ||
                doctor.specialization.toLowerCase().includes(formData.doctor.toLowerCase()) ||
                doctor.email.toLowerCase().includes(formData.doctor.toLowerCase())
            );
            setDoctorSuggestions(filtered);
        } else {
            setDoctorSuggestions([]);
        }
    }, [formData.doctor, doctors]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleDoctorSelect = (doctor: Doctor) => {
        setFormData((prev) => ({
            ...prev,
            doctor: doctor.doctorName,
            channelFee: doctor.channelFee.toString(),
        }));
        setDoctorSuggestions([]);
        if (formErrors.doctor || formErrors.channelFee) {
            setFormErrors(prev => ({ ...prev, doctor: undefined, channelFee: undefined }));
        }
    };

    // Helper function to map form status to service enum
    const mapStatusToEnum = (status: string): AppointmentStatus => {
        switch (status) {
            case "SCHEDULED":
                return AppointmentStatus.SCHEDULED;
            case "CONFIRMED":
                return AppointmentStatus.CONFIRMED;
            case "COMPLETED":
                return AppointmentStatus.COMPLETED;
            case "CANCELLED":
                return AppointmentStatus.CANCELLED;
            case "NO_SHOW":
                return AppointmentStatus.NO_SHOW;
            case "IN_PROGRESS":
                return AppointmentStatus.IN_PROGRESS;
            default:
                return AppointmentStatus.SCHEDULED;
        }
    };

    // Helper function to map form gender to service enum
    const mapGenderToEnum = (gender: string): PatientGender | undefined => {
        switch (gender) {
            case "MALE":
                return PatientGender.MALE;
            case "FEMALE":
                return PatientGender.FEMALE;
            case "OTHER":
                return PatientGender.OTHER;
            default:
                return undefined;
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});
        setLoading(true);

        try {
            // Zod validation
            updateAppointmentSchema.parse(formData);

            const selectedDoctor = doctors.find(
                (d) => d.doctorName === formData.doctor
            );

            if (!selectedDoctor) {
                setFormErrors({ doctor: "A valid doctor must be selected." });
                setLoading(false);
                return;
            }

            // Prepare update payload using the appointment update service
            const updatePayload: UpdateAppointmentRequest = {
                patientName: formData.patientName,
                patientNIC: formData.patientNIC,
                patientEmail: formData.patientEmail || undefined,
                patientPhone: formData.patientPhone,
                patientAge: parseInt(formData.patientAge) || undefined,
                patientGender: mapGenderToEnum(formData.patientGender),
                patientAddress: formData.patientAddress || undefined,
                status: mapStatusToEnum(formData.status),
            };

            console.log('🔄 Updating appointment with payload:', updatePayload);

            // Validate using the service validation
            const validation = validateAppointmentUpdateData(updatePayload);
            if (!validation.isValid) {
                console.error('❌ Service validation failed:', validation.errors);
                setSnack({
                    open: true,
                    message: validation.errors[0] || "Validation failed",
                    severity: "error",
                });
                setLoading(false);
                return;
            }

            // Use the appointment update service
            const result = await updateAppointment(
                selectedPatient._id,
                updatePayload
            );

            console.log('✅ Appointment updated successfully:', result);

            const statusColor = getStatusColor(formData.status);

            // Transform the response to match the expected format for the parent component
            const transformedResult = {
                ...result.data,
                // Map backend fields to frontend fields if needed
                name: result.data.patientName,
                nic: result.data.patientNIC,
                email: result.data.patientEmail || 'N/A',
                contact: result.data.patientPhone,
                age: result.data.patientAge?.toString() || 'N/A',
                gender: result.data.patientGender || 'N/A',
                address: result.data.patientAddress || 'N/A',
                doctor: result.data.doctorName,
                time: result.data.appointmentTime,
                date: result.data.appointmentDate,
                fee: `Rs. ${result.data.channelFee?.toLocaleString() || '0'}`,
                statusColor,
                // Keep original structure for compatibility
                patientName: result.data.patientName,
                patientNIC: result.data.patientNIC,
                patientEmail: result.data.patientEmail,
                patientPhone: result.data.patientPhone,
                patientAge: result.data.patientAge,
                patientGender: result.data.patientGender,
                patientAddress: result.data.patientAddress,
                doctorName: result.data.doctorName,
                appointmentTime: result.data.appointmentTime,
                appointmentDate: result.data.appointmentDate,
                channelFee: result.data.channelFee,
                status: result.data.status
            };

            // Call parent update function
            onUpdate(transformedResult);

            // Close modal
            onClose();

            setSnack({
                open: true,
                message: result.message || "Appointment updated successfully.",
                severity: "success",
            });

        } catch (error: any) {
            console.error("❌ Error updating appointment:", error);

            let errorMessage = "Failed to update appointment.";

            if (error instanceof ZodError) {
                const flattenedErrors = error.flatten().fieldErrors;
                setFormErrors(flattenedErrors);
                errorMessage = "Please fix the errors in the form.";
            } else if (error.message) {
                errorMessage = error.message;
            }

            setSnack({
                open: true,
                message: errorMessage,
                severity: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSnackClose = () => {
        setSnack((prev) => ({ ...prev, open: false }));
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 bg-black bg-opacity-30 flex justify-center items-center">
                <div className="bg-white p-6 rounded-md w-full max-w-2xl shadow-lg relative">
                    <button
                        className="absolute top-2 right-2 text-xl"
                        onClick={onClose}
                        type="button"
                        aria-label="Close"
                        disabled={loading}
                    >
                        &times;
                    </button>
                    <h2 className="text-xl font-semibold mb-4">Update Appointment</h2>

                    <form onSubmit={handleUpdate} noValidate>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-[14px] mb-1">
                                Appointment Number
                            </label>
                            <input
                                type="text"
                                value={formData.channelNo}
                                disabled
                                className="border border-gray-300 px-3 py-2 rounded w-auto text-sm bg-gray-100 cursor-not-allowed"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[16px]">
                            {[
                                { label: "Patient Name", name: "patientName" },
                                { label: "NIC", name: "patientNIC" },
                                { label: "Gender", name: "patientGender" },
                                { label: "Age", name: "patientAge" },
                                { label: "Contact Number", name: "patientPhone" },
                                { label: "Address", name: "patientAddress" },
                                { label: "Email Address", name: "patientEmail" },
                            ].map(({ label, name }) => {
                                if (name === "patientGender") {
                                    return (
                                        <div key={name}>
                                            <label className="block text-gray-700 text-[14px] mb-1">
                                                {label}
                                            </label>
                                            <select
                                                name={name}
                                                value={formData[name as keyof typeof formData]}
                                                onChange={handleChange}
                                                disabled={loading}
                                                className={`border border-gray-300 px-3 py-2 rounded w-full text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="MALE">Male</option>
                                                <option value="FEMALE">Female</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={name}>
                                        <label className="block text-gray-700 text-[14px] mb-1">
                                            {label}
                                        </label>
                                        <input
                                            name={name}
                                            value={formData[name as keyof typeof formData]}
                                            onChange={handleChange}
                                            disabled={loading}
                                            className={`border border-gray-300 px-3 py-2 rounded w-full text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                        {formErrors[name] && <p className="text-red-500 text-xs mt-1">{formErrors[name]}</p>}
                                    </div>
                                );
                            })}

                            <div className="relative">
                                <label className="block text-gray-700 text-[14px] mb-1">
                                    Doctor
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-500">
                                        <span className="material-symbols-outlined text-[18px]">
                                            search
                                        </span>
                                    </span>
                                    <input
                                        name="doctor"
                                        value={formData.doctor}
                                        onChange={handleChange}
                                        autoComplete="off"
                                        placeholder="Search Doctor"
                                        disabled={loading}
                                        className={`border border-gray-300 pl-8 pr-3 py-2 rounded w-full text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                {formErrors.doctor && <p className="text-red-500 text-xs mt-1">{formErrors.doctor}</p>}
                                {formData.doctor.length > 0 &&
                                    doctorSuggestions.length > 0 && !loading && (
                                        <ul className="absolute z-10 bg-white border border-gray-300 rounded w-full mt-1 max-h-32 overflow-y-auto text-sm">
                                            {doctorSuggestions.map((doc, index) => (
                                                <li
                                                    key={index}
                                                    className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleDoctorSelect(doc)}
                                                >
                                                    <div className="font-medium">
                                                        {"Dr. " + doc.doctorName}
                                                    </div>
                                                    <div className="text-gray-500 text-xs">
                                                        {doc.specialization} | {doc.email}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                            </div>

                            {[
                                {
                                    label: "Schedule Time",
                                    name: "appointmentTime",
                                    placeholder: "3:40PM",
                                },
                                {
                                    label: "Schedule Date",
                                    name: "appointmentDate",
                                    type: "date",
                                },
                                { label: "Channel Fee (LKR)", name: "channelFee" },
                            ].map(({ label, name, type = "text", placeholder }) => (
                                <div key={name}>
                                    <label className="block text-gray-700 text-[14px] mb-1">
                                        {label}
                                    </label>
                                    <input
                                        name={name}
                                        type={type}
                                        placeholder={placeholder}
                                        value={formData[name as keyof typeof formData] || ""}
                                        onChange={handleChange}
                                        readOnly={name === "channelFee" || name === "appointmentTime" || name === "appointmentDate"}
                                        disabled={loading}
                                        className={`border border-gray-300 px-3 py-2 rounded w-full text-sm ${
                                            name === "channelFee" || name === "appointmentTime" || name === "appointmentDate"
                                                ? "bg-gray-100 cursor-not-allowed"
                                                : loading ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                    />
                                    {formErrors[name] && <p className="text-red-500 text-xs mt-1">{formErrors[name]}</p>}
                                </div>
                            ))}

                            <div>
                                <label className="block text-gray-700 text-[14px] mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className={`border border-gray-300 px-3 py-2 rounded w-full text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select Status</option>
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                    <option value="NO_SHOW">No Show</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                </select>
                                {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
                            </div>

                            <div>
                                <label className="block text-gray-700 text-[14px] mb-1">
                                    Updated By
                                </label>
                                <input
                                    name="updatedBy"
                                    value={formData.updatedBy}
                                    readOnly
                                    className="border border-gray-300 px-3 py-2 rounded w-full text-sm bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className={`border px-4 py-2 rounded hover:bg-gray-100 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`bg-secondary text-white px-4 py-2 rounded ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-secondary-dark'}`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </span>
                                ) : (
                                    'Update'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={handleSnackClose}
            >
                <Alert
                    onClose={handleSnackClose}
                    severity={snack.severity}
                    variant="filled"
                    elevation={6}
                >
                    {snack.message}
                </Alert>
            </Snackbar>
        </>
    );
}