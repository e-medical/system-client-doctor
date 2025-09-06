import { useNavigate } from 'react-router-dom';

export default function NotFoundpage() {
    const navigate = useNavigate();
    const currentPath = window.location.pathname;

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
                <div className="text-center max-w-xl">
                    <h1 className="text-7xl sm:text-8xl font-bold font-poppins text-secondary mb-4">404</h1>
                    <h2 className="text-2xl sm:text-3xl font-semibold font-poppins text-gray-800 mb-2">Oops! Page Not Found</h2>
                    <p className="text-gray-600 mb-6 text-sm sm:text-base">
                        The page <span className="font-semibold text-primary font-poppins">{currentPath}</span> you are looking for
                        doesn’t exist or has been moved.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-secondary text-white font-poppins  hover:text-white border border-transparent hover:border-secondary rounded-full px-6 py-3 text-sm sm:text-base transition"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        </>
    );
}