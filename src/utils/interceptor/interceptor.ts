import api from './axios.ts';
import Cookies from 'js-cookie';
// import { toast } from 'react-toastify'; // Uncomment if using

const isSecure = () => {
    return window.location.protocol === 'https:';
}

export const setupInterceptors = () => {
    // Request interceptor
    api.interceptors.request.use(
        (config) => {
            const token = Cookies.get('authToken');
            if (token) {
                //console.log('Auth token attached:', token);
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.warn('No auth token found in cookies');
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            const status = error.response?.status;

            if (status === 401 || status === 403) {
                Cookies.remove('authToken',{path: '/', domain: isSecure() ? '.emedi.lk' : ''});
                Cookies.remove('userData',{path: '/', domain:isSecure() ? '.emedi.lk' : ''});
                Cookies.set('currentApp', 'DOCTOR',{
                    path: '/',
                    domain: isSecure() ? '.emedi.lk' : '',
                    secure:isSecure(),
                    sameSite:isSecure() ? 'None':"Lax",
                    expires:90
                });
                console.error(status === 401 ? 'Unauthorized' : 'Forbidden access');
                window.location.href = import.meta.env.VITE_AUTH_URL;

            } else if (status === 500) {
                console.error('Server error.');
                // Optionally: toast.error("Internal Server Error");
            } else {
                console.error('API error occurred');
            }

            return Promise.reject(error);
        }
    );
};
// window.location.href = "http://localhost:4200";
