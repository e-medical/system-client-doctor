import { Navigate } from "react-router-dom";
import { AuthService } from "./utils/authService.ts";

interface PrivateRouteProps {
    children: React.ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
    const isAuthenticated = AuthService.isAuthenticated();

    if (!isAuthenticated) {
        return <Navigate to="/verify" replace />;
    }

    return <>{children}</>;
}