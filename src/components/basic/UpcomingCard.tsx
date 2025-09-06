import { useState, useEffect } from "react";
import { getAllEvents, EventData } from "../../services/EventService.ts"; // Adjust path if needed

// Smooth attractive skeleton loader component
const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3 flex-1">
                <div className="w-10 h-10 bg-secondary/20 rounded-xl flex-shrink-0"></div>
                <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
            <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0"></div>
        </div>
        <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded w-full"></div>
            <div className="h-2 bg-gray-200 rounded w-5/6"></div>
            <div className="h-2 bg-gray-200 rounded w-2/3"></div>
        </div>
    </div>
);

const UpcomingCard = () => {
    // State for managing fetched events, loading, and errors
    const [allEvents, setAllEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State to manage which dropdown menu is currently open
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // State to control the number of visible sessions
    const [visibleCount, setVisibleCount] = useState<number>(10);

    // Fetch data when the component mounts
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await getAllEvents();
                if (response.success) {
                    // Assuming you want to show events from the past.
                    // You might need to add filtering/sorting logic here based on event dates.
                    setAllEvents(response.data);
                } else {
                    setError("Failed to fetch event data.");
                }
            } catch (err) {
                console.error("API Error:", err);
                setError("An error occurred while fetching events.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Toggle menu visibility for a specific event
    const toggleMenu = (id: string) => {
        setOpenMenuId(prevId => (prevId === id ? null : id));
    };

    // Hide a session from the view
    const handleHideSession = (id: string) => {
        setAllEvents(prev => prev.filter(event => event.id !== id));
        setOpenMenuId(null); // Close menu after hiding
    };

    // Handler to show all sessions
    const showAllSessions = () => {
        setVisibleCount(allEvents.length);
    }

    // Department color mapping for visual variety
    const getDepartmentColor = (department: string): string => {
        const colors: { [key: string]: string } = {
            'cardiology': 'bg-red-50 text-red-700 border-red-200',
            'neurology': 'bg-purple-50 text-purple-700 border-purple-200',
            'orthopedics': 'bg-blue-50 text-blue-700 border-blue-200',
            'pediatrics': 'bg-green-50 text-green-700 border-green-200',
            'surgery': 'bg-orange-50 text-orange-700 border-orange-200',
            'emergency': 'bg-red-100 text-red-800 border-red-300',
            'general': 'bg-secondary/10 text-secondary border-secondary/30',
        };
        return colors[department?.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    // Get department icon
    const getDepartmentIcon = (department: string): string => {
        const icons: { [key: string]: string } = {
            'cardiology': '❤️',
            'neurology': '🧠',
            'orthopedics': '🦴',
            'pediatrics': '👶',
            'surgery': '⚕️',
            'emergency': '🚨',
            'general': '🏥',
        };
        return icons[department?.toLowerCase()] || '📋';
    };

    return (
        <div className="bg-white p-2 w-full max-w-md mx-auto">
            {/* Clean Header */}
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center">
                        <span className="text-secondary text-sm">📅</span>
                    </div>
                    <div>
                        <h3 className="text-black text-[14px] font-medium">Recent Events</h3>
                        <p className="text-[10px] text-gray-500">Latest activities</p>
                    </div>
                </div>
                {!loading && (
                    <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-lg text-[10px] font-medium">
                        {allEvents.length}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {/* 1. Loading State */}
                {loading && (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                )}

                {/* 2. Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-red-600 text-sm">⚠️</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-red-800 font-medium text-sm">Error Loading</h4>
                                <p className="text-red-600 text-[10px] mt-1 truncate">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. No Data State */}
                {!loading && !error && allEvents.length === 0 && (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <span className="text-gray-400 text-2xl">📅</span>
                        </div>
                        <p className="text-gray-500 text-sm">No past sessions found.</p>
                    </div>
                )}

                {/* 4. Event Cards with Fixed Overflow */}
                {!loading && !error && allEvents.slice(0, visibleCount).map((session) => (
                    <div
                        key={session.id}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 relative group"
                    >
                        {/* Card Header - Fixed Overflow */}
                        <div className="flex justify-between items-start mb-3 gap-2">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {/* Department Icon */}
                                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm">{getDepartmentIcon(session.department)}</span>
                                </div>

                                {/* Event Title - Fixed Overflow */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-[10px] text-gray-800 mb-1 break-words">
                                        Event: {session.title}
                                    </h4>
                                    <span className={`inline-block px-2 py-1 rounded-lg text-[8px] font-medium border ${getDepartmentColor(session.department)}`}>
                                        {session.department}
                                    </span>
                                </div>
                            </div>

                            {/* More Options Button */}
                            <button
                                onClick={() => toggleMenu(session.id)}
                                className="p-2 hover:bg-secondary/10 rounded-lg transition-colors flex-shrink-0"
                            >
                                <span className="material-icons text-gray-400" style={{ fontSize: '12px' }}>more_horiz</span>
                            </button>
                        </div>

                        {/* Event Details - Fixed Overflow */}
                        <div className="space-y-2 mb-3">
                            {/* Time Information */}
                            <div className="flex items-start space-x-2">
                                <div className="w-5 h-5 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-secondary text-[8px]">🕐</span>
                                </div>
                                <p className="text-gray-600 text-[10px] mb-1 break-words flex-1">
                                    Time: {session.startTime} - {session.endTime}
                                </p>
                            </div>

                            {/* Description - Fixed Overflow */}
                            <div className="flex items-start space-x-2">
                                <div className="w-5 h-5 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-secondary text-[8px]">📝</span>
                                </div>
                                <p className="text-[10px] text-gray-700 mb-1 break-words flex-1 leading-relaxed">
                                    Description: {session.description}
                                </p>
                            </div>

                            {/* Department */}
                            <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-secondary text-[8px]">🏥</span>
                                </div>
                                <p className="text-[10px] text-secondary font-medium break-words flex-1">
                                    Department: {session.department}
                                </p>
                            </div>
                        </div>

                        {/* Dropdown Menu - Fixed Positioning */}
                        {openMenuId === session.id && (
                            <div className="absolute right-2 top-12 z-20">
                                <div className="bg-white border border-gray-200 shadow-lg text-[10px] rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => handleHideSession(session.id)}
                                        className="flex items-center space-x-2 px-3 py-2 hover:bg-secondary/5 w-full text-left text-secondary transition-colors"
                                    >
                                        <span className="text-xs">👁️</span>
                                        <span className="font-medium">Hide</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Show More Button */}
            {!loading && allEvents.length > visibleCount && (
                <div className="mt-4 text-center">
                    <button
                        onClick={showAllSessions}
                        className="inline-flex items-center space-x-2 bg-secondary/10 text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-secondary/20 transition-all duration-200"
                    >
                        <span>Show More</span>
                        <span className="bg-secondary/20 text-secondary px-2 py-0.5 rounded-lg text-xs">
                            +{allEvents.length - visibleCount}
                        </span>
                    </button>
                </div>
            )}

            {/* Footer */}
            {!loading && !error && allEvents.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-500">
                        Showing {Math.min(visibleCount, allEvents.length)} of {allEvents.length} events
                    </p>
                </div>
            )}
        </div>
    );
};

export default UpcomingCard;