"use client"

import {useState, useRef, useEffect} from "react"
import {Camera, Upload, X, RotateCcw} from "lucide-react"
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Services
import {createPrescription, CreatePrescriptionRequest} from "../../services/prescriptionService"
import { getPatientByNIC } from "../../services/getPatientById.ts"
import type {ExtractedData} from "../../types/prescription.ts";

interface AutoCaptureProps {
    onExtractedData: (data: ExtractedData, imageFile?: File) => void;
    doctorId: any;
    appointmentId: any;
    patientNIC: any;
}

type CaptureMode = "initial" | "camera" | "preview" | "processing" | "uploading"

export default function AutoCapture({onExtractedData, doctorId, appointmentId, patientNIC}: AutoCaptureProps) {
    // State declarations
    const [captureMode, setCaptureMode] = useState<CaptureMode>("initial");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedImageFile, setCapturedImageFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [patientData, setPatientData] = useState<any>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info'
    }>({
        open: false,
        message: '',
        severity: 'info',
    });

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Utility functions
    const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
        setSnackbar({ open: true, message, severity });
    };

    const resetCapture = () => {
        setCaptureMode("initial");
        setCapturedImage(null);
        setCapturedImageFile(null);
        setPatientData(null);
        setIsProcessing(false);
        setIsUploading(false);
        setSnackbar(prev => ({ ...prev, open: false }));
        stopCamera();
    };

    // Camera functions
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCaptureMode("camera");
        } catch (error) {
            console.error("Error accessing camera:", error);
            showSnackbar('Unable to access camera. Please check permissions.', 'error');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);

                canvasRef.current.toBlob(
                    (blob) => {
                        if (blob) {
                            const file = new File([blob], `prescription-${Date.now()}.jpg`, { type: "image/jpeg" });
                            setCapturedImageFile(file);
                        }
                    },
                    "image/jpeg",
                    0.8,
                );

                const imageData = canvasRef.current.toDataURL("image/jpeg", 0.8);
                setCapturedImage(imageData);
                stopCamera();
                processImage();
            }
        }
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setCapturedImageFile(null);
        setPatientData(null);
        setSnackbar(prev => ({ ...prev, open: false }));
        startCamera();
    };

    // File upload function
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCapturedImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target?.result as string;
                setCapturedImage(imageData);
                processImage();
            };
            reader.readAsDataURL(file);
        }
    };

    // Data processing functions
    const fetchPatientData = async () => {
        try {
            showSnackbar('Fetching patient data...', 'info');
            const response = await getPatientByNIC(patientNIC);

            if (response && response.patient) {
                setPatientData(response.patient);
                showSnackbar('Patient data loaded successfully!', 'success');
                return true;
            } else {
                throw new Error('Patient not found');
            }
        } catch (error: any) {
            showSnackbar('Patient not found. Please verify the NIC number.', 'error');
            return false;
        }
    };

    const processImage = async () => {
        setIsProcessing(true);
        const success = await fetchPatientData();
        if (success) {
            setCaptureMode("preview");
        }
        setIsProcessing(false);
    };

    // Helper function to validate and extract doctor ID
    const validateDoctorId = (doctorId: any): string | null => {
        if (!doctorId) {
            console.error('Doctor ID is missing or undefined');
            return null;
        }

        // If doctorId is an object, try to extract the actual ID
        if (typeof doctorId === 'object') {
            // Try common ID field names
            const possibleId = doctorId._id || doctorId.id || doctorId.doctorId || doctorId.propertyId;
            if (possibleId && typeof possibleId === 'string') {
                console.log('Extracted doctor ID from object:', possibleId);
                return possibleId;
            } else {
                console.error('Could not extract valid doctor ID from object:', doctorId);
                return null;
            }
        }

        // If it's already a string, use it directly
        if (typeof doctorId === 'string' && doctorId.trim() !== '') {
            console.log('Using doctor ID as string:', doctorId);
            return doctorId;
        }

        console.error('Doctor ID is not in expected format:', typeof doctorId, doctorId);
        return null;
    };

    // Upload function
    const uploadPrescription = async () => {
        if (!patientData || !capturedImageFile) {
            showSnackbar('Missing patient data or image.', 'error');
            return;
        }

        // Validate and extract doctor ID
        const validDoctorId = validateDoctorId(doctorId);
        if (!validDoctorId) {
            showSnackbar('Invalid doctor ID. Please contact support.', 'error');
            console.error('Doctor ID validation failed:', {
                originalDoctorId: doctorId,
                type: typeof doctorId,
                stringified: JSON.stringify(doctorId)
            });
            return;
        }

        if (!appointmentId) {
            showSnackbar('Appointment ID is required', 'error');
            return;
        }

        setIsUploading(true);
        setCaptureMode("uploading");

        try {
            showSnackbar('Uploading prescription...', 'info');

            console.log('=== PRESCRIPTION UPLOAD DEBUG ===');
            console.log('Patient Data:', {
                id: patientData._id || patientData.id,
                name: patientData.patientName,
                nic: patientData.patientNIC
            });
            console.log('Original Doctor ID received:', doctorId);
            console.log('Validated Doctor ID to use:', validDoctorId);
            console.log('Appointment ID:', appointmentId);

            const prescriptionPayload: CreatePrescriptionRequest = {
                patientId: patientData._id || patientData.id,
                doctorId: validDoctorId, // Use the validated doctor ID
                appointmentId: appointmentId,
                prescriptionImage: capturedImageFile
            };

            console.log('Final payload being sent:', {
                patientId: prescriptionPayload.patientId,
                doctorId: prescriptionPayload.doctorId,
                appointmentId: prescriptionPayload.appointmentId,
                hasImage: !!prescriptionPayload.prescriptionImage,
                doctorIdType: typeof prescriptionPayload.doctorId,
                doctorIdLength: prescriptionPayload.doctorId?.length
            });

            await createPrescription(prescriptionPayload);
            showSnackbar('Prescription uploaded successfully!', 'success');

            setTimeout(() => {
                resetCapture();
            }, 2000);

        } catch (error: any) {
            console.error('=== UPLOAD ERROR ===');
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            console.error('Response data:', error.response?.data);
            console.error('Response status:', error.response?.status);

            // More specific error messages
            let errorMessage = 'Upload failed';
            if (error.message?.includes('doctorId')) {
                errorMessage = 'Invalid doctor information. Please contact support.';
            } else if (error.message?.includes('patientId')) {
                errorMessage = 'Invalid patient information. Please try again.';
            } else if (error.message?.includes('appointmentId')) {
                errorMessage = 'Invalid appointment information. Please contact support.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showSnackbar(errorMessage, 'error');
            setCaptureMode("preview");
        } finally {
            setIsUploading(false);
        }
    };

    // Extraction confirmation
    const confirmExtraction = () => {
        if (patientData) {
            const extractedData: any = {
                patientName: patientData.patientName,
                nic: patientData.patientNIC,
                age: patientData.patientAge,
                contact: patientData.patientPhone,
                email: patientData.patientEmail,
                address: patientData.patientAddress,
                gender: patientData.patientGender,
                drugs: []
            };
            onExtractedData(extractedData, capturedImageFile || undefined);
            resetCapture();
        }
    };

    // Effects
    useEffect(() => {
        console.log('=== AutoCapture Props Validation ===');
        console.log('doctorId:', {
            value: doctorId,
            type: typeof doctorId,
            stringified: JSON.stringify(doctorId)
        });
        console.log('appointmentId:', appointmentId);
        console.log('patientNIC:', patientNIC);

        if (!doctorId || !appointmentId || !patientNIC) {
            console.warn('AutoCapture: Missing required props');
        } else {
            console.log('AutoCapture initialized successfully');
        }
    }, [doctorId, appointmentId, patientNIC]);

    useEffect(() => {
        return () => stopCamera();
    }, []);

    // Check if component can function properly
    const hasRequiredProps = doctorId && appointmentId && patientNIC;

    // Render validation error if props are missing
    if (!hasRequiredProps) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 p-8">
                <div className="border-2 border-red-300 bg-red-50 p-8 rounded-lg flex flex-col items-center gap-4 max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                        <X className="w-8 h-8 text-red-600"/>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2 text-red-800">Configuration Error</h2>
                        <p className="text-red-600 text-sm">
                            Missing required information:
                        </p>
                        <ul className="text-red-600 text-sm mt-2 list-disc list-inside">
                            {!doctorId && <li>Doctor ID</li>}
                            {!appointmentId && <li>Appointment ID</li>}
                            {!patientNIC && <li>Patient NIC</li>}
                        </ul>
                        <p className="text-red-600 text-sm mt-2">
                            Please contact support or refresh the page.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Render
    return (
        <>
            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Initial Screen */}
            {captureMode === "initial" && (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 p-8">
                    <div className="border-2 border-dashed border-gray-300 p-12 rounded-lg flex flex-col items-center gap-6 bg-white shadow-lg max-w-md w-full">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Camera className="w-8 h-8 text-blue-600"/>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">Capture Prescription</h2>
                            <p className="text-gray-600 text-sm mb-6">
                                Upload an image or use your camera to automatically extract and upload prescription data
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={startCamera}
                                className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
                            >
                                <Camera size={20}/>
                                Open Camera
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
                            >
                                <Upload size={20}/>
                                Upload Image
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            )}

            {/* Camera Screen */}
            {captureMode === "camera" && (
                <div className="w-full h-full flex flex-col bg-black">
                    <div className="flex-1 relative">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"/>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="border-2 border-white border-dashed w-80 h-60 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="p-6 bg-white flex justify-center gap-4">
                        <button
                            onClick={resetCapture}
                            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <X size={20}/>
                        </button>
                        <button
                            onClick={capturePhoto}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Camera size={20}/>
                            Capture
                        </button>
                    </div>
                    <canvas ref={canvasRef} className="hidden"/>
                </div>
            )}

            {/* Preview/Processing/Uploading Screen */}
            {(captureMode === "preview" || captureMode === "uploading" || isProcessing) && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col gap-6 max-w-xl w-full">
                        <h3 className="text-xl font-semibold text-center text-gray-800">Review and Confirm</h3>

                        {/* Captured Image */}
                        <div className="flex-1">
                            <h4 className="font-medium mb-2 text-gray-600">Captured Image</h4>
                            {capturedImage && (
                                <img
                                    src={capturedImage}
                                    alt="Captured prescription"
                                    className="w-full h-auto max-h-64 object-contain border rounded-lg p-2 bg-gray-100"
                                />
                            )}
                        </div>

                        {/* Processing Indicator */}
                        {isProcessing && (
                            <div className="flex items-center justify-center text-gray-600">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="ml-3">Processing image...</span>
                            </div>
                        )}

                        {/* Patient Information */}
                        {patientData && !isProcessing && (
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <h4 className="font-medium text-sm mb-2 text-gray-700">Patient Information:</h4>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div><strong>Patient:</strong> {patientData.patientName} ({patientData.patientNIC})</div>
                                    <div><strong>Age:</strong> {patientData.patientAge}</div>
                                    <div><strong>Contact:</strong> {patientData.patientPhone}</div>
                                    <div><strong>Email:</strong> {patientData.patientEmail}</div>
                                    <div className="text-orange-600"><strong>Note:</strong> Prescription will be uploaded with patient data only.</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-center gap-4 w-full max-w-xl">
                        <button
                            onClick={retakePhoto}
                            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                            disabled={isProcessing || isUploading}
                        >
                            <RotateCcw size={20}/>
                            Retake
                        </button>
                        <button
                            onClick={uploadPrescription}
                            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            disabled={isProcessing || !patientData || isUploading}
                        >
                            <Upload size={20}/>
                            {isUploading ? 'Uploading...' : 'Upload Prescription'}
                        </button>
                    </div>

                    {/* Alternative Action */}
                    <button
                        onClick={confirmExtraction}
                        className="mt-3 text-sm text-blue-600 hover:underline disabled:opacity-50"
                        disabled={isProcessing || !patientData || isUploading}
                    >
                        Or use extracted data without uploading
                    </button>
                </div>
            )}
        </>
    );
}