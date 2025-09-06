import { useState, useEffect, useCallback, useRef } from "react";
import FilterDropdown, { FilterState } from "../components/basic/FilterDropdown.tsx";
import PatientManagementOverviewModal from "./PatientManagementOverviewVisible.tsx";
import PatientManagementOverviewEdit from "./updateAndDelete/PatientManagementOverviewEdit.tsx";
import PatientEditModal from "./patientEditModal.tsx";
import DeleteConfirmationModal from "./DeleteConfirmationModalPatient.tsx";
import {
    getPatientsByDoctorId,
    type Patient as ServicePatient,
} from '../services/patientDoctorService.ts';
import { getLoggedInUser } from '../services/authService.ts';

interface Patient {
    id: string;
    propertyId: string;
    nic: string;
    name: string;
    email: string;
    contact: string;
    age: string;
    gender: string;
    address: string;
    dateOfBirth: string;
    medicalHistory: string;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
    displayText: string;
    status: string;
    statusColor: string;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "Active":
            return "bg-green-200 text-green-700";
        case "Inactive":
            return "bg-red-200 text-red-700";
        default:
            return "bg-gray-200 text-gray-700";
    }
};

const convertServicePatientToTablePatient = (servicePatient: ServicePatient): Patient => {
    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const calculateAgeFromDOB = (dob: string | undefined): string => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age.toString();
    };

    const isActive = servicePatient.activeStatus;

    return {
        id: servicePatient._id,
        propertyId: servicePatient.propertyId,
        nic: servicePatient.patientNIC,
        name: servicePatient.patientName,
        email: servicePatient.patientEmail || 'N/A',
        contact: servicePatient.patientPhone,
        age: servicePatient.patientAge?.toString() || calculateAgeFromDOB(servicePatient.dateOfBirth),
        gender: servicePatient.patientGender || 'N/A',
        address: servicePatient.patientAddress || 'N/A',
        dateOfBirth: formatDate(servicePatient.dateOfBirth),
        medicalHistory: servicePatient.medicalHistory || 'No medical history recorded',
        isActive: isActive,
        createdDate: formatDate(servicePatient.createdAt),
        updatedDate: formatDate(servicePatient.updatedAt),
        displayText: `${servicePatient.patientName} (${servicePatient.patientNIC})`,
        status: isActive ? 'Active' : 'Inactive',
        statusColor: getStatusColor(isActive ? 'Active' : 'Inactive')
    };
};

export default function PatientManagementOverviewTable() {
    const [patientData, setPatientData] = useState<Patient[]>([]);
    const [filteredPatientData, setFilteredPatientData] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setCurrentDoctorId] = useState<string>('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [basicEditModalOpen, setBasicEditModalOpen] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPatients, setTotalPatients] = useState(0);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

    // Add filter state
    const [filters, setFilters] = useState<FilterState>({
        status: 'All',
        gender: 'All',
        ageRange: 'All',
        dateRange: 'All',
    });

    const itemsPerPage = 10;

    // Fix NodeJS.Timeout to number for browser environment
    const debounceTimeoutRef = useRef<number>(0);

    // Get logged in user
    const loggedInUser = getLoggedInUser();
    const doctorId = loggedInUser?.id;

    // Debounce search term changes
    useEffect(() => {
        // Clear existing timeout
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Set new timeout for debouncing
        debounceTimeoutRef.current = window.setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        // Cleanup function
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    // Reset to page 1 when search term or filters change
    useEffect(() => {
        if (searchTerm !== debouncedSearchTerm) {
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm, searchTerm]);

    // Apply filters to patient data
    const applyFilters = useCallback((patients: Patient[]) => {
        let filtered = [...patients];

        // Filter by status
        if (filters.status !== 'All') {
            filtered = filtered.filter(patient => {
                if (filters.status === 'Active') return patient.isActive;
                if (filters.status === 'Inactive') return !patient.isActive;
                return true;
            });
        }

        // Filter by gender
        if (filters.gender !== 'All') {
            filtered = filtered.filter(patient =>
                patient.gender.toLowerCase() === filters.gender.toLowerCase()
            );
        }

        // Filter by age range
        if (filters.ageRange !== 'All') {
            filtered = filtered.filter(patient => {
                const age = parseInt(patient.age);
                if (isNaN(age)) return false;

                switch (filters.ageRange) {
                    case '0-18': return age >= 0 && age <= 18;
                    case '19-30': return age >= 19 && age <= 30;
                    case '31-50': return age >= 31 && age <= 50;
                    case '51-70': return age >= 51 && age <= 70;
                    case '70+': return age > 70;
                    default: return true;
                }
            });
        }

        // Filter by date range
        if (filters.dateRange !== 'All') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(patient => {
                const createdDate = new Date(patient.createdDate);
                const patientDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());

                switch (filters.dateRange) {
                    case 'Today':
                        return patientDate.getTime() === today.getTime();
                    case 'This Week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return patientDate >= weekAgo;
                    case 'This Month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        return patientDate >= monthStart;
                    case 'This Year':
                        const yearStart = new Date(now.getFullYear(), 0, 1);
                        return patientDate >= yearStart;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [filters]);

    // Update filtered data when base data or filters change
    useEffect(() => {
        const filtered = applyFilters(patientData);
        setFilteredPatientData(filtered);

        // Update pagination based on filtered results
        const filteredTotal = filtered.length;
        const filteredPages = Math.max(1, Math.ceil(filteredTotal / itemsPerPage));

        setTotalPages(filteredPages);
        setTotalPatients(filteredTotal);

        // Reset to page 1 if current page is beyond available pages
        if (currentPage > filteredPages) {
            setCurrentPage(1);
        }

        console.log(`🔧 Applied filters: ${filtered.length} patients after filtering from ${patientData.length} total`);
    }, [patientData, applyFilters, currentPage, itemsPerPage]);

    // Use useCallback to memoize the fetch function
    const fetchPatients = useCallback(async () => {
        if (!doctorId) {
            console.error("Doctor ID not found. User may not be logged in.");
            setError('Doctor ID not found. User may not be logged in.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            console.log(`🔍 Fetching patients for doctor: ${doctorId}, page: ${currentPage}, search: "${debouncedSearchTerm}"`);

            // Pass the search term to the API call
            const response = await getPatientsByDoctorId(
                doctorId,
                currentPage,
                itemsPerPage,
                debouncedSearchTerm || undefined // Pass undefined if empty string
            );

            console.log('📊 Raw API Response:', response);
            console.log('📊 Response type:', typeof response);
            console.log('📊 Response keys:', response ? Object.keys(response) : 'No response');

            // Handle case where response might be null/undefined
            if (!response) {
                console.warn('⚠️ API returned null/undefined response');
                setPatientData([]);
                return;
            }

            // Extract data with comprehensive fallbacks
            let patients: ServicePatient[] = [];

            // Check if response has the expected structure
            if (response && typeof response === 'object') {
                // Handle new API response structure
                if ('patients' in response && Array.isArray(response.patients)) {
                    patients = response.patients;
                    console.log('📄 Using patients from response.patients');
                }
                // Handle legacy response structure (direct array or data property)
                else if (Array.isArray(response)) {
                    console.log('📄 Response is direct array');
                    patients = response;
                }
                // Handle response with 'data' property
                else if ('data' in response && Array.isArray(response.data)) {
                    console.log('📄 Response has data property');
                    patients = response.data;
                }
                else {
                    console.warn('⚠️ Unexpected response structure:', response);
                    patients = [];
                }
            } else {
                console.warn('⚠️ Response is not an object:', response);
                patients = [];
            }

            console.log(`📋 Final processing: ${patients.length} patients from API`);

            // Convert service patients to table patients
            const tablePatients = patients.map(convertServicePatientToTablePatient);

            // Update base patient data (filters will be applied in useEffect)
            setPatientData(tablePatients);

            console.log(`✅ Base data updated successfully with ${tablePatients.length} patients`);

        } catch (err: any) {
            console.error('❌ Error fetching patients:', err);
            setError(err.message || 'Failed to fetch patients');
            setPatientData([]);
            setFilteredPatientData([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, doctorId]);

    // Initialize doctor ID on mount
    useEffect(() => {
        if (doctorId) {
            setCurrentDoctorId(doctorId);
        } else {
            setError('User not logged in or ID not found');
        }
    }, [doctorId]);

    // Fetch patients when dependencies change
    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    // Handle filter changes
    const handleFilterChange = (newFilters: FilterState) => {
        console.log('🔧 Filters changed:', newFilters);
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (page: number) => {
        console.log(`🔄 Page change requested: ${page}, current: ${currentPage}, total pages: ${totalPages}`);

        if (page >= 1 && page <= totalPages && page !== currentPage && !loading) {
            console.log(`✅ Changing page from ${currentPage} to ${page}`);
            setCurrentPage(page);
        } else {
            console.log(`❌ Page change rejected: page=${page}, totalPages=${totalPages}, loading=${loading}`);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        console.log(`🔍 Search term changed: "${value}"`);
        // Page reset will happen automatically when debouncedSearchTerm changes
    };

    const handleViewClick = (patient: Patient) => {
        setSelectedPatient(patient);
        setViewModalOpen(true);
    };

    const handleEditClick = (patient: Patient) => {
        setSelectedPatient(patient);
        setEditModalOpen(true);
    };

    const handleBasicEditClick = (patient: Patient) => {
        setSelectedPatient(patient);
        setBasicEditModalOpen(true);
    };

    const handleDeleteClick = (patient: Patient) => {
        setSelectedPatient(patient);
        setDeleteModalVisible(true);
    };
    const handleBasicEditSave = (updatedPatient: Patient) => {
        // Update the local state immediately for better UX
        setPatientData(prev =>
            prev.map(p => p.id === updatedPatient.id ? updatedPatient : p)
        );

        // Close the modal
        setBasicEditModalOpen(false);

        // Refresh data from server
        fetchPatients();

        console.log('✅ Patient updated:', updatedPatient);
    };

    const handleDeleteConfirm = () => {
        if (selectedPatient) {
            setDeleteModalVisible(false);
            setSelectedPatient(null);
            // Refresh data after deletion
            fetchPatients();
        }
    };

    // Clear search function
    const clearSearch = () => {
        console.log('🗑️ Clearing search');
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Enhanced search placeholder and help text
    const getSearchPlaceholder = () => {
        return "Search by NIC, Name, or Phone Number";
    };

    const getSearchHelpText = () => {
        if (debouncedSearchTerm && filteredPatientData.length === 0 && !loading) {
            return `No patients found for "${debouncedSearchTerm}". Try a different search term.`;
        }
        if (debouncedSearchTerm && filteredPatientData.length > 0) {
            return `Found ${totalPatients} patient(s) matching "${debouncedSearchTerm}"`;
        }
        return null;
    };

    // Get display data for current page
    const getDisplayPatients = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredPatientData.slice(startIndex, endIndex);
    };

    const displayPatients = getDisplayPatients();

    if (loading && patientData.length === 0) {
        return (
            <div className="p-2 border bg-white rounded-sm flex justify-center items-center py-20">
                <div className="text-center">
                    <div className="text-2xl mb-2">⏳</div>
                    <p className="text-gray-500">Loading patients...</p>
                    {debouncedSearchTerm && (
                        <p className="text-sm text-gray-400 mt-1">Searching for "{debouncedSearchTerm}"</p>
                    )}
                </div>
            </div>
        );
    }

    if (error && !loading) {
        return (
            <div className="p-2 border bg-white rounded-sm flex justify-center items-center py-20">
                <div className="text-center">
                    <div className="text-2xl mb-2">❌</div>
                    <p className="text-red-500 mb-4">{error}</p>
                    <button
                        onClick={fetchPatients}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-2 border bg-white rounded-sm relative">
                <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-4">
                    <h2 className="text-[20px] font-semibold w-full md:w-auto text-center md:text-left">
                        Patients Management
                        <span className="text-[14px] text-gray-500 ml-2">
                            ({totalPatients} patients
                            {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
                            {Object.values(filters).some(f => f !== 'All') && ' (filtered)'})
                        </span>
                    </h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder={getSearchPlaceholder()}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="border text-[12px] border-gray-300 rounded-lg px-3 py-2 w-80 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {searchTerm && (
                                <button
                                    onClick={clearSearch}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                            {loading && searchTerm && (
                                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                        </div>
                        <FilterDropdown
                            onFilterChange={handleFilterChange}
                            currentFilters={filters}
                        />
                    </div>
                </div>

                {/* Show active filters summary */}
                {Object.values(filters).some(f => f !== 'All') && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {Object.entries(filters).map(([key, value]) => {
                            if (value === 'All') return null;
                            return (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                                >
                                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {value}
                                    <button
                                        onClick={() => handleFilterChange({...filters, [key as keyof FilterState]: 'All'})}
                                        className="hover:bg-blue-200 rounded-full p-0.5"
                                        title={`Remove ${key} filter`}
                                    >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Search help text */}
                {getSearchHelpText() && (
                    <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        {getSearchHelpText()}
                    </div>
                )}

                {loading && patientData.length > 0 && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="text-xl mb-1">⏳</div>
                            <p className="text-gray-500 text-sm">Searching...</p>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="min-w-full text-[13px] table-auto border bg-white">
                        <thead className="bg-white">
                        <tr className="text-left">
                            {[
                                "NIC", "Patient Name", "Age", "Gender", "Contact Num", "Email",
                                "Address", "Date of Birth", "Medical History", "Status", "Created Date", "Actions"
                            ].map((heading) => (
                                <th key={heading} className="px-2 py-2 whitespace-nowrap font-medium text-[14px]">{heading}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {displayPatients.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={12} className="px-2 py-8 text-center text-gray-500">
                                    {debouncedSearchTerm || Object.values(filters).some(f => f !== 'All') ? (
                                        <div>
                                            <p>No patients found with current search and filters.</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                Try adjusting your search term or clearing some filters.
                                            </p>
                                            <div className="flex gap-2 justify-center mt-2">
                                                {debouncedSearchTerm && (
                                                    <button
                                                        onClick={clearSearch}
                                                        className="text-blue-500 hover:text-blue-700 underline"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                                {Object.values(filters).some(f => f !== 'All') && (
                                                    <button
                                                        onClick={() => handleFilterChange({
                                                            status: 'All',
                                                            gender: 'All',
                                                            ageRange: 'All',
                                                            dateRange: 'All',
                                                        })}
                                                        className="text-blue-500 hover:text-blue-700 underline"
                                                    >
                                                        Clear filters
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        `No patients found for page ${currentPage}.`
                                    )}
                                </td>
                            </tr>
                        ) : (
                            displayPatients.map((patient) => (
                                <tr key={patient.id} className="border-t hover:bg-gray-50">
                                    <td className="px-2 py-2 whitespace-nowrap">{patient.nic}</td>
                                    <td className="px-2 py-2 whitespace-nowrap font-medium">{patient.name}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">{patient.age}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            patient.gender === 'MALE' ? 'bg-blue-100 text-blue-700' :
                                                patient.gender === 'FEMALE' ? 'bg-pink-100 text-pink-700' :
                                                    'bg-gray-100 text-gray-700'
                                        }`}>
                                            {patient.gender}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap">{patient.contact}</td>
                                    <td className="px-2 py-2 whitespace-nowrap text-blue-600">{patient.email}</td>
                                    <td className="px-2 py-2 max-w-[150px] truncate" title={patient.address}>
                                        {patient.address}
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap">{patient.dateOfBirth}</td>
                                    <td className="px-2 py-2 max-w-[200px] truncate" title={patient.medicalHistory}>
                                        {patient.medicalHistory}
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        <span className={`text-[12px] px-2 py-1 rounded-full ${patient.statusColor}`}>
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{patient.createdDate}</td>
                                    <td className="px-2 py-2 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="material-symbols-outlined text-[16px] cursor-pointer hover:text-blue-600"
                                                onClick={() => handleViewClick(patient)}
                                                title="View Patient Details"
                                            >
                                                visibility
                                            </span>
                                            <span
                                                className="material-symbols-outlined text-[16px] cursor-pointer hover:text-green-600"
                                                onClick={() => handleBasicEditClick(patient)}
                                                title="Edit Basic Patient Details"
                                            >
                                                edit
                                            </span>
                                            <span
                                                className="material-symbols-outlined text-[16px] cursor-pointer hover:text-orange-600"
                                                onClick={() => handleEditClick(patient)}
                                                title="Advanced Edit"
                                            >
                                                settings
                                            </span>
                                            <span
                                                className="material-symbols-outlined text-red-500 text-[16px] cursor-pointer hover:text-red-700"
                                                onClick={() => handleDeleteClick(patient)}
                                                title="Delete Patient Record"
                                            >
                                                delete
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination - Always show if there's data or multiple pages */}
                {(totalPages > 1 || totalPatients > 0) && (
                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-600">
                            Showing {displayPatients.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} to {Math.min(currentPage * itemsPerPage, totalPatients)} of {totalPatients} patients
                            {(debouncedSearchTerm || Object.values(filters).some(f => f !== 'All')) && <span className="text-blue-600"> (filtered)</span>}
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={currentPage === 1 || loading}
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                Prev
                            </button>
                            {[...Array(Math.max(1, totalPages))].map((_, i) => {
                                const pageNum = i + 1;
                                // Show first page, last page, current page, and pages around current page
                                if (
                                    pageNum === 1 ||
                                    pageNum === totalPages ||
                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={pageNum}
                                            className={`px-3 py-1 text-sm border rounded disabled:cursor-not-allowed ${
                                                currentPage === pageNum ? "bg-secondary text-white font-semibold" : ""
                                            }`}
                                            onClick={() => handlePageChange(pageNum)}
                                            disabled={loading}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                } else if (
                                    (pageNum === currentPage - 2 && currentPage > 3) ||
                                    (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                                ) {
                                    return <span key={pageNum} className="px-2 py-1">...</span>;
                                }
                                return null;
                            })}
                            <button
                                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewModalOpen && (
                <PatientManagementOverviewModal
                    open={viewModalOpen}
                    onClose={() => setViewModalOpen(false)}
                    prescriptionId={selectedPatient?.id}
                    patientPropertyId={selectedPatient?.propertyId}
                />
            )}

            {/* Advanced Edit Modal */}
            {editModalOpen && (
                <PatientManagementOverviewEdit
                    patientId={selectedPatient?.id}
                    patientPropertyId={selectedPatient?.propertyId}
                    open={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                />
            )}

            {/* Basic Edit Modal */}
            {basicEditModalOpen && (
                <PatientEditModal
                    patient={selectedPatient}
                    open={basicEditModalOpen}
                    onClose={() => setBasicEditModalOpen(false)}
                    onSave={handleBasicEditSave}
                />
            )}

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={handleDeleteConfirm}
                patientId={selectedPatient?.id}
                message={`Are you sure you want to delete the record for ${selectedPatient?.name}? This action cannot be undone.`}
            />
        </>
    );
}