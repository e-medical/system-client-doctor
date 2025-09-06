import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import UserProfilePopup from './UserProfilePopup.tsx'; // Adjust path if necessary
import Cookies from 'js-cookie';
import {
    getCurrentUserDetails,
    type UserDetails
} from '../../services/UserService.ts';
import { getLoggedInUser } from '../../services/authService.ts';

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

const formatPageTitle = (path: string) => {
    const cleaned = path.replace('/', '');
    if (!cleaned) return 'Dashboard';
    return cleaned
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/^\w/, (c) => c.toUpperCase());
};

const Navbar: React.FC = () => {
    const location = useLocation();
    const pageTitle = formatPageTitle(location.pathname);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [fallbackUser, setFallbackUser] = useState<any>(null);

    // Function to get user data from cookies
    const getUserDataFromCookies = (): UserData | null => {
        try {
            // Try to get from different possible cookie names
            const possibleCookieNames = ['userData', 'user', 'currentUser', 'authUser'];

            for (const cookieName of possibleCookieNames) {
                const cookieValue = Cookies.get(cookieName);
                if (cookieValue) {
                    console.log(`Found user data in cookie: ${cookieName}`);
                    // Decode URL-encoded JSON
                    const decodedValue = decodeURIComponent(cookieValue);
                    const parsedData = JSON.parse(decodedValue);
                    return parsedData;
                }
            }

            // If no cookie found, try localStorage as fallback
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

    // Fetch user details using UserService
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            try {
                console.log('🔍 Fetching user details for navbar...');

                // Get logged in user as fallback
                const loggedInUser = getLoggedInUser();
                setFallbackUser(loggedInUser);

                // Get cookie data as additional fallback
                const cookieData = getUserDataFromCookies();
                setUserData(cookieData);

                // Fetch fresh user details from API
                const details = await getCurrentUserDetails();

                if (details) {
                    setUserDetails(details);
                    console.log('✅ User details fetched for navbar:', details);
                } else {
                    console.warn('⚠️ No user details found, using fallback data');
                }
            } catch (error) {
                console.error('❌ Error fetching user details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Get display name with priority: API > Cookie > Auth > Fallback
    const getDisplayName = () => {
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

    // Get email with priority: API > Cookie > Auth > Fallback
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
        return 'user@example.com';
    };

    // Get user ID with priority: API > Cookie > Auth > Fallback
    const getUserId = () => {
        if (userDetails) {
            return userDetails._id;
        }
        if (userData) {
            return userData.id;
        }
        if (fallbackUser) {
            return fallbackUser.id || fallbackUser._id || '';
        }
        return 'User ID';
    };

    // Get avatar with priority: API > Cookie > Auth > Generated placeholder
    const getAvatarUrl = () => {
        const avatarUrl = userDetails?.avatarUrl ||
            userData?.avatarUrl ||
            fallbackUser?.avatarUrl ||
            fallbackUser?.photo;

        if (avatarUrl) {
            return avatarUrl;
        }

        // Generate placeholder with initials if no avatar
        const firstName = userDetails?.firstName || userData?.firstName || fallbackUser?.firstName || '';
        const lastName = userDetails?.lastName || userData?.lastName || fallbackUser?.lastName || '';
        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';

        return `https://placehold.co/36x36/E5E7EB/6B7280?text=${initials}`;
    };

    // Create current user object for popup
    const currentUser = {
        name: getDisplayName(),
        id: getUserId(),
        email: getDisplayEmail(),
        avatarUrl: getAvatarUrl()
    };

    const handleMouseEnter = () => setIsPopupOpen(true);
    const handleMouseLeave = () => setIsPopupOpen(false);

    const handleSettingsClick = () => {
        console.log('Settings clicked!');
        // Add your settings navigation logic here
        // e.g., navigate('/settings');
    };

    const handleLogoutClick = () => {
        console.log('Logging out...');
        // Add your logout logic here
        // e.g., clear cookies, localStorage, and redirect to login
        // Cookies.remove('authToken');
        // Cookies.remove('userData');
        // localStorage.clear();
        // window.location.href = '/login';
    };

    return (
        <div className="px-3 sm:px-5 md:px-8 py-2 sticky top-0 z-40 bg-white shadow-sm w-full">
            {/* Top Row */}
            <div className="flex flex-wrap justify-between items-center gap-3">
                {/* Breadcrumb */}
                <p className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                    Pages / <span className="font-medium text-gray-700">{pageTitle}</span>
                </p>

                {/* Right Icons */}
                <div className="flex items-center space-x-3">
                    {/* Avatar + Info + Popup */}
                    <div
                        className="relative flex items-center space-x-2 cursor-pointer p-1 rounded-md transition duration-200 hover:bg-gray-100"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        {loading ? (
                            // Loading skeleton
                            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
                        ) : (
                            <img
                                src={currentUser.avatarUrl}
                                alt="Avatar"
                                className="w-9 h-9 rounded-full object-cover"
                                onError={(e) => {
                                    // Fallback to default placeholder if image fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://placehold.co/36x36/E5E7EB/6B7280?text=👤';
                                }}
                            />
                        )}

                        <div className="text-xs hidden sm:block leading-tight">
                            {loading ? (
                                // Loading skeleton for text
                                <>
                                    <div className="h-3 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                                    <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                                </>
                            ) : (
                                <>
                                    <p className="font-semibold text-gray-800">{currentUser.name}</p>
                                    <p className="text-gray-500">{currentUser.email}</p>
                                </>
                            )}
                        </div>

                        {isPopupOpen && !loading && (
                            <div className="absolute top-full right-0 mt-2 z-50">
                                <UserProfilePopup
                                    isOpen={isPopupOpen}
                                    onClose={handleMouseLeave}
                                    onSettingsClick={handleSettingsClick}
                                    onLogoutClick={handleLogoutClick}
                                />
                            </div>
                        )}
                    </div>

                    {/* Notification Icon */}
                    <div className="relative cursor-pointer">
                        <NavLink to="/notification" className="relative flex items-center">
                            <span className="material-symbols-outlined text-gray-700 text-[20px]">notifications</span>
                            <span className="absolute -top-1 -right-2 bg-primary text-white text-[9px] rounded-full px-1">
                                13
                            </span>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
