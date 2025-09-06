import MapView from "../components/basic/MapView.tsx";
import StatisticsPanel from "../components/basic/StatisticsPanel.tsx";
import PatientAppointments from "../components/dashboard-patient-appoinment/PatientAppointments.tsx";
import PatientDashboardCard from "../components/basic/PatientDashboardCard.tsx";
import AppointmentsCard from "../components/basic/AppointmentsCard.tsx";
import PatientOverviewCard from "../components/basic/PatientOverviewCard.tsx";
import UpcomingSheduleCard from "../components/basic/UpcomingSheduleCard.tsx";
//import UserProfileCard from "../components/UserProfileCard.tsx";
import UpcomingCard from "../components/basic/UpcomingCard.tsx";
import DashboardHeader from "../components/basic/DashboardHeader.tsx";
//import AnalogWatchDemo from "../components/basic/AnalogWatchDemo.tsx";

const Dashboard = () => {
    // A consistent style for all dashboard cards for a uniform and clean look.
    const cardStyle = "bg-white rounded-md shadow-md p-2 transition-all duration-300 ease-in-out hover:shadow-lg";

    return (
        // Main container with a soft background color and more generous padding
        <div className="bg-slate-50 p-2 sm:p-3 min-h-screen">
            <DashboardHeader/>

            {/* Main layout grid with increased gap for better separation */}
            <div className="flex flex-col lg:flex-row gap-6 mt-6">

                {/* Left Column */}
                <div className="w-full lg:w-1/2 flex flex-col gap-6">
                    {/* Row 1: MapView + StatisticsPanel */}
                    <div className="flex h-auto flex-col md:flex-row gap-6">
                        <div className={`w-full flex-1 md:w-3/5 ${cardStyle}`}>
                            <MapView />
                        </div>
                        <div className={`w-full flex-1 md:w-2/5 ${cardStyle}`}>
                            <StatisticsPanel />
                        </div>
                    </div>

                    {/* Row 2: PatientAppointments full width */}
                    <div className={`${cardStyle}`}>
                        <PatientAppointments />
                    </div>
                </div>

                {/* Right Column */}
                <div className="w-full lg:w-1/2 flex flex-col md:flex-row gap-6">
                    {/* Right-Left Section (60%) */}
                    <div className="w-full md:w-[60%] flex flex-col gap-6">

                        <div className={`flex-1 ${cardStyle}`}>
                            <UpcomingSheduleCard />
                        </div>
                    </div>

                    {/* Right-Right Section (40%) */}
                    <div className="w-full md:w-[40%] flex flex-col gap-6">
                        {/*<div className={`flex-1 ${cardStyle}`}>*/}
                        {/* <UserProfileCard />*/}
                        {/*</div>*/}
                        {/*<div className={cardStyle}>*/}
                        {/*    <AnalogWatchDemo/>*/}
                        {/*</div>*/}
                        <div className={cardStyle}>
                            <PatientDashboardCard/>
                        </div>
                        <div className={cardStyle}>
                            <AppointmentsCard/>
                        </div>
                        <div className={cardStyle}>
                            <PatientOverviewCard/>
                        </div>
                        <div className={`flex-1 ${cardStyle}`}>
                            <UpcomingCard/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;