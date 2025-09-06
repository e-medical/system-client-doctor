import PatientsOverview from "../components/appointments/PatientsOverview.tsx";

const Appointments = () => {
  return (
      <div className="flex flex-col pt-4 space-y-2">

        <div className="p-1 mt-[-20px]">
          <PatientsOverview/>
        </div>
      </div>
  );
};

export default Appointments;
