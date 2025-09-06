import MedicalReportsDashboard from "../patientsManagement/MedicalReportsDashboard.tsx";
import PrescriptionDashboard from "../patientsManagement/components/dashboard/PrescriptionDashboard.tsx";
import {useSearchParams} from "react-router-dom";

export default function PatientsManagement() {
    const [searchParams] = useSearchParams();
    const patientNIC = searchParams.get('patientNIC');

    return (
        <div className="min-h-screen w-full p-2 flex flex-col gap-8 ">
            {/* Prescription and Inventory Dashboard */}
            <div>
                <PrescriptionDashboard/>
            </div>

            {/* Medical Reports Dashboard */}
            <div>
                <MedicalReportsDashboard
                    patientNIC={patientNIC}
                />
            </div>
        </div>
    );
}
