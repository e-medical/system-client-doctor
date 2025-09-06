import { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { generalReportsService, type GeneralReportResponse } from '../../services/prescriptions/generalReportGetByPatientId.ts';
import { updateGeneralReport } from '../../services/prescriptions/generalReportUpdate.ts';
import { deleteGeneralReport } from '../../services/prescriptions/generalReportDelete.ts';
import MedicalDiagnosisCard from "./MedicalDiagnosisCard.tsx";
import ReportUploadCard from "./ReportUploadCard.tsx";

interface SnackbarState {
    open: boolean;
    message: string;
    severity: AlertColor;
}

const GeneralReports = ({ patientId }: { patientId: any }) => {
    console.log("edit general report", patientId);

    const [formData, setFormData] = useState({
        heartRate: '',
        bloodPressure: '',
        bodyMassIndex: '',
        bloodSugar: '',
        weight: '',
        height: '',
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reports, setReports] = useState<GeneralReportResponse[]>([]);
    const [selectedReport, setSelectedReport] = useState<GeneralReportResponse | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Snackbar state
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Helper function to show snackbar
    const showSnackbar = (message: string, severity: AlertColor = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    };

    // Handle snackbar close
    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Fetch general reports when component mounts or patientId changes
    useEffect(() => {
        if (patientId) {
            fetchGeneralReports();
        }
    }, [patientId]);

    const fetchGeneralReports = async () => {
        if (!patientId) {
            setError('Patient ID is required');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log('🔍 Fetching general reports for patient:', patientId);

            const reportsData = await generalReportsService.getGeneralReports(patientId);
            setReports(reportsData);

            console.log('✅ General reports fetched:', reportsData);

            // If reports exist, populate form with the latest report
            if (reportsData && reportsData.length > 0) {
                const latestReport = reportsData[0]; // Assuming first is the latest
                setSelectedReport(latestReport);
                setFormData({
                    heartRate: latestReport.heartRate || '',
                    bloodPressure: latestReport.bloodPressure || '',
                    bodyMassIndex: latestReport.bodyMassIndex || '',
                    bloodSugar: latestReport.bloodSugar || '',
                    weight: latestReport.weight || '',
                    height: latestReport.height || '',
                });
            }

        } catch (err: any) {
            console.error('❌ Error fetching general reports:', err);
            setError(err.message || 'Failed to fetch general reports');
            showSnackbar(err.message || 'Failed to fetch general reports', 'error');
            // Set empty form if fetch fails
            setFormData({
                heartRate: '',
                bloodPressure: '',
                bodyMassIndex: '',
                bloodSugar: '',
                weight: '',
                height: '',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        // Reset form to original data or empty
        if (selectedReport) {
            setFormData({
                heartRate: selectedReport.heartRate || '',
                bloodPressure: selectedReport.bloodPressure || '',
                bodyMassIndex: selectedReport.bodyMassIndex || '',
                bloodSugar: selectedReport.bloodSugar || '',
                weight: selectedReport.weight || '',
                height: selectedReport.height || '',
            });
            showSnackbar('Form reset to original values', 'info');
        } else {
            setFormData({
                heartRate: '',
                bloodPressure: '',
                bodyMassIndex: '',
                bloodSugar: '',
                weight: '',
                height: '',
            });
            showSnackbar('Form cleared', 'info');
        }
        console.log("Form cancelled");
    };

    const handleComplete = async () => {
        if (!selectedReport) {
            console.log("No report selected - create new functionality not implemented yet");
            showSnackbar("Create new report functionality not implemented yet", 'warning');
            return;
        }

        setUpdateLoading(true);
        setError(null);

        try {
            console.log('🔄 Updating report:', selectedReport.id, formData);

            // Call the update service
            const response = await updateGeneralReport(selectedReport.id, {
                heartRate: formData.heartRate || undefined,
                bloodPressure: formData.bloodPressure || undefined,
                bodyMassIndex: formData.bodyMassIndex || undefined,
                bloodSugar: formData.bloodSugar || undefined,
                weight: formData.weight || undefined,
                height: formData.height || undefined,
            });

            console.log('✅ Report updated successfully:', response);

            // Update the reports list with the updated report
            setReports(prev =>
                prev.map(report =>
                    report.id === selectedReport.id
                        ? { ...report, ...response.report, updatedAt: response.report.updatedAt }
                        : report
                )
            );

            // Update the selected report
            setSelectedReport(prev =>
                prev ? { ...prev, ...response.report, updatedAt: response.report.updatedAt } : prev
            );

            // Show success message
            showSnackbar('Report updated successfully!', 'success');

        } catch (err: any) {
            console.error('❌ Error updating report:', err);
            setError(err.message || 'Failed to update report');
            showSnackbar(`Failed to update report: ${err.message || 'Unknown error'}`, 'error');
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleReportSelect = (report: GeneralReportResponse) => {
        setSelectedReport(report);
        setFormData({
            heartRate: report.heartRate || '',
            bloodPressure: report.bloodPressure || '',
            bodyMassIndex: report.bodyMassIndex || '',
            bloodSugar: report.bloodSugar || '',
            weight: report.weight || '',
            height: report.height || '',
        });
        showSnackbar(`Selected report from ${new Date(report.createdAt).toLocaleDateString()}`, 'info');
    };

    const handleDeleteReport = async (report: GeneralReportResponse) => {
        // Confirm deletion
        const confirmMessage = `Are you sure you want to delete the report from ${new Date(report.createdAt).toLocaleDateString()}?\n\nThis action cannot be undone.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setDeleteLoading(report.id);

        try {
            console.log('🗑️ Deleting report:', report.id);

            // Call the delete service
            await deleteGeneralReport(report.id);

            // Remove the report from local state
            setReports(prev => prev.filter(r => r.id !== report.id));

            // If the deleted report was selected, clear selection
            if (selectedReport?.id === report.id) {
                setSelectedReport(null);
                setFormData({
                    heartRate: '',
                    bloodPressure: '',
                    bodyMassIndex: '',
                    bloodSugar: '',
                    weight: '',
                    height: '',
                });
            }

            console.log('✅ Report deleted successfully');
            showSnackbar('Report deleted successfully', 'success');

        } catch (err: any) {
            console.error('❌ Error deleting report:', err);
            showSnackbar(`Failed to delete report: ${err.message || 'Unknown error'}`, 'error');
        } finally {
            setDeleteLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading general reports...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Reports</h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={fetchGeneralReports}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Reports History Section */}
            {reports.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Previous Reports</h3>
                    <div className="space-y-2 mb-4">
                        {reports.map((report, index) => (
                            <div
                                key={report.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                    selectedReport?.id === report.id
                                        ? 'bg-teal-50 border-teal-300'
                                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <button
                                        onClick={() => handleReportSelect(report)}
                                        className="flex-1 text-left"
                                        disabled={updateLoading}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${
                                                    selectedReport?.id === report.id ? 'text-teal-800' : 'text-gray-700'
                                                }`}>
                                                    Report {index + 1} - {new Date(report.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className={`text-xs ${
                                                    selectedReport?.id === report.id ? 'text-teal-600' : 'text-gray-500'
                                                }`}>
                                                    Created by: {report.createdBy?.name || 'Unknown'}
                                                    {report.createdBy?.role && ` (${report.createdBy.role})`}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xs ${
                                                    selectedReport?.id === report.id ? 'text-teal-600' : 'text-gray-500'
                                                }`}>
                                                    Updated: {new Date(report.updatedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDeleteReport(report)}
                                    disabled={deleteLoading === report.id || updateLoading}
                                    className={`ml-3 p-2 rounded-md transition-colors ${
                                        deleteLoading === report.id || updateLoading
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                    }`}
                                    title={deleteLoading === report.id ? 'Deleting...' : `Delete report from ${new Date(report.createdAt).toLocaleDateString()}`}
                                >
                                    {deleteLoading === report.id ? (
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18"></path>
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {/* Heart Rate */}
                <div className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="heartRate" className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">
                        Heart Rate (HR):
                    </label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="heartRate"
                            name="heartRate"
                            value={formData.heartRate}
                            onChange={handleChange}
                            disabled={updateLoading}
                            className={`w-full bg-transparent outline-none text-gray-800 text-sm py-1 ${updateLoading ? 'text-gray-400' : ''}`}
                            placeholder="Enter heart rate"
                        />
                        <span className="text-gray-500 text-sm ml-2">bpm</span>
                    </div>
                </div>

                {/* Blood Pressure */}
                <div className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="bloodPressure" className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">
                        Blood Pressure (BP):
                    </label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="bloodPressure"
                            name="bloodPressure"
                            value={formData.bloodPressure}
                            onChange={handleChange}
                            disabled={updateLoading}
                            className={`w-full bg-transparent outline-none text-gray-800 text-sm py-1 ${updateLoading ? 'text-gray-400' : ''}`}
                            placeholder="e.g., 120/80"
                        />
                        <span className="text-gray-500 text-sm ml-2">mmHg</span>
                    </div>
                </div>

                {/* Body Mass Index */}
                <div className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="bodyMassIndex" className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">
                        Body Mass Index (BMI):
                    </label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="bodyMassIndex"
                            name="bodyMassIndex"
                            value={formData.bodyMassIndex}
                            onChange={handleChange}
                            disabled={updateLoading}
                            className={`w-full bg-transparent outline-none text-gray-800 text-sm py-1 ${updateLoading ? 'text-gray-400' : ''}`}
                            placeholder="e.g., 24.5"
                        />
                        <span className="text-gray-500 text-sm ml-2">BMI</span>
                    </div>
                </div>

                {/* Blood Sugar (Glucose) */}
                <div className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="bloodSugar" className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">
                        Blood Sugar (Glucose):
                    </label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="bloodSugar"
                            name="bloodSugar"
                            value={formData.bloodSugar}
                            onChange={handleChange}
                            disabled={updateLoading}
                            className={`w-full bg-transparent outline-none text-gray-800 text-sm py-1 ${updateLoading ? 'text-gray-400' : ''}`}
                            placeholder="e.g., 95"
                        />
                        <span className="text-gray-500 text-sm ml-2">mg/dL</span>
                    </div>
                </div>

                {/* Weight */}
                <div className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="weight" className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">
                        Weight:
                    </label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="weight"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            disabled={updateLoading}
                            className={`w-full bg-transparent outline-none text-gray-800 text-sm py-1 ${updateLoading ? 'text-gray-400' : ''}`}
                            placeholder="e.g., 70"
                        />
                        <span className="text-gray-500 text-sm ml-2">Kg</span>
                    </div>
                </div>

                {/* Height */}
                <div className="relative border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-secondary">
                    <label htmlFor="height" className="absolute -top-3 left-3 bg-white px-1 text-gray-600 text-xs font-medium">
                        Height:
                    </label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            id="height"
                            name="height"
                            value={formData.height}
                            onChange={handleChange}
                            disabled={updateLoading}
                            className={`w-full bg-transparent outline-none text-gray-800 text-sm py-1 ${updateLoading ? 'text-gray-400' : ''}`}
                            placeholder="e.g., 175"
                        />
                        <span className="text-gray-500 text-sm ml-2">Cm</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8">
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchGeneralReports}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={loading || updateLoading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Reports'}
                    </button>
                    {reports.length > 0 && (
                        <span className="text-sm text-gray-500">
                            {reports.length} report{reports.length !== 1 ? 's' : ''} found
                        </span>
                    )}
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={updateLoading}
                        className={`px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm ${
                            updateLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={updateLoading || !selectedReport}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors shadow-md ${
                            updateLoading || !selectedReport
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                        }`}
                    >
                        {updateLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                            </span>
                        ) : selectedReport ? 'Update Report' : 'Select Report to Edit'}
                    </button>
                </div>
            </div>

            {/* MUI Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

const Diagnosis = ({ patientId }: { patientId: any }) => {
    return (
        <div className="p-6 bg-white rounded-b-lg border-gray-200 min-h-[300px] flex items-center justify-center text-gray-500">
            <MedicalDiagnosisCard patientId={patientId} />
        </div>
    );
};

const LabResults = ({ patientId }: { patientId: any }) => {
    return (
        <div className="p-6 bg-white rounded-b-lg border-gray-200 min-h-[300px] flex items-center justify-center text-gray-500">
            <ReportUploadCard patientId={patientId} />
        </div>
    );
};

// Main MedicalReportsDashboard Component with Tab Navigation
export default function MedicalReportsDashboard({ prescriptionId, patientPropertyId }: any) {
    console.log("medicalReportsDashboard", prescriptionId, patientPropertyId);
    const [activeTab, setActiveTab] = useState('generalReports');
    console.log(prescriptionId);

    const renderContent = () => {
        switch (activeTab) {
            case 'generalReports':
                return <GeneralReports patientId={patientPropertyId} />;
            case 'diagnosis':
                return <Diagnosis patientId={patientPropertyId} />;
            case 'labResults':
                return <LabResults patientId={patientPropertyId} />;
            default:
                return <GeneralReports patientId={patientPropertyId} />;
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