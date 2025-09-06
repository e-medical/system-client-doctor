// import React, { useState, useEffect } from 'react';
// import { FileText, Stethoscope, Settings, ArrowLeft } from 'lucide-react';
// import { getCurrentUserDetails } from '../../../services/userService';
// import api from "../../../utils/interceptor/axios";
// import type { AxiosResponse } from "axios";
//
// // Import the prescription selector form
// import PrescriptionSelectorForm from "./PrescriptionSelectorForm";
//
// const baseUrl = import.meta.env.VITE_API_BASE_URL;
//
// // Types
// type PrescriptionType = 'Default' | 'Standard' | 'Custom';
//
// interface PrescriptionTheme {
//     theme: string;
//     isActive: boolean;
// }
//
// interface HospitalDetails {
//     _id: string;
//     businessName: string;
//     prescriptionTheme: PrescriptionTheme[];
// }
//
// interface AvailablePrescription {
//     _id: string;
//     prescriptionName: string;
//     description?: string;
//     drugDetails: {
//         drugName: string;
//         strength: string;
//         dosage: string;
//         brand: string;
//         frequency: string;
//         duration: string;
//         issuedQty: string;
//         instructions?: string;
//     };
//     doctorId: string;
//     hospitalId: string;
//     isActive: boolean;
// }
//
// interface PrescriptionTypeInfo {
//     type: PrescriptionType;
//     title: string;
//     description: string;
//     icon: React.ComponentType<{ size?: number }>;
//     isActive: boolean;
//     prescriptionCount: number;
//     isAvailable: boolean;
// }
//
// interface PrescriptionTypeSelectorProps {
//     onBack?: () => void;
// }
//
// export default function PrescriptionTypeSelector({ onBack }: PrescriptionTypeSelectorProps) {
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<string>('');
//     const [selectedType, setSelectedType] = useState<PrescriptionType | null>(null);
//     const [showSelector, setShowSelector] = useState<boolean>(false);
//     const [debugMode, setDebugMode] = useState<boolean>(false);
//
//     // State for prescription data
//     const [prescriptionTypes, setPrescriptionTypes] = useState<PrescriptionTypeInfo[]>([]);
//     const [availablePrescriptions, setAvailablePrescriptions] = useState<AvailablePrescription[]>([]);
//     const [hospitalDetails, setHospitalDetails] = useState<HospitalDetails | null>(null);
//
//     // Get user's hospital ID
//     const getUserHospitalId = async (): Promise<string | null> => {
//         try {
//             const userDetails = await getCurrentUserDetails();
//             if (userDetails?.hospital) {
//                 return userDetails.hospital;
//             }
//             return null;
//         } catch (error) {
//             console.error('Error getting user hospital ID:', error);
//             return null;
//         }
//     };
//
//     // Get hospital details
//     const getHospitalDetails = async (hospitalId: string): Promise<HospitalDetails | null> => {
//         try {
//             const response: AxiosResponse<{ success: boolean; data: HospitalDetails }> = await api.get(
//                 `${baseUrl}hospitals/${hospitalId}`
//             );
//
//             if (response.data && response.data.success) {
//                 return response.data.data;
//             }
//             return null;
//         } catch (error) {
//             console.error('Error fetching hospital details:', error);
//             return null;
//         }
//     };
//
//     // Get available prescriptions
//     const getAvailablePrescriptions = async (hospitalId: string): Promise<AvailablePrescription[]> => {
//         try {
//             const response: AxiosResponse<{ success: boolean; data: AvailablePrescription[] }> = await api.get(
//                 `${baseUrl}prescriptions`
//             );
//
//             if (response.data && response.data.success) {
//                 // Filter by hospital ID and active status
//                 return response.data.data.filter(prescription =>
//                     prescription.hospitalId === hospitalId && prescription.isActive
//                 );
//             }
//             return [];
//         } catch (error) {
//             console.error('Error fetching prescriptions:', error);
//             return [];
//         }
//     };
//
//     // Load prescription types and availability
//     useEffect(() => {
//         const loadPrescriptionData = async () => {
//             setLoading(true);
//             setError('');
//
//             try {
//                 console.log('🏥 Loading prescription data...');
//
//                 // Get user's hospital ID
//                 const hospitalId = await getUserHospitalId();
//                 if (!hospitalId) {
//                     setError('Unable to determine your hospital. Please contact support.');
//                     setLoading(false);
//                     return;
//                 }
//
//                 console.log('🏥 Hospital ID:', hospitalId);
//
//                 // Load hospital details and prescriptions
//                 const [hospital, prescriptions] = await Promise.all([
//                     getHospitalDetails(hospitalId),
//                     getAvailablePrescriptions(hospitalId)
//                 ]);
//
//                 if (!hospital) {
//                     setError('Failed to load hospital configuration.');
//                     setLoading(false);
//                     return;
//                 }
//
//                 setHospitalDetails(hospital);
//                 setAvailablePrescriptions(prescriptions);
//
//                 console.log('🏥 Hospital:', hospital.businessName);
//                 console.log('💊 Themes:', hospital.prescriptionTheme);
//                 console.log('📋 Prescriptions:', prescriptions.length);
//
//                 // Check prescription themes
//                 const themes = hospital.prescriptionTheme || [];
//                 const defaultTheme = themes.find(t => t.theme === 'Default');
//                 const standardTheme = themes.find(t => t.theme === 'Standard');
//                 const customTheme = themes.find(t => t.theme === 'Custom');
//
//                 // Create type info
//                 const typeInfo: PrescriptionTypeInfo[] = [
//                     {
//                         type: 'Default',
//                         title: 'Default Prescription',
//                         description: 'Standard prescription format with essential fields',
//                         icon: FileText,
//                         isActive: defaultTheme?.isActive || false,
//                         prescriptionCount: prescriptions.length,
//                         isAvailable: debugMode || (defaultTheme?.isActive && prescriptions.length > 0)
//                     },
//                     {
//                         type: 'Standard',
//                         title: 'Standard Prescription',
//                         description: 'Enhanced prescription format with additional details',
//                         icon: Stethoscope,
//                         isActive: standardTheme?.isActive || false,
//                         prescriptionCount: prescriptions.length,
//                         isAvailable: debugMode || (standardTheme?.isActive && prescriptions.length > 0)
//                     },
//                     {
//                         type: 'Custom',
//                         title: 'Custom Prescription',
//                         description: 'Fully customizable prescription format',
//                         icon: Settings,
//                         isActive: customTheme?.isActive || false,
//                         prescriptionCount: prescriptions.length,
//                         isAvailable: debugMode || (customTheme?.isActive && prescriptions.length > 0)
//                     }
//                 ];
//
//                 setPrescriptionTypes(typeInfo);
//
//                 const availableTypes = typeInfo.filter(t => t.isAvailable);
//                 const activeTypes = typeInfo.filter(t => t.isActive);
//
//                 console.log('✅ Results:', {
//                     availableTypes: availableTypes.length,
//                     activeTypes: activeTypes.length,
//                     totalPrescriptions: prescriptions.length
//                 });
//
//                 // Set error messages
//                 if (availableTypes.length === 0 && !debugMode) {
//                     if (activeTypes.length === 0) {
//                         setError(`No prescription themes are active for ${hospital.businessName}. Please contact your administrator to activate prescription themes.`);
//                     } else if (prescriptions.length === 0) {
//                         setError(`No prescriptions available for ${hospital.businessName}. Please add prescriptions first.`);
//                     } else {
//                         setError('Configuration issue detected. Please contact support.');
//                     }
//                 }
//
//             } catch (error) {
//                 console.error('❌ Error loading data:', error);
//                 setError('Failed to load prescription data. Please try again.');
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         loadPrescriptionData();
//     }, [debugMode]);
//
//     // Handle prescription type selection
//     const handleTypeSelect = (type: PrescriptionType) => {
//         const typeInfo = prescriptionTypes.find(t => t.type === type);
//
//         if (!debugMode && !typeInfo?.isAvailable) {
//             setError(`${type} prescription is not available.`);
//             return;
//         }
//
//         setSelectedType(type);
//         setShowSelector(true);
//         setError('');
//     };
//
//     // Handle back navigation
//     const handleBack = () => {
//         if (showSelector) {
//             setShowSelector(false);
//             setSelectedType(null);
//         } else if (onBack) {
//             onBack();
//         }
//     };
//
//     // Handle prescription form submission
//     const handlePrescriptionSubmit = (data: any) => {
//         console.log('✅ Prescription submitted:', data);
//         alert(`Prescription created successfully!\nType: ${selectedType}\nPatient: ${data.patientName}`);
//         handleBack();
//     };
//
//     // Show loading state
//     if (loading) {
//         return (
//             <div className="flex flex-col justify-center items-center bg-gray-50 min-h-[81vh] px-4 sm:px-6 lg:px-10 py-10">
//                 <div className="text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
//                     <h2 className="text-2xl font-bold mb-2">Loading Prescription Types</h2>
//                     <p className="text-gray-600">Checking hospital configuration...</p>
//                 </div>
//             </div>
//         );
//     }
//
//     // Show prescription selector page
//     if (showSelector && selectedType) {
//         return (
//             <div className="flex flex-col bg-gray-50 min-h-screen">
//                 <div className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-10 py-4">
//                     <div className="flex items-center justify-between">
//                         <div className="flex items-center space-x-4">
//                             <button
//                                 onClick={handleBack}
//                                 className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
//                             >
//                                 <ArrowLeft size={20} className="mr-2" />
//                                 Back to Types
//                             </button>
//                             <div>
//                                 <h1 className="text-xl font-bold text-gray-800">
//                                     {selectedType} Prescription
//                                 </h1>
//                                 <p className="text-sm text-gray-600">
//                                     {hospitalDetails?.businessName}
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//
//                 <div className="flex-1 p-4 sm:p-6 lg:p-10">
//                     <div className="max-w-4xl mx-auto">
//                         <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
//                             <h3 className="font-semibold text-teal-800">
//                                 {selectedType} Prescription Selected
//                             </h3>
//                             <p className="text-sm text-teal-700">
//                                 {prescriptionTypes.find(t => t.type === selectedType)?.description}
//                             </p>
//                         </div>
//
//                         <PrescriptionSelectorForm
//                             onSubmit={handlePrescriptionSubmit}
//                             prescriptionType={selectedType}
//                         />
//                     </div>
//                 </div>
//             </div>
//         );
//     }
//
//     // Show prescription type selector
//     return (
//         <div className="flex flex-col justify-center items-center bg-gray-50 min-h-[81vh] px-4 sm:px-6 lg:px-10 py-10">
//             {/* Header */}
//             <div className="text-center mb-8">
//                 <div className="flex items-center justify-center mb-4 relative">
//                     {onBack && (
//                         <button
//                             onClick={handleBack}
//                             className="absolute left-0 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
//                         >
//                             <ArrowLeft size={20} className="mr-2" />
//                             Back
//                         </button>
//                     )}
//                     <h2 className="text-2xl font-bold">Select Prescription Type</h2>
//                 </div>
//
//                 {hospitalDetails && (
//                     <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
//                         <p className="text-blue-800 text-sm">
//                             <strong>{hospitalDetails.businessName}</strong>
//                         </p>
//                         <p className="text-blue-700 text-xs mt-1">
//                             {availablePrescriptions.length} prescriptions available
//                         </p>
//                     </div>
//                 )}
//             </div>
//
//             {/* Debug Mode Banner */}
//             {debugMode && (
//                 <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
//                     <div className="flex items-center justify-between">
//                         <div>
//                             <strong>🧪 Debug Mode Enabled</strong>
//                             <p className="text-sm">All prescription types are available for testing.</p>
//                         </div>
//                         <button
//                             onClick={() => setDebugMode(false)}
//                             className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
//                         >
//                             Disable
//                         </button>
//                     </div>
//                 </div>
//             )}
//
//             {/* Error Display */}
//             {error && (
//                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
//                     <div className="mb-3">
//                         <strong className="font-bold">Error: </strong>
//                         <span>{error}</span>
//                     </div>
//
//                     <details className="mt-3">
//                         <summary className="cursor-pointer text-sm font-semibold text-red-600 hover:text-red-800">
//                             🔍 Debug Information
//                         </summary>
//                         <div className="mt-3 p-3 bg-red-50 rounded text-xs">
//                             {hospitalDetails && (
//                                 <div className="mb-3">
//                                     <p><strong>Hospital:</strong> {hospitalDetails.businessName}</p>
//                                     <p><strong>Prescriptions:</strong> {availablePrescriptions.length}</p>
//                                     <p><strong>Themes:</strong></p>
//                                     <ul className="ml-4">
//                                         {hospitalDetails.prescriptionTheme?.map(theme => (
//                                             <li key={theme.theme} className="mb-1">
//                                                 <span className={`inline-block w-2 h-2 rounded-full mr-2 ${theme.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
//                                                 {theme.theme}: {theme.isActive ? 'Active' : 'Inactive'}
//                                             </li>
//                                         )) || <li>No themes found</li>}
//                                     </ul>
//                                 </div>
//                             )}
//
//                             <button
//                                 onClick={() => setDebugMode(true)}
//                                 className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 mr-2"
//                             >
//                                 🧪 Enable Debug Mode
//                             </button>
//
//                             <button
//                                 onClick={() => window.location.reload()}
//                                 className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
//                             >
//                                 🔄 Refresh
//                             </button>
//                         </div>
//                     </details>
//                 </div>
//             )}
//
//             {/* Prescription Type Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
//                 {prescriptionTypes.map((typeConfig) => {
//                     const isDisabled = !typeConfig.isAvailable && !debugMode;
//                     const IconComponent = typeConfig.icon;
//
//                     return (
//                         <div
//                             key={typeConfig.type}
//                             onClick={() => !isDisabled && handleTypeSelect(typeConfig.type)}
//                             className={`
//                                 relative bg-white rounded-lg shadow-lg border-2 transition-all duration-300 transform
//                                 ${!isDisabled
//                                 ? 'border-gray-200 hover:border-teal-400 hover:shadow-xl cursor-pointer hover:scale-105'
//                                 : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
//                             }
//                                 ${!typeConfig.isActive && !debugMode ? 'ring-2 ring-amber-200' : ''}
//                             `}
//                         >
//                             {/* Status indicators */}
//                             <div className="absolute top-3 right-3 flex space-x-1">
//                                 {!typeConfig.isActive && !debugMode && (
//                                     <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
//                                         Inactive
//                                     </span>
//                                 )}
//                                 {typeConfig.isAvailable || debugMode ? (
//                                     <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
//                                         Available
//                                     </span>
//                                 ) : (
//                                     <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
//                                         Unavailable
//                                     </span>
//                                 )}
//                             </div>
//
//                             <div className="p-6">
//                                 <div className={`mb-4 ${isDisabled ? 'text-gray-400' : 'text-teal-600'}`}>
//                                     <IconComponent size={48} />
//                                 </div>
//
//                                 <h3 className={`text-xl font-bold mb-2 ${isDisabled ? 'text-gray-500' : 'text-gray-800'}`}>
//                                     {typeConfig.title}
//                                 </h3>
//                                 <p className={`text-sm mb-4 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
//                                     {typeConfig.description}
//                                 </p>
//
//                                 <div className="flex items-center justify-between">
//                                     <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
//                                         {typeConfig.prescriptionCount} prescription{typeConfig.prescriptionCount !== 1 ? 's' : ''}
//                                     </span>
//
//                                     {(typeConfig.isAvailable || debugMode) && (
//                                         <button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">
//                                             Select
//                                         </button>
//                                     )}
//                                 </div>
//
//                                 {!typeConfig.isActive && !debugMode && (
//                                     <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
//                                         This prescription type is not active in your hospital settings.
//                                     </div>
//                                 )}
//                             </div>
//                         </div>
//                     );
//                 })}
//             </div>
//
//             {/* Summary */}
//             <div className="mt-8 text-center text-sm text-gray-600">
//                 <p>
//                     {prescriptionTypes.filter(t => t.isAvailable || debugMode).length} of {prescriptionTypes.length} prescription types available
//                 </p>
//                 {availablePrescriptions.length === 0 && (
//                     <p className="text-amber-600 mt-2">
//                         No prescriptions found for your hospital.
//                     </p>
//                 )}
//             </div>
//         </div>
//     );
// }