import React, { useEffect, useState, useRef } from 'react';
import { Type, FileText, Calendar, Minus, Heading, Save, Loader2, BookOpen } from 'lucide-react';
import PrescriptionHeader from './PrescriptionHeader';

// Import services
import { createPrescription } from '../../patientsManagement/services/prescriptionService.ts';
import { getPatientByNIC } from '../../patientsManagement/services/getPatientById.ts';
import { getCurrentUserDetails } from '../../services/UserService';
import { getAllDoctors, Doctor } from '../../services/doctorService';
import { getHospitalDetails } from "../../services/hospitals/hospitalGetById.ts";
import {
    type ComponentType,
    type PrescriptionComponent,
    type PrescriptionTemplate,
    getDefaultTemplate,
    createPrescriptionComponent,
    saveTemplate,
    validateTemplatePayload,
    type CreateTemplatePayload
} from '../../services/prescriptionTemplateService.ts';

// ---------------------- Component Interfaces ----------------------
interface DraggableSidebarItemProps {
    id: ComponentType;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    onDragStart: (type: ComponentType) => void;
}

interface SidebarProps {
    onDragStart: (type: ComponentType) => void;
}

interface ComponentRendererProps {
    component: PrescriptionComponent;
    onRemove: (id: string) => void;
    onUpdate: (id: string, newValue: string) => void;
}

interface PrescriptionCanvasProps {
    components: PrescriptionComponent[];
    headerColor: string;
    onChangeHeaderColor: (color: string) => void;
    onRemove: (id: string) => void;
    onDrop: (type: ComponentType) => void;
    onUpdateComponent: (id: string, newValue: string) => void;
    canvasRef?: React.RefObject<HTMLDivElement | null>;
}

interface CustomPrescriptionProps {
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

interface TemplateSaveStatus {
    isLoading: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | null;
}

interface Patient {
    id?: string;
    _id?: string;
    patientName: string;
    patientNIC: string;
    patientAge?: number;
    patientGender?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientAddress?: string;
}

interface CreatePrescriptionRequest {
    patientId: string;
    appointmentId: string;
    doctorId: string;
    prescriptionImage: File;
}

// ---------------------- Components ----------------------
const DraggableSidebarItem: React.FC<DraggableSidebarItemProps> = ({
                                                                       id,
                                                                       label,
                                                                       icon: Icon,
                                                                       onDragStart,
                                                                   }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStart(id);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="border px-2 py-1 bg-white rounded shadow cursor-move text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
            <Icon size={16} />
            {label}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ onDragStart }) => (
    <div className="w-60 bg-gray-100 shadow-md p-3 flex flex-col">
        <h2 className="text-base font-semibold mb-2">Components</h2>
        <div className="space-y-3 mt-10">
            <DraggableSidebarItem id="text" label="Text Field" icon={Type} onDragStart={onDragStart} />
            <DraggableSidebarItem id="input" label="Input Field" icon={FileText} onDragStart={onDragStart} />
            <DraggableSidebarItem id="date" label="Date Picker" icon={Calendar} onDragStart={onDragStart} />
            <DraggableSidebarItem id="divider" label="Divider" icon={Minus} onDragStart={onDragStart} />
            <DraggableSidebarItem id="header" label="Section Header" icon={Heading} onDragStart={onDragStart} />
            <DraggableSidebarItem id="rx" label="RX Section" icon={Heading} onDragStart={onDragStart} />
            <DraggableSidebarItem id="lx" label="LX Section" icon={Heading} onDragStart={onDragStart} />
        </div>
    </div>
);

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component, onRemove, onUpdate }) => {
    const handleContentChange = (e: React.FormEvent<HTMLElement>) => {
        const target = e.currentTarget;
        const newValue = target.textContent || '';
        onUpdate(component.id, newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(component.id, e.target.value);
    };

    return (
        <div
            className="relative p-2 resize rounded overflow-auto group"
            style={{ resize: 'both', minHeight: '20px', minWidth: '50px' }}
        >
            <button
                className="absolute top-0 right-0 text-red-500 text-xs p-1 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={() => onRemove(component.id)}
            >
                ✕
            </button>

            {component.type === 'text' && (
                <p
                    contentEditable
                    suppressContentEditableWarning
                    className="text-lg text-gray-700 focus:outline-none w-full h-full"
                    onBlur={handleContentChange}
                >
                    {component.text || 'Enter text here...'}
                </p>
            )}
            {component.type === 'input' && (
                <input
                    type="text"
                    className="px-2 py-1 w-full h-full focus:outline-none border-b border-black"
                    placeholder="Enter value..."
                    value={component.text || ''}
                    onChange={handleInputChange}
                />
            )}
            {component.type === 'date' && (
                <input
                    type="date"
                    className="px-2 py-1 w-full h-full focus:outline-none"
                    value={component.text || new Date().toISOString().split('T')[0]}
                    onChange={handleInputChange}
                />
            )}
            {component.type === 'divider' && <hr className="my-2 border-gray-300" />}
            {component.type === 'header' && (
                <h2
                    contentEditable
                    suppressContentEditableWarning
                    className="text-lg font-bold focus:outline-none w-full h-full"
                    onBlur={handleContentChange}
                >
                    {component.text || 'Section Title'}
                </h2>
            )}
            {component.type === 'rx' && (
                <h2
                    contentEditable
                    suppressContentEditableWarning
                    className="text-4xl font-light text-blue-700 focus:outline-none w-full h-full"
                    onBlur={handleContentChange}
                >
                    {component.text || 'Rx'}
                </h2>
            )}
            {component.type === 'lx' && (
                <h2
                    contentEditable
                    suppressContentEditableWarning
                    className="text-xl font-bold focus:outline-none w-full h-full text-green-700"
                    onBlur={handleContentChange}
                >
                    {component.text || 'Lab Tests (Lx)'}
                </h2>
            )}
        </div>
    );
};

const PrescriptionCanvas: React.FC<PrescriptionCanvasProps> = ({
                                                                   components,
                                                                   headerColor,
                                                                   onChangeHeaderColor,
                                                                   onRemove,
                                                                   onDrop,
                                                                   onUpdateComponent,
                                                                   canvasRef,
                                                               }) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(false);
        const componentType = e.dataTransfer.getData('text/plain') as ComponentType;
        if (componentType) {
            onDrop(componentType);
        }
    };

    const handleChildData = (color: string) => {
        onChangeHeaderColor(color);
    };

    return (
        <div className="flex justify-center w-full mt-5">
            <div
                ref={canvasRef}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-2 bg-white border space-y-4 rounded shadow-sm max-w-2xl w-full mx-4 ${
                    isDragging ? 'border-blue-400 border-2 bg-blue-50' : ''
                }`}
                id="prescription-canvas-capture"
            >
                <PrescriptionHeader sendHeaderColorToParent={handleChildData} color={headerColor} />
                {components.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-400 italic mb-2">Create your custom prescription</p>
                        <p className="text-sm text-gray-500">Drag and drop components from the sidebar to get started</p>
                    </div>
                ) : (
                    components.map((comp: PrescriptionComponent) => (
                        <ComponentRenderer
                            key={comp.id}
                            component={comp}
                            onRemove={onRemove}
                            onUpdate={onUpdateComponent}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ---------------------- Main Component ----------------------
const CustomPrescription: React.FC<CustomPrescriptionProps> = ({
                                                                   doctorId,
                                                                   appointmentId,
                                                                   patientNIC,
                                                                   onPrescriptionCreated
                                                               }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // Original states
    const [components, setComponents] = useState<PrescriptionComponent[]>([]);
    const [headerColor, setHeaderColor] = useState<string>('#3B82F6');
    const [colorFromChild, setColorFromChild] = useState<string>('#3B82F6');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Enhanced states from LabTestPrescription
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
    const [saveStatus, setSaveStatus] = useState<SaveStatus>({
        isLoading: false,
        message: '',
        type: null
    });

    // New state for template saving
    const [templateSaveStatus, setTemplateSaveStatus] = useState<TemplateSaveStatus>({
        isLoading: false,
        message: '',
        type: null
    });

    // Load initial data (enhanced from LabTestPrescription approach)
    useEffect(() => {
        const loadInitialData = async () => {
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

                            setSaveStatus({
                                isLoading: false,
                                message: 'Patient data loaded successfully!',
                                type: 'success'
                            });
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
            }
        };

        loadInitialData();
    }, [patientNIC, doctorId]);

    // Load default template on component mount
    useEffect(() => {
        const loadDefaultTemplate = async () => {
            setLoading(true);
            setError('');

            try {
                const defaultTemplate: PrescriptionTemplate | null = await getDefaultTemplate();

                if (defaultTemplate) {
                    setComponents(defaultTemplate.components || []);
                    setHeaderColor(defaultTemplate.color || '#3B82F6');
                    setColorFromChild(defaultTemplate.color || '#3B82F6');
                    console.log('✅ Default template loaded successfully');
                } else {
                    console.log('ℹ️ No default template found - starting with empty canvas');
                }
            } catch (error) {
                console.error('❌ Failed to load default template:', error);
                setError('Failed to load template. Starting with empty canvas.');
            } finally {
                setLoading(false);
            }
        };

        loadDefaultTemplate();
    }, []);

    const handleChildData = (data: string) => {
        setColorFromChild(data);
        setHeaderColor(data);
        console.log('Header color updated:', data);
    };

    // Enhanced PDF Generation (improved from LabTestPrescription approach)
    const generatePrescriptionPDF = async (): Promise<File> => {
        return new Promise(async (resolve, reject) => {
            try {
                const html2canvas = (await import('html2canvas')).default;
                const { jsPDF } = await import('jspdf');

                // First try to get the print version, then fallback to canvas
                let elementToCapture: HTMLElement | null = printRef.current;
                if (!elementToCapture || elementToCapture.children.length === 0) {
                    elementToCapture = document.getElementById('prescription-canvas-capture');
                }

                if (!elementToCapture) {
                    reject(new Error('Prescription content not found'));
                    return;
                }

                // If using print ref, temporarily show it
                if (elementToCapture === printRef.current) {
                    elementToCapture.style.display = 'block';
                    elementToCapture.style.position = 'absolute';
                    elementToCapture.style.left = '-9999px';
                    elementToCapture.style.background = 'white';
                    elementToCapture.style.width = '800px';
                }

                // Capture the content
                const canvas = await html2canvas(elementToCapture, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#ffffff',
                    width: elementToCapture === printRef.current ? 800 : elementToCapture.offsetWidth,
                    height: elementToCapture === printRef.current ? elementToCapture.scrollHeight : elementToCapture.offsetHeight
                });

                // Hide the print element again
                if (elementToCapture === printRef.current) {
                    elementToCapture.style.display = 'none';
                }

                // Create PDF
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pageWidth = 210; // A4 width in mm
                const pageHeight = 295; // A4 height in mm

                // Add canvas to PDF
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const imgWidth = pageWidth;
                const imgHeight = (canvas.height * pageWidth) / canvas.width;
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
                const pdfFile = new File([pdfBlob], `custom-prescription-${Date.now()}.pdf`, {
                    type: 'application/pdf'
                });

                resolve(pdfFile);
            } catch (error) {
                reject(error);
            }
        });
    };

    const handleDragStart = (): void => {
        console.log('Drag started');
    };

    const handleDrop = (type: ComponentType): void => {
        try {
            const newComponent = createPrescriptionComponent(type);
            setComponents((prev) => [...prev, newComponent]);
            console.log(`✅ Added new ${type} component:`, newComponent.id);
        } catch (error) {
            console.error('❌ Error adding component:', error);
            setError('Failed to add component');
        }
    };

    const handleRemove = (id: string): void => {
        try {
            setComponents((prev) => prev.filter((c) => c.id !== id));
            console.log(`✅ Removed component: ${id}`);
        } catch (error) {
            console.error('❌ Error removing component:', error);
            setError('Failed to remove component');
        }
    };

    const handleUpdateComponent = (id: string, newValue: string): void => {
        setComponents((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, text: newValue } : c
            )
        );
    };

    // NEW: Handle template saving separately
    const handleSaveTemplate = async (): Promise<void> => {
        // Validation for template
        if (components.length === 0) {
            setTemplateSaveStatus({
                isLoading: false,
                message: 'Please add some components before saving the template',
                type: 'error'
            });
            return;
        }

        if (!headerColor) {
            setTemplateSaveStatus({
                isLoading: false,
                message: 'Header color is required',
                type: 'error'
            });
            return;
        }

        setTemplateSaveStatus({
            isLoading: true,
            message: 'Validating template...',
            type: 'info'
        });

        try {
            // Prepare template payload
            const templatePayload: CreateTemplatePayload = {
                components: components,
                color: headerColor
            };

            // Validate template payload
            const validation = validateTemplatePayload(templatePayload);
            if (!validation.isValid) {
                setTemplateSaveStatus({
                    isLoading: false,
                    message: `Validation failed: ${validation.errors.join(', ')}`,
                    type: 'error'
                });
                return;
            }

            setTemplateSaveStatus({
                isLoading: true,
                message: 'Saving template...',
                type: 'info'
            });

            console.log('💾 Saving template with payload:', templatePayload);

            // Save template using the service
            const response = await saveTemplate(templatePayload);

            console.log('✅ Template saved successfully:', response);

            setTemplateSaveStatus({
                isLoading: false,
                message: 'Template saved successfully! You can now reuse this design.',
                type: 'success'
            });

            // Auto-hide success message after 4 seconds
            setTimeout(() => {
                setTemplateSaveStatus({ isLoading: false, message: '', type: null });
            }, 4000);

        } catch (error: any) {
            console.error('❌ Error saving template:', error);

            let errorMessage = 'Failed to save template';
            if (error.message) {
                errorMessage = error.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }

            setTemplateSaveStatus({
                isLoading: false,
                message: errorMessage,
                type: 'error'
            });
        }
    };

    const handleSavePrescription = async (): Promise<void> => {
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

        if (components.length === 0) {
            setSaveStatus({
                isLoading: false,
                message: 'Please add some components to the prescription',
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

            console.log('Saving custom prescription with payload:', {
                patientId: prescriptionPayload.patientId,
                doctorId: prescriptionPayload.doctorId,
                appointmentId: prescriptionPayload.appointmentId,
                pdfSize: pdfFile.size
            });

            // Save prescription
            const response = await createPrescription(prescriptionPayload);
            const newPrescriptionId = response?.data?._id || response?.data?.propertyId;

            setSaveStatus({
                isLoading: false,
                message: 'Custom prescription saved successfully!',
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
            console.error('Error saving custom prescription:', error);
            setSaveStatus({
                isLoading: false,
                message: error.message || 'Failed to save prescription',
                type: 'error'
            });
        }
    };

    const handleReset = (): void => {
        if (window.confirm('⚠️ Are you sure you want to reset the canvas? This will remove all components.')) {
            try {
                setComponents([]);
                setHeaderColor('#3B82F6');
                setColorFromChild('#3B82F6');
                setError('');
                setSaveStatus({ isLoading: false, message: '', type: null });
                setTemplateSaveStatus({ isLoading: false, message: '', type: null });
                console.log('✅ Canvas reset successfully');
            } catch (error) {
                console.error('❌ Error resetting canvas:', error);
                setError('Failed to reset canvas');
            }
        }
    };

    const handlePrint = () => window.print();

    // Check if we have the required data to save prescription
    const canSavePrescription = currentDoctorId && appointmentId && patientId && components.length > 0;

    // Check if we can save template
    const canSaveTemplate = components.length > 0 && headerColor;

    // Show loading state
    if (loading && components.length === 0) {
        return (
            <div className="flex min-h-screen bg-gray-50 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading template...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar onDragStart={handleDragStart} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Status Messages */}
                {(error || saveStatus.message || templateSaveStatus.message) && (
                    <div className="mx-6 mt-4 space-y-2">
                        {/* Prescription Save Status */}
                        {(error || saveStatus.message) && (
                            <div className={`px-4 py-3 rounded border-l-4 ${
                                error ? 'bg-red-100 border-red-400 text-red-700' :
                                    saveStatus.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' :
                                        saveStatus.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                                            'bg-blue-50 border-blue-400 text-blue-700'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {saveStatus.isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                                        <span className="text-sm font-medium">
                                            {error ? 'Error: ' : 'Prescription: '}
                                            {error || saveStatus.message}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setError('');
                                            setSaveStatus({ isLoading: false, message: '', type: null });
                                        }}
                                        className="text-current hover:opacity-70"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Template Save Status */}
                        {templateSaveStatus.message && (
                            <div className={`px-4 py-3 rounded border-l-4 ${
                                templateSaveStatus.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' :
                                    templateSaveStatus.type === 'error' ? 'bg-red-50 border-red-400 text-red-700' :
                                        'bg-purple-50 border-purple-400 text-purple-700'
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {templateSaveStatus.isLoading && <Loader2 className="animate-spin mr-2" size={16} />}
                                        <span className="text-sm font-medium">
                                            Template: {templateSaveStatus.message}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setTemplateSaveStatus({ isLoading: false, message: '', type: null });
                                        }}
                                        className="text-current hover:opacity-70"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Canvas */}
                <div className="flex-1">
                    <PrescriptionCanvas
                        components={components}
                        headerColor={headerColor}
                        onChangeHeaderColor={handleChildData}
                        onRemove={handleRemove}
                        onDrop={handleDrop}
                        onUpdateComponent={handleUpdateComponent}
                        canvasRef={canvasRef}
                    />

                    {/* Component Count Info */}
                    <div className="px-6 py-2 text-sm text-gray-600 flex justify-between">
                        <span>Components: {components.length} | Header Color: {colorFromChild}</span>
                        <div className="flex space-x-4">
                            {canSaveTemplate && (
                                <span className="text-purple-600">✓ Ready to save as template</span>
                            )}
                            {canSavePrescription && (
                                <span className="text-green-600">✓ Ready to save prescription</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Enhanced with Template Save */}
                <div className="bg-white border-t border-gray-200 px-6 py-4 mt-auto">
                    <div className="flex justify-between items-center">
                        <div className="flex space-x-4">
                            <button
                                className={`px-4 py-2 rounded shadow transition-colors ${
                                    loading || saveStatus.isLoading || templateSaveStatus.isLoading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-500 hover:bg-red-600'
                                } text-white`}
                                onClick={handleReset}
                                disabled={loading || saveStatus.isLoading || templateSaveStatus.isLoading}
                            >
                                Reset Template
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 bg-teal-500 text-white rounded shadow hover:bg-teal-600 transition-colors"
                                disabled={saveStatus.isLoading || templateSaveStatus.isLoading}
                            >
                                <FileText size={18} className="inline mr-2" />
                                Print Preview
                            </button>
                        </div>

                        <div className="flex space-x-4">
                            {/* NEW: Template Save Button */}
                            <button
                                onClick={handleSaveTemplate}
                                disabled={!canSaveTemplate || templateSaveStatus.isLoading}
                                className={`px-6 py-2 rounded-md flex items-center space-x-2 ${
                                    canSaveTemplate && !templateSaveStatus.isLoading
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                title={canSaveTemplate ? 'Save current design as a reusable template' : 'Add components to save as template'}
                            >
                                {templateSaveStatus.isLoading ? (
                                    <Loader2 className="animate-spin" size={18} />
                                ) : (
                                    <BookOpen size={18} />
                                )}
                                <span>{templateSaveStatus.isLoading ? 'Saving Template...' : 'Save Template'}</span>
                            </button>

                            {/* Prescription Save Button */}
                            <button
                                onClick={handleSavePrescription}
                                disabled={!canSavePrescription || saveStatus.isLoading}
                                className={`px-6 py-2 rounded-md flex items-center space-x-2 ${
                                    canSavePrescription && !saveStatus.isLoading
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                                title={canSavePrescription ? 'Save prescription for patient' : 'Patient and appointment info required'}
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

                    {/* Help Text */}
                    {/*<div className="mt-3 pt-3 border-t border-gray-100">*/}
                    {/*    <div className="flex justify-between text-xs text-gray-500">*/}
                    {/*        <div className="flex space-x-4">*/}
                    {/*            <span>💡 <strong>Save Template:</strong> Reuse this design for future prescriptions</span>*/}
                    {/*            <span>📄 <strong>Save Prescription:</strong> Create final prescription for patient</span>*/}
                    {/*        </div>*/}
                    {/*        <div>*/}
                    {/*            Components: {components.length} |*/}
                    {/*            Template Ready: {canSaveTemplate ? '✅' : '❌'} |*/}
                    {/*            Prescription Ready: {canSavePrescription ? '✅' : '❌'}*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
            </div>

            {/* Hidden Print Version for PDF Generation */}
            <div ref={printRef} style={{ display: 'none' }} className="prescription-print">
                <div style={{
                    fontFamily: 'Arial, sans-serif',
                    maxWidth: '800px',
                    margin: '0 auto',
                    backgroundColor: 'white'
                }}>
                    {/* Enhanced Header with Doctor/Hospital Info */}
                    <div style={{
                        background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%)`,
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

                        <div style={{
                            position: 'relative',
                            zIndex: 10,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}>
                            {/* Doctor Information */}
                            <div style={{ flex: 1 }}>
                                {doctorDetails ? (
                                    <React.Fragment>
                                        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>
                                            Dr. {doctorDetails.name}
                                        </h2>
                                        <p style={{ margin: '0 0 15px 0', fontSize: '14px', opacity: 0.9 }}>
                                            {doctorDetails.qualification}
                                        </p>
                                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                            <strong>SLMC Reg:</strong> {doctorDetails.slmcNumber}
                                        </div>
                                    </React.Fragment>
                                ) : (
                                    <div>
                                        <h2 style={{ margin: '0 0 5px 0', fontSize: '20px', fontWeight: 'bold' }}>
                                            Doctor Information
                                        </h2>
                                        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                                            Custom Prescription
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
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: '50%'
                                                }}
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
                            <div>ID: CUSTOM-{Date.now()}</div>
                        </div>
                    </div>

                    {/* Patient Info Section */}
                    {patientData && (
                        <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <h3 style={{
                                margin: '0 0 15px 0',
                                color: '#374151',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}>Patient Information</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '15px',
                                fontSize: '14px'
                            }}>
                                <div><strong>Name:</strong> {patientData.patientName}</div>
                                <div><strong>Age:</strong> {patientData.patientAge}</div>
                                <div><strong>Gender:</strong> {patientData.patientGender}</div>
                                <div><strong>NIC:</strong> {patientData.patientNIC}</div>
                                <div><strong>Phone:</strong> {patientData.patientPhone}</div>
                                <div><strong>Email:</strong> {patientData.patientEmail}</div>
                            </div>
                        </div>
                    )}

                    {/* Custom Components Section */}
                    <div style={{ padding: '20px' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#374151', fontSize: '18px', fontWeight: 'bold' }}>
                            Prescription Content
                        </h3>

                        {components.length > 0 ? (
                            <div style={{ padding: '16px' }}>
                                {components.map((component) => (
                                    <div key={component.id} style={{
                                        marginBottom: '16px',
                                        padding: component.type === 'divider' ? '0' : '12px',
                                        border: component.type === 'divider' ? 'none' : '1px solid #e2e8f0',
                                        borderRadius: component.type === 'divider' ? '0' : '8px',
                                        backgroundColor: component.type === 'divider' ? 'transparent' : '#f8fafc'
                                    }}>
                                        {component.type === 'text' && (
                                            <p style={{
                                                margin: 0,
                                                fontSize: '14px',
                                                color: '#374151',
                                                lineHeight: '1.6'
                                            }}>
                                                {component.text || 'Text content'}
                                            </p>
                                        )}
                                        {component.type === 'input' && (
                                            <div style={{ fontSize: '14px', color: '#374151' }}>
                                                <strong>Input Field:</strong> <span style={{
                                                borderBottom: '1px solid #374151',
                                                paddingBottom: '2px',
                                                minWidth: '200px',
                                                display: 'inline-block'
                                            }}>{component.text || '_____________'}</span>
                                            </div>
                                        )}
                                        {component.type === 'date' && (
                                            <div style={{ fontSize: '14px', color: '#374151' }}>
                                                <strong>Date:</strong> {component.text || new Date().toLocaleDateString()}
                                            </div>
                                        )}
                                        {component.type === 'divider' && (
                                            <hr style={{
                                                margin: '16px 0',
                                                border: 'none',
                                                borderTop: '2px solid #e2e8f0'
                                            }} />
                                        )}
                                        {component.type === 'header' && (
                                            <h3 style={{
                                                margin: '0',
                                                fontSize: '18px',
                                                fontWeight: 'bold',
                                                color: '#374151'
                                            }}>
                                                {component.text || 'Section Title'}
                                            </h3>
                                        )}
                                        {component.type === 'rx' && (
                                            <h2 style={{
                                                margin: '0',
                                                fontSize: '48px',
                                                fontWeight: 'light',
                                                color: '#3b82f6'
                                            }}>
                                                {component.text || 'Rx'}
                                            </h2>
                                        )}
                                        {component.type === 'lx' && (
                                            <h3 style={{
                                                margin: '0',
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                color: '#059669'
                                            }}>
                                                {component.text || 'Lab Tests (Lx)'}
                                            </h3>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: '#6b7280',
                                fontStyle: 'italic',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '2px dashed #d1d5db'
                            }}>
                                No prescription content added
                            </div>
                        )}
                    </div>

                    {/* Footer with Doctor Signature */}
                    <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                <div>Generated on: {new Date().toLocaleString()}</div>
                                <div>Prescription Type: Custom Prescription</div>
                                <div>Components: {components.length}</div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                <div
                                    style={{ borderTop: '1px solid #374151', width: '200px', marginBottom: '5px' }}></div>
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
                    <div style={{ height: '8px', backgroundColor: headerColor }}></div>
                </div>
            </div>
        </div>
    );
};

export default CustomPrescription;