import Cookies from 'js-cookie';

// This interface matches the data structure in your component
interface UserPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    emailVerified: boolean;
}

/**
 * Retrieves logged-in user data by checking various cookies and localStorage.
 * This logic is based on your UserProfilePopup component for consistency.
 * @returns {UserPayload | null} The parsed user data or null if not found.
 */
export const getLoggedInUser = (): UserPayload | null => {
    try {
        // Define the possible cookie names to check
        const possibleCookieNames = ['userData', 'user', 'currentUser', 'authUser'];

        for (const cookieName of possibleCookieNames) {
            const cookieValue = Cookies.get(cookieName);
            if (cookieValue) {
                // Decode the cookie value if it's URL-encoded JSON
                const decodedValue = decodeURIComponent(cookieValue);
                const parsedData: UserPayload = JSON.parse(decodedValue);
                return parsedData;
            }
        }

        // If no cookie is found, fall back to checking localStorage
        const localStorageUser = localStorage.getItem('user');
        if (localStorageUser) {
            const parsedData: UserPayload = JSON.parse(localStorageUser);
            return parsedData;
        }

        // If no data is found in either source
        console.warn('No user data found in cookies or localStorage.');
        return null;

    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};
