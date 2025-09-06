import PatientManagementOverviewTable from "../patientsManagementOverview/PatientManagementOverviewTable.tsx";

export default function patientsManagementOverview() {

    return (
        <div className="min-h-screen w-full p-2 flex flex-col gap-8 ">

            <div>
                <PatientManagementOverviewTable />
            </div>
        </div>
    );
}
