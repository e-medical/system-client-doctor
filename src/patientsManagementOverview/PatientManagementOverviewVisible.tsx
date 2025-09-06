import {useState, useEffect} from "react";
import PatientManagementVisibleModalComponent from "./PatientManagementVisibleModalComponent.tsx";
import {prescriptionService, type PrescriptionResponse} from "../services/prescriptions/prescriptionById.ts";

interface PatientManagementOverviewModalProps {
    open: boolean,
    onClose: () => void,
    prescriptionId: string | undefined,
    patientPropertyId: string | undefined,
}

export default function PatientManagementOverviewModal({
                                                           open,
                                                           onClose,
                                                           prescriptionId,
                                                           patientPropertyId
                                                       }: PatientManagementOverviewModalProps) {

    console.log("patient property ID", patientPropertyId);
    const [prescription, setPrescription] = useState<PrescriptionResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setShowPDF] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    // Fetch prescription data when modal opens
    useEffect(() => {
        if (open && prescriptionId) {
            fetchPrescription();
        } else if (open && !prescriptionId) {
            setError('No prescription ID provided');
        } else {
            // Reset state when modal closes
            setPrescription(null);
            setError(null);
            setShowPDF(false);
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
        }
    }, [open, prescriptionId]);

    const fetchPrescription = async () => {
        if (!prescriptionId) {
            setError('No prescription ID provided');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const prescriptionData = await prescriptionService.getPrescriptionById(prescriptionId);
            setPrescription(prescriptionData);
        } catch (err: any) {
            console.error('Error fetching prescription:', err);
            setError(err.message || 'Failed to load prescription');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to determine if URL is a PDF
// Helper function to get file extension
    const getFileExtension = (url: string): string => {
        return url.split('.').pop()?.toLowerCase() || '';
    };

    // Helper function to determine file type
    const getFileType = (url: string): 'pdf' | 'image' | 'unknown' => {
        const extension = getFileExtension(url);
        if (extension === 'pdf' || url.toLowerCase().includes('pdf')) {
            return 'pdf';
        }
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension)) {
            return 'image';
        }
        return 'unknown';
    };

    const handleDownloadFile = (url: string, filename: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        link.click();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Prescription Overview</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                        disabled={loading}
                    >
                        ✕
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">Loading prescription...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                            <span className="text-red-500 text-xl mr-2">⚠️</span>
                            <div>
                                <p className="text-red-700 font-medium">Error loading prescription</p>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchPrescription}
                            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Prescription Content */}
                {prescription && !loading && (
                    <>
                        {/* Prescription Header Info */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Issued Date:</span>
                                    <p className="text-gray-900">{new Date(prescription.issuedDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Expiry Date:</span>
                                    <p className="text-gray-900">{new Date(prescription.expiryDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        prescription.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}>
                                        {prescription.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Created By:</span>
                                    <p className="text-gray-900">{prescription.createdBy?.firstName} {prescription.createdBy?.lastName}</p>
                                </div>
                                {prescription.patientInfo?.dateOfVisit && (
                                    <div>
                                        <span className="font-medium text-gray-700">Date of Visit:</span>
                                        <p className="text-gray-900">{new Date(prescription.patientInfo.dateOfVisit).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Prescription Document (PDF or Image) */}
                        {prescription.prescriptionImageUrl && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                    Prescription Document
                                    <span className="ml-2 text-sm font-normal text-gray-600">
                                        ({getFileType(prescription.prescriptionImageUrl).toUpperCase()})
                                    </span>
                                </h3>
                                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                                        {getFileType(prescription.prescriptionImageUrl) === 'pdf' ? (
                                            // PDF Display
                                            <div className="w-full">
                                                <iframe
                                                    src={prescription.prescriptionImageUrl}
                                                    className="w-full h-96 border-0"
                                                    title="Prescription PDF"
                                                    onError={(e) => {
                                                        console.error('Failed to load prescription PDF');
                                                        // Fallback: show download link if iframe fails
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'block';
                                                    }}
                                                />
                                                {/* Fallback for PDF loading issues */}
                                                <div className="hidden p-8 text-center bg-gray-100">
                                                    <div className="text-4xl text-gray-400 mb-2">📄</div>
                                                    <p className="text-gray-600 mb-4">Unable to display PDF in browser</p>
                                                    <button
                                                        onClick={() => window.open(prescription.prescriptionImageUrl, '_blank')}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Open PDF in New Tab
                                                    </button>
                                                </div>
                                            </div>
                                        ) : getFileType(prescription.prescriptionImageUrl) === 'image' ? (
                                            // Image Display
                                            <img
                                                src={prescription.prescriptionImageUrl}
                                                alt="Prescription"
                                                className="w-full h-auto max-h-96 object-contain"
                                                onError={(e) => {
                                                    console.error('Failed to load prescription image');
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                    if (fallback) fallback.style.display = 'block';
                                                }}
                                            />
                                        ) : (
                                            // Unknown file type
                                            <div className="p-8 text-center bg-gray-100">
                                                <div className="text-4xl text-gray-400 mb-2">📎</div>
                                                <p className="text-gray-600 mb-4">Unsupported file format</p>
                                                <button
                                                    onClick={() => window.open(prescription.prescriptionImageUrl, '_blank')}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                >
                                                    Open File
                                                </button>
                                            </div>
                                        )}

                                        {/* Error fallback (hidden by default) */}
                                        <div className="hidden p-8 text-center bg-gray-100">
                                            <div className="text-4xl text-gray-400 mb-2">⚠️</div>
                                            <p className="text-gray-600 mb-4">Failed to load prescription document</p>
                                            <button
                                                onClick={() => window.open(prescription.prescriptionImageUrl, '_blank')}
                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Try Opening in New Tab
                                            </button>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-3 flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => window.open(prescription.prescriptionImageUrl, '_blank')}
                                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            View Full Size
                                        </button>
                                        <button
                                            onClick={() => {
                                                const fileType = getFileType(prescription.prescriptionImageUrl!);
                                                const extension = fileType === 'pdf' ? 'pdf' : 'png';
                                                handleDownloadFile(
                                                    prescription.prescriptionImageUrl!,
                                                    `prescription_${prescription._id}.${extension}`
                                                );
                                            }}
                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download {getFileType(prescription.prescriptionImageUrl).toUpperCase()}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Medications List */}
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Medications</h3>
                            {prescription.medications && prescription.medications.length > 0 ? (
                                <div className="space-y-3">
                                    {prescription.medications.map((medication, index) => (
                                        <div key={medication._id || index}
                                             className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                            <div
                                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-700">Medication:</span>
                                                    <p className="text-gray-900">{medication.medicationName}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Dosage:</span>
                                                    <p className="text-gray-900">{medication.dosage}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Frequency:</span>
                                                    <p className="text-gray-900">{medication.frequency}</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Duration:</span>
                                                    <p className="text-gray-900">{medication.duration}</p>
                                                </div>
                                            </div>
                                            {medication.instructions && (
                                                <div className="mt-2">
                                                    <span className="font-medium text-gray-700">Instructions:</span>
                                                    <p className="text-gray-900 text-sm">{medication.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-50 rounded-md text-center text-gray-500">
                                    No medications listed
                                </div>
                            )}
                        </div>

                        {/* Clinical Information */}
                        {prescription.clinicalInfo && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Clinical Information</h3>
                                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                    <h4 className="font-medium text-gray-700 mb-2">Past Medical History:</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.clinicalInfo.pastMedicalHistory.diabetes ? 'bg-red-500' : 'bg-green-500'
                                            }`}></span>
                                            Diabetes: {prescription.clinicalInfo.pastMedicalHistory.diabetes ? 'Yes' : 'No'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.clinicalInfo.pastMedicalHistory.hypertension ? 'bg-red-500' : 'bg-green-500'
                                            }`}></span>
                                            Hypertension: {prescription.clinicalInfo.pastMedicalHistory.hypertension ? 'Yes' : 'No'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.clinicalInfo.pastMedicalHistory.asthma ? 'bg-red-500' : 'bg-green-500'
                                            }`}></span>
                                            Asthma: {prescription.clinicalInfo.pastMedicalHistory.asthma ? 'Yes' : 'No'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.clinicalInfo.pastMedicalHistory.heartDisease ? 'bg-red-500' : 'bg-green-500'
                                            }`}></span>
                                            Heart Disease: {prescription.clinicalInfo.pastMedicalHistory.heartDisease ? 'Yes' : 'No'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Examination Findings */}
                        {prescription.examinationFindings && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Examination Findings</h3>
                                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                    <h4 className="font-medium text-gray-700 mb-2">Investigations Ordered:</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.examinationFindings.investigationsOrdered.cbc ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}></span>
                                            CBC: {prescription.examinationFindings.investigationsOrdered.cbc ? 'Ordered' : 'Not Ordered'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.examinationFindings.investigationsOrdered.xray ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}></span>
                                            X-Ray: {prescription.examinationFindings.investigationsOrdered.xray ? 'Ordered' : 'Not Ordered'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.examinationFindings.investigationsOrdered.ecg ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}></span>
                                            ECG: {prescription.examinationFindings.investigationsOrdered.ecg ? 'Ordered' : 'Not Ordered'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.examinationFindings.investigationsOrdered.bloodSugar ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}></span>
                                            Blood Sugar: {prescription.examinationFindings.investigationsOrdered.bloodSugar ? 'Ordered' : 'Not Ordered'}
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`w-3 h-3 rounded-full mr-2 ${
                                                prescription.examinationFindings.investigationsOrdered.mri ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}></span>
                                            MRI: {prescription.examinationFindings.investigationsOrdered.mri ? 'Ordered' : 'Not Ordered'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Document Available */}
                        {!prescription.prescriptionImageUrl && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Prescription Document</h3>
                                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                        <div className="text-4xl text-gray-400 mb-2">📄</div>
                                        <p className="text-gray-500">No prescription document available</p>
                                        <p className="text-sm text-gray-400 mt-2">Prescription document not provided</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* No Prescription ID provided */}
                {!prescriptionId && !loading && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center">
                            <span className="text-yellow-500 text-xl mr-2">⚠️</span>
                            <p className="text-yellow-700">No prescription ID provided</p>
                        </div>
                    </div>
                )}

                {/* Medical Reports Table */}
                <div className="mt-4">
                    <PatientManagementVisibleModalComponent
                        patientId={prescriptionId}
                        patientPropertyId={patientPropertyId}
                    />
                </div>
            </div>
        </div>
    );
}