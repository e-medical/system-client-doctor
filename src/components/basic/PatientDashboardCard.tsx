const PatientDashboardCard = () => {
    return (
        <div className="rounded-[3px] p-2 bg-white sm:p-3 md:p-3 lg:p-3 xl:p-3 flex justify-between items-center w-full h-full border border-gray-200">
            {/* Left Section */}
            <div className="flex flex-col justify-start">
                <h1 className="text-[13px] font-semibold text-black mb-1">Patients</h1>

                {/* 50+ new on one line */}
                <div className="flex items-center space-x-1 mb-0.5 ml-[50px]">
                    <span className="text-[10px] font-medium text-black">50+</span>
                    <span className="text-[10px] text-orange-500 font-medium">new</span>
                </div>

                {/* Main patient count */}
                <div className="text-[28px] font-extrabold text-black leading-none mt-[-11px] ">125</div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium text-indigo-600">Male</span>
                <span className="text-[10px] font-medium text-pink-500 mb-2">Female</span>
                <button className="bg-blue-100 px-1  text-[10px] rounded-full font-semibold text-black">
                    Patients Visit
                </button>
            </div>
        </div>
    );
};

export default PatientDashboardCard;
