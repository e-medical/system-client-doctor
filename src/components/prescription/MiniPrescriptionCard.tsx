// components/MiniPrescriptionCard.tsx
interface MiniPrescriptionCardProps {
    type: string;
}

const MiniPrescriptionCard: React.FC<MiniPrescriptionCardProps> = ({ type }) => {
    const sampleContent = {
        Standard: "Amoxicillin 500mg — Take twice a day after meals.",
        "Lab Test": "CBC, Liver Function Test, Blood Sugar (FBS)",
        Customized: "Apply ointment to affected area 3x daily.",
    };

    return (
        <div className="text-sm text-gray-700 space-y-1">
            <p className="font-semibold">{type} Prescription</p>
            <p className="text-gray-500">{sampleContent[type as keyof typeof sampleContent]}</p>
        </div>
    );
};

export default MiniPrescriptionCard;
