import { Outlet } from 'react-router-dom';
import Sidebar from '../basic/Sidebar.tsx';
import Navbar from '../basic/Navbar.tsx';


const DashboardLayout = () => {
    return (
        <div className="dashboard-layout z-100" style={{display: 'flex', height: '100vh'}}>
            {/* Sidebar Section */}
            <Sidebar/>

            <div className="main-content flex flex-col w-full" style={{flex: 1, overflowY: 'auto'}}>
                {/* Navbar */}
                <div className="border-gray-200 bg-white z-20 pr-2.5 sticky top-0">
                    <Navbar/>
                </div>

                <div className="p-1">
                    <Outlet/>
                </div>
            </div>
        </div>
    );
};
export default DashboardLayout;
