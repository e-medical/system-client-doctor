import { useEffect, useState, useCallback} from "react";
import DeleteConfirmationModal from "./DeleteConfirmationModal.tsx";
import ViewAppointmentModal from "./ViewAppointmentModal.tsx";
import AppointmentModal from "./AppointmentModal.tsx";
import UpdateAppointmentModal from "./UpdateAppointmentModal.tsx";
import FilterDropdown, { AppointmentFilterState } from "./FilterDropdown.tsx";

import {
    getAppointmentsByDoctor,
    type Appointment,
} from "../../services/appointmentService.ts";
import { getLoggedInUser} from "../../services/authService.ts";

// Status badge color generator
const getStatusColor = (status: string) => {
    switch (status) {
        case "SCHEDULED":
            return "bg-[#64DBE1] text-[#056B70]";
        case "CONFIRMED":
            return "bg-green-200 text-green-700";
        case "CANCELLED":
            return "bg-red-200 text-red-700";
        case "IN_PROGRESS":
            return "bg-yellow-200 text-yellow-700";
        case "COMPLETED":
            return "bg-blue-200 text-blue-700";
        default:
            return "bg-gray-200 text-gray-700";
    }
};

// Create appointment-specific filter structure (removed unused variable)

export default function PatientsOverview() {
    const [patientData, setPatientData] = useState<Appointment[]>([]);
    const [filteredPatientData, setFilteredPatientData] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Appointment | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [totalPages, setTotalPages] = useState(1);
    const [totalAppointments, setTotalAppointments] = useState(0);

    // Custom appointment filters (removed unused filters and setFilters)
    const [appointmentFilters, setAppointmentFilters] = useState({
        status: 'All',
        dateRange: 'All',
        feeRange: 'All',
        channelRange: 'All',
    });

    const loggedInUser = getLoggedInUser();
    const doctorId = loggedInUser?.id;

    // Apply filters to appointment data
    const applyFilters = useCallback((appointments: Appointment[]) => {
        let filtered = [...appointments];

        // Filter by status
        if (appointmentFilters.status !== 'All') {
            filtered = filtered.filter(appointment =>
                appointment.status.toLowerCase() === appointmentFilters.status.toLowerCase().replace(' ', '_')
            );
        }

        // Filter by date range
        if (appointmentFilters.dateRange !== 'All') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            filtered = filtered.filter(appointment => {
                const appointmentDate = new Date(appointment.appointmentDate);
                const apptDate = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());

                switch (appointmentFilters.dateRange) {
                    case 'Today':
                        return apptDate.getTime() === today.getTime();
                    case 'This Week':
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return apptDate >= weekAgo;
                    case 'This Month':
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                        return apptDate >= monthStart;
                    case 'This Year':
                        const yearStart = new Date(now.getFullYear(), 0, 1);
                        return apptDate >= yearStart;
                    default:
                        return true;
                }
            });
        }

        // Filter by fee range
        if (appointmentFilters.feeRange !== 'All') {
            filtered = filtered.filter(appointment => {
                const fee = parseFloat(String(appointment.channelFee));
                if (isNaN(fee)) return false;

                switch (appointmentFilters.feeRange) {
                    case '0-1000': return fee >= 0 && fee <= 1000;
                    case '1001-3000': return fee >= 1001 && fee <= 3000;
                    case '3001-5000': return fee >= 3001 && fee <= 5000;
                    case '5000+': return fee > 5000;
                    default: return true;
                }
            });
        }

        // Filter by channel number range
        if (appointmentFilters.channelRange !== 'All') {
            filtered = filtered.filter(appointment => {
                const channelNo = parseInt(String(appointment.channelNo));
                if (isNaN(channelNo)) return false;

                switch (appointmentFilters.channelRange) {
                    case '001-050': return channelNo >= 1 && channelNo <= 50;
                    case '051-100': return channelNo >= 51 && channelNo <= 100;
                    case '101-150': return channelNo >= 101 && channelNo <= 150;
                    case '151+': return channelNo > 150;
                    default: return true;
                }
            });
        }

        return filtered;
    }, [appointmentFilters]);

    // Update filtered data when base data or filters change
    useEffect(() => {
        const filtered = applyFilters(patientData);
        setFilteredPatientData(filtered);

        // Update pagination based on filtered results
        const filteredTotal = filtered.length;
        const filteredPages = Math.max(1, Math.ceil(filteredTotal / itemsPerPage));

        setTotalPages(filteredPages);
        setTotalAppointments(filteredTotal);

        // Reset to page 1 if current page is beyond available pages
        if (currentPage > filteredPages) {
            setCurrentPage(1);
        }

        console.log(`🔧 Applied filters: ${filtered.length} appointments after filtering from ${patientData.length} total`);
    }, [patientData, applyFilters, currentPage, itemsPerPage]);

    // Use useCallback to memoize the fetch function
    const fetchAppointments = useCallback(async () => {
        if (!doctorId) {
            console.error("Doctor ID not found. User may not be logged in.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await getAppointmentsByDoctor({
                doctorId: doctorId,
                page: currentPage,
                size: itemsPerPage,
                search: searchTerm,
                sortBy: "appointmentDate",
                sortOrder: "desc",
            });

            setPatientData(res.data);
            console.log(`✅ Fetched ${res.data.length} appointments from API`);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setPatientData([]);
            setFilteredPatientData([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, doctorId]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Handle filter changes from the FilterDropdown component
    const handleFilterChange = (newFilters: AppointmentFilterState) => {
        console.log('🔧 Filters changed:', newFilters);
        setAppointmentFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // --- Modal Opening Handlers ---
    const handleEditClick = (patient: Appointment) => {
        setSelectedPatient(patient);
        setEditModalVisible(true);
    };

    const handleDeleteClick = (patient: Appointment) => {
        setSelectedPatient(patient);
        setDeleteModalVisible(true);
    };

    const handleViewClick = (patient: Appointment) => {
        setSelectedPatient(patient);
        setViewModalVisible(true);
    };

    // Get display data for current page
    const getDisplayAppointments = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredPatientData.slice(startIndex, endIndex);
    };

    const displayAppointments = getDisplayAppointments();

    // Clear search function
    const clearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Clear all filters
    const clearAllFilters = () => {
        const clearedFilters: AppointmentFilterState = {
            status: 'All',
            dateRange: 'All',
            feeRange: 'All',
            channelRange: 'All',
        };
        setAppointmentFilters(clearedFilters);
        setCurrentPage(1);
    };

    // Get active filter count
    const getActiveFilterCount = () => {
        return Object.values(appointmentFilters).filter(value => value !== 'All').length;
    };

    const activeFilterCount = getActiveFilterCount();

    return (
        <div className="p-2 border bg-white rounded-sm relative">
            {/* Modals are now connected to the corrected handlers */}
            <AppointmentModal isOpen={modalVisible} onClose={() => setModalVisible(false)} onAdd={fetchAppointments} />
            <UpdateAppointmentModal isOpen={editModalVisible} onClose={() => setEditModalVisible(false)} onUpdate={fetchAppointments} selectedPatient={selectedPatient} />
            <DeleteConfirmationModal isOpen={deleteModalVisible} onClose={() => setDeleteModalVisible(false)} onConfirm={fetchAppointments} selectedPatientAppointmentId={selectedPatient?._id}/>
            <ViewAppointmentModal isOpen={viewModalVisible} onClose={() => setViewModalVisible(false)} selectedPatient={selectedPatient} />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                {/* Title */}
                <div className="w-full md:w-auto">
                    <h2 className="text-[20px] font-semibold text-center md:text-left">
                        Appointments Management
                        <span className="text-[14px] text-gray-500 ml-2">
                            ({totalAppointments} appointments
                            {searchTerm && ` for "${searchTerm}"`}
                            {activeFilterCount > 0 && ' (filtered)'})
                        </span>
                    </h2>
                </div>

                {/* Search Bar - Centered */}
                <div className="flex-1 max-w-md mx-auto">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search by NIC Number"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border text-[12px] border-gray-300 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end">
                    <button onClick={() => setModalVisible(true)} className="bg-secondary text-[14px] text-white px-3.5 py-2.5 rounded-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">add</span> Add New
                    </button>
                    <FilterDropdown
                        onFilterChange={handleFilterChange}
                        currentFilters={appointmentFilters}
                    />
                </div>
            </div>

            {/* Show active filters summary */}
            {activeFilterCount > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {Object.entries(appointmentFilters).map(([key, value]) => {
                        if (value === 'All') return null;
                        const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                            <span
                                key={key}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                                {displayKey}: {value}
                                <button
                                    onClick={() => setAppointmentFilters(prev => ({ ...prev, [key]: 'All' }))}
                                    className="hover:bg-blue-200 rounded-full p-0.5"
                                    title={`Remove ${displayKey} filter`}
                                >
                                    <span className="material-symbols-outlined text-[12px]">close</span>
                                </button>
                            </span>
                        );
                    })}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs text-red-600 hover:text-red-800 underline ml-2"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && patientData.length > 0 && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="text-center">
                        <div className="text-xl mb-1">⏳</div>
                        <p className="text-gray-500 text-sm">Loading...</p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-[13px] table-auto border bg-white">
                    <thead className="bg-white">
                    <tr className="text-left">
                        {[
                            "NIC", "Patient Name", "Age", "Contact Num", "Channel Num", "Channel Fee",  "Doctor",
                            "Schedule Time", "Schedule Date", "Status", "Actions"
                        ].map((heading, index) => (
                            <th key={index} className="px-2 py-2 whitespace-nowrap font-medium text-[14px]">{heading}</th>
                        ))}
                        {/*"Verify By"*/}
                    </tr>
                    </thead>
                    <tbody>
                    {loading && patientData.length === 0 ? (
                        <tr><td colSpan={12} className="text-center py-8">
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                Loading appointments...
                            </div>
                        </td></tr>
                    ) : displayAppointments.length === 0 ? (
                        <tr><td colSpan={12} className="px-2 py-8 text-center text-gray-500">
                            {searchTerm || activeFilterCount > 0 ? (
                                <div>
                                    <p>No appointments found with current search and filters.</p>
                                    <div className="flex gap-2 justify-center mt-2">
                                        {searchTerm && (
                                            <button
                                                onClick={clearSearch}
                                                className="text-blue-500 hover:text-blue-700 underline"
                                            >
                                                Clear search
                                            </button>
                                        )}
                                        {activeFilterCount > 0 && (
                                            <button
                                                onClick={clearAllFilters}
                                                className="text-blue-500 hover:text-blue-700 underline"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                "No appointments found"
                            )}
                        </td></tr>
                    ) : (
                        displayAppointments.map((patient) => (
                            <tr key={patient._id} className="border-t hover:bg-gray-50">
                                <td className="px-2 py-2 whitespace-nowrap">{patient.patientNIC}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{patient.patientName}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{patient.patientAge}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{patient.patientPhone}</td>
                                <td className="px-2 py-2 whitespace-nowrap">CN{String(patient.channelNo).padStart(3, "0")}</td>
                                <td className="px-2 py-2 whitespace-nowrap">LKR. {patient.channelFee}</td>
                                {/*<td className="px-2 py-2 whitespace-nowrap">{patient.createdBy}</td>*/}
                                <td className="px-2 py-2 whitespace-nowrap">{patient.doctorName}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{patient.appointmentTime}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{patient.appointmentDate.split("T")[0]}</td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    <span className={`text-[12px] px-2 py-1 rounded-full ${getStatusColor(patient.status)}`}>
                                        {patient.status}
                                    </span>
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-blue-600" onClick={() => handleViewClick(patient)} title="View Details">visibility</span>
                                        <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-green-600" onClick={() => handleEditClick(patient)} title="Edit Appointment">edit</span>
                                        <span className="material-symbols-outlined text-red-500 text-[16px] cursor-pointer hover:text-red-700" onClick={() => handleDeleteClick(patient)} title="Delete Appointment">delete</span>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {(totalPages > 1 || totalAppointments > 0) && (
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-600">
                        Showing {displayAppointments.length > 0 ? ((currentPage - 1) * itemsPerPage + 1) : 0} to {Math.min(currentPage * itemsPerPage, totalAppointments)} of {totalAppointments} appointments
                        {(searchTerm || activeFilterCount > 0) && <span className="text-blue-600"> (filtered)</span>}
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
    );
}
