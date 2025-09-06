import React, {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import CookieService from "../services/cookie/CookieService.ts";
import LoadingSpinner from "../utils/LoadingSpinner";

const Verification: React.FC = () => {
    const navigate = useNavigate();
    const VITE_AUTH_URL = import.meta.env.VITE_AUTH_URL;

    useEffect(() => {
        const checkToken = async () => {
            const isAuthenticated = !!CookieService.getToken("authToken");
            if (isAuthenticated) {
                navigate("/process/doctor/dashboard", {replace: true});
            } else {
                const cookieDomain = (window.location.hostname.includes('emedi.lk')) ? '.emedi.lk' : '';
                CookieService.remove('authToken', cookieDomain);
                CookieService.remove('userData', cookieDomain);

                CookieService.set('currentApp', 'DOCTOR', cookieDomain, 90);


                window.location.href = VITE_AUTH_URL;


            }
        };

        const timer = setTimeout(checkToken, 2000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return <LoadingSpinner message="Verifying your session..." theme="light"/>;
};

export default Verification;