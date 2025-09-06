import { useState, type ChangeEvent, useEffect } from "react";
import {
    uploadAvatar,
    validateAvatarFile,
    createImagePreview,
    type AvatarUploadProgress
} from "../../services/avatarService.ts";
import {
    getCurrentUserDetails,
    type UserDetails
} from "../../services/UserService.ts";
import { getLoggedInUser } from "../../services/authService.ts";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert, { AlertProps } from "@mui/material/Alert";
import React from "react";

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function ProfileSection() {
    const [user, setUser] = useState(getLoggedInUser());
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [snack, setSnack] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error" | "warning",
    });

    // Fetch user details including avatar URL
    useEffect(() => {
        const fetchUserDetails = async () => {
            setLoading(true);
            try {
                console.log('🔍 Fetching user details with avatar...');

                const details = await getCurrentUserDetails();

                if (details) {
                    setUserDetails(details);
                    console.log('✅ User details fetched:', details);

                    // Update user state with fresh data
                    const updatedUser = {
                        ...user,
                        firstName: details.firstName,
                        lastName: details.lastName,
                        email: details.userEmail,
                        avatarUrl: details.avatarUrl || null,
                        _id: details._id
                    };

                    // @ts-ignore
                    setUser(updatedUser);

                    // Update localStorage with fresh user data
                    localStorage.setItem('user', JSON.stringify(updatedUser));

                } else {
                    console.warn('⚠️ No user details found');
                }
            } catch (error) {
                console.error('❌ Error fetching user details:', error);
                setSnack({
                    open: true,
                    message: "Failed to load user profile data",
                    severity: "error"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserDetails();
    }, []); // Only fetch on component mount

    // Update avatar preview when user data changes
    useEffect(() => {
        const avatarUrl = userDetails?.avatarUrl;
        const fallbackUrl = `https://placehold.co/100x100/E2E8F0/4A5568?text=${userDetails?.firstName?.[0] || user?.firstName?.[0] || 'A'}`;
        setAvatarPreview(avatarUrl || fallbackUrl);
    }, [userDetails, user]);

    // Resets the preview and opens the modal
    const handleOpenModal = () => {
        const currentAvatar = userDetails?.avatarUrl;
        const fallbackUrl = `https://placehold.co/100x100/E2E8F0/4A5568?text=${userDetails?.firstName?.[0] || user?.firstName?.[0] || 'A'}`;
        setAvatarPreview(currentAvatar || fallbackUrl);
        setSelectedFile(null);
        setUploadProgress(0);
        setIsOpen(true);
    };

    // Sets the new file and updates the preview in the modal
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file using the service
        const validation = validateAvatarFile(file);
        if (!validation.isValid) {
            setSnack({
                open: true,
                message: validation.error || "Invalid file selected",
                severity: "error"
            });
            return;
        }

        setSelectedFile(file);

        // Create preview using the service
        try {
            const previewUrl = await createImagePreview(file);
            setAvatarPreview(previewUrl);
        } catch (error) {
            console.error("Error creating preview:", error);
            setSnack({
                open: true,
                message: "Failed to preview image",
                severity: "error"
            });
        }
    };

    // Handles the "Save" button click, triggering the upload
    const handleSave = async () => {
        if (!selectedFile) {
            setSnack({
                open: true,
                message: "Please select a new photo first.",
                severity: "warning"
            });
            return;
        }

        if (!user?.id) {
            setSnack({
                open: true,
                message: "User ID not found. Please log in again.",
                severity: "error"
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            console.log('🔄 Starting avatar upload...');

            // Get user ID (handle both 'id' and '_id' properties)
            const userId = user.id;

            // Upload progress callback
            const onProgress = (progress: AvatarUploadProgress) => {
                setUploadProgress(progress.percentage);
                console.log(`Upload progress: ${progress.percentage}%`);
            };

            // Call the avatar upload service
            const result = await uploadAvatar(userId, selectedFile, onProgress);

            console.log('✅ Avatar upload successful:', result);

            // Extract the new avatar URL from the response
            const newAvatarUrl = result.data?.avatarUrl;

            if (newAvatarUrl) {
                // Update user data with new avatar URL
                const updatedUser = {
                    ...user,
                    photo: newAvatarUrl,
                    avatarUrl: newAvatarUrl
                };

                // Update userDetails state
                const updatedUserDetails = {
                    ...userDetails!,
                    avatarUrl: newAvatarUrl
                };

                // Update localStorage
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Update states to reflect changes immediately
                setUser(updatedUser);
                setUserDetails(updatedUserDetails);
                setAvatarPreview(newAvatarUrl);

                setSnack({
                    open: true,
                    message: "Profile photo updated successfully!",
                    severity: "success"
                });

                // Close modal after successful upload
                setTimeout(() => {
                    setIsOpen(false);
                }, 1000);
            } else {
                throw new Error('Avatar URL not returned from server');
            }

        } catch (err: any) {
            console.error("❌ Avatar upload failed:", err);

            let errorMessage = "Failed to upload photo. Please try again.";

            // Handle specific error messages
            if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setSnack({
                open: true,
                message: errorMessage,
                severity: "error"
            });

            // Reset preview on error
            const currentAvatar = userDetails?.avatarUrl;
            const fallbackUrl = `https://placehold.co/100x100/E2E8F0/4A5568?text=${userDetails?.firstName?.[0] || user?.firstName?.[0] || 'A'}`;
            setAvatarPreview(currentAvatar || fallbackUrl);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleSnackClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnack(prev => ({ ...prev, open: false }));
    };

    // Get current avatar URL with fallback
    const getCurrentAvatarUrl = () => {
        const avatarUrl = userDetails?.avatarUrl;
        const fallbackUrl = `https://placehold.co/100x100/E2E8F0/4A5568?text=${userDetails?.firstName?.[0] || user?.firstName?.[0] || 'A'}`;
        return avatarUrl || fallbackUrl;
    };

    // Get display name with fallback
    const getDisplayName = () => {
        if (userDetails) {
            return `${userDetails.firstName} ${userDetails.lastName}`;
        }
        return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
    };

    // Get email with fallback
    const getDisplayEmail = () => {
        return userDetails?.userEmail || user?.email || '';
    };

    // Show loading state while fetching user details
    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-between border-b pb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse"></div>
                        <div>
                            <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Profile Display */}
            <div className="flex items-center justify-between border-b pb-10">
                <div className="flex items-center gap-4">
                    <img
                        src={getCurrentAvatarUrl()}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            const fallbackUrl = `https://placehold.co/100x100/E2E8F0/4A5568?text=${userDetails?.firstName?.[0] || user?.firstName?.[0] || 'A'}`;
                            target.src = fallbackUrl;
                        }}
                    />
                    <div>
                        <h2 className="text-lg font-semibold">{getDisplayName()}</h2>
                        <p className="text-sm text-gray-500">{getDisplayEmail()}</p>
                    </div>
                </div>
                <button
                    className="p-2 rounded-full hover:bg-gray-100"
                    onClick={handleOpenModal}
                    aria-label="Edit profile photo"
                    disabled={uploading}
                >
                    <span className="material-symbols-outlined text-lg">edit</span>
                </button>
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-lg">
                        <h1 className="text-lg font-semibold mb-4">Update Profile Photo</h1>

                        <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-lg gap-4 mb-4">
                            <div className="relative">
                                <img
                                    src={avatarPreview}
                                    alt="Preview"
                                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                                    onError={(e) => {
                                        // Fallback to placeholder if preview fails
                                        const target = e.target as HTMLImageElement;
                                        const fallbackUrl = `https://placehold.co/100x100/E2E8F0/4A5568?text=${userDetails?.firstName?.[0] || user?.firstName?.[0] || 'A'}`;
                                        target.src = fallbackUrl;
                                    }}
                                />
                                <label
                                    htmlFor="profile-photo"
                                    className={`absolute -bottom-1 -right-1 cursor-pointer bg-secondary text-white p-1.5 rounded-full ${
                                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                                    title="Change Photo"
                                >
                                    <span className="material-symbols-outlined text-lg">add_a_photo</span>
                                    <input
                                        id="profile-photo"
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                </label>

                                {/* Upload Progress Overlay */}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                        <div className="text-white text-center">
                                            <div className="text-sm font-medium">{uploadProgress}%</div>
                                            <div className="text-xs">Uploading...</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Upload Progress Bar */}
                        {uploading && (
                            <div className="mb-4">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-secondary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setIsOpen(false)}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm bg-secondary text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSave}
                                disabled={uploading || !selectedFile}
                            >
                                {uploading ? 'Uploading...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Snackbar for notifications */}
            <Snackbar
                open={snack.open}
                autoHideDuration={5000}
                onClose={handleSnackClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackClose} severity={snack.severity} sx={{ width: '100%' }}>
                    {snack.message}
                </Alert>
            </Snackbar>
        </div>
    );
}
