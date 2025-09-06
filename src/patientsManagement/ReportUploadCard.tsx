import {useState, useRef, ChangeEvent, DragEvent, FormEvent} from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { getPatientByNIC } from "../services/prescriptions/getPatientById.ts";
import { createLabReport, CreateLabReportRequest } from "../services/prescriptions/labReportSevice.ts";

interface FileWithPreview extends File {
    preview: string;
}

interface ReportUploadCardProps {
    patientNIC?: string | undefined
}

const ReportUploadCard = ({patientNIC}: ReportUploadCardProps) => {
    console.log(patientNIC);
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [notes, setNotes] = useState<string>('');

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

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

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
        setSnackbar({ ...snackbar, open: false });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles: FileWithPreview[] = Array.from(files).map(file =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file),
                })
            );
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const openCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: {ideal: 1280},
                    height: {ideal: 720}
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
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob and create file
        canvas.toBlob((blob) => {
            if (blob) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `lab-report-${timestamp}.jpg`;

                const file = new File([blob], fileName, {type: 'image/jpeg'});
                const fileWithPreview = Object.assign(file, {
                    preview: URL.createObjectURL(file),
                });

                setSelectedFiles(prev => [...prev, fileWithPreview]);
                closeCamera();
                showSnackbar('Photo captured successfully!', 'success');
            }
        }, 'image/jpeg', 0.8);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
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
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => {
            const updated = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index].preview);
            return updated;
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (selectedFiles.length === 0) {
            showSnackbar('Please upload or capture at least one report.', 'error');
            return;
        }

        if (!patientNIC) {
            showSnackbar('Patient NIC is required to create lab reports.', 'error');
            return;
        }

        setIsSubmitting(true);

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

            // Step 2: Upload each lab report
            const uploadPromises = selectedFiles.map(async (file, index) => {
                const reportData: CreateLabReportRequest = {
                    patientId: patient.propertyId, // Use patient's propertyId
                    labReportFile: file,
                    reportDate: new Date().toISOString(),
                    notes: notes ? `${notes} (File ${index + 1}: ${file.name})` : `Lab report file: ${file.name}`
                };

                console.log(`Creating lab report ${index + 1}:`, {
                    patientId: reportData.patientId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size
                });

                return await createLabReport(reportData);
            });

            // Step 3: Wait for all uploads to complete
            showSnackbar('Uploading lab reports...', 'info');
            const results = await Promise.all(uploadPromises);

            console.log('All lab reports created successfully:', results);
            showSnackbar(`Successfully uploaded ${selectedFiles.length} lab report(s) for ${patient.patientName}!`, 'success');

            // Step 4: Clean up and reset
            selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
            setSelectedFiles([]);
            setNotes('');

        } catch (error: any) {
            console.error('Error creating lab reports:', error);
            showSnackbar(error.message || 'Failed to upload lab reports', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
        setSelectedFiles([]);
        setNotes('');
        closeCamera();
        showSnackbar('Operation cancelled.', 'info');
    };

    return (
        <div className="w-full mx-auto p-6 bg-white rounded-lg my-1">
            {/* MUI Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Patient Info Display */}
            {patientNIC && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-700 text-sm">
                        <strong>Patient NIC:</strong> {patientNIC}
                    </p>
                </div>
            )}

            {/* Camera Modal */}
            {isCameraOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-4 max-w-lg w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Capture Lab Report</h3>
                            <button
                                onClick={closeCamera}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="relative">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full rounded-lg"
                            />

                            <div className="flex justify-center gap-4 mt-4">
                                <button
                                    onClick={closeCamera}
                                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    📷 Take Photo
                                </button>
                            </div>
                        </div>

                        {/* Hidden canvas for photo capture */}
                        <canvas ref={canvasRef} className="hidden"/>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div
                className={`border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} border-dashed rounded-lg p-8 text-center transition-all duration-200`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col items-center justify-center">
                    <div className="text-4xl mb-4">🔬</div>
                    <p className="text-gray-500 text-lg font-medium mb-2">Upload or Capture Lab Reports</p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                            disabled={isSubmitting}
                        >
                            Upload File
                        </button>
                        <button
                            type="button"
                            onClick={openCamera}
                            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm rounded"
                            disabled={isSubmitting}
                        >
                            Open Camera
                        </button>
                    </div>
                </div>

                {/* Hidden File Input */}
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                />
            </div>

            {/* Notes Section */}
            <div className="mt-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                </label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes about these lab reports..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    disabled={isSubmitting}
                />
            </div>

            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <div className="mt-6 pt-6">
                    <h4 className="text-md font-semibold text-gray-700 mb-3">Selected Lab Reports ({selectedFiles.length}):</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {selectedFiles.map((file, index) => (
                            <div key={index}
                                 className="relative border border-gray-300 rounded-md overflow-hidden shadow-sm">
                                {file.type.startsWith('image/') ? (
                                    <img src={file.preview} alt={file.name} className="w-full h-24 object-cover"/>
                                ) : (
                                    <div
                                        className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center text-gray-500 text-xs p-2">
                                        <div className="text-2xl mb-1">📄</div>
                                        <span className="text-center break-all">{file.name}</span>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                                    aria-label={`Remove ${file.name}`}
                                    disabled={isSubmitting}
                                >
                                    ✕
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 truncate">
                                    {file.name}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-8 pt-6">
                <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedFiles.length === 0 || !patientNIC}
                    className="px-6 py-2 bg-secondary text-white rounded-md transition-colors text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {isSubmitting ? 'Uploading...' : 'Complete'}
                </button>
            </div>
        </div>
    );
};

export default ReportUploadCard;