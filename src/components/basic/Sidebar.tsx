import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '/assets/logo.png';
import Tooltip from '@mui/material/Tooltip';
import HospitalNameCard from './HospitalNameCard.tsx';
const Sidebar = () => {
    const [isHospitalCardOpen, setIsHospitalCardOpen] = useState(false);

    // const hospitalData = {
    //     hospitalName: "Asiri Hospital",
    //     branchName: "Panadura branch",
    //     phoneNumber: "(+94) 714911257",
    //     email: "asirihospital@gmail.com",
    //     patientName: "W Maduka Avishka",
    //     patientId: "12546789",
    //     patientAvatarUrl: "https://placehold.co/64x64/E5E7EB/6B7280?text=👤"
    // };

    return (
        <div className="top-0 left-0 flex flex-col items-center h-screen bg-secondary text-white w-[40px] py-4 z-[1000] relative">
            <div
                className="relative flex items-center justify-center h-7 mb-3  p-2 hover:bg-transparent focus:ring-primary transition-colors cursor-pointer"
                onMouseEnter={() => setIsHospitalCardOpen(true)}
                onMouseLeave={() => setIsHospitalCardOpen(false)}
            >

                <img src={logo} alt="Logo" className="w-6 h-6 cursor-pointer hover:opacity-80" />


                {isHospitalCardOpen && (
                    <div className="absolute top-0 left-full ml-2 z-[9999]">
                        <HospitalNameCard/>
                    </div>
                )}
            </div>


            {/* Navigation Links */}
            <div className="flex flex-col space-y-6 text-lg">
                <Tooltip title="Dashboard" placement="right" arrow>
                    <NavLink
                        to="/process/doctor/dashboard"
                        className={({ isActive }) =>
                            isActive
                                ? "bg-gray-500 p-1 rounded-sm w-full h-full flex justify-center items-center"
                                : "p-1 w-full h-6 rounded-sm flex justify-center items-center transition-all duration-300"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">dashboard</span>
                    </NavLink>
                </Tooltip>
                <Tooltip title="Appoinment" placement="right" arrow>
                    <NavLink
                        to="/process/doctor/appointments"
                        className={({ isActive }) =>
                            isActive
                                ? "bg-gray-500 p-1 rounded-sm w-full h-full flex justify-center items-center"
                                : "p-1 w-full h-6 rounded-sm flex justify-center items-center transition-all duration-300"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
                    </NavLink>
                </Tooltip>
                <Tooltip title="Patients Management" placement="right" arrow>
                    <NavLink
                        to="/process/doctor/patient-management"
                        className={({ isActive }) =>
                            isActive
                                ? "bg-gray-500 p-1 rounded-sm w-full h-full flex justify-center items-center"
                                : "p-1 w-full h-6 rounded-sm flex justify-center items-center transition-all duration-300"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">patient_list</span>
                    </NavLink>
                </Tooltip>
                <Tooltip title="prescription-management" placement="right" arrow>
                    <NavLink
                        to="/process/doctor/prescription-management"
                        className={({ isActive }) =>
                            isActive
                                ? "bg-gray-500 p-1 rounded-sm w-full h-full flex justify-center items-center"
                                : "p-1 w-full h-6 rounded-sm flex justify-center items-center transition-all duration-300"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">prescriptions</span>
                    </NavLink>
                </Tooltip>
                <Tooltip title="Calender" placement="right" arrow>
                    <NavLink
                        to="/process/doctor/eventManagement"
                        className={({ isActive }) =>
                            isActive
                                ? "bg-gray-500 p-1 rounded-sm w-full h-full flex justify-center items-center"
                                : "p-1 w-full h-6 rounded-sm flex justify-center items-center transition-all duration-300"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">calendar_clock</span>
                    </NavLink>
                </Tooltip>
                <Tooltip title="Feedback" placement="right" arrow>
                    <NavLink
                        to="/process/doctor/feedback"
                        className={({ isActive }) =>
                            isActive
                                ? "bg-gray-500 p-1 rounded-sm w-full h-full flex justify-center items-center"
                                : "p-1 w-full h-6 rounded-sm flex justify-center items-center transition-all duration-300"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">add_reaction</span>
                    </NavLink>
                </Tooltip>

                <Tooltip title="Settings" placement="right" arrow>
                    <NavLink
                        to="/process/doctor/settings"
                        className={({ isActive }) =>
                            isActive
                                ? "bg-gray-500 p-1 rounded-sm w-full h-full flex justify-center items-center"
                                : "p-1 w-full h-6 rounded-sm flex justify-center items-center transition-all duration-300"
                        }
                    >
                        <span className="material-symbols-outlined text-[20px]">manufacturing</span>
                    </NavLink>
                </Tooltip>
            </div>
        </div>
    );
};

export default Sidebar;
