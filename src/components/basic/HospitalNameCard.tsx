import React, { useEffect, useState } from 'react';
import { getCurrentUserDetails } from '../../services/UserService';
import { getHospitalDetails } from '../../services/hospitals/hospitalGetById.ts';
import type { UserDetails } from '../../services/UserService';
import type { HospitalDetails } from '../../services/hospitals/hospitalGetById.ts';

const HospitalNameCard: React.FC = () => {
    const [user, setUser] = useState<UserDetails | null>(null);
    const [hospital, setHospital] = useState<HospitalDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await getCurrentUserDetails();
                if (userData) {
                    setUser(userData);
                    const hospitalData = await getHospitalDetails(userData.hospital);
                    if (hospitalData) {
                        setHospital(hospitalData);
                    }
                }
            } catch (error) {
                console.error('Error fetching hospital or user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="text-gray-500">Loading...</div>;
    }

    if (!user || !hospital) {
        return <div className="text-red-500">Failed to load data</div>;
    }

    return (
        <div className="bg-white border border-gray-300 rounded-lg rounded-tl-none mt-4 shadow-lg p-4 w-[350px] z-1000">
            {/* Hospital Info */}
            <div className="mb-3 border-b pb-2">
                <div className="flex justify-between items-start">
                    <h2 className="text-base font-bold text-gray-800">{hospital.businessName}</h2>
                    <span className="text-xs font-semibold text-teal-600">{hospital.address}</span>
                </div>
                <div className="text-sm text-gray-600 flex justify-between">
                    <p>{hospital.adminContact}</p>
                    <a href={`mailto:${hospital.adminEmail}`} className="text-blue-600 hover:underline">{hospital.adminEmail}</a>
                </div>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {user.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt="User Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = "https://placehold.co/64x64/E5E7EB/6B7280?text=👤";
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">👤</div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">{`${user.firstName} ${user.lastName}`}</p>
                    <p className="text-xs text-gray-500">{user.userEmail}</p>
                </div>
            </div>
        </div>
    );
};

export default HospitalNameCard;
