import Cookies from "js-cookie";

const VITE_AUTH_URL = import.meta.env.VITE_AUTH_URL;

const isSecure = () => window.location.protocol === 'https:';

export const AuthService = {
    getUser() {
        const token = Cookies.get('authToken');
        const userData = Cookies.get('userData');

        if (token && userData) {
            try {
                return JSON.parse(userData);
            } catch (error) {
                console.error("Failed to parse user data", error);
                return null;
            }
        }
        return null;
    },

    isAuthenticated() {
        return !!Cookies.get('authToken') && !!Cookies.get('userData');
    },

    logout(shouldRedirect: boolean = true) {
        Cookies.remove('authToken',{path:'/',domain:isSecure() ? '.emedi.lk' : ''});
        Cookies.remove('userData',{path:'/',domain:isSecure() ? '.emedi.lk' : ''});
        Cookies.set("currentApp", "DOCTOR",{
            path:'/',
            domain:isSecure() ? '.emedi.lk':'',
            secure:isSecure(),
            sameSite:isSecure() ? 'None' : 'Lax',
            expires:90
        });

        if (shouldRedirect) {
            window.location.href = VITE_AUTH_URL;
        }
    }
};