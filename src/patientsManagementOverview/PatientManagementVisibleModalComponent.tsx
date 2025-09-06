import {useState, useEffect} from 'react';
import {
    generalReportsService,
    type GeneralReportResponse
} from '../services/prescriptions/generalReportGetByPatientId.ts';
import MedicalDiagnosisCard from "./MedicalDiagnosisCard.tsx";
import ReportUploadCard from "./ReportUploadCard.tsx";

// GeneralReports Component
// Implements the UI for the General Reports page based on the provided image.
interface GeneralReportsProps {
    patientId?: any
}

const GeneralReports = ({patientId}: GeneralReportsProps) => {
    console.log(patientId);

    // State for form data
    const [formData, setFormData] = useState({
        heartRate: '',
        bloodPressure: '',
        bodyMassIndex: '',
        bloodSugar: '',
        weight: '',
        height: '',
    });

    // State for general reports data
    const [reports, setReports] = useState<GeneralReportResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch general reports when component mounts or patientId changes
    useEffect(() => {
        if (patientId) {
            fetchGeneralReports();
        }
    }, [patientId]);

    const fetchGeneralReports = async () => {
        if (!patientId) {
            setError('No patient ID provided');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const reportsData = await generalReportsService.getGeneralReports(patientId);
            setReports(reportsData);

            // If there are reports, populate the form with the latest report data
            if (reportsData.length > 0) {
                const latestReport = reportsData[0]; // Get the first (latest) report

                // Populate form fields with the latest report data
                setFormData({
                    heartRate: latestReport.heartRate || '',
                    bloodPressure: latestReport.bloodPressure || '',
                    bodyMassIndex: latestReport.bodyMassIndex || '',
                    bloodSugar: latestReport.bloodSugar || '',
                    weight: latestReport.weight || '',
                    height: latestReport.height || '',
                });

                console.log('Form populated with latest report data:', latestReport);
            } else {
                // Clear form if no reports found
                setFormData({
                    heartRate: '',
                    bloodPressure: '',
                    bodyMassIndex: '',
                    bloodSugar: '',
                    weight: '',
                    height: '',
                });
            }
        } catch (err: any) {
            console.error('Error fetching general reports:', err);
            setError(err.message || 'Failed to load general reports');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
    };

    return (
        <div className="p-6">
            {/* Loading State */}
            {loading && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        <span className="text-blue-700">Loading general reports...</span>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <span className="text-red-500 text-xl mr-2">⚠️</span>
                        <div>
                            <p className="text-red-700 font-medium">Error loading reports</p>
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchGeneralReports}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Reports Summary (if data loaded) */}
            {reports.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center justify-between">
                        <p className="text-green-700 text-sm">
                            Loaded latest report data from {new Date(reports[0].createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-green-600 text-xs">
                            Created by: {reports[0].createdBy.name}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
                {/* Heart Rate */}
                <div
                    className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="heartRate"
                           className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">Heart Rate
                        (HR) :</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="heartRate"
                            name="heartRate"
                            value={formData.heartRate}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder=""
                        />
                        <span className="text-gray-500 text-sm ml-2">bpm</span>
                    </div>
                </div>

                {/* Blood Pressure */}
                <div
                    className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="bloodPressure"
                           className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">Blood
                        Pressure (BP) :</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="bloodPressure"
                            name="bloodPressure"
                            value={formData.bloodPressure}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder=""
                        />
                        <span className="text-gray-500 text-sm ml-2">mmHg</span>
                    </div>
                </div>

                {/* Body Mass Index */}
                <div
                    className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="bodyMassIndex"
                           className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">Body Mass
                        Index (BMI) :</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="bodyMassIndex"
                            name="bodyMassIndex"
                            value={formData.bodyMassIndex}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder=""
                        />
                        <span className="text-gray-500 text-sm ml-2">BMI</span>
                    </div>
                </div>

                {/* Blood Sugar (Glucose) */}
                <div
                    className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="bloodSugar"
                           className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">Blood
                        Sugar (Glucose) :</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="bloodSugar"
                            name="bloodSugar"
                            value={formData.bloodSugar}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder=""
                        />
                        <span className="text-gray-500 text-sm ml-2">mg/dL</span>
                    </div>
                </div>

                {/* Weight */}
                <div
                    className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="weight"
                           className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">Weight
                        :</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="weight"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder=""
                        />
                        <span className="text-gray-500 text-sm ml-2">Kg</span>
                    </div>
                </div>

                {/* Height */}
                <div
                    className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="height"
                           className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">Height
                        :</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="height"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder=""
                        />
                        <span className="text-gray-500 text-sm ml-2">Cm</span>
                    </div>
                </div>
            </div>

            {/* Hidden section to store reports data for potential future use */}
            <div style={{display: 'none'}}>
                {/* Reports data is loaded and available in the 'reports' state */}
                {/* You can access this data through: */}
                {/* reports.map(report => ...) */}
                {/* This section is hidden but reports data is available in component state */}
            </div>
        </div>
    );
};

// Diagnosis Component (Placeholder)
interface DiagnosisProps {
    patientId: string | undefined;
}

const Diagnosis = ({patientId}: DiagnosisProps) => {
    console.log("diagnosis", patientId);
    return (
        <div
            className="p-6 bg-white rounded-b-lg shadow-md border border-gray-200 min-h-[300px] flex items-center justify-center text-gray-500">
            <MedicalDiagnosisCard
                patientId={patientId}
            />
        </div>
    );
};

// LabResults Component (Placeholder)
interface LabResultsProps {
    patientId?: string;
}

const LabResults = ({patientId}: LabResultsProps) => {
    return (
        <div
            className="p-6 bg-white rounded-b-lg shadow-md border  border-gray-200 min-h-[300px] flex items-center justify-center text-gray-500">
            <ReportUploadCard
                patientId={patientId}/>
        </div>
    );
};

interface PatientManagementVisibleModalComponentProps {
    patientId: string | undefined,
    patientPropertyId: string | undefined,
}

export default function PatientManagementVisibleModalComponent({
                                                                   patientId,
                                                                   patientPropertyId
                                                               }: PatientManagementVisibleModalComponentProps) {
    console.log("patient id", patientId);
    console.log("patient property ID", patientPropertyId);
    const [activeTab, setActiveTab] = useState('generalReports'); // State to manage active tab

    const renderContent = () => {
        switch (activeTab) {
            case 'generalReports':
                return <GeneralReports
                    patientId={patientPropertyId}
                />;
            case 'diagnosis':
                return <Diagnosis
                    patientId={patientPropertyId}
                />;
            case 'labResults':
                return <LabResults
                    patientId={patientPropertyId}/>;
            default:
                return <GeneralReports
                    patientId={patientPropertyId}
                />;
        }
    };

    return (
        <div className="min-h-screen h-screen w-full border rounded-sm font-inter">
            <div className="w-full h-full">
                {/* Tab Navigation */}
                <div className="flex bg-white rounded-t-lg">
                    <button
                        className={`px-6 py-3 text-sm font-medium ${
                            activeTab === 'generalReports'
                                ? 'border-b-2 border-teal-600 text-teal-700'
                                : 'text-gray-600 hover:text-gray-800'
                        } focus:outline-none transition-colors duration-200`}
                        onClick={() => setActiveTab('generalReports')}
                    >
                        General Reports
                    </button>
                    <button
                        className={`px-6 py-3 text-sm font-medium ${
                            activeTab === 'diagnosis'
                                ? 'border-b-2 border-teal-600 text-teal-700'
                                : 'text-gray-600 hover:text-gray-800'
                        } focus:outline-none transition-colors duration-200`}
                        onClick={() => setActiveTab('diagnosis')}
                    >
                        Diagnosis
                    </button>
                    <button
                        className={`px-6 py-3 text-sm font-medium ${
                            activeTab === 'labResults'
                                ? 'border-b-2 border-teal-600 text-teal-700'
                                : 'text-gray-600 hover:text-gray-800'
                        } focus:outline-none transition-colors duration-200`}
                        onClick={() => setActiveTab('labResults')}
                    >
                        Lab Results
                    </button>
                    {/* Three dots icon on the right */}
                    <div className="ml-auto p-3 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                             className="lucide lucide-ellipsis">
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="19" cy="12" r="1"/>
                            <circle cx="5" cy="12" r="1"/>
                        </svg>
                    </div>
                </div>

                {/* Content Area based on active tab */}
                {renderContent()}
            </div>
        </div>
    );
}