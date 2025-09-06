const AppointmentsCard = () => {
    return (
        <div className="rounded-[3px] p-2 bg-white sm:p-3 md:p-3 lg:p-3 xl:p-3 flex justify-between items-center w-full h-full border border-gray-200">
            {/* Left Section */}
            <div className="flex flex-col justify-start">
                <h1 className="text-[12px] font-semibold text-black mb-2">Appointments</h1>

                {/* Main patient count */}
                <div className="text-[28px] font-extrabold text-black leading-none">125</div>
                <div className="flex items-center space-x-1 mb-0.5 ml-[50px] ">
                    <span className="text-[10px] text-orange-500 font-medium mt-[-10px]">new</span>
                </div>
            </div>

            {/* Right Section */}
            <div className="flex flex-col items-end mt-[-15px]">
                <span className="text-[10px] font-medium text-primary">Canceled</span>
                <span className="text-[10px] font-medium text-indigo-600 mb-2">scheduled</span>
            </div>
        </div>
    );
};

export default AppointmentsCard;
