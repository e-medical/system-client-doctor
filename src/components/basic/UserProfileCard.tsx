import React from 'react';


const UserProfileCard: React.FC = () => {
    return (
        <div className="bg-white rounded-[3px] p-3 text-center w-full h-full">
            {/* Avatar */}
            <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                    <span role="img" aria-label="avatar">🤩</span>
                </div>
            </div>

            {/* Name */}
            <h2 className="text-[16px] font-semibold text-purple-600">Rayan Silva</h2>

            {/* Age and Location */}
            <p className="text-[10px] text-gray-400 mt-1">
                25 years old <span className="mx-1">|</span>
                <span className="material-symbols-outlined text-[10px]">location_on</span> Colombo, Sri Lanka
            </p>

            {/* Divider */}
            <hr className="my-2 border-gray-200" />

            {/* Medical Stats */}
            <div className="flex justify-around text-xs mt">
                <div>
                    <p className="text-[10px] text-gray-400">Blood</p>
                    <p className="text-[14px] font-bold text-gray-700">O+</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400">Height</p>
                    <p className="text-[14px] font-bold text-gray-700">186cm</p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-400">Weight</p>
                    <p className="text-[14px] font-bold text-gray-700">90kg</p>
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;
