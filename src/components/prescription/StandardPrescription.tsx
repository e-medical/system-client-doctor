import {X, PlusCircle, Trash2, Save, FileText, Loader2} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useEffect, useState, useRef, ChangeEvent} from 'react';

// Import services and types
import {getCurrentUserDetails} from '../../services/UserService.ts';
import {getHospitalDetails} from '../../services/hospitals/hospitalGetById.ts';
import {getAllDoctors, Doctor} from "../../services/doctorService";
import {createPrescription, CreatePrescriptionRequest} from "../../patientsManagement/services/prescriptionService";
import {getPatientByNIC, Patient} from "../../patientsManagement/services/getPatientById.ts";

// --- TYPE DEFINITIONS ---
interface DoctorDetails {
    name: string;
    qualification: string;
    slmcNumber: string;
}

interface Drug {
    id: number;
    drugName: string;
    strength: string;
    dosage: string;
    brand: string;
    duration: string;
    instructions: string;
}

interface DefaultPrescriptionProps {
    doctorId?: string | null | undefined;
    appointmentId?: string | null | undefined;
    patientNIC?: string | null | undefined;
}

interface SaveStatus {
    isLoading: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | null;
}

export default function StandardPrescription({doctorId, appointmentId, patientNIC}: DefaultPrescriptionProps) {
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement>(null);

    // --- STATE MANAGEMENT ---
    const [hospitalSummary, setHospitalSummary] = useState<{
        businessName: string,
        logoUrl: string,
        address: string
    } | null>(null);
    const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null);
    const [patientData, setPatientData] = useState<Patient | null>(null);
    const [patientId, setPatientId] = useState<string | null>(null);
    // Use the passed doctorId prop directly
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>({
        isLoading: false,
        message: '',
        type: null
    });

    const [formData, setFormData] = useState({
        prescriptionId: `RX-${Date.now()}`,
        patientName: '',
        age: '',
        gender: '',
        date: new Date().toISOString().split('T')[0],
        drugs: [
            {id: Date.now(), drugName: '', strength: '', dosage: '', brand: '', duration: '', instructions: ''}
        ] as Drug[]
    });

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // 1. Get User Details first
                const user = await getCurrentUserDetails();
                if (!user?._id) {
                    setError("Could not identify logged-in user. Please log in again.");
                    setIsLoading(false);
                    return;
                }

                // 2. Fetch doctor list and hospital details in parallel
                const [doctorResponse, hospitalData] = await Promise.all([
                    getAllDoctors(),
                    user.hospital ? getHospitalDetails(user.hospital) : Promise.resolve(null)
                ]);

                // --- Process Doctor Data ---
                const currentDoctor = doctorResponse.data?.find((doc: Doctor) => doc.systemUser?.id === user._id);
                if (currentDoctor) {
                    setDoctorDetails({
                        name: currentDoctor.doctorName,
                        qualification: currentDoctor.qualification,
                        slmcNumber: currentDoctor.slmcNumber,
                    });
                } else {
                    console.warn("Logged-in user does not have a matching doctor profile.");
                }

                // --- Process Hospital Data ---
                if (hospitalData) {
                    setHospitalSummary({
                        businessName: hospitalData.businessName,
                        address: hospitalData.address,
                        logoUrl: ''
                    });
                } else {
                    console.warn("Could not fetch hospital details for this user.");
                }

                // 3. Fetch patient data if NIC is provided
                if (patientNIC) {
                    try {
                        setSaveStatus({ isLoading: true, message: 'Loading patient data...', type: 'info' });
                        const patientResponse = await getPatientByNIC(patientNIC);
                        if (patientResponse?.patient) {
                            setPatientData(patientResponse.patient);
                            // Store the patient ID for prescription saving
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

                            // Auto-hide success message after 2 seconds
                            setTimeout(() => {
                                setSaveStatus({ isLoading: false, message: '', type: null });
                            }, 2000);
                        }
                    } catch (patientError: any) {
                        console.warn("Could not fetch patient data:", patientError);
                        setSaveStatus({
                            isLoading: false,
                            message: `Patient not found with NIC: ${patientNIC}. Please verify the NIC number.`,
                            type: 'error'
                        });
                    }
                }

            } catch (err) {
                console.error("❌ Error fetching prescription data:", err);
                setError("Failed to load required data. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        void fetchData();
    }, [patientNIC]);

    // --- PDF GENERATION UTILITIES ---
    const generatePrescriptionPDF = async (): Promise<File> => {
        return new Promise((resolve, reject) => {
            try {
                // Import html2canvas and jsPDF dynamically
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
                            const pdfFile = new File([pdfBlob], `prescription-${formData.prescriptionId}-${Date.now()}.pdf`, {
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
    const handlePatientInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleDrugChange = (id: number, e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            drugs: prev.drugs.map(drug =>
                drug.id === id ? {...drug, [name]: value} : drug
            )
        }));
    };

    const handleAddDrug = () => {
        setFormData(prev => ({
            ...prev,
            drugs: [
                ...prev.drugs,
                {id: Date.now(), drugName: '', strength: '', dosage: '', brand: '', duration: '', instructions: ''}
            ]
        }));
    };

    const handleRemoveDrug = (id: number) => {
        setFormData(prev => ({
            ...prev,
            drugs: prev.drugs.filter(drug => drug.id !== id)
        }));
    };

    const handlePrint = () => window.print();

    const handleReset = () => {
        setFormData({
            prescriptionId: `RX-${Date.now()}`,
            patientName: patientData?.patientName || '',
            age: patientData?.patientAge?.toString() || '',
            gender: patientData?.patientGender || '',
            date: new Date().toISOString().split('T')[0],
            drugs: [{id: Date.now(), drugName: '', strength: '', dosage: '', brand: '', duration: '', instructions: ''}]
        });
        setSaveStatus({ isLoading: false, message: '', type: null });
    };

    const handleSavePrescription = async () => {
        // Validation - Use the passed doctorId prop
        if (!doctorId || !appointmentId) {
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
                message: 'Patient information is required to save prescription. Please provide a valid patient NIC.',
                type: 'error'
            });
            return;
        }

        if (!formData.patientName.trim() || formData.drugs.some(drug => !drug.drugName.trim())) {
            setSaveStatus({
                isLoading: false,
                message: 'Please fill in patient name and at least one drug',
                type: 'error'
            });
            return;
        }

        setSaveStatus({ isLoading: true, message: 'Generating prescription PDF...', type: 'info' });

        try {
            // Generate PDF
            const pdfFile = await generatePrescriptionPDF();

            setSaveStatus({ isLoading: true, message: 'Saving prescription...', type: 'info' });

            // Prepare prescription data - Use the found patientId and passed doctorId prop
            const prescriptionPayload: CreatePrescriptionRequest = {
                patientId: patientId, // Use the patient ID found by NIC
                doctorId: doctorId, // Use the prop directly
                appointmentId: appointmentId,
                prescriptionImage: pdfFile
            };

            console.log('Saving prescription with payload:', {
                patientId: prescriptionPayload.patientId,
                patientNIC: patientNIC,
                patientName: formData.patientName,
                doctorId: prescriptionPayload.doctorId,
                appointmentId: prescriptionPayload.appointmentId,
                pdfSize: pdfFile.size
            });

            // Save prescription
            await createPrescription(prescriptionPayload);

            setSaveStatus({
                isLoading: false,
                message: 'Prescription saved successfully!',
                type: 'success'
            });

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSaveStatus({ isLoading: false, message: '', type: null });
            }, 3000);

        } catch (error: any) {
            console.error('Error saving prescription:', error);
            setSaveStatus({
                isLoading: false,
                message: error.message || 'Failed to save prescription',
                type: 'error'
            });
        }
    };

    const handleCancel = () => navigate(-1);

    // Check if we have the required data to save - Use the found patientId and passed doctorId prop
    const canSave = doctorId && appointmentId && patientId && formData.patientName.trim() &&
        formData.drugs.some(drug => drug.drugName.trim());

    return (
        <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none">
            {/* Header */}
            <div className="bg-white px-6 py-4 border-b flex justify-between items-center print:hidden">
                <h1 className="text-xl font-semibold text-gray-800">Prescription</h1>
                <button className="text-gray-400 hover:text-gray-600" onClick={handleCancel}>
                    <X size={24}/>
                </button>
            </div>

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

            {/* Prescription Content - Visible Version */}
            <div className="prescription-content">
                {/* Doctor Info Header */}
                <div className="bg-teal-500 text-white px-6 py-4 flex justify-between items-start">
                    {isLoading ? <div className="text-sm">Loading...</div> : error ?
                        <div className="text-sm text-red-200">{error}</div> : doctorDetails && (
                        <>
                            <div>
                                <h2 className="text-lg font-semibold">Dr {doctorDetails.name}</h2>
                                <p className="text-sm opacity-90">{doctorDetails.qualification}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold">SLMC Reg.</p>
                                <p className="text-sm opacity-90">{doctorDetails.slmcNumber}</p>
                            </div>
                        </>
                    )}
                    <div className="bg-white rounded-lg px-3 py-2 flex items-center space-x-2 text-teal-600">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                            {hospitalSummary?.logoUrl ?
                                <img src={hospitalSummary.logoUrl} alt="Logo" className="w-full h-full object-cover"/> :
                                <span className="text-xs text-center">No Logo</span>}
                        </div>
                        <div className="text-xs">
                            <div className="font-semibold">{hospitalSummary?.businessName || 'Hospital'}</div>
                            <div>{hospitalSummary?.address || 'Address'}</div>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-6">
                    {/* Patient Information */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <input type="text" name="prescriptionId" placeholder="Prescription Id"
                               value={formData.prescriptionId} onChange={handlePatientInfoChange}
                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                        <input type="text" name="patientName" placeholder="Patient Name" value={formData.patientName}
                               onChange={handlePatientInfoChange}
                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                        <input type="text" name="age" placeholder="Age" value={formData.age}
                               onChange={handlePatientInfoChange}
                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                        <input type="text" name="gender" placeholder="Gender" value={formData.gender}
                               onChange={handlePatientInfoChange}
                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                        <input type="date" name="date" value={formData.date} onChange={handlePatientInfoChange}
                               className="w-full border-b focus:border-teal-500 outline-none py-1 bg-transparent"/>
                    </div>

                    {/* RX Section */}
                    <div className="mt-4">
                        <h3 className="text-3xl font-light text-gray-400 mb-4">R<span className="text-4xl">x</span></h3>
                        <div className="space-y-4">
                            {formData.drugs.map((drug) => (
                                <div key={drug.id} className="p-4 border rounded-md relative print:border-none print:p-0">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <input type="text" name="drugName" placeholder="Drug Name" value={drug.drugName}
                                               onChange={e => handleDrugChange(drug.id, e)}
                                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                                        <input type="text" name="strength" placeholder="Strength (Ml/Mg)"
                                               value={drug.strength} onChange={e => handleDrugChange(drug.id, e)}
                                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                                        <input type="text" name="dosage" placeholder="Dosage (T/C/S)" value={drug.dosage}
                                               onChange={e => handleDrugChange(drug.id, e)}
                                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                                        <input type="text" name="brand" placeholder="Brand" value={drug.brand}
                                               onChange={e => handleDrugChange(drug.id, e)}
                                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                                        <input type="text" name="duration" placeholder="Duration" value={drug.duration}
                                               onChange={e => handleDrugChange(drug.id, e)}
                                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                                        <input type="text" name="instructions" placeholder="Instructions"
                                               value={drug.instructions} onChange={e => handleDrugChange(drug.id, e)}
                                               className="w-full border-b focus:border-teal-500 outline-none py-1"/>
                                    </div>
                                    {formData.drugs.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveDrug(drug.id)}
                                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 print:hidden">
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div className="mt-4 flex justify-start print:hidden">
                                <button type="button" onClick={handleAddDrug}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-teal-600 hover:text-teal-800">
                                    <PlusCircle size={18}/>
                                    <span>Add Another Drug</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-teal-500 h-4"></div>
            </div>

            {/* Hidden Print Version for PDF Generation */}
            <div ref={printRef} style={{ display: 'none' }} className="prescription-print">
                {/* Same content structure but optimized for PDF */}
                <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', backgroundColor: 'white' }}>
                    {/* Doctor Header */}
                    <div style={{ backgroundColor: '#14b8a6', color: 'white', padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                                Dr {doctorDetails?.name || 'Doctor Name'}
                            </h2>
                            <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
                                {doctorDetails?.qualification || 'Qualification'}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0' }}>SLMC Reg.</p>
                            <p style={{ fontSize: '14px', margin: 0, opacity: 0.9 }}>
                                {doctorDetails?.slmcNumber || 'SLMC Number'}
                            </p>
                        </div>
                    </div>

                    {/* Hospital Info */}
                    <div style={{ padding: '10px 20px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            {hospitalSummary?.businessName || 'Hospital Name'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {hospitalSummary?.address || 'Hospital Address'}
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div style={{ padding: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div><strong>Prescription ID:</strong> {formData.prescriptionId}</div>
                            <div><strong>Patient Name:</strong> {formData.patientName}</div>
                            <div><strong>Age:</strong> {formData.age}</div>
                            <div><strong>Gender:</strong> {formData.gender}</div>
                            <div><strong>Date:</strong> {formData.date}</div>
                        </div>

                        {/* Rx Section */}
                        <div style={{ marginTop: '30px' }}>
                            <h3 style={{ fontSize: '36px', color: '#9ca3af', fontWeight: 'normal', margin: '0 0 20px 0' }}>
                                R<span style={{ fontSize: '48px' }}>x</span>
                            </h3>

                            {formData.drugs.map((drug) => (
                                <div key={drug.id} style={{
                                    marginBottom: '20px',
                                    padding: '15px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '5px'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                                        <div><strong>Drug:</strong> {drug.drugName}</div>
                                        <div><strong>Strength:</strong> {drug.strength}</div>
                                        <div><strong>Dosage:</strong> {drug.dosage}</div>
                                        <div><strong>Brand:</strong> {drug.brand}</div>
                                        <div><strong>Duration:</strong> {drug.duration}</div>
                                        <div><strong>Instructions:</strong> {drug.instructions}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Doctor Signature Area */}
                        <div style={{ marginTop: '40px', textAlign: 'right' }}>
                            <div style={{ borderTop: '1px solid #000', width: '200px', marginLeft: 'auto', marginBottom: '5px' }}></div>
                            <div style={{ fontSize: '12px' }}>Doctor's Signature</div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ backgroundColor: '#14b8a6', height: '10px' }}></div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-gray-50 flex justify-between items-center print:hidden">
                <div className="flex space-x-3">
                    <button onClick={handleReset}
                            className="px-6 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            disabled={saveStatus.isLoading}>
                        Reset
                    </button>
                    <button onClick={handlePrint}
                            className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600"
                            disabled={saveStatus.isLoading}>
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