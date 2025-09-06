import { useState, useEffect } from "react";
import type { Doctor } from "../../services/doctorService.ts";
import Snackbar from "@mui/material/Snackbar";
import { getAllDoctors } from "../../services/doctorService.ts";
import {
    createAppointment,
    generateChannelNumber,
    type CreateAppointment,
} from "../../services/createAppointment.ts";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import React from "react";
import { z, ZodError } from "zod";

// Zod schema for form validation
const appointmentSchema = z.object({
    patientName: z.string().min(1, "Patient Name is required"),
    patientNIC: z.string().min(1, "Patient NIC is required"),
    patientPhone: z.string().min(1, "Contact Number is required"),
    appointmentDate: z.string().min(1, "Appointment Date is required"),
    appointmentTime: z.string().min(1, "Appointment Time is required"),
    channelFee: z.string().min(1, "Channel Fee is required (select a doctor)"),
    //doctor: z.string().min(1, "Please select a doctor"),
    patientEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
});


const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function AppointmentModal({ isOpen, onClose, onAdd }: any) {
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
        status: "SCHEDULED",
        createdBy: "",
    });

    const [nextChannel, setNextChannel] = useState("");
    const [doctorSuggestions, setDoctorSuggestions] = useState<Doctor[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
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
        };

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const fullName =
            user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : "Unknown";
        setFormData((prev) => ({ ...prev, createdBy: fullName}));

        getAllDoctors()
            .then((res) => setDoctors(res.data || []))
            .catch((err) => console.error("Failed to load doctors:", err));
    }, [isOpen]);

    useEffect(() => {
        const fetchChannelNumber = async () => {
            const selectedDoctor = doctors.find(
                (d) => d.doctorName === formData.doctor
            );
            if (selectedDoctor && formData.appointmentDate) {
                try {
                    const token = localStorage.getItem("authToken") || "";
                    const date = new Date(formData.appointmentDate)
                        .toISOString()
                        .split("T")[0];
                    const generated = await generateChannelNumber(
                        selectedDoctor.propertyId,
                        date,
                        token
                    );
                    setNextChannel(generated.toString());
                    setFormData((prev) => ({ ...prev, channelNo: generated.toString() }));
                } catch (err) {
                    console.error("Failed to generate channel number:", err);
                    setNextChannel("");
                    setFormData((prev) => ({ ...prev, channelNo: "" }));
                }
            }
        };
        fetchChannelNumber();
    }, [formData.doctor, formData.appointmentDate, doctors]);

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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormErrors({});

        // FIX: Correctly handling Zod validation errors
        try {
            appointmentSchema.parse(formData);
        } catch (error) {
            if (error instanceof ZodError) {
                // Use flatten() to get a simple object of field errors
                const flattenedErrors = error.flatten().fieldErrors;
                setFormErrors(flattenedErrors);
                setSnack({
                    open: true,
                    message: "Please fix the errors in the form.",
                    severity: "error",
                });
                return;
            }
            console.error("An unexpected error occurred during validation:", error);
            return;
        }

        const selectedDoctor = doctors.find(
            (d) => d.doctorName === formData.doctor
        );

        if (!selectedDoctor) {
            setFormErrors({ doctor: "A valid doctor must be selected." });
            return;
        }

        const payload: CreateAppointment = {
            patientName: formData.patientName,
            patientNIC: formData.patientNIC,
            patientEmail: formData.patientEmail || undefined,
            patientPhone: formData.patientPhone,
            patientAge: parseInt(formData.patientAge) || undefined,
            patientGender:
                (formData.patientGender as "MALE" | "FEMALE" | "OTHER") || undefined,
            doctorId: selectedDoctor.propertyId,
            appointmentDate: new Date(formData.appointmentDate)
                .toISOString()
                .split("T")[0],
            appointmentTime: formData.appointmentTime,
            patientAddress: formData.patientAddress,
            duration: 30,
            appointmentType: "CONSULTATION",
            priority: "NORMAL",
            symptoms: "",
            notes: "",
            channelNo: parseInt(formData.channelNo) || 1,
            channelFee: Number(formData.channelFee),
        };

        try {
            const token = localStorage.getItem("authToken") || "";
            const result = await createAppointment(payload, token);
            onAdd(result.data);
            onClose();
            setSnack({
                open: true,
                message: "Appointment created successfully.",
                severity: "success",
            });
        } catch (error) {
            console.error("Error creating appointment:", error);
            setSnack({
                open: true,
                message: "Failed to create appointment.",
                severity: "error",
            });
        }
    };

    const handleSnackClose = () => {
        setSnack((prev) => ({ ...prev, open: false }));
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-md w-full max-w-2xl shadow-lg relative">
                    <button
                        className="absolute top-2 right-2 text-xl"
                        onClick={onClose}
                        type="button"
                        aria-label="Close"
                    >
                        &times;
                    </button>
                    <h2 className="text-xl font-semibold mb-4">Appointment Overview</h2>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-[14px] mb-1">
                                Appointment Number
                            </label>
                            <input
                                type="text"
                                value={nextChannel}
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
                                                className="border border-gray-300 px-3 py-2 rounded w-full text-sm"
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
                                            className="border border-gray-300 px-3 py-2 rounded w-full text-sm"
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
                                        className="border border-gray-300 pl-8 pr-3 py-2 rounded w-full text-sm"
                                    />
                                </div>
                                {formErrors.doctor && <p className="text-red-500 text-xs mt-1">{formErrors.doctor}</p>}
                                {formData.doctor.length > 0 &&
                                    doctorSuggestions.length > 0 && (
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
                                { label: "Status", name: "status" },
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
                                        readOnly={name === "channelFee" || name === "status"}
                                        className={`border border-gray-300 px-3 py-2 rounded w-full text-sm ${
                                            name === "channelFee" || name === "status"
                                                ? "bg-gray-100 cursor-not-allowed"
                                                : ""
                                        }`}
                                    />
                                    {formErrors[name] && <p className="text-red-500 text-xs mt-1">{formErrors[name]}</p>}
                                </div>
                            ))}

                            <div>
                                <label className="block text-gray-700 text-[14px] mb-1">
                                    Verified By
                                </label>
                                <input
                                    name="createdBy"
                                    value={formData.createdBy}
                                    readOnly
                                    className="border border-gray-300 px-3 py-2 rounded w-full text-sm bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="border px-4 py-2 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-secondary text-white px-4 py-2 rounded"
                            >
                                Create
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
