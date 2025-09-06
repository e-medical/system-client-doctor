import {useState, useEffect} from "react";
import {prescriptionService, type PrescriptionResponse} from "../../services/prescriptions/prescriptionById.ts";
import {prescriptionUpdateService} from "../../services/prescriptions/prescriptionUpdateDelete.ts";
import MedicalReportsDashboard from "./MedicalReportsDashboard.tsx";
import {Edit, Save, X, Upload, Plus, Trash2, Loader2, AlertTriangle} from "lucide-react";

interface PatientManagementOverviewModalProps {
    open: boolean,
    onClose: () => void,
    patientId: string | undefined,
    patientPropertyId: string | undefined,
}

// Extended interface to include diagnosis and notes
interface ExtendedPrescriptionResponse extends PrescriptionResponse {
    diagnosis?: string;
    notes?: string;
}

export default function PatientManagementOverviewModal({
                                                           open,
                                                           onClose,
                                                           patientId,
                                                           patientPropertyId,
                                                       }: PatientManagementOverviewModalProps) {
    console.log('editing prescription ', patientId);
    console.log('editing prescription property', patientPropertyId);

    const [prescription, setPrescription] = useState<ExtendedPrescriptionResponse | null>(null);
    const [prescriptionId, setPrescriptionId] = useState<string | null>(null); // Store actual prescription ID
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    // Update states
    const [isEditing, setIsEditing] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [newPrescriptionImage, setNewPrescriptionImage] = useState<File | null>(null);

    useEffect(() => {
        if (open && patientId) {
            fetchPrescription();
        } else if (open && !patientId) {
            setError('No prescription ID provided');
        } else {
            setPrescription(null);
            setPrescriptionId(null);
            setError(null);
            setIsEditing(false);
            setDeleting(false);
            setShowDeleteConfirm(false);
            setEditData({});
            setNewPrescriptionImage(null);
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
        }
    }, [open, patientId, pdfUrl]);

    const fetchPrescription = async () => {
        if (!patientId) {
            setError('No prescription ID provided');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const prescriptionData = await prescriptionService.getPrescriptionById(patientId);
            const extendedData: ExtendedPrescriptionResponse = {
                ...prescriptionData,
                diagnosis: (prescriptionData as any).diagnosis || '',
                notes: (prescriptionData as any).notes || ''
            };

            setPrescription(extendedData);
            // Store the actual prescription ID for updates
            setPrescriptionId(extendedData._id || extendedData.propertyId || patientId);

            setEditData({
                diagnosis: extendedData.diagnosis || '',
                notes: extendedData.notes || '',
                status: extendedData.status || '',
                medications: extendedData.medications || []
            });
        } catch (err: any) {
            console.error('Error fetching prescription:', err);
            setError(err.message || 'Failed to load prescription');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!prescriptionId) {
            setError('No prescription ID available for deletion');
            return;
        }

        setDeleting(true);
        try {
            console.log('Deleting prescription with ID:', prescriptionId);
            await prescriptionUpdateService.deletePrescription(prescriptionId);
            console.log('Prescription deleted successfully');
            setShowDeleteConfirm(false);
            onClose(); // Close modal after successful deletion
        } catch (err: any) {
            console.error('Delete error:', err);
            setError(err.message || 'Failed to delete prescription');
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    const handleShowDeleteConfirm = () => {
        setShowDeleteConfirm(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const handleStartEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({
            diagnosis: prescription?.diagnosis || '',
            notes: prescription?.notes || '',
            status: prescription?.status || '',
            medications: prescription?.medications || []
        });
        setNewPrescriptionImage(null);
    };

    const handleSaveUpdate = async () => {
        if (!prescriptionId) {
            setError('No prescription ID available for update');
            return;
        }

        setUpdating(true);
        try {
            const updateData: any = {};

            if (editData.diagnosis !== prescription?.diagnosis) {
                updateData.diagnosis = editData.diagnosis;
            }
            if (editData.notes !== prescription?.notes) {
                updateData.notes = editData.notes;
            }
            if (editData.status !== prescription?.status) {
                updateData.status = editData.status;
            }
            if (JSON.stringify(editData.medications) !== JSON.stringify(prescription?.medications)) {
                updateData.medications = editData.medications;
            }
            if (newPrescriptionImage) {
                updateData.prescriptionImage = newPrescriptionImage;
            }

            console.log('Update data to send:', updateData);
            console.log('Using prescription ID:', prescriptionId);

            if (Object.keys(updateData).length > 0) {
                await prescriptionUpdateService.updatePrescription(prescriptionId, updateData);
                await fetchPrescription(); // Refresh data
            }

            setIsEditing(false);
            setNewPrescriptionImage(null);
        } catch (err: any) {
            console.error('Update error:', err);
            setError(err.message || 'Failed to update prescription');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddMedication = () => {
        setEditData({
            ...editData,
            medications: [
                ...editData.medications,
                {
                    medicationName: '',
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: ''
                }
            ]
        });
    };

    const handleRemoveMedication = (index: number) => {
        const newMedications = editData.medications.filter((_: any, i: number) => i !== index);
        setEditData({ ...editData, medications: newMedications });
    };

    const handleMedicationChange = (index: number, field: string, value: string) => {
        const newMedications = [...editData.medications];
        newMedications[index] = { ...newMedications[index], [field]: value };
        setEditData({ ...editData, medications: newMedications });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setNewPrescriptionImage(file);
        }
    };

    const getFileExtension = (url: string): string => {
        return url.split('.').pop()?.toLowerCase() || '';
    };

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
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={handleStartEdit}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                    disabled={loading || !prescription}
                                >
                                    <Edit size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={handleShowDeleteConfirm}
                                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                    disabled={loading || !prescription || deleting}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            </>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveUpdate}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                    disabled={updating}
                                >
                                    {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Save
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                                    disabled={updating}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                            disabled={loading || updating}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                            <div className="flex items-center mb-4">
                                <AlertTriangle className="text-red-500 mr-3" size={24}/>
                                <h3 className="text-lg font-bold text-gray-800">Confirm Delete</h3>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this prescription? This action will mark the prescription as cancelled and remove it from the appointment.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={handleCancelDelete}
                                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    disabled={deleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                    disabled={deleting}
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                                    {deleting ? 'Deleting...' : 'Delete Prescription'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
                                    {isEditing ? (
                                        <select
                                            value={editData.status}
                                            onChange={(e) => setEditData({...editData, status: e.target.value})}
                                            className="px-2 py-1 border rounded text-sm"
                                        >
                                            <option value="ACTIVE">ACTIVE</option>
                                            <option value="INACTIVE">INACTIVE</option>
                                            <option value="EXPIRED">EXPIRED</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            prescription.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {prescription.status}
                                        </span>
                                    )}
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

                        {/* Diagnosis and Notes */}
                        {(prescription.diagnosis || prescription.notes || isEditing) && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Diagnosis & Notes</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis:</label>
                                        {isEditing ? (
                                            <textarea
                                                value={editData.diagnosis}
                                                onChange={(e) => setEditData({...editData, diagnosis: e.target.value})}
                                                className="w-full p-2 border rounded-md"
                                                rows={2}
                                                placeholder="Enter diagnosis..."
                                            />
                                        ) : (
                                            <p className="text-gray-900 p-2 bg-gray-50 rounded-md">{prescription.diagnosis || 'No diagnosis provided'}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes:</label>
                                        {isEditing ? (
                                            <textarea
                                                value={editData.notes}
                                                onChange={(e) => setEditData({...editData, notes: e.target.value})}
                                                className="w-full p-2 border rounded-md"
                                                rows={3}
                                                placeholder="Enter notes..."
                                            />
                                        ) : (
                                            <p className="text-gray-900 p-2 bg-gray-50 rounded-md">{prescription.notes || 'No notes provided'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Prescription Document */}
                        {(prescription.prescriptionImageUrl || isEditing) && (
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        Prescription Document
                                        {prescription.prescriptionImageUrl && (
                                            <span className="ml-2 text-sm font-normal text-gray-600">
                                                ({getFileType(prescription.prescriptionImageUrl).toUpperCase()})
                                            </span>
                                        )}
                                    </h3>
                                    {isEditing && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                className="hidden"
                                                id="prescription-file"
                                            />
                                            <label
                                                htmlFor="prescription-file"
                                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm cursor-pointer"
                                            >
                                                <Upload size={16} />
                                                Upload New
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {newPrescriptionImage && (
                                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                        <p className="text-sm text-yellow-700">
                                            New file selected: {newPrescriptionImage.name}
                                        </p>
                                    </div>
                                )}

                                {prescription.prescriptionImageUrl && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                        <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                                            {getFileType(prescription.prescriptionImageUrl) === 'pdf' ? (
                                                <div className="w-full">
                                                    <iframe
                                                        src={prescription.prescriptionImageUrl}
                                                        className="w-full h-96 border-0"
                                                        title="Prescription PDF"
                                                    />
                                                </div>
                                            ) : getFileType(prescription.prescriptionImageUrl) === 'image' ? (
                                                <img
                                                    src={prescription.prescriptionImageUrl}
                                                    alt="Prescription"
                                                    className="w-full h-auto max-h-96 object-contain"
                                                />
                                            ) : (
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
                                        </div>

                                        <div className="mt-3 flex gap-2 flex-wrap">
                                            <button
                                                onClick={() => window.open(prescription.prescriptionImageUrl, '_blank')}
                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                            >
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
                                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Medications List */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-semibold text-gray-800">Medications</h3>
                                {isEditing && (
                                    <button
                                        onClick={handleAddMedication}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                    >
                                        <Plus size={16} />
                                        Add Medication
                                    </button>
                                )}
                            </div>
                            {editData.medications && editData.medications.length > 0 ? (
                                <div className="space-y-3">
                                    {editData.medications.map((medication: any, index: number) => (
                                        <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                            {isEditing && (
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        onClick={() => handleRemoveMedication(index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-700">Medication:</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={medication.medicationName}
                                                            onChange={(e) => handleMedicationChange(index, 'medicationName', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm mt-1"
                                                            placeholder="Medication name"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900">{medication.medicationName}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Dosage:</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={medication.dosage}
                                                            onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm mt-1"
                                                            placeholder="Dosage"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900">{medication.dosage}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Frequency:</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={medication.frequency}
                                                            onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm mt-1"
                                                            placeholder="Frequency"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900">{medication.frequency}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Duration:</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={medication.duration}
                                                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm mt-1"
                                                            placeholder="Duration"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900">{medication.duration}</p>
                                                    )}
                                                </div>
                                            </div>
                                            {(medication.instructions || isEditing) && (
                                                <div className="mt-2">
                                                    <span className="font-medium text-gray-700">Instructions:</span>
                                                    {isEditing ? (
                                                        <textarea
                                                            value={medication.instructions || ''}
                                                            onChange={(e) => handleMedicationChange(index, 'instructions', e.target.value)}
                                                            className="w-full p-1 border rounded text-sm mt-1"
                                                            placeholder="Instructions"
                                                            rows={2}
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900 text-sm">{medication.instructions}</p>
                                                    )}
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
                    </>
                )}

                {/* No Prescription ID provided */}
                {!patientId && !loading && (
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-center">
                            <span className="text-yellow-500 text-xl mr-2">⚠️</span>
                            <p className="text-yellow-700">No prescription ID provided</p>
                        </div>
                    </div>
                )}

                {/* Medical Reports Table */}
                <div className="mt-4">
                    <MedicalReportsDashboard
                        patientId={prescriptionId}
                        patientPropertyId={patientPropertyId}
                    />
                </div>
            </div>
        </div>
    );
}