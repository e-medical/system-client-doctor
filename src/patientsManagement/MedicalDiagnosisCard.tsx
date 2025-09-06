import {useState, useRef, ChangeEvent, FormEvent} from 'react';
import SignatureCanvas from 'react-signature-canvas';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { getPatientByNIC } from "../services/prescriptions/getPatientById.ts";
import { createDiagnosisCard, CreateDiagnosisCardRequest } from "../services/prescriptions/diagnosisCardService.ts";
import logo from '/assets/logo.png';

// Define Interfaces for better type safety
interface PatientInfo {
    name: string;
    age: string;
    gender: string;
    patientId: string;
    dateOfVisit: string;
    referringDoctor: string;
}

interface PastMedicalHistory {
    diabetes: boolean;
    hypertension: boolean;
    asthma: boolean;
    heartDisease: boolean;
    other: string;
}

interface ClinicalInfo {
    presentingComplaints: string;
    historyOfPresentIllness: string;
    pastMedicalHistory: PastMedicalHistory;
    drugHistoryAllergies: string;
}

interface GeneralExamination {
    bp: string;
    hr: string;
    temp: string;
    spo2: string;
}

interface SystemicExamination {
    cvs: string;
    rs: string;
    abdomen: string;
    cns: string;
}

interface InvestigationsOrdered {
    cbc: boolean;
    xray: boolean;
    ecg: boolean;
    bloodSugar: boolean;
    mri: boolean;
    other: string;
}

interface ExaminationFindings {
    generalExamination: GeneralExamination;
    systemicExamination: SystemicExamination;
    investigationsOrdered: InvestigationsOrdered;
}

interface Diagnosis {
    primaryDiagnosis: string;
    secondaryDiagnosis: string;
    icd10Codes: string;
}

interface TreatmentPlan {
    treatmentPlanMedications: string;
    procedures: string;
    lifestyleDietaryAdvice: string;
    followUpDateReferral: string;
}

interface MedicalDiagnosisCardProps {
    patientNIC?: string | undefined
}

// Helper function to validate and convert date
const parseDate = (dateString: string): Date | null => {
    if (!dateString || dateString.trim() === '') {
        return null;
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
};

const MedicalDiagnosisCard: React.FC<MedicalDiagnosisCardProps> = ({patientNIC}) => {
    // State for form fields
    console.log("diagnosis", patientNIC);
    const [patientInfo, setPatientInfo] = useState<PatientInfo>({
        name: '', age: '', gender: '', patientId: '', dateOfVisit: '', referringDoctor: '',
    });

    const [clinicalInfo, setClinicalInfo] = useState<ClinicalInfo>({
        presentingComplaints: '', historyOfPresentIllness: '',
        pastMedicalHistory: {diabetes: false, hypertension: false, asthma: false, heartDisease: false, other: ''},
        drugHistoryAllergies: '',
    });

    const [examinationFindings, setExaminationFindings] = useState<ExaminationFindings>({
        generalExamination: {bp: '', hr: '', temp: '', spo2: ''},
        systemicExamination: {cvs: '', rs: '', abdomen: '', cns: ''},
        investigationsOrdered: {cbc: false, xray: false, ecg: false, bloodSugar: false, mri: false, other: ''},
    });

    const [diagnosis, setDiagnosis] = useState<Diagnosis>({
        primaryDiagnosis: '', secondaryDiagnosis: '', icd10Codes: '',
    });

    const [treatmentPlan, setTreatmentPlan] = useState<TreatmentPlan>({
        treatmentPlanMedications: '', procedures: '', lifestyleDietaryAdvice: '', followUpDateReferral: '',
    });

    // New state for signature
    const [signatureMethod, setSignatureMethod] = useState<'none' | 'upload' | 'draw' | 'type'>('none');
    const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
    const [typedSignature, setTypedSignature] = useState<string>('');
    const [signatureDate, setSignatureDate] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

    const sigCanvas = useRef<any>(null);
    const formRef = useRef<HTMLDivElement>(null);

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

    // Handlers for form fields
    const handlePatientInfoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setPatientInfo((prev) => ({...prev, [name]: value}));
    };

    const handleClinicalInfoChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const {name, value} = e.target;
        setClinicalInfo((prev) => ({...prev, [name]: value}));
    };

    const handlePastMedicalHistoryChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, type, checked, value} = e.target;
        setClinicalInfo((prev) => ({
            ...prev,
            pastMedicalHistory: {
                ...prev.pastMedicalHistory,
                [name]: type === 'checkbox' ? checked : value,
            },
        }));
    };

    const handleGeneralExaminationChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setExaminationFindings((prev) => ({
            ...prev,
            generalExamination: {
                ...prev.generalExamination,
                [name]: value,
            },
        }));
    };

    const handleSystemicExaminationChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setExaminationFindings((prev) => ({
            ...prev,
            systemicExamination: {
                ...prev.systemicExamination,
                [name]: value,
            },
        }));
    };

    const handleInvestigationsOrderedChange = (e: ChangeEvent<HTMLInputElement>) => {
        const {name, type, checked, value} = e.target;
        setExaminationFindings((prev) => ({
            ...prev,
            investigationsOrdered: {
                ...prev.investigationsOrdered,
                [name]: type === 'checkbox' ? checked : value,
            },
        }));
    };

    const handleDiagnosisChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const {name, value} = e.target;
        setDiagnosis((prev) => ({...prev, [name]: value}));
    };

    const handleTreatmentPlanChange = (e: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const {name, value} = e.target;
        setTreatmentPlan((prev) => ({...prev, [name]: value}));
    };

    // Handlers for Signature Input
    const handleSignatureMethodChange = (method: typeof signatureMethod) => {
        setSignatureMethod(method);
        setUploadedSignature(null);
        setTypedSignature('');
        if (sigCanvas.current) {
            sigCanvas.current.clear();
        }
    };

    const handleUploadSignature = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedSignature(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleClearSignaturePad = () => {
        if (sigCanvas.current) {
            sigCanvas.current.clear();
            setUploadedSignature(null);
        }
    };

    const handleSaveSignaturePad = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            setUploadedSignature(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
        } else {
            setUploadedSignature(null);
        }
    };

    const handleTypedSignatureChange = (e: ChangeEvent<HTMLInputElement>) => {
        setTypedSignature(e.target.value);
    };

    // Generate PDF from the form
    const generatePDF = async (): Promise<File> => {
        if (!formRef.current) {
            throw new Error('Form reference not found');
        }

        try {
            // Hide interactive elements for PDF
            const buttons = formRef.current.querySelectorAll('button, input[type="file"]');
            // const checkboxes = formRef.current.querySelectorAll('input[type="checkbox"]');
            // const radioButtons = formRef.current.querySelectorAll('input[type="radio"]');

            // Store original display values
            const originalDisplays: string[] = [];

            buttons.forEach((button, index) => {
                originalDisplays[index] = (button as HTMLElement).style.display;
                (button as HTMLElement).style.display = 'none';
            });

            // Add a temporary style element for better PDF rendering
            const style = document.createElement('style');
            style.textContent = `
                .pdf-render * {
                    box-sizing: border-box !important;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                .pdf-render input[type="text"], 
                .pdf-render input[type="date"], 
                .pdf-render textarea {
                    border: 1px solid #d1d5db !important;
                    background: white !important;
                    padding: 8px !important;
                    font-size: 12px !important;
                    line-height: 1.2 !important;
                    word-wrap: break-word !important;
                }
                .pdf-render input[type="checkbox"] {
                    width: 16px !important;
                    height: 16px !important;
                    margin-right: 8px !important;
                }
                .pdf-render textarea {
                    min-height: 40px !important;
                    resize: none !important;
                }
                .pdf-render .grid {
                    display: grid !important;
                }
                .pdf-render .flex {
                    display: flex !important;
                }
                .pdf-render .border-b {
                    border-bottom: 1px solid #e5e7eb !important;
                }
                .pdf-render .mb-4 {
                    margin-bottom: 16px !important;
                }
                .pdf-render .mb-6 {
                    margin-bottom: 24px !important;
                }
                .pdf-render .p-2 {
                    padding: 8px !important;
                }
                .pdf-render .text-sm {
                    font-size: 12px !important;
                }
                .pdf-render .font-bold {
                    font-weight: bold !important;
                }
                .pdf-render .font-semibold {
                    font-weight: 600 !important;
                }
                .pdf-render h3 {
                    font-size: 16px !important;
                    font-weight: 600 !important;
                    margin-bottom: 16px !important;
                }
                .pdf-render h4 {
                    font-size: 14px !important;
                    font-weight: 600 !important;
                    margin-bottom: 12px !important;
                }
                .pdf-render label {
                    font-size: 12px !important;
                    font-weight: bold !important;
                    color: #4b5563 !important;
                    margin-bottom: 4px !important;
                    display: block !important;
                }
                .pdf-render img {
                    max-width: 100% !important;
                    height: auto !important;
                }
                .pdf-render .signature-section {
                    min-height: 100px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                }
            `;
            document.head.appendChild(style);

            // Add PDF render class to form
            formRef.current.classList.add('pdf-render');

            // Generate canvas with improved settings
            const canvas = await html2canvas(formRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: formRef.current.scrollWidth,
                height: formRef.current.scrollHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: formRef.current.scrollWidth,
                windowHeight: formRef.current.scrollHeight
            });

            // Clean up
            formRef.current.classList.remove('pdf-render');
            document.head.removeChild(style);

            // Restore original display values
            buttons.forEach((button, index) => {
                (button as HTMLElement).style.display = originalDisplays[index] || '';
            });

            // Create PDF with better sizing
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Add additional pages if needed
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            // Convert PDF to File
            const pdfBlob = pdf.output('blob');
            const pdfFile = new File([pdfBlob], `diagnosis-card-${Date.now()}.pdf`, {
                type: 'application/pdf',
            });

            return pdfFile;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('Failed to generate PDF');
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!patientNIC) {
            showSnackbar('Patient NIC is required to create diagnosis card.', 'error');
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

            // Step 2: Generate PDF
            showSnackbar('Generating diagnosis card PDF...', 'info');
            const pdfFile = await generatePDF();

            // Step 3: Prepare signature data
            if (signatureMethod === 'upload' && uploadedSignature) {
            } else if (signatureMethod === 'draw' && sigCanvas.current && !sigCanvas.current.isEmpty()) {
            } else if (signatureMethod === 'type' && typedSignature) {
            }

            // Step 4: Prepare diagnosis card data with proper date handling
            const followUpDate = parseDate(treatmentPlan.followUpDateReferral);

            const diagnosisCardData: CreateDiagnosisCardRequest = {
                patientId: patient.propertyId, // Use patient's propertyId
                diagnosisCardPdf: pdfFile,
                diagnosis: `${diagnosis.primaryDiagnosis}${diagnosis.secondaryDiagnosis ? ` | ${diagnosis.secondaryDiagnosis}` : ''}`,
                notes: `Clinical Info: ${clinicalInfo.presentingComplaints} | Treatment: ${treatmentPlan.treatmentPlanMedications}`,
                expiryDate: followUpDate ? followUpDate.toISOString() : undefined,
            };

            // Step 5: Create diagnosis card
            console.log('Creating diagnosis card:', {
                patientId: diagnosisCardData.patientId,
                pdfFileName: pdfFile.name,
                pdfSize: pdfFile.size,
                diagnosis: diagnosisCardData.diagnosis,
                expiryDate: diagnosisCardData.expiryDate
            });

            showSnackbar('Uploading diagnosis card...', 'info');
            const result = await createDiagnosisCard(diagnosisCardData);

            console.log('Diagnosis card created successfully:', result);
            showSnackbar(`Diagnosis card created successfully for ${patient.patientName}!`, 'success');

            // Step 6: Reset form
            setTimeout(() => {
                setPatientInfo({
                    name: '', age: '', gender: '', patientId: '', dateOfVisit: '', referringDoctor: '',
                });
                setClinicalInfo({
                    presentingComplaints: '', historyOfPresentIllness: '',
                    pastMedicalHistory: {diabetes: false, hypertension: false, asthma: false, heartDisease: false, other: ''},
                    drugHistoryAllergies: '',
                });
                setExaminationFindings({
                    generalExamination: {bp: '', hr: '', temp: '', spo2: ''},
                    systemicExamination: {cvs: '', rs: '', abdomen: '', cns: ''},
                    investigationsOrdered: {cbc: false, xray: false, ecg: false, bloodSugar: false, mri: false, other: ''},
                });
                setDiagnosis({
                    primaryDiagnosis: '', secondaryDiagnosis: '', icd10Codes: '',
                });
                setTreatmentPlan({
                    treatmentPlanMedications: '', procedures: '', lifestyleDietaryAdvice: '', followUpDateReferral: '',
                });
                setSignatureMethod('none');
                setUploadedSignature(null);
                setTypedSignature('');
                setSignatureDate('');
            }, 2000);

        } catch (error: any) {
            console.error('Error creating diagnosis card:', error);
            showSnackbar(error.message || 'Failed to create diagnosis card', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Reset all form data
        setPatientInfo({
            name: '', age: '', gender: '', patientId: '', dateOfVisit: '', referringDoctor: '',
        });
        setClinicalInfo({
            presentingComplaints: '', historyOfPresentIllness: '',
            pastMedicalHistory: {diabetes: false, hypertension: false, asthma: false, heartDisease: false, other: ''},
            drugHistoryAllergies: '',
        });
        setExaminationFindings({
            generalExamination: {bp: '', hr: '', temp: '', spo2: ''},
            systemicExamination: {cvs: '', rs: '', abdomen: '', cns: ''},
            investigationsOrdered: {cbc: false, xray: false, ecg: false, bloodSugar: false, mri: false, other: ''},
        });
        setDiagnosis({
            primaryDiagnosis: '', secondaryDiagnosis: '', icd10Codes: '',
        });
        setTreatmentPlan({
            treatmentPlanMedications: '', procedures: '', lifestyleDietaryAdvice: '', followUpDateReferral: '',
        });
        setSignatureMethod('none');
        setUploadedSignature(null);
        setTypedSignature('');
        setSignatureDate('');
        showSnackbar('Form cancelled and reset.', 'info');
    };

    return (
        <div className="w-full mx-auto p-5 border border-gray-200  bg-white my-5">
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

            <div ref={formRef} style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', lineHeight: '1.4' }}>
                <div className="flex w-full mb-5 pb-2 border-b border-gray-200">
                    <div className="mr-4">
                        <img src={logo} alt="Hospital Logo" className="h-8 w-8"/>
                    </div>
                    <div className="flex w-full flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                        <span>ABC Hospital PVT LTD</span>
                        <span>ABC Hospital PVT LTD</span>
                        <span>+94 789 56778</span>
                        <span>011-2536 45632</span>
                        <span>info@hospitalname.com</span>
                        <span>www.abccompany.com</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Patient Information Section */}
                    <section className="mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-1">Patient Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex flex-col">
                                <label htmlFor="name" className="font-bold mb-1 text-gray-600 text-sm">Name :</label>
                                <input type="text" id="name" name="name" value={patientInfo.name}
                                       onChange={handlePatientInfoChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="age" className="font-bold mb-1 text-gray-600 text-sm">Age :</label>
                                <input type="text" id="age" name="age" value={patientInfo.age}
                                       onChange={handlePatientInfoChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="gender" className="font-bold mb-1 text-gray-600 text-sm">Gender :</label>
                                <input type="text" id="gender" name="gender" value={patientInfo.gender}
                                       onChange={handlePatientInfoChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col">
                                <label htmlFor="patientId" className="font-bold mb-1 text-gray-600 text-sm">Patient ID / MRN :</label>
                                <input type="text" id="patientId" name="patientId" value={patientInfo.patientId}
                                       onChange={handlePatientInfoChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="dateOfVisit" className="font-bold mb-1 text-gray-600 text-sm">Date Of Visit :</label>
                                <input type="date" id="dateOfVisit" name="dateOfVisit" value={patientInfo.dateOfVisit}
                                       onChange={handlePatientInfoChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="referringDoctor" className="font-bold mb-1 text-gray-600 text-sm">Referring Doctor :</label>
                                <input type="text" id="referringDoctor" name="referringDoctor"
                                       value={patientInfo.referringDoctor} onChange={handlePatientInfoChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                        </div>
                    </section>

                    {/* Clinical Information Section */}
                    <section className="mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-1">Clinical Information</h3>
                        <div className="mb-4">
                            <label htmlFor="presentingComplaints" className="font-bold mb-1 text-gray-600 text-sm">Presenting Complaints :</label>
                            <textarea id="presentingComplaints" name="presentingComplaints" rows={2}
                                      value={clinicalInfo.presentingComplaints} onChange={handleClinicalInfoChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="historyOfPresentIllness" className="font-bold mb-1 text-gray-600 text-sm">History Of Present Illness :</label>
                            <textarea id="historyOfPresentIllness" name="historyOfPresentIllness" rows={2}
                                      value={clinicalInfo.historyOfPresentIllness} onChange={handleClinicalInfoChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                        <div className="mb-4">
                            <label className="font-bold mb-2 text-gray-600 text-sm block">Past Medical History :</label>
                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <label className="flex items-center text-gray-800 text-sm">
                                    <input type="checkbox" name="hypertension"
                                           checked={clinicalInfo.pastMedicalHistory.hypertension}
                                           onChange={handlePastMedicalHistoryChange}
                                           className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                           disabled={isSubmitting}/> Hypertension
                                </label>
                                <label className="flex items-center text-gray-800 text-sm">
                                    <input type="checkbox" name="asthma" checked={clinicalInfo.pastMedicalHistory.asthma}
                                           onChange={handlePastMedicalHistoryChange}
                                           className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                           disabled={isSubmitting}/> Asthma
                                </label>
                                <label className="flex items-center text-gray-800 text-sm">
                                    <input type="checkbox" name="heartDisease"
                                           checked={clinicalInfo.pastMedicalHistory.heartDisease}
                                           onChange={handlePastMedicalHistoryChange}
                                           className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                           disabled={isSubmitting}/> Heart Disease
                                </label>
                                <label className="flex items-center text-gray-800 text-sm">
                                    <input type="checkbox" name="other" checked={!!clinicalInfo.pastMedicalHistory.other}
                                           onChange={handlePastMedicalHistoryChange}
                                           className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                           disabled={isSubmitting}/> Other:
                                    <input type="text" name="other" value={clinicalInfo.pastMedicalHistory.other}
                                           onChange={handlePastMedicalHistoryChange}
                                           className="ml-2 p-1 border border-gray-300 rounded text-sm w-auto flex-grow disabled:bg-gray-100 disabled:text-gray-500"
                                           style={{ fontSize: '12px', padding: '4px', lineHeight: '1.2' }}
                                           disabled={!clinicalInfo.pastMedicalHistory.other || isSubmitting}/>
                                </label>
                            </div>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="drugHistoryAllergies" className="font-bold mb-1 text-gray-600 text-sm">Drug History / Allergies :</label>
                            <textarea id="drugHistoryAllergies" name="drugHistoryAllergies" rows={2}
                                      value={clinicalInfo.drugHistoryAllergies} onChange={handleClinicalInfoChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                    </section>

                    {/* Examination & Findings Section */}
                    <section className="mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-1">Examination & Findings</h3>
                        <h4 className="font-semibold mb-3 text-gray-600">General Examination :</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex flex-col">
                                <label htmlFor="bp" className="font-bold mb-1 text-gray-600 text-sm">BP :</label>
                                <input type="text" id="bp" name="bp" placeholder="mmHg"
                                       value={examinationFindings.generalExamination.bp}
                                       onChange={handleGeneralExaminationChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="hr" className="font-bold mb-1 text-gray-600 text-sm">HR :</label>
                                <input type="text" id="hr" name="hr" placeholder="bpm"
                                       value={examinationFindings.generalExamination.hr}
                                       onChange={handleGeneralExaminationChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="temp" className="font-bold mb-1 text-gray-600 text-sm">Temp :</label>
                                <input type="text" id="temp" name="temp" placeholder="°C"
                                       value={examinationFindings.generalExamination.temp}
                                       onChange={handleGeneralExaminationChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="spo2" className="font-bold mb-1 text-gray-600 text-sm">SpO2 :</label>
                                <input type="text" id="spo2" name="spo2" placeholder="%"
                                       value={examinationFindings.generalExamination.spo2}
                                       onChange={handleGeneralExaminationChange}
                                       className="p-2 border border-gray-300 rounded text-sm"
                                       style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                       disabled={isSubmitting}/>
                            </div>
                        </div>
                        <h4 className="font-semibold mb-3 text-gray-600">Systemic Examination :</h4>
                        <div className="mb-4">
                            <label htmlFor="cvs" className="font-bold mb-1 text-gray-600 text-sm">CVS :</label>
                            <input type="text" id="cvs" name="cvs" value={examinationFindings.systemicExamination.cvs}
                                   onChange={handleSystemicExaminationChange}
                                   className="w-full p-2 border border-gray-300 rounded text-sm"
                                   style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                   disabled={isSubmitting}/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="rs" className="font-bold mb-1 text-gray-600 text-sm">RS :</label>
                            <input type="text" id="rs" name="rs" value={examinationFindings.systemicExamination.rs}
                                   onChange={handleSystemicExaminationChange}
                                   className="w-full p-2 border border-gray-300 rounded text-sm"
                                   style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                   disabled={isSubmitting}/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="abdomen" className="font-bold mb-1 text-gray-600 text-sm">Abdomen :</label>
                            <input type="text" id="abdomen" name="abdomen"
                                   value={examinationFindings.systemicExamination.abdomen}
                                   onChange={handleSystemicExaminationChange}
                                   className="w-full p-2 border border-gray-300 rounded text-sm"
                                   style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                   disabled={isSubmitting}/>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="cns" className="font-bold mb-1 text-gray-600 text-sm">CNS :</label>
                            <input type="text" id="cns" name="cns" value={examinationFindings.systemicExamination.cns}
                                   onChange={handleSystemicExaminationChange}
                                   className="w-full p-2 border border-gray-300 rounded text-sm"
                                   style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                   disabled={isSubmitting}/>
                        </div>

                        <h4 className="font-semibold mb-3 text-gray-600">Investigations Ordered :</h4>
                        <div className="flex flex-wrap gap-x-6 gap-y-2">
                            <label className="flex items-center text-gray-800 text-sm">
                                <input type="checkbox" name="cbc" checked={examinationFindings.investigationsOrdered.cbc}
                                       onChange={handleInvestigationsOrderedChange}
                                       className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                       disabled={isSubmitting}/> CBC
                            </label>
                            <label className="flex items-center text-gray-800 text-sm">
                                <input type="checkbox" name="xray" checked={examinationFindings.investigationsOrdered.xray}
                                       onChange={handleInvestigationsOrderedChange}
                                       className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                       disabled={isSubmitting}/> X-Ray
                            </label>
                            <label className="flex items-center text-gray-800 text-sm">
                                <input type="checkbox" name="ecg" checked={examinationFindings.investigationsOrdered.ecg}
                                       onChange={handleInvestigationsOrderedChange}
                                       className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                       disabled={isSubmitting}/> ECG
                            </label>
                            <label className="flex items-center text-gray-800 text-sm">
                                <input type="checkbox" name="bloodSugar"
                                       checked={examinationFindings.investigationsOrdered.bloodSugar}
                                       onChange={handleInvestigationsOrderedChange}
                                       className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                       disabled={isSubmitting}/> Blood Sugar
                            </label>
                            <label className="flex items-center text-gray-800 text-sm">
                                <input type="checkbox" name="mri" checked={examinationFindings.investigationsOrdered.mri}
                                       onChange={handleInvestigationsOrderedChange}
                                       className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                       disabled={isSubmitting}/> MRI
                            </label>
                            <label className="flex items-center text-gray-800 text-sm">
                                <input type="checkbox" name="other"
                                       checked={!!examinationFindings.investigationsOrdered.other}
                                       onChange={handleInvestigationsOrderedChange}
                                       className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                       disabled={isSubmitting}/> Other:
                                <input type="text" name="other" value={examinationFindings.investigationsOrdered.other}
                                       onChange={handleInvestigationsOrderedChange}
                                       className="ml-2 p-1 border border-gray-300 rounded text-sm w-auto flex-grow disabled:bg-gray-100 disabled:text-gray-500"
                                       style={{ fontSize: '12px', padding: '4px', lineHeight: '1.2' }}
                                       disabled={!examinationFindings.investigationsOrdered.other || isSubmitting}/>
                            </label>
                        </div>
                    </section>

                    {/* Diagnosis Section */}
                    <section className="mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-1">Diagnosis</h3>
                        <div className="mb-4">
                            <label htmlFor="primaryDiagnosis" className="font-bold mb-1 text-gray-600 text-sm">Primary Diagnosis:</label>
                            <textarea id="primaryDiagnosis" name="primaryDiagnosis" rows={2}
                                      value={diagnosis.primaryDiagnosis} onChange={handleDiagnosisChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="secondaryDiagnosis" className="font-bold mb-1 text-gray-600 text-sm">Secondary Diagnosis (If Any):</label>
                            <textarea id="secondaryDiagnosis" name="secondaryDiagnosis" rows={2}
                                      value={diagnosis.secondaryDiagnosis} onChange={handleDiagnosisChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="icd10Codes" className="font-bold mb-1 text-gray-600 text-sm">ICD-10 Code(S):</label>
                            <input type="text" id="icd10Codes" name="icd10Codes" value={diagnosis.icd10Codes}
                                   onChange={handleDiagnosisChange}
                                   className="w-full p-2 border border-gray-300 rounded text-sm"
                                   style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                   disabled={isSubmitting}/>
                        </div>
                    </section>

                    {/* Treatment Plan / Medications Section */}
                    <section className="mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-1">Treatment Plan / Medications</h3>
                        <div className="mb-4">
                            <textarea id="treatmentPlanMedications" name="treatmentPlanMedications" rows={2}
                                      value={treatmentPlan.treatmentPlanMedications} onChange={handleTreatmentPlanChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                        <h4 className="font-semibold mb-3 text-gray-600">Procedures:</h4>
                        <div className="mb-4">
                            <textarea id="procedures" name="procedures" rows={2} value={treatmentPlan.procedures}
                                      onChange={handleTreatmentPlanChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                        <h4 className="font-semibold mb-3 text-gray-600">Lifestyle / Dietary Advice :</h4>
                        <div className="mb-4">
                            <textarea id="lifestyleDietaryAdvice" name="lifestyleDietaryAdvice" rows={2}
                                      value={treatmentPlan.lifestyleDietaryAdvice} onChange={handleTreatmentPlanChange}
                                      className="w-full p-2 border border-gray-300 rounded text-sm resize-y min-h-[40px]"
                                      style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2', wordWrap: 'break-word' }}
                                      disabled={isSubmitting}></textarea>
                        </div>
                        <h4 className="font-semibold mb-3 text-gray-600">Follow-Up Date / Referral :</h4>
                        <div className="mb-4">
                            <input type="date" id="followUpDateReferral" name="followUpDateReferral"
                                   value={treatmentPlan.followUpDateReferral} onChange={handleTreatmentPlanChange}
                                   className="w-full p-2 border border-gray-300 rounded text-sm"
                                   style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                   disabled={isSubmitting}/>
                        </div>
                    </section>

                    {/* Doctor Signature & Stamp Section */}
                    <section className="mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-1">Doctor Signature & Stamp</h3>
                        <div className="mb-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => handleSignatureMethodChange('upload')}
                                className={`px-4 py-2 rounded-md text-sm ${signatureMethod === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={isSubmitting}
                            >
                                Upload E-Signature
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSignatureMethodChange('draw')}
                                className={`px-4 py-2 rounded-md text-sm ${signatureMethod === 'draw' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={isSubmitting}
                            >
                                Draw Signature
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSignatureMethodChange('type')}
                                className={`px-4 py-2 rounded-md text-sm ${signatureMethod === 'type' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                disabled={isSubmitting}
                            >
                                Type Signature
                            </button>
                            <label
                                htmlFor="cameraInput"
                                className={`px-4 py-2 rounded-md text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer ${uploadedSignature && signatureMethod === 'upload' ? 'opacity-50 cursor-not-allowed' : ''} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Take Photo
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    id="cameraInput"
                                    onChange={handleUploadSignature}
                                    disabled={!!(uploadedSignature && signatureMethod === 'upload') || isSubmitting}
                                />
                            </label>
                        </div>

                        {signatureMethod === 'upload' && (
                            <div className="mt-4 p-4 border border-dashed border-gray-400 rounded-md bg-gray-50 flex flex-col items-center justify-center">
                                <label htmlFor="signatureUpload"
                                       className="cursor-pointer text-blue-600 hover:underline mb-2">
                                    Click to upload image file
                                </label>
                                <input
                                    type="file"
                                    id="signatureUpload"
                                    accept="image/*"
                                    onChange={handleUploadSignature}
                                    className="hidden"
                                    disabled={isSubmitting}
                                />
                                {uploadedSignature && (
                                    <div className="mt-4 text-center signature-section">
                                        <p className="text-gray-700 text-sm mb-2">Uploaded E-Signature:</p>
                                        <img src={uploadedSignature} alt="Uploaded Signature"
                                             className="max-w-xs max-h-32 border border-gray-300 shadow-sm mx-auto"/>
                                        <button
                                            type="button"
                                            onClick={() => setUploadedSignature(null)}
                                            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md text-xs hover:bg-red-600"
                                            disabled={isSubmitting}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {signatureMethod === 'draw' && (
                            <div className="mt-4 p-2 border border-gray-300 rounded-md bg-white">
                                <SignatureCanvas
                                    ref={sigCanvas}
                                    penColor='black'
                                    canvasProps={{
                                        width: 400,
                                        height: 150,
                                        className: 'sigCanvas border border-gray-200 w-[300px]'
                                    }}
                                    clearOnResize={false}
                                />
                                <div className="mt-2 flex gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={handleClearSignaturePad}
                                        className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                                        disabled={isSubmitting}
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveSignaturePad}
                                        className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                                        disabled={isSubmitting}
                                    >
                                        Save Drawing
                                    </button>
                                </div>
                                {uploadedSignature && signatureMethod === 'draw' && (
                                    <div className="mt-4 text-center signature-section">
                                        <p className="text-gray-700 text-sm mb-2">Current Drawing:</p>
                                        <img src={uploadedSignature} alt="Drawn Signature Preview"
                                             className="max-w-xs max-h-32 border border-gray-300 shadow-sm mx-auto"/>
                                    </div>
                                )}
                            </div>
                        )}

                        {signatureMethod === 'type' && (
                            <div className="mt-4 flex flex-col">
                                <label htmlFor="typedSignature" className="font-bold mb-1 text-gray-600 text-sm">Type Your Signature:</label>
                                <input
                                    type="text"
                                    id="typedSignature"
                                    name="typedSignature"
                                    value={typedSignature}
                                    onChange={handleTypedSignatureChange}
                                    className="p-2 border border-gray-300 rounded text-sm text-center signature-section"
                                    style={{fontFamily: 'Dancing Script, cursive', fontSize: '1.5em'}}
                                    placeholder="Type your name here..."
                                    disabled={isSubmitting}
                                />
                                {typedSignature && (
                                    <div className="mt-2 text-gray-700 text-xs italic">
                                        Note: A signature-like font will be applied for display.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Date field */}
                        <div className="mt-4 flex flex-col md:w-1/2">
                            <label htmlFor="signatureDate" className="font-bold mb-1 text-gray-600 text-sm">Date :</label>
                            <input type="date" id="signatureDate" name="signatureDate"
                                   value={signatureDate}
                                   onChange={(e) => setSignatureDate(e.target.value)}
                                   className="p-2 border border-gray-300 rounded text-sm"
                                   style={{ fontSize: '12px', padding: '8px', lineHeight: '1.2' }}
                                   disabled={isSubmitting}/>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !patientNIC}
                            className="px-5 py-2 bg-secondary text-white rounded-md hover:bg-secondary transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isSubmitting ? 'Creating...' : 'Complete'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MedicalDiagnosisCard;