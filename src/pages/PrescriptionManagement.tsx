
import PrescriptionManagement from "../components/prescription/PrescriptionManagement.tsx";

const Prescription = () => {

    return (
        <div className="flex flex-col space-y-2">
            {/*<div className="font-bold font-sans text-2xl text-black">Prescription Management</div>*/}
            {/* Header */}

            <div className="p-1 mt-[-20px]">
                <PrescriptionManagement />
            </div>
        </div>
    );
};

export default Prescription;