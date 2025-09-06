import { useState, useEffect } from 'react';
import { getLoggedInUser } from '../../services/authService.ts';

export default function DashboardHeader() {
    const [greeting, setGreeting] = useState('Morning');
    const [userName, setUserName] = useState('Hasika');

    // Generate time-based greeting
    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 12) {
            return 'Morning';
        } else if (hour >= 12 && hour < 17) {
            return 'Afternoon';
        } else if (hour >= 17 && hour < 21) {
            return 'Evening';
        } else {
            return 'Night';
        }
    };

    // Get user name and set greeting
    useEffect(() => {
        try {
            // Get logged-in user
            const loggedInUser = getLoggedInUser();

            if (loggedInUser) {
                // Use first name if available, otherwise use full name or fallback
                const displayName = loggedInUser.firstName;
                setUserName(displayName);
            }

            // Set time-based greeting
            setGreeting(getTimeBasedGreeting());

            // Update greeting every minute to stay current
            const interval = setInterval(() => {
                setGreeting(getTimeBasedGreeting());
            }, 60000); // Update every minute

            return () => clearInterval(interval);
        } catch (error) {
            console.error('Error getting user info:', error);
            // Keep default values if error occurs
        }
    }, []);

    return (
        <div className="flex items-center justify-between w-full px-1 py-1">
            {/* Left: Greeting */}
            <div>
                <h1 className="text-[20px] font-semibold ">
                    {greeting} {userName}!
                </h1>
                <h3 className="text-sm text-gray-500">
                    Here's what's happening with you Front Desk today.
                </h3>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center space-x-3">
                {[
                    {
                        icon: 'calendar_month',
                        label: 'Last Year',
                    },
                    {
                        icon: 'download',
                        label: 'Export',
                        extraClasses: 'bg-secondary text-white hover:bg-secondary',
                    },
                ].map(({ icon, label, extraClasses = '' }, index) => (
                    <button
                        key={index}
                        className={`flex items-center justify-center gap-1 border px-3.5 py-2.5  text-sm transition ${extraClasses} ${
                            !extraClasses && 'bg-white hover:bg-gray-100'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                        {label}
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
