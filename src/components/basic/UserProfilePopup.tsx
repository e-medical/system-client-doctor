import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import {
    getCurrentUserDetails,
    getUserRoles,
    type UserDetails
} from '../../services/UserService.ts';
import { getLoggedInUser } from '../../services/authService.ts';

// Helper function to detect secure protocol
const isSecure = () => window.location.protocol === 'https:';

// Define the user data structure based on your cookie data
interface UserData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    emailVerified: boolean;
    avatarUrl: string;
}

// Define props for the UserProfilePopup component
interface UserProfilePopupProps {
    isOpen: boolean;                  // Controls if the popup is visible
    onClose: () => void;              // Function to call when the popup should close
    onSettingsClick: () => void;
    onLogoutClick: () => void;        // Optional external logout handler
    // Optional: Allow overriding user data (for testing or manual data)
    overrideUserData?: {
        userName?: string;
        userId?: string;
    };
}

const UserProfilePopup: React.FC<UserProfilePopupProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               onLogoutClick,
                                                               overrideUserData,
                                                           }) => {
    const navigate = useNavigate();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [, setUserRolesList] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [fallbackUser, setFallbackUser] = useState<any>(null);

    // Function to get user data from cookies/localStorage
    const getUserDataFromCookies = (): UserData | null => {
        try {
            const possibleCookieNames = ['userData', 'user', 'currentUser', 'authUser'];

            for (const cookieName of possibleCookieNames) {
                const cookieValue = Cookies.get(cookieName);
                if (cookieValue) {
                    console.log(`Found user data in cookie: ${cookieName}`);
                    const decodedValue = decodeURIComponent(cookieValue);
                    const parsedData = JSON.parse(decodedValue);
                    return parsedData;
                }
            }

            const localStorageUser = localStorage.getItem('user');
            if (localStorageUser) {
                console.log('Found user data in localStorage');
                return JSON.parse(localStorageUser);
            }

            console.warn('No user data found in cookies or localStorage');
            return null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    };

    // Load user data when component mounts or when popup opens
    useEffect(() => {
        const fetchUserData = async () => {
            if (!isOpen) return;

            setLoading(true);
            try {
                console.log('🔍 Fetching user details for popup...');

                // Fallback user from auth service
                const loggedInUser = getLoggedInUser();
                setFallbackUser(loggedInUser);

                // Cookie data fallback
                const cookieData = getUserDataFromCookies();
                setUserData(cookieData);

                // Fetch fresh user details via API
                const details = await getCurrentUserDetails();
                if (details) {
                    setUserDetails(details);
                    console.log('✅ User details fetched for popup:', details);
                }

                // Fetch user roles
                const roles = await getUserRoles();
                if (roles && roles.length > 0) {
                    setUserRolesList(roles);
                    console.log('✅ User roles fetched:', roles);
                }

            } catch (error) {
                console.error('❌ Error fetching user data for popup:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isOpen]);

    // If popup is not open, render nothing
    if (!isOpen) {
        return null;
    }

    // Handle clicks outside modal (overlay) to close popup
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Get display name with priority: override > API > cookie > fallback
    const getDisplayName = () => {
        if (overrideUserData?.userName) {
            return overrideUserData.userName;
        }
        if (userDetails) {
            return `${userDetails.firstName} ${userDetails.lastName}`;
        }
        if (userData) {
            return `${userData.firstName} ${userData.lastName}`;
        }
        if (fallbackUser) {
            return `${fallbackUser.firstName || ''} ${fallbackUser.lastName || ''}`.trim() || 'User';
        }
        return 'User Name';
    };

    const getDisplayEmail = () => {
        if (userDetails) {
            return userDetails.userEmail;
        }
        if (userData) {
            return userData.email;
        }
        if (fallbackUser) {
            return fallbackUser.email || fallbackUser.userEmail || '';
        }
        return '';
    };

    // // User roles display string
    // const getUserRolesDisplay = () => {
    //     if (userRolesList && userRolesList.length > 0) {
    //         return userRolesList.join(', ');
    //     }
    //     if (userDetails && userDetails.roles && userDetails.roles.length > 0) {
    //         return userDetails.roles.join(', ');
    //     }
    //     if (userData && userData.roles && userData.roles.length > 0) {
    //         return userData.roles.join(', ');
    //     }
    //     if (fallbackUser && fallbackUser.roles && fallbackUser.roles.length > 0) {
    //         return fallbackUser.roles.join(', ');
    //     }
    //     return '';
    // };

    // Get avatar URL or null for fallback initials
    const getAvatarUrl = () => {
        return (
            userDetails?.avatarUrl ||
            userData?.avatarUrl ||
            fallbackUser?.avatarUrl ||
            fallbackUser?.photo ||
            null
        );
    };

    // Get initials from user name for avatar fallback
    const getUserInitials = () => {
        const firstName = userDetails?.firstName || userData?.firstName || fallbackUser?.firstName || '';
        const lastName = userDetails?.lastName || userData?.lastName || fallbackUser?.lastName || '';

        if (firstName && lastName) {
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        }

        return '👤';
    };

    // Logout handler - clears tokens and navigates to login
    const handleLogout = () => {
        // Remove tokens/cookies/localStorage entries - adjust keys as per your app
        Cookies.remove('authToken', { path: '/', domain: isSecure() ? '.emedi.lk' : undefined });
        Cookies.remove('token');
        Cookies.remove('userData'); // if your app uses any user data cookies
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Call external logout if provided
        if (onLogoutClick) {
            onLogoutClick();
        }

        // Navigate to login page
        navigate('/');

        // Close the popup
        onClose();
    };

    const handleSetting = () =>{
        navigate('/process/doctor/settings');
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-gray-600 bg-opacity-0 flex justify-end items-start z-50 p-4"
            onClick={handleOverlayClick}
        >
            <div
                className="bg-white rounded-lg shadow-xl w-full max-w-xs mt-16 mr-4 transform transition-transform duration-300 ease-out scale-100 opacity-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* User Info Section */}
                <div className="flex items-center p-4 border-b border-gray-200">
                    <div className="flex-shrink-0 w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {loading ? (
                            <div className="w-full h-full bg-gray-300 animate-pulse"></div>
                        ) : getAvatarUrl() ? (
                            <img
                                src={getAvatarUrl()!}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        parent.innerHTML = `
                                            <div class="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                                ${getUserInitials()}
                                            </div>
                                        `;
                                    }
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                {getUserInitials()}
                            </div>
                        )}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                        {loading ? (
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                                <div className="h-3 bg-gray-300 rounded w-2/3 mt-1"></div>
                            </div>
                        ) : (
                            <>
                                <p className="text-lg font-semibold text-gray-800 truncate">
                                    {getDisplayName()}
                                </p>
                                {getDisplayEmail() && (
                                    <p className="text-xs text-gray-400 truncate">{getDisplayEmail()}</p>
                                )}
                                {/*{getUserRolesDisplay() && (*/}
                                {/*    <p className="text-xs text-blue-600 font-medium mt-1">*/}
                                {/*        {getUserRolesDisplay()}*/}
                                {/*    </p>*/}
                                {/*)}*/}
                            </>
                        )}
                    </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                    <button
                        onClick={handleSetting}
                        disabled={loading}
                        className="w-full flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 mr-3 text-teal-600"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.004c.55 0 1.02.398 1.11.94l.17.992c.088.51.48.932.99.992l.992.17c.542.09.94.56.94 1.11v1.004c0 .55-.398 1.02-.94 1.11l-.992.17c-.51.088-.932.48-.992.99l-.17.992c-.09.542-.56.94-1.11.94h-1.004c-.55 0-1.02-.398-1.11-.94l-.17-.992c-.088-.51-.48-.932-.99-.992l-.992-.17c-.542-.09-.94-.56-.94-1.11V12.04c0-.55.398-1.02.94-1.11l.992-.17c.51-.088.932-.48.992-.99l.17-.992z"
                            />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                        Settings
                    </button>

                    <button
                        onClick={handleLogout}
                        disabled={loading}
                        className="w-full flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-6 h-6 mr-3 text-gray-600"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                            />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePopup;
