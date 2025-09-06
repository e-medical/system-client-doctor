import {useState} from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import MedicalDiagnosisCard from "./MedicalDiagnosisCard.tsx";
import ReportUploadCard from "./ReportUploadCard.tsx";
import {getPatientByNIC} from "../services/prescriptions/getPatientById.ts";
import {createGeneralReport, CreateGeneralReportRequest} from "../services/prescriptions/generalReportService.ts";

// GeneralReports Component
interface GeneralReportsProps {
    patientNIC?: string;
}

const GeneralReports = ({patientNIC}: GeneralReportsProps) => {
    console.log("patientNIC " + patientNIC);

    const [formData, setFormData] = useState({
        heartRate: '',
        bloodPressure: '',
        bodyMassIndex: '',
        bloodSugar: '',
        weight: '',
        height: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info',
    });

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({...snackbar, open: false});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData((prev) => ({...prev, [name]: value}));
        // Clear messages when user starts typing
        if (error) setError(null);
        if (success) setSuccess(null);
    };

    const handleCancel = () => {
        // Reset form
        setFormData({
            heartRate: '',
            bloodPressure: '',
            bodyMassIndex: '',
            bloodSugar: '',
            weight: '',
            height: '',
        });
        setError(null);
        setSuccess(null);
        showSnackbar('Form cancelled', 'info');
        console.log("Form cancelled");
    };

    const handleCreate = async () => {
        if (!patientNIC) {
            setError('Patient NIC is required');
            showSnackbar('Patient NIC is required', 'error');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // Step 1: Get patient data using NIC
            console.log('Fetching patient data for NIC:', patientNIC);
            showSnackbar('Fetching patient data...', 'info');

            const patientResponse = await getPatientByNIC(patientNIC);

            if (!patientResponse || !patientResponse.patient) {
                throw new Error('Patient not found');
            }

            const patient = patientResponse.patient;
            console.log('Patient found:', patient.patientName);
            showSnackbar(`Patient found: ${patient.patientName}`, 'info');

            // Step 2: Prepare report data
            const reportData: CreateGeneralReportRequest = {
                patientId: patient.propertyId, // Use patient's propertyId
                heartRate: formData.heartRate ? parseFloat(formData.heartRate) : undefined,
                bloodPressure: formData.bloodPressure || undefined,
                bodyMassIndex: formData.bodyMassIndex ? parseFloat(formData.bodyMassIndex) : undefined,
                bloodSugar: formData.bloodSugar ? parseFloat(formData.bloodSugar) : undefined,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                height: formData.height ? parseFloat(formData.height) : undefined,
            };

            // Step 3: Create general report
            console.log('Creating general report with data:', reportData);
            showSnackbar('Creating general report...', 'info');

            const result = await createGeneralReport(reportData);

            console.log('General report created successfully:', result);
            const successMessage = `General report created successfully for ${patient.patientName}!`;
            setSuccess(successMessage);
            showSnackbar(successMessage, 'success');

            // Reset form after successful creation
            setFormData({
                heartRate: '',
                bloodPressure: '',
                bodyMassIndex: '',
                bloodSugar: '',
                weight: '',
                height: '',
            });

        } catch (error: any) {
            console.error('Error creating general report:', error);
            const errorMessage = error.message || 'Failed to create general report';
            setError(errorMessage);
            showSnackbar(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            {/* MUI Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{width: '100%'}}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Error/Success Messages - Keep your existing UI */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">{success}</p>
                </div>
            )}

            {/* Patient Info Display */}
            {patientNIC && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">
                        <strong>Patient NIC:</strong> {patientNIC}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Heart Rate */}
                <div
                    className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="heartRate"
                           className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">Heart Rate
                        (HR) :</label>
                    <div className="flex items-center">
                        <input
                            type="number"
                            id="heartRate"
                            name="heartRate"
                            value={formData.heartRate}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder="Enter heart rate"
                            disabled={isSubmitting}
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
                            placeholder="e.g., 120/80"
                            disabled={isSubmitting}
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
                            type="number"
                            step="0.1"
                            id="bodyMassIndex"
                            name="bodyMassIndex"
                            value={formData.bodyMassIndex}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder="Enter BMI"
                            disabled={isSubmitting}
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
                            type="number"
                            id="bloodSugar"
                            name="bloodSugar"
                            value={formData.bloodSugar}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder="Enter blood sugar"
                            disabled={isSubmitting}
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
                            type="number"
                            step="0.1"
                            id="weight"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder="Enter weight"
                            disabled={isSubmitting}
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
                            type="number"
                            step="0.1"
                            id="height"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-gray-800 text-sm py-1"
                            placeholder="Enter height"
                            disabled={isSubmitting}
                        />
                        <span className="text-gray-500 text-sm ml-2">Cm</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isSubmitting || !patientNIC}
                    className="px-6 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {isSubmitting ? 'Creating...' : 'Create Report'}
                </button>
            </div>
        </div>
    );
};

interface DiagnosisProps {
    patientNIC?: string | undefined
}

const Diagnosis = ({patientNIC}: DiagnosisProps) => {
    return (
        <div
            className="p-6 bg-white rounded-b-lg border-gray-200 min-h-[300px] flex items-center justify-center text-gray-500">
            <MedicalDiagnosisCard  patientNIC={patientNIC || undefined}/>
        </div>
    );
};

interface LabResultsProps {
    patientNIC?: string | undefined
}

const LabResults = ({patientNIC}: LabResultsProps) => {
    console.log("labReport " + patientNIC);
    return (
        <div
            className="p-6 bg-white rounded-b-lg border-gray-200 min-h-[300px] flex items-center justify-center text-gray-500">
            <ReportUploadCard patientNIC={patientNIC || undefined}/>
        </div>
    );
};

// Main MedicalReportsDashboard Component with Tab Navigation
interface MedicalReportsDashboardProps {
    patientNIC?: string | null
}

export default function MedicalReportsDashboard({patientNIC}: MedicalReportsDashboardProps) {
    const [activeTab, setActiveTab] = useState('generalReports');

    const renderContent = () => {
        switch (activeTab) {
            case 'generalReports':
                return <GeneralReports patientNIC={patientNIC || undefined}/>;
            case 'diagnosis':
                return <Diagnosis patientNIC={patientNIC || undefined}/>;
            case 'labResults':
                return <LabResults patientNIC={patientNIC || undefined}/>;
            default:
                return <GeneralReports patientNIC={patientNIC || undefined}/>;
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