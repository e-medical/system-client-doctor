import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import DashboardLayout from "../components/layouts/DashboardLayout";
import Appointments from "../pages/Appointments";
import Calender from "../pages/EventManagement.tsx";
import MedicalReports from "../pages/MedicalReports";
import Settings from "../pages/Settings";
import Dashboard from "../pages/Dashboard.tsx";
import PatientsManagementOverview from "../pages/PatientsManagementOverview.tsx";
import PatientsManagement from "../pages/PatientsManagement.tsx";
import PrescriptionManagement from "../pages/PrescriptionManagement.tsx";
import FeedbackPage from "../pages/FeedbackPage.tsx";
import StandardPrescription from "../components/prescription/StandardPrescription.tsx";
import LabTestPrescription from "../components/prescription/LabTestPrescription.tsx";
import CustomPrescription from "../components/prescription/CustomPrescription.tsx";

import NotFoundpage from "../pages/NotFoundPage.tsx";
import Verification from "../utils/Verification.tsx";


export default function AppRoutes() {
    return (
        <Router>
            <Routes>
                {/* Main layout route */}
                Redirect root to verification page
                <Route path="/" element={<Navigate to="/process/security/verification" replace />} />

                {/* Verification page */}
                <Route path="/process/security/verification" element={<Verification />} />
                <Route path="/process/doctor" element={<DashboardLayout />}>
                    <Route path="dashboard" element={<Dashboard />}/>
                    <Route path="appointments" element={<Appointments />} />
                    <Route path="patient-management" element={<PatientsManagementOverview />} />
                    <Route path="patient-management/patient-management-create" element={<PatientsManagement />}/>
                    <Route path="feedback" element={<FeedbackPage />} />
                    <Route path="prescription-management" element={<PrescriptionManagement />} />
                    <Route path="eventManagement" element={<Calender />} />
                    {/*<Route path="special-events" element={<SpecialEvents />} />*/}
                    <Route path="medical-reports" element={<MedicalReports />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="prescription/standard" element={<StandardPrescription />} />
                    <Route path="prescription/lab-test" element={<LabTestPrescription />} />
                    <Route path="prescription/custom" element={<CustomPrescription />} />
                </Route>
                <Route path="*" element={<NotFoundpage />} />
            </Routes>
        </Router>
    );
}
