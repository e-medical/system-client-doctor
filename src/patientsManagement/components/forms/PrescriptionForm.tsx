import React, {useState, useEffect} from 'react';
import {FileText, Stethoscope, Settings, ArrowLeft, RefreshCw} from 'lucide-react';
import {getCurrentUserDetails} from '../../../services/UserService.ts';
import {getLoggedInUser} from '../../../services/authService.ts';
import {getHospitalDetails, type HospitalDetails} from '../../../services/hospitals/hospitalGetById.ts';

// Import your existing prescription components
import DefaultPrescription from "../../../components/prescription/StandardPrescription.tsx";
import StandardPrescription from "../../../components/prescription/LabTestPrescription.tsx";
import CustomPrescription from "../../../components/prescription/CustomPrescription.tsx";
import {ExtractedData} from "../../types/prescription.ts";

// Types
type PrescriptionType = 'Default' | 'Standard' | 'Custom';

interface PrescriptionTypeInfo {
    type: PrescriptionType;
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number }>;
    isActive: boolean;
    isAvailable: boolean;
}

interface PrescriptionTypeSelectorProps {
    onBack?: () => void,
    autoExtractedData?: ExtractedData | undefined,
    prescriptionImage?: File | undefined,
    doctorId?: string | null,
    appointmentId?: string | null,
    patientNIC?: string | null
}

export default function PrescriptionTypeSelector({
                                                     onBack,
                                                     autoExtractedData,
                                                     prescriptionImage,
                                                     doctorId,
                                                     appointmentId,
                                                     patientNIC
                                                 }: PrescriptionTypeSelectorProps) {
    console.log(autoExtractedData, prescriptionImage);
    console.log(doctorId, appointmentId, patientNIC );
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [selectedType, setSelectedType] = useState<PrescriptionType | null>(null);
    const [showPrescription, setShowPrescription] = useState<boolean>(false);

    // State for prescription data
    const [prescriptionTypes, setPrescriptionTypes] = useState<PrescriptionTypeInfo[]>([]);
    const [hospitalDetails, setHospitalDetails] = useState<HospitalDetails | null>(null);
    const [userDetails, setUserDetails] = useState<any>(null);

    // Get user ID from auth service (cookies)
    const getUserId = (): string | null => {
        try {
            const loggedInUser = getLoggedInUser();
            return loggedInUser?.id || null;
        } catch (error) {
            console.error('Error getting user ID from auth service:', error);
            return null;
        }
    };

    // // Get user's hospital ID using user service
    // const getUserHospitalId = async (userId: string): Promise<string | null> => {
    //     try {
    //         const userDetails = await getCurrentUserDetails();
    //         if (userDetails?.hospital) {
    //             return userDetails.hospital;
    //         }
    //         return null;
    //     } catch (error) {
    //         console.error('Error getting user hospital ID:', error);
    //         return null;
    //     }
    // };

    // Load prescription types and availability
    useEffect(() => {
        const loadPrescriptionData = async () => {
            setLoading(true);
            setError('');

            try {
                console.log('🔐 Getting user ID from auth service...');

                // Step 1: Get user ID from cookies (auth service)
                const userId = getUserId();
                if (!userId) {
                    setError('Unable to get user ID. Please login again.');
                    setLoading(false);
                    return;
                }

                console.log('👤 User ID from auth service:', userId);

                // Step 2: Get user details using user service
                const userDetails = await getCurrentUserDetails();
                if (!userDetails) {
                    setError('Unable to get user details. Please contact support.');
                    setLoading(false);
                    return;
                }

                setUserDetails(userDetails);
                console.log('👤 User details loaded:', userDetails);

                // Step 3: Get hospital ID from user details
                const hospitalId = userDetails.hospital;
                if (!hospitalId) {
                    setError('No hospital associated with your account. Please contact support.');
                    setLoading(false);
                    return;
                }

                console.log('🏥 Hospital ID from user:', hospitalId);

                // Step 4: Get hospital details to check prescription themes
                const hospital = await getHospitalDetails(hospitalId);
                if (!hospital) {
                    setError('Failed to load hospital configuration. Please contact support.');
                    setLoading(false);
                    return;
                }

                setHospitalDetails(hospital);
                console.log('🏥 Hospital details loaded:', hospital);
                console.log('💊 Prescription themes:', hospital.prescriptionTheme);

                // Step 5: Check prescription theme availability
                const themes = hospital.prescriptionTheme || [];
                const defaultTheme = themes.find(t => t.theme === 'Default');
                const standardTheme = themes.find(t => t.theme === 'Standard');
                const customTheme = themes.find(t => t.theme === 'Custom');

                console.log('🎨 Theme status:', {
                    default: defaultTheme?.isActive || false,
                    standard: standardTheme?.isActive || false,
                    custom: customTheme?.isActive || false
                });

                // Step 6: Create prescription type info based on active themes
                const typeInfo: PrescriptionTypeInfo[] = [
                    {
                        type: 'Default',
                        title: 'Default Prescription',
                        description: 'Standard prescription format with essential medical fields',
                        icon: FileText,
                        isActive: defaultTheme?.isActive || false,
                        isAvailable: defaultTheme?.isActive || false
                    },
                    {
                        type: 'Standard',
                        title: 'Standard Prescription',
                        description: 'Enhanced prescription format with detailed patient information',
                        icon: Stethoscope,
                        isActive: standardTheme?.isActive || false,
                        isAvailable: standardTheme?.isActive || false
                    },
                    {
                        type: 'Custom',
                        title: 'Custom Prescription',
                        description: 'Fully customizable prescription format with drag-and-drop components',
                        icon: Settings,
                        isActive: customTheme?.isActive || false,
                        isAvailable: customTheme?.isActive || false
                    }
                ];

                setPrescriptionTypes(typeInfo);

                const availableTypes = typeInfo.filter(t => t.isAvailable);
                const activeTypes = typeInfo.filter(t => t.isActive);

                console.log('✅ Prescription types processed:', {
                    totalTypes: typeInfo.length,
                    activeTypes: activeTypes.length,
                    availableTypes: availableTypes.length,
                    hospitalName: hospital.businessName
                });

                // Step 7: Show error if no types are available
                if (availableTypes.length === 0) {
                    if (activeTypes.length === 0) {
                        setError(`No prescription themes are active for ${hospital.businessName}. Available themes: ${themes.map(t => `${t.theme}(${t.isActive ? 'active' : 'inactive'})`).join(', ')}. Please contact your administrator to activate prescription themes.`);
                    } else {
                        setError('No prescription types are currently available. Please contact your administrator.');
                    }
                }

            } catch (error) {
                console.error('❌ Error loading prescription data:', error);
                setError('Failed to load prescription data. Please check your connection and try again.');
            } finally {
                setLoading(false);
            }
        };

        loadPrescriptionData();
    }, []);

    // Handle prescription type selection
    const handleTypeSelect = (type: PrescriptionType) => {
        const typeInfo = prescriptionTypes.find(t => t.type === type);

        if (!typeInfo?.isAvailable) {
            setError(`${type} prescription is not available. Please contact your administrator.`);
            return;
        }

        setSelectedType(type);
        setShowPrescription(true);
        setError('');

        console.log('✅ Selected prescription type:', type);
    };

    // Handle back navigation
    const handleBack = () => {
        if (showPrescription) {
            setShowPrescription(false);
            setSelectedType(null);
        } else if (onBack) {
            onBack();
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        window.location.reload();
    };

    // Render the selected prescription component
    const renderSelectedPrescription = () => {
        if (!selectedType) return null;

        switch (selectedType) {
            case 'Default':
                return <DefaultPrescription
                    doctorId={doctorId}
                    appointmentId={appointmentId}
                    patientNIC={patientNIC}
                />;

            case 'Standard':
                return <StandardPrescription
                    doctorId={doctorId}
                    appointmentId={appointmentId}
                    patientNIC={patientNIC}/>;
            case 'Custom':
                return <CustomPrescription
                    doctorId={doctorId}
                    appointmentId={appointmentId}
                    patientNIC={patientNIC}/>;
            default:
                return null;
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div
                className="flex flex-col justify-center items-center bg-gray-50 min-h-[81vh] px-4 sm:px-6 lg:px-10 py-10">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Loading Prescription Types</h2>
                    <p className="text-gray-600">Checking user authentication and hospital configuration...</p>
                </div>
            </div>
        );
    }

    // Show selected prescription component
    if (showPrescription && selectedType) {
        return (
            <div className="flex flex-col bg-gray-50 min-h-screen">
                {/* Header with back button */}
                <div className="bg-white shadow-sm border-b px-4 sm:px-6 lg:px-10 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleBack}
                                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft size={20} className="mr-2"/>
                                Back to Types
                            </button>
                            {/*<div>*/}
                            {/*    <h1 className="text-xl font-bold text-gray-800">*/}
                            {/*        {selectedType} Prescription*/}
                            {/*    </h1>*/}
                            {/*    <p className="text-sm text-gray-600">*/}
                            {/*        {hospitalDetails?.businessName}*/}
                            {/*    </p>*/}
                            {/*</div>*/}
                        </div>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <RefreshCw size={16} className="mr-1"/>
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Prescription Component */}
                <div className="flex-1 p-4 sm:p-6 lg:p-10">
                    <div className="max-w-6xl mx-auto">
                        {/* Info banner */}
                        {/*<div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">*/}
                        {/*    <div className="flex items-center justify-between">*/}
                        {/*        <div>*/}
                        {/*            <h3 className="font-semibold text-teal-800">*/}
                        {/*                {selectedType} Prescription Active*/}
                        {/*            </h3>*/}
                        {/*            <p className="text-sm text-teal-700">*/}
                        {/*                {prescriptionTypes.find(t => t.type === selectedType)?.description}*/}
                        {/*            </p>*/}
                        {/*            {userDetails && (*/}
                        {/*                <p className="text-xs text-teal-600 mt-1">*/}
                        {/*                    User: {userDetails.firstName} {userDetails.lastName} | Hospital: {hospitalDetails?.businessName}*/}
                        {/*                </p>*/}
                        {/*            )}*/}
                        {/*        </div>*/}
                        {/*        <div className="text-right">*/}
                        {/*            <span className="bg-teal-100 text-teal-800 text-sm px-3 py-1 rounded-full">*/}
                        {/*                {selectedType} Theme*/}
                        {/*            </span>*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}

                        {/* Render the selected prescription component */}
                        {renderSelectedPrescription()}
                    </div>
                </div>
            </div>
        );
    }

    // Show prescription type selector
    return (
        <div className="flex flex-col justify-center items-center bg-white min-h-screen px-4 sm:px-6 lg:px-10 py-5">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="flex items-center justify-center mb-4 relative">
                    {onBack && (
                        <button
                            onClick={handleBack}
                            className="absolute left-0 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft size={20} className="mr-2"/>
                            Back
                        </button>
                    )}
                    <h2 className="text-2xl font-bold ">Select Prescription Type</h2>
                </div>

                {/*{hospitalDetails && userDetails && (*/}
                {/*    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">*/}
                {/*        <p className="text-blue-800 text-sm">*/}
                {/*            <strong>{hospitalDetails.businessName}</strong>*/}
                {/*        </p>*/}
                {/*        <p className="text-blue-700 text-xs mt-1">*/}
                {/*            Welcome, {userDetails.firstName} {userDetails.lastName}*/}
                {/*        </p>*/}
                {/*        <p className="text-blue-600 text-xs">*/}
                {/*            {prescriptionTypes.filter(t => t.isAvailable).length} prescription theme{prescriptionTypes.filter(t => t.isAvailable).length !== 1 ? 's' : ''} available*/}
                {/*        </p>*/}
                {/*    </div>*/}
                {/*)}*/}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 max-w-2xl mx-auto">
                    <div className="mb-3">
                        <strong className="font-bold">Error: </strong>
                        <span>{error}</span>
                    </div>

                    <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-semibold text-red-600 hover:text-red-800">
                            🔍 Debug Information
                        </summary>
                        <div className="mt-3 p-3 bg-red-50 rounded text-xs">
                            {userDetails && (
                                <div className="mb-3">
                                    <p><strong>User:</strong> {userDetails.firstName} {userDetails.lastName}</p>
                                    <p><strong>Email:</strong> {userDetails.userEmail}</p>
                                    <p><strong>Hospital ID:</strong> {userDetails.hospital}</p>
                                    <p><strong>Roles:</strong> {userDetails.roles?.join(', ')}</p>
                                </div>
                            )}

                            {hospitalDetails && (
                                <div className="mb-3">
                                    <p><strong>Hospital:</strong> {hospitalDetails.businessName}</p>
                                    <p><strong>Hospital ID:</strong> {hospitalDetails._id}</p>
                                    <p><strong>Admin:</strong> {hospitalDetails.adminName}</p>
                                    <p><strong>Status:</strong> {hospitalDetails.status ? 'Active' : 'Inactive'}</p>
                                    <p><strong>Prescription Themes:</strong></p>
                                    <ul className="ml-4">
                                        {hospitalDetails.prescriptionTheme?.map(theme => (
                                            <li key={theme.theme} className="mb-1">
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-2 ${theme.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {theme.theme}: {theme.isActive ? 'Active' : 'Inactive'}
                                            </li>
                                        )) || <li>No themes found</li>}
                                    </ul>
                                </div>
                            )}

                            <button
                                onClick={handleRefresh}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-xs hover:bg-gray-600"
                            >
                                🔄 Refresh Data
                            </button>
                        </div>
                    </details>
                </div>
            )}

            {/* Prescription Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
                {prescriptionTypes.map((typeConfig) => {
                    const isDisabled = !typeConfig.isAvailable;
                    const IconComponent = typeConfig.icon;

                    return (
                        <div
                            key={typeConfig.type}
                            onClick={() => !isDisabled && handleTypeSelect(typeConfig.type)}
                            className={`
                                relative bg-white rounded-lg shadow-lg border-2 transition-all duration-300 transform
                                ${!isDisabled
                                ? 'border-gray-200 hover:border-teal-400 hover:shadow-xl cursor-pointer hover:scale-105'
                                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                            }
                                ${!typeConfig.isActive ? 'ring-2 ring-amber-200' : ''}
                            `}
                        >
                            {/* Status indicators */}
                            <div className="absolute top-3 right-3 flex space-x-1">
                                {!typeConfig.isActive && (
                                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                                        Inactive
                                    </span>
                                )}
                                {typeConfig.isAvailable ? (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Available
                                    </span>
                                ) : (
                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                        Unavailable
                                    </span>
                                )}
                            </div>

                            <div className="p-6">
                                {/* Icon */}
                                <div className={`mb-4 ${isDisabled ? 'text-gray-400' : 'text-teal-600'}`}>
                                    <IconComponent size={48}/>
                                </div>

                                {/* Content */}
                                <h3 className={`text-xl font-bold mb-2 ${isDisabled ? 'text-gray-500' : 'text-gray-800'}`}>
                                    {typeConfig.title}
                                </h3>
                                <p className={`text-sm mb-4 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {typeConfig.description}
                                </p>

                                {/* Action button */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {typeConfig.isActive ? 'Theme Active' : 'Theme Inactive'}
                                    </span>

                                    {typeConfig.isAvailable && (
                                        <button
                                            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm">
                                            Open Prescription
                                        </button>
                                    )}
                                </div>

                                {!typeConfig.isActive && (
                                    <div
                                        className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                        This prescription theme is not activated in your hospital settings.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-8 text-center text-sm text-gray-600">
                <p>
                    {prescriptionTypes.filter(t => t.isAvailable).length} of {prescriptionTypes.length} prescription
                    types available
                </p>
                {prescriptionTypes.filter(t => t.isAvailable).length === 0 && (
                    <p className="text-amber-600 mt-2">
                        Please contact your administrator to activate prescription themes.
                    </p>
                )}
            </div>

            {/*/!* Development Debug *!/*/}
            {/*{process.env.NODE_ENV === 'development' && hospitalDetails && (*/}
            {/*    <details className="mt-8 max-w-4xl w-full">*/}
            {/*        <summary className="cursor-pointer font-bold text-gray-700 bg-gray-100 p-2 rounded">*/}
            {/*            Debug Info (Development Only)*/}
            {/*        </summary>*/}
            {/*        <div className="mt-2 p-4 bg-gray-50 rounded text-xs">*/}
            {/*            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">*/}
            {/*                <div>*/}
            {/*                    <h4 className="font-bold mb-2">User Details:</h4>*/}
            {/*                    <pre className="bg-white p-2 rounded overflow-x-auto">*/}
            {/*                        {JSON.stringify(userDetails, null, 2)}*/}
            {/*                    </pre>*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <h4 className="font-bold mb-2">Hospital Details:</h4>*/}
            {/*                    <pre className="bg-white p-2 rounded overflow-x-auto">*/}
            {/*                        {JSON.stringify(hospitalDetails, null, 2)}*/}
            {/*                    </pre>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </details>*/}
            {/*)}*/}
        </div>
    );
}