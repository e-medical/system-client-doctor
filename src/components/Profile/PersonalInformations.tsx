import {useState, useEffect} from "react";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, {AlertProps} from "@mui/material/Alert";
import React from "react";
import {
    updateUserProfile,
    getCurrentUserDetails,
    type UpdateUserProfilePayload,
    type UserProfileResponse,
} from '../../services/UserService.ts';

// Helper function to format date for input
const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
};

// Basic validation functions
const validateField = (field: string, value: string): string | null => {
    if (!value || !value.trim()) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    switch (field) {
        case 'firstName':
        case 'lastName':
            if (value.trim().length < 2) {
                return `${field === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
            }
            if (value.trim().length > 50) {
                return `${field === 'firstName' ? 'First' : 'Last'} name must not exceed 50 characters`;
            }
            break;
        case 'phone':
            if (!/^\d+$/.test(value.trim())) {
                return "Phone number must contain only digits";
            }
            if (value.trim().length < 10) {
                return "Phone number must be at least 10 digits";
            }
            break;
        case 'gender':
            if (!['MALE', 'FEMALE', 'OTHER'].includes(value)) {
                return "Please select a valid gender";
            }
            break;
    }

    return null;
};

// MUI Alert component
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface EditableFields {
    firstName: boolean;
    lastName: boolean;
    birthday: boolean;
    gender: boolean;
    phone: boolean;
}

interface Profile {
    firstName: string;
    lastName: string;
    birthday: string;
    gender: string;
    phone: string;
    editableFields: EditableFields;
}

interface PersonalInformationsProps {
    profile: any,
    onChange: any,
    autoLoad?: boolean,
    onToggleEdit?: (field: any) => void
}

export default function PersonalInformations({
                                                 profile,
                                                 onChange,
                                                 autoLoad = true,
                                                 onToggleEdit
                                             }: PersonalInformationsProps) {
    console.log(onToggleEdit)
    const [loading, setLoading] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error"
    });
    const [hasChanges, setHasChanges] = useState<boolean>(false);
    const [originalProfile, setOriginalProfile] = useState<Profile | null>(null);
    const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);

    // Manual trigger function
    const loadUserData = async () => {
        setIsLoadingUserData(true);
        try {
            console.log('🔍 Fetching user details...');

            const details = await getCurrentUserDetails();

            if (details) {
                console.log('✅ User details fetched:', details);

                const profileData: Profile = {
                    firstName: details.firstName || '',
                    lastName: details.lastName || '',
                    birthday: details.dob ? details.dob : '',
                    phone: details.contact || '',
                    gender: details.gender || '',
                    editableFields: {
                        firstName: true,
                        lastName: true,
                        birthday: true,
                        gender: true,
                        phone: true
                    }
                };

                // Update profile data via onChange
                Object.entries(profileData).forEach(([key, value]) => {
                    if (key !== 'editableFields') {
                        onChange(key as keyof Profile, value as string);
                    }
                });

                setDataLoaded(true);
                console.log('📝 Profile populated with user data:', profileData);
            } else {
                console.warn('⚠️ No user details found');
                setSnackbar({
                    open: true,
                    message: "Failed to load user profile data",
                    severity: "error"
                });
            }
        } catch (error) {
            console.error('❌ Error fetching user details:', error);
            setSnackbar({
                open: true,
                message: "Error loading profile data",
                severity: "error"
            });
        } finally {
            setIsLoadingUserData(false);
        }
    };

    // Auto-load effect (only runs if autoLoad is true)
    useEffect(() => {
        if (autoLoad && !dataLoaded) {
            loadUserData();
        }
    }, [autoLoad, dataLoaded]);

    // Store original profile data for comparison
    useEffect(() => {
        if (profile && !originalProfile && !isLoadingUserData && dataLoaded) {
            setOriginalProfile({...profile});
            console.log('💾 Original profile stored for comparison:', profile);
        }
    }, [profile, originalProfile, isLoadingUserData, dataLoaded]);

    // Check if there are any changes
    useEffect(() => {
        if (originalProfile && profile) {
            const changed =
                profile.firstName !== originalProfile.firstName ||
                profile.lastName !== originalProfile.lastName ||
                profile.birthday !== originalProfile.birthday ||
                profile.phone !== originalProfile.phone ||
                profile.gender !== originalProfile.gender;

            setHasChanges(changed);
        }
    }, [profile, originalProfile]);

    const handleFieldChange = (field: string, value: string) => {
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
            });
        }

        onChange(field as keyof Profile, value);
    };

    const validateAllFields = (): boolean => {
        if (!profile) return false;

        const errors: Record<string, string> = {};
        const fields = ['firstName', 'lastName', 'birthday', 'phone', 'gender'];
        let hasErrors = false;

        fields.forEach(field => {
            const value = (profile as any)[field] || '';
            const error = validateField(field, value);
            if (error) {
                errors[field] = error;
                hasErrors = true;
            }
        });

        if (hasErrors) {
            setFormErrors(errors);
            setSnackbar({
                open: true,
                message: "Please fix all validation errors before saving",
                severity: "error"
            });
            return false;
        }

        setFormErrors({});
        return true;
    };

    const handleFieldValidation = (field: string, value: string): void => {
        const error = validateField(field, value);

        if (error) {
            setFormErrors(prev => ({...prev, [field]: error}));
        } else {
            setFormErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const isFormComplete = (): boolean => {
        return !!(
            profile?.firstName?.trim() &&
            profile?.lastName?.trim() &&
            profile?.birthday?.trim() &&
            profile?.phone?.trim() &&
            profile?.gender?.trim()
        );
    };

    const isSaveEnabled = (): boolean => {
        return isFormComplete() && hasChanges && !loading;
    };

    const handleSaveChanges = async () => {
        if (!profile) {
            setSnackbar({
                open: true,
                message: "Profile data is missing",
                severity: "error"
            });
            return;
        }

        if (!validateAllFields()) {
            return;
        }

        setLoading(true);

        try {
            const updatePayload: UpdateUserProfilePayload = {
                firstName: profile.firstName?.trim() || '',
                lastName: profile.lastName?.trim() || '',
                dob: profile.birthday || '',
                contact: profile.phone?.trim() || '',
                gender: (profile.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'OTHER'
            };

            console.log('🔄 Updating profile with payload:', updatePayload);

            const response: UserProfileResponse = await updateUserProfile(updatePayload);

            setSnackbar({
                open: true,
                message: "Profile updated successfully!",
                severity: "success"
            });

            setOriginalProfile({...profile});
            setHasChanges(false);

            console.log('✅ Profile updated successfully:', response.user);

        } catch (error) {
            console.error('❌ Error updating profile:', error);

            if (error instanceof Error) {
                setSnackbar({
                    open: true,
                    message: error.message,
                    severity: "error"
                });
            } else {
                setSnackbar({
                    open: true,
                    message: "Failed to update profile. Please try again.",
                    severity: "error"
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFieldBlur = (field: string, value: string) => {
        if (value.trim()) {
            handleFieldValidation(field, value);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({...prev, open: false}));
    };

    const fieldLabels: Record<string, string> = {
        firstName: "First Name",
        lastName: "Last Name",
        birthday: "Birthday",
        phone: "Phone Number",
        gender: "Gender",
    };

    const profileFields = {
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        birthday: formatDateForInput(profile?.birthday || ''),
        phone: profile?.phone || '',
        gender: profile?.gender || '',
    };

    // Show different loading states based on configuration
    if ((!autoLoad && !dataLoaded) || (autoLoad && isLoadingUserData && !dataLoaded)) {
        return (
            <div className="p-4 text-center">
                {!autoLoad && !dataLoaded ? (
                    // Manual load state
                    <div className="space-y-4">
                        <p className="text-gray-600">Click to load your profile data</p>
                        <button
                            onClick={loadUserData}
                            disabled={isLoadingUserData}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isLoadingUserData ? (
                                <span className="flex items-center">
                                    <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                                    Loading...
                                </span>
                            ) : (
                                'Load Profile Data'
                            )}
                        </button>
                    </div>
                ) : (
                    // Auto-load loading state
                    <div className="text-gray-500">
                        <div className="flex items-center justify-center space-x-2">
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                            <p>Loading profile data...</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div>
                {/* Refresh Data Button (always available after initial load) */}
                {dataLoaded && (
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Personal Information</h3>
                        <button
                            onClick={loadUserData}
                            disabled={isLoadingUserData}
                            className="px-4 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                            {isLoadingUserData ? (
                                <span className="flex items-center">
                                    <span className="material-symbols-outlined animate-spin mr-1 text-sm">refresh</span>
                                    Refreshing...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <span className="material-symbols-outlined mr-1 text-sm">refresh</span>
                                    Refresh Data
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 border-b pb-10 sm:grid-cols-2 gap-4">
                    {Object.entries(profileFields).map(([key, value]) => (
                        <div className="flex flex-col" key={key}>
                            <label className="text-sm font-medium mb-1">
                                {fieldLabels[key]}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="flex items-center border rounded px-2">
                                {key === "gender" ? (
                                    <select
                                        className="w-full py-2 outline-none bg-transparent"
                                        value={value}
                                        onChange={(e) => handleFieldChange(key, e.target.value)}
                                        onBlur={(e) => handleFieldBlur(key, e.target.value)}
                                        disabled={loading}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="MALE">Male</option>
                                        <option value="FEMALE">Female</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                ) : (
                                    <input
                                        type={key === "birthday" ? "date" : "text"}
                                        className="w-full py-2 outline-none bg-transparent"
                                        value={key === "birthday" ? formatDateForInput(value) : value}
                                        onChange={(e) => handleFieldChange(key, e.target.value)}
                                        onBlur={(e) => handleFieldBlur(key, e.target.value)}
                                        disabled={loading}
                                        required
                                        placeholder={
                                            key === "firstName" ? "Enter first name" :
                                                key === "lastName" ? "Enter last name" :
                                                    key === "phone" ? "Enter phone number" : ""
                                        }
                                    />
                                )}
                                {loading && (
                                    <span className="material-symbols-outlined text-gray-400 animate-spin text-sm">
                                        refresh
                                    </span>
                                )}
                            </div>
                            {formErrors[key] && (
                                <p className="text-red-500 text-xs mt-1">{formErrors[key]}</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Save Changes Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveChanges}
                        disabled={!isSaveEnabled()}
                        className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                            isSaveEnabled()
                                ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-md hover:shadow-lg transform hover:scale-105'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <span className="material-symbols-outlined animate-spin mr-2 text-sm">
                                    refresh
                                </span>
                                Saving...
                            </span>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>

                {/* Form Status Indicators */}
                <div className="mt-2 text-center">
                    {!isFormComplete() && (
                        <p className="text-red-500 text-sm">
                            Please fill in all required fields to enable saving
                        </p>
                    )}

                    {isFormComplete() && !hasChanges && (
                        <p className="text-gray-500 text-sm">
                            No changes to save
                        </p>
                    )}

                    {isFormComplete() && hasChanges && !loading && (
                        <p className="text-teal-600 text-sm">
                            Changes detected - click "Save Changes" to update your profile
                        </p>
                    )}
                </div>
            </div>

            {/* MUI Snackbar for Success/Error Messages */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleSnackbarClose}
                anchorOrigin={{vertical: 'top', horizontal: 'right'}}
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