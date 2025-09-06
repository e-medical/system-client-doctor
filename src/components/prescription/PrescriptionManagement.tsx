import { useEffect, useState } from 'react';
import {
    getPrescriptionManagementData,
    isThemeActive,
    refreshHospitalData,
    type PrescriptionManagementData,
} from '../../services/prescriptionManagementService';
import DefaultPrescription from "./DefaultPrescriptionICardInner";
import StandardPrescription from "./DefaultSecondPrescriptionCardInner";
import CustomPrescription from "./DefaultCustomCardInner";

export default function PrescriptionManagement() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [hospitalData, setHospitalData] = useState<PrescriptionManagementData | null>(null);
    const [themeStates, setThemeStates] = useState<{
        showDefault: boolean;
        showStandard: boolean;
        showCustom: boolean;
    }>({
        showDefault: false,
        showStandard: false,
        showCustom: false
    });

    // Load hospital data and determine which themes to show
    useEffect(() => {
        const loadHospitalData = async () => {
            setLoading(true);
            setError('');

            try {
                console.log('🚀 Loading prescription management data...');

                // Get hospital data
                const data = await getPrescriptionManagementData();

                if (data) {
                    setHospitalData(data);
                    console.log('✅ Hospital data loaded:', data);

                    // Check which themes are active
                    const [defaultActive, standardActive, customActive] = await Promise.all([
                        isThemeActive('Default'),
                        isThemeActive('Standard'),
                        isThemeActive('Custom')
                    ]);

                    setThemeStates({
                        showDefault: defaultActive,
                        showStandard: standardActive,
                        showCustom: customActive
                    });

                    console.log('🎨 Theme states:', {
                        Default: defaultActive,
                        Standard: standardActive,
                        Custom: customActive
                    });

                    // Log active themes for debugging
                    const activeThemeNames = data.activeThemes.map(theme => theme.theme);
                    console.log('✅ Active themes:', activeThemeNames);

                    // If no themes are active, show a warning
                    if (data.activeThemes.length === 0) {
                        console.warn('⚠️ No prescription themes are currently active');
                        setError('No prescription themes are currently active. Please contact your administrator.');
                    }
                } else {
                    console.error('❌ Failed to load hospital data');
                    setError('Failed to load hospital configuration. Please try refreshing the page.');
                }
            } catch (error) {
                console.error('❌ Error loading hospital data:', error);
                setError('An error occurred while loading prescription themes. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadHospitalData();
    }, []);

    // Handle refresh functionality
    const handleRefresh = async () => {
        setLoading(true);
        setError('');

        try {
            console.log('🔄 Refreshing hospital data...');
            const refreshedData = await refreshHospitalData();

            if (refreshedData) {
                setHospitalData(refreshedData);

                // Re-check theme states
                const [defaultActive, standardActive, customActive] = await Promise.all([
                    isThemeActive('Default'),
                    isThemeActive('Standard'),
                    isThemeActive('Custom')
                ]);

                setThemeStates({
                    showDefault: defaultActive,
                    showStandard: standardActive,
                    showCustom: customActive
                });

                console.log('✅ Data refreshed successfully');
            } else {
                setError('Failed to refresh hospital data.');
            }
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            setError('Failed to refresh data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center bg-gray-50 min-h-[81vh] px-4 sm:px-6 lg:px-10 py-10">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold mb-2">Loading Prescription Management</h2>
                    <p className="text-gray-600">Fetching your hospital configuration...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center bg-gray-50 min-h-[81vh] px-4 sm:px-6 lg:px-10 py-10">
                <div className="text-center max-w-md">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Calculate visible themes count
    const visibleThemesCount = Object.values(themeStates).filter(Boolean).length;

    return (
        <div className="flex flex-col justify-center items-center bg-gray-50 min-h-[81vh] px-4 sm:px-6 lg:px-10 py-10">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Prescription Management</h2>
                {/*{hospitalData?.hospitalSummary.businessName && (*/}
                {/*    <p className="text-gray-600">*/}
                {/*        {hospitalData.hospitalSummary.businessName}*/}
                {/*    </p>*/}
                {/*)}*/}

                {/*/!* Theme count info *!/*/}
                {/*<div className="mt-4 text-sm text-gray-500">*/}
                {/*    {visibleThemesCount > 0 ? (*/}
                {/*        <span>*/}
                {/*            {visibleThemesCount} prescription theme{visibleThemesCount !== 1 ? 's' : ''} available*/}
                {/*        </span>*/}
                {/*    ) : (*/}
                {/*        <span className="text-amber-600">*/}
                {/*            No prescription themes are currently active*/}
                {/*        </span>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/* Refresh button */}
                <button
                    onClick={handleRefresh}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                    Refresh Configuration
                </button>
            </div>

            {/* Prescription Theme Cards */}
            {visibleThemesCount > 0 ? (
                <div className="flex flex-col sm:flex-row flex-wrap gap-6 items-center justify-center w-full">
                    {/* Default Prescription - Only show if active */}
                    {themeStates.showDefault && (
                        <div className="transition-all duration-300 ease-in-out">
                            <DefaultPrescription />
                        </div>
                    )}

                    {/* Standard Prescription - Only show if active */}
                    {themeStates.showStandard && (
                        <div className="transition-all duration-300 ease-in-out">
                            <StandardPrescription />
                        </div>
                    )}

                    {/* Custom Prescription - Only show if active */}
                    {themeStates.showCustom && (
                        <div className="transition-all duration-300 ease-in-out">
                            <CustomPrescription />
                        </div>
                    )}
                </div>
            ) : (
                /* No active themes message */
                <div className="text-center max-w-md">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-6 rounded-lg">
                        <h3 className="font-bold mb-2">No Active Prescription Themes</h3>
                        <p className="text-sm mb-4">
                            It looks like no prescription themes are currently enabled for your hospital.
                            Please contact your administrator to enable the prescription themes you need.
                        </p>

                        {/* Show all available themes for debugging */}
                        {hospitalData?.allThemes && hospitalData.allThemes.length > 0 && (
                            <div className="mt-4 text-xs">
                                <p className="font-semibold mb-1">Available themes:</p>
                                <ul className="list-disc list-inside">
                                    {hospitalData.allThemes.map((theme, index) => (
                                        <li key={index} className="flex justify-between">
                                            <span>{theme.theme}</span>
                                            <span className={`ml-2 ${theme.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                {theme.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/*/!* Debug Info (only in development) *!/*/}
            {/*{process.env.NODE_ENV === 'development' && hospitalData && (*/}
            {/*    <div className="mt-8 max-w-4xl w-full">*/}
            {/*        <details className="bg-gray-100 p-4 rounded border">*/}
            {/*            <summary className="cursor-pointer font-bold text-gray-700">*/}
            {/*                Debug Info (Development Only)*/}
            {/*            </summary>*/}
            {/*            <div className="mt-4 text-xs">*/}
            {/*                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">*/}
            {/*                    <div>*/}
            {/*                        <h4 className="font-bold mb-2">Hospital Summary:</h4>*/}
            {/*                        <pre className="bg-white p-2 rounded overflow-x-auto">*/}
            {/*                            {JSON.stringify(hospitalData.hospitalSummary, null, 2)}*/}
            {/*                        </pre>*/}
            {/*                    </div>*/}
            {/*                    <div>*/}
            {/*                        <h4 className="font-bold mb-2">Prescription Themes:</h4>*/}
            {/*                        <pre className="bg-white p-2 rounded overflow-x-auto">*/}
            {/*                            {JSON.stringify(hospitalData.allThemes, null, 2)}*/}
            {/*                        </pre>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </details>*/}
            {/*    </div>*/}
            {/*)}*/}
        </div>
    );
}