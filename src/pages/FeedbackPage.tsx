import DoctorFeedbackTable from "../components/feedback/DoctorFeedbackTable.tsx";

const FeedbackPage = () => {
  return (
      <div className="flex border border-gray-200 rounded-md flex-col pt-4 space-y-2">

        <div className="p-1 mt-[-20px]">
          <DoctorFeedbackTable/>
        </div>
      </div>
  );
};

export default FeedbackPage;
