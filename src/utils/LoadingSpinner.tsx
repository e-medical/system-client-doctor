import React from "react";

interface LoadingSpinnerProps {
    message: string;
    theme?: "light" | "dark"; // Optional theme prop
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, theme = "light" }) => {
    const backgroundClass = theme === "light" ? "bg-gray-100" : "bg-black bg-opacity-50";

    return (
        <div className={`flex items-center justify-center min-h-screen ${backgroundClass}`}>
            <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
                <p className="text-lg font-semibold text-gray-700">{message}</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;