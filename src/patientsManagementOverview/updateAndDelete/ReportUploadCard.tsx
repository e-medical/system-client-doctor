import React, { useState, useRef, useEffect, ChangeEvent, DragEvent, FormEvent, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { labReportsService, LabReportResponse } from '../../services/prescriptions/labReportGetById';
import { updateLabReport } from '../../services/prescriptions/labReportUpdateService.ts';
import { deleteLabReport } from '../../services/prescriptions/labReportDeleteService.ts';
import { Eye, Download, Calendar, User, FileText, RefreshCw, AlertCircle, Trash2, Edit, Upload } from 'lucide-react';

interface FileWithPreview extends File {
    preview: string;
}

interface SnackbarState {
    open: boolean;
    message: string;
    severity: AlertColor;
}

interface EditFormState {
    reportDate: string;
    notes: string;
}

interface ReportUploadCardProps {
    patientId: string;
}

const ReportUploadCard: React.FC<ReportUploadCardProps> = ({ patientId }) => {
    // Existing states
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // States for fetching data
    const [existingReports, setExistingReports] = useState<LabReportResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('existing');

    // Edit and Delete functionality states
    const [editingReport, setEditingReport] = useState<string | null>(null);
    const [updateLoading, setUpdateLoading] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    // Form state for editing
    const [editForm, setEditForm] = useState<EditFormState>({
        reportDate: '',
        notes: '',
    });
    // ✅ NEW: State for the file being edited
    const [editFile, setEditFile] = useState<File | null>(null);


    // Snackbar state
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'info'
    });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Helper function to show snackbar
    const showSnackbar = useCallback((message: string, severity: AlertColor = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    }, []);

    // Handle snackbar close
    const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    const fetchExistingReports = useCallback(async () => {
        if (!patientId) return;

        try {
            setLoading(true);
            setError(null);
            const reports = await labReportsService.getLabReports(patientId);
            setExistingReports(reports);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load existing reports';
            setError(errorMessage);
            showSnackbar(errorMessage, 'error');
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    }, [patientId, showSnackbar]);

    // Fetch existing reports when component mounts or patientId changes
    useEffect(() => {
        if (patientId) {
            fetchExistingReports();
        }
    }, [patientId, fetchExistingReports]);

    // ✅ MODIFIED: handleEditStart now resets the edit file state
    const handleEditStart = useCallback((report: LabReportResponse) => {
        setEditingReport(report.id);
        setEditForm({
            // Using .slice(0, 16) for datetime-local input format
            reportDate: report.reportDate ? new Date(report.reportDate).toISOString().slice(0, 16) : '',
            notes: report.notes || '',
        });
        setEditFile(null); // Reset file on edit start
    }, []);

    // ✅ MODIFIED: handleEditCancel now resets the edit file state
    const handleEditCancel = useCallback(() => {
        setEditingReport(null);
        setEditForm({
            reportDate: '',
            notes: '',
        });
        setEditFile(null); // Reset file on cancel
    }, []);

    const handleInputChange = useCallback((field: keyof EditFormState, value: string) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    // ✅ MODIFIED: handleUpdateReport now uses FormData to upload the new file
    const handleUpdateReport = useCallback(async (reportId: string) => {
        try {
            setUpdateLoading(reportId);

            const formData = new FormData();

            if (editForm.reportDate) {
                formData.append('reportDate', new Date(editForm.reportDate).toISOString());
            }
            formData.append('notes', editForm.notes);

            if (editFile) {
                formData.append('labReportFile', editFile); // Ensure 'labReportFile' matches your backend API's expected field name
            }

            // This service function MUST be able to send FormData
            const response = await updateLabReport(reportId, formData);

            // Inside handleUpdateReport function

            setExistingReports(prev =>
                prev.map(report =>
                    report.id === reportId
                        ? {
                            ...report, // Keep the old report data as a base
                            reportDate: response.report.reportDate,
                            notes: response.report.notes || '',
                            // ✅ FIX: Fall back to the old URL if the new one is not in the response
                            labReportUrl: response.report.labReportUrl ?? report.labReportUrl,
                            updatedAt: response.report.updatedAt,
                        }
                        : report
                )
            );

            handleEditCancel(); // This will clear the form and reset the editFile state
            showSnackbar('Lab report updated successfully!', 'success');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update lab report';
            showSnackbar(errorMessage, 'error');
        } finally {
            setUpdateLoading(null);
        }
    }, [editForm, editFile, showSnackbar, handleEditCancel]);

    const handleDeleteReport = useCallback(async (reportId: string, reportDate: string) => {
        const confirmMessage = `Are you sure you want to delete the lab report from ${formatDate(reportDate)}?\n\nThis action cannot be undone.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setDeleteLoading(reportId);
            await deleteLabReport(reportId);
            setExistingReports(prev => prev.filter(report => report.id !== reportId));
            if (editingReport === reportId) {
                handleEditCancel();
            }
            showSnackbar('Lab report deleted successfully!', 'success');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete lab report';
            showSnackbar(errorMessage, 'error');
        } finally {
            setDeleteLoading(null);
        }
    }, [editingReport, handleEditCancel, showSnackbar]);

    const formatDate = useCallback((dateString: string) => {
        if (!dateString) return 'No Date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    const handleViewReport = useCallback((url: string) => {
        window.open(url, '_blank');
    }, []);

    const handleDownloadReport = useCallback(async (url: string, reportDate: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const fileExtension = url.split('.').pop() || 'jpg';
            const formattedDate = new Date(reportDate).toISOString().split('T')[0];
            link.download = `lab-report-${formattedDate}.${fileExtension}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading report:', error);
            showSnackbar('Failed to download report. Please try again.', 'error');
        }
    }, [showSnackbar]);

    const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles: FileWithPreview[] = Array.from(files).map(file =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file),
                })
            );
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    }, []);

    const openCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            setStream(mediaStream);
            setIsCameraOpen(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            showSnackbar('Could not access camera. Please check permissions or try uploading a file instead.', 'error');
        }
    }, [showSnackbar]);

    const closeCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    }, [stream]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `camera-capture-${timestamp}.jpg`;

                const file = new File([blob], fileName, { type: 'image/jpeg' });
                const fileWithPreview = Object.assign(file, {
                    preview: URL.createObjectURL(file),
                });

                setSelectedFiles(prev => [...prev, fileWithPreview]);
                closeCamera();
            }
        }, 'image/jpeg', 0.8);
    }, [closeCamera]);

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const newFiles: FileWithPreview[] = Array.from(files).map(file =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file),
                })
            );
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    }, []);

    const handleRemoveFile = useCallback((index: number) => {
        setSelectedFiles(prev => {
            const updated = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index].preview);
            return updated;
        });
    }, []);

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            showSnackbar('Please upload or capture at least one report.', 'warning');
            return;
        }

        console.log('Submitting reports:', selectedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
        })));

        showSnackbar(`Successfully processed ${selectedFiles.length} report(s)!`, 'success');
        selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
        setSelectedFiles([]);

        await fetchExistingReports();

    }, [selectedFiles, showSnackbar, fetchExistingReports]);

    const handleCancel = useCallback(() => {
        selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
        setSelectedFiles([]);
        closeCamera();
        showSnackbar('Operation cancelled.', 'info');
    }, [selectedFiles, closeCamera, showSnackbar]);

    return (
        <div className="w-full mx-auto p-6 bg-white rounded-lg my-1">
            {/* Tab Navigation */}
            <div className="flex mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('existing')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'existing'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    type="button"
                >
                    <FileText className="w-4 h-4 inline-block mr-2" />
                    Existing Reports ({existingReports.length})
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'upload'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    type="button"
                >
                    📷 Upload New Report
                </button>
            </div>

            {/* Existing Reports Tab */}
            {activeTab === 'existing' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Lab Reports</h3>
                        <button
                            onClick={fetchExistingReports}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            type="button"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            <span className="ml-2 text-gray-600">Loading reports...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                <span className="text-red-700">{error}</span>
                            </div>
                        </div>
                    )}

                    {!loading && !error && existingReports.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No lab reports found for this patient.</p>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                                type="button"
                            >
                                Upload your first report →
                            </button>
                        </div>
                    )}

                    {!loading && existingReports.length > 0 && (
                        <div className="space-y-4">
                            {existingReports.map((report) => {
                                const isEditing = editingReport === report.id;
                                const isUpdating = updateLoading === report.id;
                                const isDeleting = deleteLoading === report.id;

                                return (
                                    <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Calendar className="w-4 h-4 text-gray-500" />
                                                    {isEditing ? (
                                                        <input
                                                            type="datetime-local"
                                                            value={editForm.reportDate}
                                                            onChange={(e) => handleInputChange('reportDate', e.target.value)}
                                                            className="font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                                                            disabled={isUpdating}
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-gray-900">
                                                            {formatDate(report.reportDate)}
                                                        </span>
                                                    )}
                                                </div>

                                                {isEditing ? (
                                                    <textarea
                                                        value={editForm.notes}
                                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                                        className="w-full text-gray-600 border border-gray-300 rounded px-2 py-1 mb-2 resize-none"
                                                        rows={3}
                                                        placeholder="Notes..."
                                                        disabled={isUpdating}
                                                    />
                                                ) : (
                                                    report.notes && (
                                                        <p className="text-gray-600 text-sm mb-2 break-words">{report.notes}</p>
                                                    )
                                                )}

                                                {/* ✅ NEW: File Input for Editing */}
                                                {isEditing && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Report File</label>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="file"
                                                                id={`edit-file-${report.id}`}
                                                                accept="image/*,application/pdf"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    if (e.target.files && e.target.files.length > 0) {
                                                                        setEditFile(e.target.files[0]);
                                                                    }
                                                                }}
                                                                disabled={isUpdating}
                                                            />
                                                            <label htmlFor={`edit-file-${report.id}`} className="cursor-pointer px-3 py-2 bg-gray-200 text-gray-800 text-sm rounded-md hover:bg-gray-300">
                                                                Change File
                                                            </label>
                                                            <span className="text-sm text-gray-600 truncate">
                                                                {editFile ? `New: ${editFile.name}` : `Current: ${report.labReportUrl.split('/').pop()}`}
                                                            </span>
                                                            {editFile && (
                                                                <button onClick={() => setEditFile(null)} className="text-red-500 hover:text-red-700 text-xs" type="button" disabled={isUpdating}>
                                                                    (cancel)
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {!isEditing && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                                                        <User className="w-4 h-4" />
                                                        <span>Created by {report.createdBy.name} ({report.createdBy.role})</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-2">
                                                {!isEditing && !isDeleting && (
                                                    <>
                                                        <button onClick={() => handleEditStart(report)} className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700" type="button"><Edit className="w-4 h-4" /><span>Edit</span></button>
                                                        <button onClick={() => handleViewReport(report.labReportUrl)} className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700" type="button"><Eye className="w-4 h-4" /><span>View</span></button>
                                                        <button onClick={() => handleDownloadReport(report.labReportUrl, report.reportDate)} className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700" type="button"><Download className="w-4 h-4" /><span>Download</span></button>
                                                        <button onClick={() => handleDeleteReport(report.id, report.reportDate)} disabled={isDeleting} className={`flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-lg ${isDeleting ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`} type="button">
                                                            {isDeleting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Trash2 className="w-4 h-4" />}
                                                            <span>{isDeleting ? 'Deleting' : 'Delete'}</span>
                                                        </button>
                                                    </>
                                                )}

                                                {isEditing && (
                                                    <>
                                                        <button onClick={handleEditCancel} disabled={isUpdating} className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50" type="button">Cancel</button>
                                                        <button onClick={() => handleUpdateReport(report.id)} disabled={isUpdating} className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50" type="button">
                                                            {isUpdating ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Upload className="w-4 h-4" />}
                                                            <span>{isUpdating ? 'Updating...' : 'Update'}</span>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div>
                    {isCameraOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-4 max-w-lg w-full mx-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Capture Photo</h3>
                                    <button onClick={closeCamera} className="text-gray-500 hover:text-gray-700 text-2xl" type="button">✕</button>
                                </div>
                                <div className="relative">
                                    <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                                    <div className="flex justify-center gap-4 mt-4">
                                        <button onClick={closeCamera} className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600" type="button">Cancel</button>
                                        <button onClick={capturePhoto} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" type="button">📷 Take Photo</button>
                                    </div>
                                </div>
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                        </div>
                    )}

                    <div
                        className={`border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} border-dashed rounded-lg p-8 text-center transition-all duration-200`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-4xl mb-4">📷</div>
                            <p className="text-gray-500 text-lg font-medium mb-2">Upload or Capture Reports</p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => document.getElementById('file-upload')?.click()} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded">Upload File</button>
                                <button type="button" onClick={openCamera} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm rounded">Open Camera</button>
                            </div>
                        </div>
                        <input id="file-upload" type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleFileChange} />
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className="mt-6 pt-6">
                            <h4 className="text-md font-semibold text-gray-700 mb-3">Selected Reports:</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="relative border border-gray-300 rounded-md overflow-hidden shadow-sm">
                                        {file.type.startsWith('image/') ? (
                                            <img src={file.preview} alt={file.name} className="w-full h-24 object-cover" />
                                        ) : (
                                            <div className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center text-gray-500 text-xs p-2">
                                                <FileText className="h-8 w-8 text-gray-400 mb-1" />
                                                <span className="text-center break-all">{file.name}</span>
                                            </div>
                                        )}
                                        <button type="button" onClick={() => handleRemoveFile(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs leading-none hover:bg-red-600" aria-label={`Remove ${file.name}`}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedFiles.length > 0 && (
                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
                            <button type="button" onClick={handleCancel} className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-base font-medium">Cancel</button>
                            <button type="submit" onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-medium">Complete</button>
                        </div>
                    )}
                </div>
            )}

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

export default ReportUploadCard;