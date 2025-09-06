import { useState, useEffect, useRef } from 'react';
import { Trash2, GripVertical, Camera, Upload, X, Check, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";

// Service interfaces and functions
interface CreatePrescriptionRequest {
    prescriptionImage?: File;
    patientInfo: {
        name: string;
        nic: string;
        age: number;
        contact: string;
        email: string;
        address: string;
        dateOfVisit: string | Date;
    };
    drugs: {
        brandName: string;
        drugName: string;
        strength: string;
        dosage: string;
        frequency: string;
        duration: string;
        issuedQty: string;
    }[];
}

// Mock API service (replace with your actual service)
const createPrescription = async (data: CreatePrescriptionRequest) => {
    try {
        const formData = new FormData();

        if (data.prescriptionImage) {
            formData.append("prescriptionImage", data.prescriptionImage);
        }

        formData.append("patientInfo", JSON.stringify(data.patientInfo));
        formData.append("drugs", JSON.stringify(data.drugs));

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log("Prescription created successfully:", data);
        return { success: true, message: "Prescription created successfully" };
    } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to create prescription");
    }
};

interface DrugItem {
    id: string;
    brand: string;
    drug: string;
    strength: string;
    dosage: string;
}

// --- CustomInventory Component ---
function CustomInventory() {
    const [items, setItems] = useState<DrugItem[]>([]);
    const [search, setSearch] = useState("");
    const [inventoryData, setInventoryData] = useState<DrugItem[]>([]);

    // Fake inventory data simulating API
    useEffect(() => {
        const fakeInventory: DrugItem[] = [
            { id: crypto.randomUUID(), brand: "PharmaCo", drug: "Paracetamol", strength: "500mg", dosage: "1T" },
            { id: crypto.randomUUID(), brand: "MediCorp", drug: "Amoxicillin", strength: "250mg", dosage: "1C" },
            { id: crypto.randomUUID(), brand: "HealthPlus", drug: "Ibuprofen", strength: "200mg", dosage: "1T" },
            { id: crypto.randomUUID(), brand: "ZenithPharma", drug: "Metformin", strength: "500mg", dosage: "1T" },
        ];
        setInventoryData(fakeInventory);
        setItems(fakeInventory);
    }, []);

    const handleChange = (id: string, field: keyof DrugItem, value: string) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleDelete = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleAdd = () => {
        setItems(prev => [...prev, { id: crypto.randomUUID(), brand: "", drug: "", strength: "", dosage: "" }]);
    };

    const handleAddFromSearch = (drug: DrugItem) => {
        setItems(prev => [...prev, { ...drug, id: crypto.randomUUID() }]);
    };

    const filteredInventory = inventoryData.filter(item =>
        item.brand.toLowerCase().includes(search.toLowerCase()) ||
        item.drug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-white border rounded-lg p-1 h-screen flex flex-col">
            <h3 className="font-semibold text-base mb-3 text-gray-800">Custom Inventory</h3>
            <div className="relative mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Brand or Drug"
                    className="w-full border border-gray-300 px-3 py-2 pl-10 rounded-md text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Show search results */}
            {search && (
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Search Results</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {filteredInventory.map(drug => (
                            <button key={drug.id} onClick={() => handleAddFromSearch(drug)} className="w-full text-left text-sm p-2 bg-gray-100 hover:bg-gray-200 rounded">
                                {drug.brand} - {drug.drug} ({drug.strength})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                {items.map(item => (
                    <div
                        key={item.id}
                        draggable="true"
                        onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify(item))}
                        className="flex items-center gap-2 border border-gray-200 px-2 py-1 rounded-md bg-gray-50 cursor-grab"
                    >
                        <GripVertical className="text-gray-600" size={18}/>
                        <input value={item.brand} onChange={(e) => handleChange(item.id, "brand", e.target.value)}
                               className="w-[80px] text-xs border text-gray-600 px-2 py-1 rounded" placeholder="Brand"/>
                        <input value={item.drug} onChange={(e) => handleChange(item.id, "drug", e.target.value)}
                               className="w-[80px] text-xs border px-2 text-gray-600 py-1 rounded" placeholder="Drug"/>
                        <input value={item.strength} onChange={(e) => handleChange(item.id, "strength", e.target.value)}
                               className="w-[60px] text-xs border px-2 text-gray-600 py-1 rounded"
                               placeholder="Strength"/>
                        <input value={item.dosage} onChange={(e) => handleChange(item.id, "dosage", e.target.value)}
                               className="w-[40px] text-xs border px-2 text-gray-600 py-1 rounded" placeholder="T"/>
                        <button onClick={() => handleDelete(item.id)}
                                className="ml-auto text-gray-500 hover:text-red-700">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>

            <button onClick={handleAdd}
                    className="mt-4 text-gray-500 text-sm border border-dashed rounded px-3 py-2 hover:bg-gray-100">
                + Add More Drugs
            </button>
        </div>
    );
}

// Enhanced AutoCapture Component
function AutoCapture({ onExtractedData }: { onExtractedData: (data: any, imageFile?: File) => void }) {
    const [captureMode, setCaptureMode] = useState<'initial' | 'camera' | 'preview' | 'processing'>('initial');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedImageFile, setCapturedImageFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // Simulate OCR extraction with realistic prescription data
    const simulateOCRExtraction = async () => {
        setIsProcessing(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate extracted data from prescription image
        const mockExtractedData = {
            patientName: "John Smith",
            nic: "199012345678",
            age: 45,
            contact: "+94701234567",
            email: "john.smith@email.com",
            address: "123 Main Street, Colombo",
            dateOfVisit: "2025-07-01",
            medications: [
                {
                    brandName: "MediCorp",
                    drugName: "Amoxicillin",
                    strength: "500mg",
                    dosage: "1C",
                    frequency: "3 times daily",
                    duration: "7 days",
                    issuedQty: "21",
                    instructions: "Take with food"
                },
                {
                    brandName: "PharmaCo",
                    drugName: "Paracetamol",
                    strength: "500mg",
                    dosage: "1T",
                    frequency: "Every 6 hours",
                    duration: "As needed",
                    issuedQty: "10",
                    instructions: "Take when needed for pain"
                }
            ]
        };

        setExtractedData(mockExtractedData);
        setIsProcessing(false);
        setCaptureMode('preview');
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCaptureMode('camera');
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);

                // Convert canvas to blob and create File object
                canvasRef.current.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `prescription-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        setCapturedImageFile(file);
                    }
                }, 'image/jpeg', 0.8);

                const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
                setCapturedImage(imageData);
                stopCamera();
                simulateOCRExtraction();
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCapturedImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target?.result as string;
                setCapturedImage(imageData);
                simulateOCRExtraction();
            };
            reader.readAsDataURL(file);
        }
    };

    const confirmExtraction = () => {
        if (extractedData) {
            onExtractedData(extractedData, capturedImageFile || undefined);
            resetCapture();
        }
    };

    const resetCapture = () => {
        setCaptureMode('initial');
        setCapturedImage(null);
        setCapturedImageFile(null);
        setExtractedData(null);
        setIsProcessing(false);
        stopCamera();
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setCapturedImageFile(null);
        setExtractedData(null);
        startCamera();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    if (captureMode === 'initial') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 p-8">
                <div className="border-2 border-dashed border-gray-300 p-12 rounded-lg flex flex-col items-center gap-6 bg-white shadow-lg max-w-md w-full">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">Capture Prescription</h2>
                        <p className="text-gray-600 text-sm mb-6">Upload an image or use your camera to automatically extract prescription data</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={startCamera}
                            className="flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
                        >
                            <Camera size={20} />
                            Open Camera
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full"
                        >
                            <Upload size={20} />
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
        );
    }

    if (captureMode === 'camera') {
        return (
            <div className="w-full h-full flex flex-col bg-black">
                <div className="flex-1 relative">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-white border-dashed w-80 h-60 rounded-lg"></div>
                    </div>
                </div>
                <div className="p-6 bg-white flex justify-center gap-4">
                    <button
                        onClick={resetCapture}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={capturePhoto}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Camera size={20} />
                        Capture
                    </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
            </div>
        );
    }

    if (captureMode === 'preview' || isProcessing) {
        return (
            <div className="w-full h-full flex flex-col ">
                {/* Image Preview */}
                <div className="flex-1 p-6 ">
                    <div className="h-full flex gap-6 justify-center">
                        {/* Image Side */}
                        <div className="w-1/2">
                            <div className="bg-white rounded-md shadow-sm p-4 h-full">
                                <h3 className="text-lg font-semibold mb-4">Captured Image</h3>
                                {capturedImage && (
                                    <img
                                        src={capturedImage}
                                        alt="Captured prescription"
                                        className="w-full h-80 object-contain border rounded-lg"
                                    />
                                )}
                                {isProcessing && (
                                    <div className="flex items-center justify-center mt-4">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        <span className="ml-2 text-gray-600">Processing image...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 bg-white border-t flex justify-center gap-4">
                    <button
                        onClick={retakePhoto}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                        disabled={isProcessing}
                    >
                        <RotateCcw size={20} />
                        Retake
                    </button>
                    <button
                        onClick={resetCapture}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmExtraction}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        disabled={isProcessing || !extractedData}
                    >
                        <Check size={20} />
                        Use This Data
                    </button>
                </div>
            </div>
        );
    }

    return null;
}

function PrescriptionFormGenerator({ autoExtractedData, activeMode, setActiveMode }: {
    autoExtractedData?: any;
    activeMode: 'manual' | 'auto';
    setActiveMode: (mode: 'manual' | 'auto') => void;
}) {
    const [, setExtractedData] = useState<any>(null);
    const [prescriptionImage, setPrescriptionImage] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [submitMessage, setSubmitMessage] = useState('');

    // State to store form data for the prescription
    const [formData, setFormData] = useState({
        prescriptionId: '',
        patientName: '',
        nic: '',
        age: '',
        contact: '',
        email: '',
        address: '',
        dateOfVisit: '',
        drugName: '',
        strength: '',
        dosage: '',
        brand: '',
        frequency: '',
        duration: '',
        issuedQty: '',
        instructions: '',
    });

    // Update form data when auto-extracted data is received
    useEffect(() => {
        if (autoExtractedData) {
            const firstMedication = autoExtractedData.medications?.[0] || {};
            setFormData(prev => ({
                ...prev,
                patientName: autoExtractedData.patientName || prev.patientName,
                nic: autoExtractedData.nic || prev.nic,
                age: autoExtractedData.age?.toString() || prev.age,
                contact: autoExtractedData.contact || prev.contact,
                email: autoExtractedData.email || prev.email,
                address: autoExtractedData.address || prev.address,
                dateOfVisit: autoExtractedData.dateOfVisit || prev.dateOfVisit,
                drugName: firstMedication.drugName || prev.drugName,
                strength: firstMedication.strength || prev.strength,
                dosage: firstMedication.dosage || prev.dosage,
                brand: firstMedication.brandName || prev.brand,
                frequency: firstMedication.frequency || prev.frequency,
                duration: firstMedication.duration || prev.duration,
                issuedQty: firstMedication.issuedQty || prev.issuedQty,
                instructions: firstMedication.instructions || prev.instructions,
            }));
            // Switch to auto mode when data is extracted
            setActiveMode('auto');
        }
    }, [autoExtractedData, setActiveMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAutoExtractedData = (data: any, imageFile?: File) => {
        setExtractedData(data);
        if (imageFile) {
            setPrescriptionImage(imageFile);
        }

        // Apply the data to form
        const firstMedication = data.medications?.[0] || {};
        setFormData(prev => ({
            ...prev,
            patientName: data.patientName || prev.patientName,
            nic: data.nic || prev.nic,
            age: data.age?.toString() || prev.age,
            contact: data.contact || prev.contact,
            email: data.email || prev.email,
            address: data.address || prev.address,
            dateOfVisit: data.dateOfVisit || prev.dateOfVisit,
            drugName: firstMedication.drugName || prev.drugName,
            strength: firstMedication.strength || prev.strength,
            dosage: firstMedication.dosage || prev.dosage,
            brand: firstMedication.brandName || prev.brand,
            frequency: firstMedication.frequency || prev.frequency,
            duration: firstMedication.duration || prev.duration,
            issuedQty: firstMedication.issuedQty || prev.issuedQty,
            instructions: firstMedication.instructions || prev.instructions,
        }));
        // Switch to auto mode to show the filled form
        setActiveMode('auto');
    };

    // Handle dropping of drug data onto input fields
    const handleDrop = (e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault();
        const droppedData = e.dataTransfer.getData("application/json");
        try {
            const drug: DrugItem = JSON.parse(droppedData);
            setFormData(prev => ({
                ...prev,
                drugName: drug.drug || prev.drugName,
                strength: drug.strength || prev.strength,
                dosage: drug.dosage || prev.dosage,
                brand: drug.brand || prev.brand,
            }));
        } catch (error) {
            console.error("Failed to parse dropped data:", error);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            const prescriptionRequest: CreatePrescriptionRequest = {
                prescriptionImage: prescriptionImage || undefined,
                patientInfo: {
                    name: formData.patientName,
                    nic: formData.nic,
                    age: parseInt(formData.age) || 0,
                    contact: formData.contact,
                    email: formData.email,
                    address: formData.address,
                    dateOfVisit: formData.dateOfVisit,
                },
                drugs: [{
                    brandName: formData.brand,
                    drugName: formData.drugName,
                    strength: formData.strength,
                    dosage: formData.dosage,
                    frequency: formData.frequency,
                    duration: formData.duration,
                    issuedQty: formData.issuedQty,
                }]
            };

            await createPrescription(prescriptionRequest);
            setSubmitStatus('success');
            setSubmitMessage('Prescription created successfully!');

            // Reset form after successful submission
            setTimeout(() => {
                setFormData({
                    prescriptionId: '',
                    patientName: '',
                    nic: '',
                    age: '',
                    contact: '',
                    email: '',
                    address: '',
                    dateOfVisit: '',
                    drugName: '',
                    strength: '',
                    dosage: '',
                    brand: '',
                    frequency: '',
                    duration: '',
                    issuedQty: '',
                    instructions: '',
                });
                setPrescriptionImage(null);
                setSubmitStatus('idle');
            }, 3000);

        } catch (error: any) {
            setSubmitStatus('error');
            setSubmitMessage(error.message || 'Failed to create prescription');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center font-inter h-full">
            {/* Manual/Auto Switch Button */}
            <div className="flex bg-white p-1 rounded-full shadow-lg mb-4">
                <button
                    className={`px-6 py-2 rounded-full text-base font-medium transition-colors duration-300 ${
                        activeMode === 'manual'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveMode('manual')}
                >
                    Manual
                </button>
                <button
                    className={`px-6 py-2 rounded-full text-base font-medium transition-colors duration-300 ${
                        activeMode === 'auto'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveMode('auto')}
                >
                    Auto
                </button>
            </div>

            {/* Content Area */}
            {activeMode === 'manual' ? (
                <div className="w-full flex-grow">
                    <AutoCapture onExtractedData={handleAutoExtractedData} />
                </div>
            ) : (
                /* Prescription Form Container */
                <form onSubmit={handleSubmit} className="w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col flex-grow">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-6 rounded-t-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                            <div className="mb-4 sm:mb-0">
                                <h1 className="text-xl font-bold">Dr. Sadun Perera</h1>
                                <p className="text-sm">MBBS University Of Peradeniya</p>
                            </div>
                            <div className="text-center sm:text-right mb-4 sm:mb-0 sm:ml-auto sm:mr-8">
                                <p className="text-sm font-semibold">Registration Number</p>
                                <p className="text-xs">ID XXXXXXXX567879</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <img
                                    src="https://placehold.co/40x40/E0F2F7/263238?text=Logo"
                                    alt="Hospital Logo"
                                    className="w-10 h-10 rounded-full"
                                />
                                <div>
                                    <p className="text-sm font-bold">LANKA Hospital PVT LTD</p>
                                    <p className="text-xs">www.hospital.lk - 011-234-567</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Messages */}
                    {submitStatus !== 'idle' && (
                        <div className={`p-4 flex items-center gap-2 ${
                            submitStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {submitStatus === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                            <span>{submitMessage}</span>
                        </div>
                    )}

                    {/* Form Body */}
                    <div className="p-6 bg-gray-50 flex-grow overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                            <div>
                                <label htmlFor="patientName" className="block text-gray-700 text-sm font-medium mb-1">Patient Name :</label>
                                <input
                                    type="text"
                                    id="patientName"
                                    name="patientName"
                                    value={formData.patientName}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="nic" className="block text-gray-700 text-sm font-medium mb-1">NIC :</label>
                                <input
                                    type="text"
                                    id="nic"
                                    name="nic"
                                    value={formData.nic}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="age" className="block text-gray-700 text-sm font-medium mb-1">Age :</label>
                                <input
                                    type="number"
                                    id="age"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="contact" className="block text-gray-700 text-sm font-medium mb-1">Contact :</label>
                                <input
                                    type="tel"
                                    id="contact"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1">Email :</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="address" className="block text-gray-700 text-sm font-medium mb-1">Address :</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                            <div>
                                <label htmlFor="dateOfVisit" className="block text-gray-700 text-sm font-medium mb-1">Date of Visit :</label>
                                <input
                                    type="date"
                                    id="dateOfVisit"
                                    name="dateOfVisit"
                                    value={formData.dateOfVisit}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 bg-transparent"
                                />
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-4xl font-light text-gray-500 mb-6 border-b-2 border-gray-300 pb-2 inline-block">RX</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <label htmlFor="drugName" className="block text-gray-700 text-sm font-medium mb-1">Drug Name :</label>
                                    <input
                                        type="text"
                                        id="drugName"
                                        name="drugName"
                                        value={formData.drugName}
                                        onChange={handleChange}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        required
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="strength" className="block text-gray-700 text-sm font-medium mb-1">Strength (Ml/Mg) :</label>
                                    <input
                                        type="text"
                                        id="strength"
                                        name="strength"
                                        value={formData.strength}
                                        onChange={handleChange}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        required
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="dosage" className="block text-gray-700 text-sm font-medium mb-1">Dosage (T/C/S) :</label>
                                    <input
                                        type="text"
                                        id="dosage"
                                        name="dosage"
                                        value={formData.dosage}
                                        onChange={handleChange}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        required
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="brand" className="block text-gray-700 text-sm font-medium mb-1">Brand :</label>
                                    <input
                                        type="text"
                                        id="brand"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        required
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="frequency" className="block text-gray-700 text-sm font-medium mb-1">Frequency :</label>
                                    <input
                                        type="text"
                                        id="frequency"
                                        name="frequency"
                                        value={formData.frequency}
                                        onChange={handleChange}
                                        placeholder="e.g., 3 times daily"
                                        required
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="duration" className="block text-gray-700 text-sm font-medium mb-1">Duration :</label>
                                    <input
                                        type="text"
                                        id="duration"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        placeholder="e.g., 7 days"
                                        required
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="issuedQty" className="block text-gray-700 text-sm font-medium mb-1">Issued Quantity :</label>
                                    <input
                                        type="text"
                                        id="issuedQty"
                                        name="issuedQty"
                                        value={formData.issuedQty}
                                        onChange={handleChange}
                                        placeholder="e.g., 21"
                                        required
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="instructions" className="block text-gray-700 text-sm font-medium mb-1">Instructions :</label>
                                    <input
                                        type="text"
                                        id="instructions"
                                        name="instructions"
                                        value={formData.instructions}
                                        onChange={handleChange}
                                        placeholder="e.g., Take with food"
                                        className="w-full border-b border-gray-300 focus:border-blue-500 text-gray-900 focus:outline-none py-1 bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        {prescriptionImage && (
                            <div className="mb-6 p-4 bg-white rounded-lg border">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Prescription Image:</h4>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{prescriptionImage.name}</span>
                                    <span className="text-gray-400">({(prescriptionImage.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-center pt-6">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Creating Prescription...
                                    </>
                                ) : (
                                    'Create Prescription'
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer section */}
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-700 h-4 rounded-b-lg flex-shrink-0"></div>
                </form>
            )}
        </div>
    );
}

// --- PrescriptionAndInventoryDashboard (Default Export) ---

export default function PrescriptionAndInventoryDashboard() {
    const [activeMode, setActiveMode] = useState<'manual' | 'auto'>('manual');
    const [extractedData] = useState<any>(null);
    const [currentInventory] = useState(false);

    return (
        <div className="min-h-screen flex">
            <div
                className={`w-full flex flex-col md:flex-row h-screen gap-4 ${currentInventory ? '' : 'justify-center items-center'}`}>
                <div className={`${currentInventory ? 'w-full md:w-3/4' : 'w-full max-w-4xl'} h-full`}>
                    <div className="w-full h-full bg-white flex justify-center text-gray-400">
                        <PrescriptionFormGenerator
                            autoExtractedData={extractedData}
                            activeMode={activeMode}
                            setActiveMode={setActiveMode}
                        />
                    </div>
                </div>

                {/* UPDATED CONDITION */}
                {activeMode === 'auto' && (
                    <div className="w-full md:w-1/4 h-full">
                        <CustomInventory/>
                    </div>
                )}
            </div>
        </div>
    );
}
