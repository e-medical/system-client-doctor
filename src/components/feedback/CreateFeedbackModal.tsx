import React, { useState, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import { z, ZodError } from "zod";
import {
    addCurrentDoctorTestimonial,
    validateTestimonialMessage,
    getMessageCharacterInfo,
    type TestimonialResponse
} from '../../services/doctorTestermonialService.ts';
import { getAllDoctors, type Doctor } from '../../services/doctorService.ts';
import {
    getCurrentUserDetails,
    type UserDetails
} from '../../services/UserService.ts';
import { getLoggedInUser } from '../../services/authService.ts';

// Zod schema for testimonial validation
const testimonialSchema = z.object({
    feedback: z
        .string()
        .min(1, "Feedback is required")
        .min(10, "Feedback must be at least 10 characters long")
        .max(1000, "Feedback must not exceed 1000 characters")
        .trim(),
    applicationUserId: z
        .string()
        .min(1, "User ID is required")
});

// MUI Alert component
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface CreateFeedbackModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (feedback: string) => void;
}

export default function CreateFeedbackModal({ open, onClose, onCreate }: CreateFeedbackModalProps) {
    const [feedback, setFeedback] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [doctorInfo, setDoctorInfo] = useState<{
        name: string;
        specialty: string;
        hasExistingTestimonial: boolean;
        avatarUrl: string | null;
        userId: string | null;
    }>({
        name: "Loading...",
        specialty: "Loading...",
        hasExistingTestimonial: false,
        avatarUrl: null,
        userId: null
    });
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error"
    });

    useEffect(() => {
        const fetchDoctorAndUserInfo = async () => {
            if (!open) return;

            setLoading(true);
            setError(null);
            try {
                const loggedInUser = getLoggedInUser();
                if (!loggedInUser) {
                    setError('User not logged in');
                    setLoading(false);
                    return;
                }

                const [userDetailsResponse, doctorsResponse] = await Promise.all([
                    getCurrentUserDetails(),
                    getAllDoctors()
                ]);

                if (userDetailsResponse) {
                    setUserDetails(userDetailsResponse);
                }

                if (doctorsResponse.success && doctorsResponse.data) {
                    // Find the doctor profile linked to the logged-in user's ID
                    const currentDoctor = doctorsResponse.data.find(
                        (doctor: Doctor) => (doctor as any).systemUser?.id === loggedInUser.id
                    );

                    if (currentDoctor) {
                        const doctorName = `Dr. ${currentDoctor.firstName || userDetailsResponse?.firstName} ${currentDoctor.lastName || userDetailsResponse?.lastName}`;

                        setDoctorInfo({
                            name: doctorName.trim() !== 'Dr.' ? doctorName : 'Doctor Profile',
                            specialty: currentDoctor.specialization || "General Physician",
                            hasExistingTestimonial: !!currentDoctor.testimonial,
                            // Prioritize user's avatar, then doctor's avatar, then null
                            avatarUrl: userDetailsResponse?.avatarUrl || (currentDoctor as any).avatarUrl || null,
                            userId: loggedInUser.id
                        });

                        if (currentDoctor.testimonial) {
                            setError('You have already submitted a testimonial. Only one testimonial per doctor is allowed.');
                        }
                    } else {
                        setError('Doctor profile not found');
                    }
                } else {
                    setError('Failed to load doctor data');
                }
            } catch (err) {
                console.error('❌ Error fetching doctor/user info:', err);
                setError('Failed to load profile information');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorAndUserInfo();
    }, [open]);

    useEffect(() => {
        if (!open) {
            setFeedback("");
            setError(null);
            setLoading(false);
            setFormErrors({});
            setUserDetails(null);
            setDoctorInfo({
                name: "Loading...",
                specialty: "Loading...",
                hasExistingTestimonial: false,
                avatarUrl: null,
                userId: null
            });
        }
    }, [open]);

    const handleFeedbackChange = (value: string) => {
        setFeedback(value);
        setError(null);

        if (formErrors.feedback) {
            setFormErrors(prev => {
                const { feedback, ...rest } = prev;
                return rest;
            });
        }

        try {
            const validation = validateTestimonialMessage(value);
            if (!validation.isValid && value.length > 0) {
                setFormErrors(prev => ({
                    ...prev,
                    feedback: validation.error || 'Invalid feedback'
                }));
            }
        } catch (error) {
            console.warn('Validation service error:', error);
        }
    };

    const validateForm = (): boolean => {
        try {
            const loggedInUser = getLoggedInUser();
            if (!loggedInUser) {
                setError('User not logged in');
                return false;
            }

            testimonialSchema.parse({
                feedback: feedback,
                applicationUserId: loggedInUser.id
            });

            const feedbackValidation = validateTestimonialMessage(feedback);
            if (!feedbackValidation.isValid) {
                setFormErrors({ feedback: feedbackValidation.error || 'Invalid feedback' });
                return false;
            }

            setFormErrors({});
            return true;

        } catch (error) {
            if (error instanceof ZodError) {
                const newFormErrors: Record<string, string> = {};
                error.issues.forEach((issue) => {
                    const path = issue.path[0];
                    if (typeof path === 'string' && !newFormErrors[path]) {
                        newFormErrors[path] = issue.message;
                    }
                });

                setFormErrors(newFormErrors);
                setSnackbar({
                    open: true,
                    message: "Please fix the errors in the form",
                    severity: "error"
                });
                return false;
            }

            setError('Validation failed');
            return false;
        }
    };

    const handleCreate = async () => {
        if (!validateForm()) return;

        if (doctorInfo.hasExistingTestimonial) {
            setSnackbar({
                open: true,
                message: "You have already submitted a testimonial. Only one testimonial per doctor is allowed.",
                severity: "error"
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const loggedInUser = getLoggedInUser();
            if (!loggedInUser) {
                setSnackbar({
                    open: true,
                    message: "User not logged in",
                    severity: "error"
                });
                setLoading(false);
                return;
            }

            const response: TestimonialResponse = await addCurrentDoctorTestimonial(feedback, loggedInUser.id);

            if (response.success) {
                setSnackbar({
                    open: true,
                    message: "Testimonial submitted successfully!",
                    severity: "success"
                });

                onCreate(feedback);
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                throw new Error(response.message || 'Failed to submit testimonial.');
            }

        } catch (err: any) {
            console.error('❌ Error submitting testimonial:', err);
            let errorMessage = 'Failed to submit feedback. Please try again.';

            if (err.response?.status === 404) {
                errorMessage = 'Doctor profile not found. Please contact support.';
            } else if (err.response?.status === 400) {
                errorMessage = err.response?.data?.message || 'Invalid feedback data. Please check your input.';
            } else if (err.response?.status === 409) {
                errorMessage = 'You have already submitted a testimonial. Only one testimonial per doctor is allowed.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setSnackbar({
                open: true,
                message: errorMessage,
                severity: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const getFallbackAvatar = () => {
        const fName = userDetails?.firstName;
        const lName = userDetails?.lastName;

        if (fName && lName) {
            const initials = `${fName.charAt(0)}${lName.charAt(0)}`.toUpperCase();
            return `https://placehold.co/60x60/E2E8F0/4A5568?text=${initials}`;
        }

        if (doctorInfo.name && !doctorInfo.name.includes("Loading...")) {
            const nameParts = doctorInfo.name.replace('Dr.', '').trim().split(' ');
            const firstInitial = nameParts[0] ? nameParts[0].charAt(0) : '';
            const lastInitial = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '';
            const initials = `${firstInitial}${lastInitial}`.toUpperCase();
            if(initials) return `https://placehold.co/60x60/E2E8F0/4A5568?text=${initials}`;
        }

        return `https://placehold.co/60x60/E2E8F0/4A5568?text=DR`;
    };

    const getCharInfo = () => {
        return getMessageCharacterInfo(feedback);
    };

    const charInfo = getCharInfo();

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-lg w-full max-w-md shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Create Feedback</h2>
                        <button onClick={onClose} className="text-gray-500 text-2xl font-medium">&times;</button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            <img
                                src={doctorInfo.avatarUrl || getFallbackAvatar()}
                                alt={doctorInfo.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = getFallbackAvatar();
                                }}
                            />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-800">{doctorInfo.name}</h3>
                            <p className="text-xs text-gray-500">{doctorInfo.specialty}</p>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="mb-2">
                        <textarea
                            value={feedback}
                            onChange={(e) => handleFeedbackChange(e.target.value)}
                            placeholder="Write your feedback here..."
                            rows={5}
                            disabled={loading || doctorInfo.hasExistingTestimonial}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-secondary/50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        {formErrors.feedback && (
                            <p className="text-red-500 text-xs mt-1">{formErrors.feedback}</p>
                        )}
                    </div>

                    <div className="mb-6 text-right">
                        <span className={`text-xs ${charInfo.isValid ? 'text-gray-500' : 'text-red-500'}`}>
                            {charInfo.current}/{charInfo.max} characters
                            {charInfo.current > 0 && charInfo.current < 10 && (
                                <span className="text-red-500"> (minimum 10 required)</span>
                            )}
                        </span>
                    </div>

                    <div className="flex justify-end mt-6 gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading || !charInfo.isValid || doctorInfo.hasExistingTestimonial}
                            className="px-4 py-2 bg-secondary text-white rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={2000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    variant="filled"
                    elevation={6}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
