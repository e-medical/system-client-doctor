import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { PlusCircle, Trash2, Save, FileText, Loader2 } from 'lucide-react';
import PrescriptionHeader from './PrescriptionHeader';

// Import services
import { createPrescription, CreatePrescriptionRequest } from '../../patientsManagement/services/prescriptionService.ts';
import { getPatientByNIC, Patient } from '../../patientsManagement/services/getPatientById.ts';
import { getCurrentUserDetails } from '../../services/UserService';
import { getAllDoctors, Doctor } from '../../services/doctorService';
import {getHospitalDetails} from "../../services/hospitals/hospitalGetById.ts";

// --- TYPE DEFINITIONS ---

interface Drug {
    id: number;
    drugName: string;
    strength: string;
    dosage: string;
    brand: string;
    duration: string;
    instructions: string;
}

interface FormData {
    prescriptionId: string;
    patientName: string;
    age: string;
    gender: string;
    date: string;
    history: string;
    lx: string;
    drugs: Drug[];
}

interface LabTestPrescriptionProps {
    doctorId?: string | null | undefined;
    appointmentId?: string | null | undefined;
    patientNIC?: string | null | undefined;
    onPrescriptionCreated?: (prescriptionId: string) => void;
}

interface SaveStatus {
    isLoading: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | null;
}

export default function LabTestPrescription({
                                                doctorId,
                                                appointmentId,
                                                patientNIC,
                                                onPrescriptionCreated
                                            }: LabTestPrescriptionProps) {
    const printRef = useRef<HTMLDivElement>(null);

    // State for patient data and doctor info
    const [patientData, setPatientData] = useState<Patient | null>(null);
    const [patientId, setPatientId] = useState<string | null>(null);
    const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
    const [doctorDetails, setDoctorDetails] = useState<{
        name: string;
        qualification: string;
        slmcNumber: string;
    } | null>(null);
    const [hospitalSummary, setHospitalSummary] = useState<{
        businessName: string;
        address: string;
        logoUrl: string;
    } | null>(null);
    const [headerBgColor, setHeaderBgColor] = useState<string>('#14b8a6');
    const [, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>({
        isLoading: false,
        message: '',
        type: null
    });

    // Form data state
    const [formData, setFormData] = useState<FormData>({
        prescriptionId: `LAB-${Date.now()}`,
        patientName: '',
        age: '',
        gender: '',
        date: new Date().toISOString().split('T')[0],
        history: '',
        lx: '',
        drugs: [
            { id: Date.now(), drugName: '', strength: '', dosage: '', brand: '', duration: '', instructions: '' }
        ],
    });

    // Load patient and doctor data on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);

            try {
                // Load user and doctor data first
                const user = await getCurrentUserDetails();
                if (!user?._id) {
                    console.warn("Could not identify logged-in user");
                    return;
                }

                // Fetch doctor and hospital data in parallel
                const [doctorResponse, hospitalData] = await Promise.all([
                    getAllDoctors(),
                    user.hospital ? getHospitalDetails(user.hospital) : Promise.resolve(null)
                ]);

                // Process Doctor Data
                const currentDoctor = doctorResponse.data?.find((doc: Doctor) => doc.systemUser?.id === user._id);
                if (currentDoctor) {
                    setDoctorDetails({
                        name: currentDoctor.doctorName,
                        qualification: currentDoctor.qualification,
                        slmcNumber: currentDoctor.slmcNumber,
                    });

                    // Set doctor ID (use prop if provided, otherwise use current doctor)
                    const resolvedDoctorId = doctorId || currentDoctor.propertyId || (currentDoctor as any)._id || (currentDoctor as any).id;
                    setCurrentDoctorId(resolvedDoctorId);
                }

                // Process Hospital Data
                if (hospitalData) {
                    setHospitalSummary({
                        businessName: hospitalData.businessName,
                        address: hospitalData.address,
                        logoUrl: '' // Logo URL from hospital data if available
                    });
                }

                // Load patient data if NIC is provided
                if (patientNIC) {
                    try {
                        setSaveStatus({ isLoading: true, message: 'Loading patient data...', type: 'info' });
                        const patientResponse = await getPatientByNIC(patientNIC);
                        if (patientResponse?.patient) {
                            setPatientData(patientResponse.patient);
                            const foundPatientId = patientResponse.patient.id || (patientResponse.patient as any)._id;
                            setPatientId(foundPatientId);

                            // Pre-fill form with patient data
                            setFormData(prev => ({
                                ...prev,
                                patientName: patientResponse.patient.patientName || '',
                                age: patientResponse.patient.patientAge?.toString() || '',
                                gender: patientResponse.patient.patientGender || ''
                            }));

                            setSaveStatus({ isLoading: false, message: 'Patient data loaded successfully!', type: 'success' });
                            setTimeout(() => setSaveStatus({ isLoading: false, message: '', type: null }), 2000);
                        }
                    } catch (patientError: any) {
                        setSaveStatus({
                            isLoading: false,
                            message: `Patient not found with NIC: ${patientNIC}`,
                            type: 'error'
                        });
                    }
                }

            } catch (error) {
                console.error("Error loading initial data:", error);
                setSaveStatus({
                    isLoading: false,
                    message: 'Failed to load doctor/hospital information',
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [patientNIC, doctorId]);

    // --- PDF GENERATION ---
    const generatePrescriptionPDF = async (): Promise<File> => {
        return new Promise((resolve, reject) => {
            try {
                import('html2canvas').then(html2canvas => {
                    import('jspdf').then(({ jsPDF }) => {
                        const element = printRef.current;
                        if (!element) {
                            reject(new Error('Prescription element not found'));
                            return;
                        }

                        // Temporarily show the element for capturing
                        element.style.display = 'block';
                        element.style.position = 'absolute';
                        element.style.left = '-9999px';
                        element.style.background = 'white';
                        element.style.width = '800px';

                        html2canvas.default(element, {
                            scale: 2,
                            useCORS: true,
                            allowTaint: true,
                            backgroundColor: '#ffffff',
                            width: 800,
                            height: element.scrollHeight
                        }).then((canvas: HTMLCanvasElement) => {
                            // Hide the element again
                            element.style.display = 'none';

                            const imgData = canvas.toDataURL('image/jpeg', 0.95);
                            const pdf = new jsPDF('p', 'mm', 'a4');

                            const imgWidth = 210; // A4 width in mm
                            const pageHeight = 295; // A4 height in mm
                            const imgHeight = (canvas.height * imgWidth) / canvas.width;
                            let heightLeft = imgHeight;
                            let position = 0;

                            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                            heightLeft -= pageHeight;

                            while (heightLeft >= 0) {
                                position = heightLeft - imgHeight;
                                pdf.addPage();
                                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                                heightLeft -= pageHeight;
                            }

                            // Convert PDF to File object
                            const pdfBlob = pdf.output('blob');
                            const pdfFile = new File([pdfBlob], `lab-prescription-${formData.prescriptionId}-${Date.now()}.pdf`, {
                                type: 'application/pdf'
                            });

                            resolve(pdfFile);
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    };

    // --- HANDLERS ---
    const handlePatientInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleDrugChange = (id: number, e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            drugs: prev.drugs.map(drug =>
                drug.id === id ? { ...drug, [name]: value } : drug
            )
        }));
    };

    const handleAddDrug = () => {
        setFormData(prev => ({
            ...prev,
            drugs: [
                ...prev.drugs,
                { id: Date.now(), drugName: '', strength: '', dosage: '', brand: '', duration: '', instructions: '' }
            ]
        }));
    };

    const handleRemoveDrug = (id: number) => {
        if (formData.drugs.length <= 1) return;
        setFormData(prev => ({
            ...prev,
            drugs: prev.drugs.filter(drug => drug.id !== id)
        }));
    };

    const handlePrint = () => window.print();

    const handleReset = () => {
        setFormData({
            prescriptionId: `LAB-${Date.now()}`,
            patientName: patientData?.patientName || '',
            age: patientData?.patientAge?.toString() || '',
            gender: patientData?.patientGender || '',
            date: new Date().toISOString().split('T')[0],
            history: '',
            lx: '',
            drugs: [
                { id: Date.now(), drugName: '', strength: '', dosage: '', brand: '', duration: '', instructions: '' }
            ],
        });
        setSaveStatus({ isLoading: false, message: '', type: null });
    };

    const handleSavePrescription = async () => {
        // Validation
        if (!currentDoctorId || !appointmentId) {
            setSaveStatus({
                isLoading: false,
                message: 'Missing doctor or appointment information',
                type: 'error'
            });
            return;
        }

        if (!patientId) {
            setSaveStatus({
                isLoading: false,
                message: 'Patient information is required to save prescription',
                type: 'error'
            });
            return;
        }

        if (!formData.patientName.trim()) {
            setSaveStatus({
                isLoading: false,
                message: 'Please fill in patient name',
                type: 'error'
            });
            return;
        }

        setSaveStatus({ isLoading: true, message: 'Generating prescription PDF...', type: 'info' });

        try {
            // Generate PDF
            const pdfFile = await generatePrescriptionPDF();

            setSaveStatus({ isLoading: true, message: 'Saving prescription...', type: 'info' });

            // Prepare prescription data
            const prescriptionPayload: CreatePrescriptionRequest = {
                patientId: patientId,
                doctorId: currentDoctorId,
                appointmentId: appointmentId,
                prescriptionImage: pdfFile
            };

            console.log('Saving lab prescription with payload:', {
                patientId: prescriptionPayload.patientId,
                doctorId: prescriptionPayload.doctorId,
                appointmentId: prescriptionPayload.appointmentId,
                pdfSize: pdfFile.size
            });

            // Save prescription
            const response = await createPrescription(prescriptionPayload);
            const newPrescriptionId = response.data._id || response.data.propertyId;

            setSaveStatus({
                isLoading: false,
                message: 'Lab prescription saved successfully!',
                type: 'success'
            });

            // Call callback if provided
            if (onPrescriptionCreated && newPrescriptionId) {
                onPrescriptionCreated(newPrescriptionId);
            }

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSaveStatus({ isLoading: false, message: '', type: null });
            }, 3000);

        } catch (error: any) {
            console.error('Error saving lab prescription:', error);
            setSaveStatus({
                isLoading: false,
                message: error.message || 'Failed to save prescription',
                type: 'error'
            });
        }
    };

    // Check if we have the required data to save
    const canSave = currentDoctorId && appointmentId && patientId && formData.patientName.trim();

    // Handler for header color changes
    const handleHeaderColorChange = (color: string) => {
        setHeaderBgColor(color);
    };

    return (
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
            <PrescriptionHeader
                sendHeaderColorToParent={handleHeaderColorChange}
                color={headerBgColor}
            />

            {/* Status Messages */}
            {saveStatus.message && (
                <div className={`px-6 py-3 border-l-4 ${
                    saveStatus.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' :
                        saveStatus.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                            'bg-blue-50 border-blue-400 text-blue-700'
                } print:hidden`}>
                    <div className="flex items-center">
                        {saveStatus.isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                        <span className="text-sm">{saveStatus.message}</span>
                    </div>
                </div>
            )}

            {/* Patient Information Display */}
            {/*{patientData && (*/}
            {/*    // <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg print:hidden">*/}
            {/*    //     <h4 className="font-medium text-sm mb-2 text-blue-800">Patient Information (Auto-loaded)</h4>*/}
            {/*    //     <div className="text-xs text-blue-600 space-y-1">*/}
            {/*    //         <div><strong>Patient:</strong> {patientData.patientName}</div>*/}
            {/*    //         <div><strong>NIC:</strong> {patientData.patientNIC}</div>*/}
            {/*    //         <div><strong>Age:</strong> {patientData.patientAge}</div>*/}
            {/*    //         <div><strong>Contact:</strong> {patientData.patientPhone}</div>*/}
            {/*    //     </div>*/}
            {/*    // </div>*/}
            {/*)}*/}

            {/* Main Form Content */}
            <div className="prescription-content">
                <div className="p-6 space-y-6">
                    {/* Patient Information Fields */}
                    <div className="grid grid-cols-2 gap-6">
                        <input
                            type="text"
                            name="prescriptionId"
                            placeholder="Prescription Id"
                            value={formData.prescriptionId}
                            onChange={handlePatientInfoChange}
                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                        />
                        <input
                            type="text"
                            name="patientName"
                            placeholder="Patient Name"
                            value={formData.patientName}
                            onChange={handlePatientInfoChange}
                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                        />
                        <input
                            type="text"
                            name="age"
                            placeholder="Age"
                            value={formData.age}
                            onChange={handlePatientInfoChange}
                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                        />
                        <input
                            type="text"
                            name="gender"
                            placeholder="Gender"
                            value={formData.gender}
                            onChange={handlePatientInfoChange}
                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                        />
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handlePatientInfoChange}
                            className="w-full border-b focus:border-teal-500 outline-none py-1 bg-transparent"
                        />
                    </div>

                    {/* History & Lab Test Sections */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            name="history"
                            placeholder="Patient History"
                            value={formData.history}
                            onChange={handlePatientInfoChange}
                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                        />
                        <input
                            type="text"
                            name="lx"
                            placeholder="Lab Tests to be done"
                            value={formData.lx}
                            onChange={handlePatientInfoChange}
                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                        />
                    </div>

                    {/* RX Section */}
                    <div className="mt-4">
                        <h3 className="text-3xl font-light text-gray-400 mb-4">R<span className="text-4xl">x</span></h3>
                        <div className="space-y-4">
                            {formData.drugs.map((drug) => (
                                <div key={drug.id} className="p-4 border rounded-md relative print:border-none print:p-0">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <input
                                            type="text"
                                            name="drugName"
                                            placeholder="Drug Name"
                                            value={drug.drugName}
                                            onChange={e => handleDrugChange(drug.id, e)}
                                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                                        />
                                        <input
                                            type="text"
                                            name="strength"
                                            placeholder="Strength (Ml/Mg)"
                                            value={drug.strength}
                                            onChange={e => handleDrugChange(drug.id, e)}
                                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                                        />
                                        <input
                                            type="text"
                                            name="dosage"
                                            placeholder="Dosage (T/C/S)"
                                            value={drug.dosage}
                                            onChange={e => handleDrugChange(drug.id, e)}
                                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                                        />
                                        <input
                                            type="text"
                                            name="brand"
                                            placeholder="Brand"
                                            value={drug.brand}
                                            onChange={e => handleDrugChange(drug.id, e)}
                                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                                        />
                                        <input
                                            type="text"
                                            name="duration"
                                            placeholder="Duration"
                                            value={drug.duration}
                                            onChange={e => handleDrugChange(drug.id, e)}
                                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                                        />
                                        <input
                                            type="text"
                                            name="instructions"
                                            placeholder="Instructions"
                                            value={drug.instructions}
                                            onChange={e => handleDrugChange(drug.id, e)}
                                            className="w-full border-b focus:border-teal-500 outline-none py-1"
                                        />
                                    </div>
                                    {formData.drugs.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDrug(drug.id)}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 print:hidden"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}

                            <div className="mt-4 flex justify-start print:hidden">
                                <button
                                    type="button"
                                    onClick={handleAddDrug}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-teal-600 hover:text-teal-800"
                                >
                                    <PlusCircle size={18} />
                                    <span>Add Another Drug</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-teal-500 h-4 mt-5"></div>
            </div>

            {/* Hidden Print Version for PDF Generation */}
            <div ref={printRef} style={{ display: 'none' }} className="prescription-print">
                <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>

                    {/* Enhanced Header with PrescriptionHeader styling */}
                    <div style={{
                        background: `linear-gradient(135deg, ${headerBgColor} 0%, ${headerBgColor}dd 100%)`,
                        color: 'white',
                        padding: '20px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {/* Decorative Background Pattern */}
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            right: '0',
                            width: '150px',
                            height: '150px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            transform: 'translate(50px, -50px)'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            width: '100px',
                            height: '100px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            transform: 'translate(-30px, 30px)'
                        }}></div>

                        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            {/* Doctor Information */}
                            <div style={{ flex: 1 }}>
                                {doctorDetails ? (
                                    <>
                                        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>
                                            Dr. {doctorDetails.name}
                                        </h2>
                                        <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.9 }}>
                                            {doctorDetails.qualification}
                                        </p>
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                            <strong>SLMC Reg:</strong> {doctorDetails.slmcNumber}
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>
                                            Doctor Information
                                        </h2>
                                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                                            Lab Test Prescription
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Hospital/Practice Information */}
                            <div style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '8px',
                                padding: '12px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                minWidth: '200px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {/* Logo placeholder */}
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: 'rgba(255,255,255,0.3)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        color: 'white'
                                    }}>
                                        {hospitalSummary?.logoUrl ? (
                                            <img
                                                src={hospitalSummary.logoUrl}
                                                alt="Logo"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                            />
                                        ) : (
                                            'LOGO'
                                        )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
                                            {hospitalSummary?.businessName || 'Medical Practice'}
                                        </div>
                                        <div style={{ fontSize: '10px', opacity: 0.9 }}>
                                            {hospitalSummary?.address || 'Medical Center'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date and Prescription ID */}
                        <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '20px',
                            fontSize: '11px',
                            opacity: 0.8
                        }}>
                            <div>Date: {new Date().toLocaleDateString()}</div>
                            <div>ID: {formData.prescriptionId}</div>
                        </div>
                    </div>

                    {/* Patient Info Section */}
                    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#374151', fontSize: '16px', fontWeight: 'bold' }}>Patient Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '14px' }}>
                            <div><strong>Name:</strong> {formData.patientName}</div>
                            <div><strong>Age:</strong> {formData.age}</div>
                            <div><strong>Gender:</strong> {formData.gender}</div>
                        </div>

                        {formData.history && (
                            <div style={{ marginTop: '15px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <strong style={{ color: '#374151' }}>Patient History:</strong>
                                <div style={{ marginTop: '5px', color: '#6b7280' }}>{formData.history}</div>
                            </div>
                        )}

                        {formData.lx && (
                            <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #f59e0b' }}>
                                <strong style={{ color: '#92400e' }}>Lab Tests Ordered:</strong>
                                <div style={{ marginTop: '5px', color: '#92400e' }}>{formData.lx}</div>
                            </div>
                        )}
                    </div>

                    {/* Medications Section */}
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '36px', fontWeight: 'normal' }}>
                            R<span style={{ fontSize: '48px' }}>x</span>
                        </h3>

                        {formData.drugs.filter(drug => drug.drugName.trim()).length > 0 ? (
                            formData.drugs.filter(drug => drug.drugName.trim()).map((drug) => (
                                <div key={drug.id} style={{
                                    marginBottom: '20px',
                                    padding: '16px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    backgroundColor: '#f8fafc'
                                }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '12px',
                                        fontSize: '14px',
                                        lineHeight: '1.5'
                                    }}>
                                        <div><strong style={{ color: '#374151' }}>Drug Name:</strong> <span style={{ color: '#1f2937' }}>{drug.drugName}</span></div>
                                        <div><strong style={{ color: '#374151' }}>Strength:</strong> <span style={{ color: '#1f2937' }}>{drug.strength}</span></div>
                                        <div><strong style={{ color: '#374151' }}>Dosage:</strong> <span style={{ color: '#1f2937' }}>{drug.dosage}</span></div>
                                        <div><strong style={{ color: '#374151' }}>Brand:</strong> <span style={{ color: '#1f2937' }}>{drug.brand}</span></div>
                                        <div><strong style={{ color: '#374151' }}>Duration:</strong> <span style={{ color: '#1f2937' }}>{drug.duration}</span></div>
                                        <div><strong style={{ color: '#374151' }}>Instructions:</strong> <span style={{ color: '#1f2937' }}>{drug.instructions}</span></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                padding: '20px',
                                textAlign: 'center',
                                color: '#6b7280',
                                fontStyle: 'italic',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '2px dashed #d1d5db'
                            }}>
                                No medications prescribed
                            </div>
                        )}
                    </div>

                    {/* Footer with Doctor Signature */}
                    <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                <div>Generated on: {new Date().toLocaleString()}</div>
                                <div>Prescription Type: Lab Test Prescription</div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div style={{ borderTop: '1px solid #374151', width: '200px', marginBottom: '5px' }}></div>
                                <div style={{ fontSize: '12px', color: '#374151' }}>
                                    {doctorDetails ? `Dr. ${doctorDetails.name}` : "Doctor's Signature"}
                                </div>
                                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                                    {doctorDetails?.slmcNumber && `SLMC: ${doctorDetails.slmcNumber}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom color bar */}
                    <div style={{ height: '8px', backgroundColor: headerBgColor }}></div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center print:hidden">
                <div className="flex space-x-3">
                    <button
                        onClick={handleReset}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        disabled={saveStatus.isLoading}
                    >
                        Reset
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
                        disabled={saveStatus.isLoading}
                    >
                        <FileText size={18} className="inline mr-2"/>
                        Print
                    </button>
                </div>

                <button
                    onClick={handleSavePrescription}
                    disabled={!canSave || saveStatus.isLoading}
                    className={`px-6 py-2 rounded-md flex items-center space-x-2 ${
                        canSave && !saveStatus.isLoading
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {saveStatus.isLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <Save size={18} />
                    )}
                    <span>{saveStatus.isLoading ? 'Saving...' : 'Save Prescription'}</span>
                </button>
            </div>
        </div>
    );
}