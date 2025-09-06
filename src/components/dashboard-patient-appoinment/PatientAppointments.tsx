import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Patient, PatientAppointmentsProps } from './types.ts';
import PatientDetailsModal from './PatientDetailsModal.tsx';
import PatientEditModal from "./PatientEditModal.tsx";
import {
    getUpcomingAppointmentsData,
    type UpcomingAppointmentData
} from '../../services/getUpcomingAppointments.ts';
import { getAllDoctors, type Doctor } from '../../services/doctorService.ts';
import { getLoggedInUser } from '../../services/authService.ts';
import DeleteConfirmationModal from "./DeleteConfirmationModal.tsx";
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Eye, Edit, Trash2, RefreshCw } from 'lucide-react';

//=========== CONSTANTS & TYPES ===========//

interface DateItem {
    day: string;
    date: number;
    fullDate: string;
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;
}

//=========== UTILITY FUNCTIONS ===========//

/**
 * Get current date in local timezone (not UTC)
 */
const getCurrentDate = (): Date => {
    return new Date();
};

/**
 * Format date to YYYY-MM-DD in local timezone
 */
const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Check if two dates are the same day (ignoring time)
 */
const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

/**
 * Generate date array with proper today detection
 */
const generateDateArray = (currentDate: Date): DateItem[] => {
    const dates: DateItem[] = [];

    // Start from 3 days ago to include past dates
    for (let i = -3; i <= 7; i++) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + i);

        const isToday = isSameDay(date, currentDate);
        const isPast = date < currentDate && !isToday;
        const isFuture = date > currentDate && !isToday;

        dates.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate(),
            fullDate: formatDateToString(date),
            isToday,
            isPast,
            isFuture
        });
    }

    return dates;
};

/**
 * Normalizes date to YYYY-MM-DD format
 */
const normalizeDate = (dateString: string): string => {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return '';
        }
        return formatDateToString(date);
    } catch (error) {
        console.error('Error normalizing date:', dateString, error);
        return '';
    }
};

/**
 * Enhanced status styling with secondary color
 */
const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
        case 'scheduled':
            return 'bg-secondary/10 text-secondary border border-secondary/20';
        case 'confirmed':
            return 'bg-green-100 text-green-800 border border-green-200';
        case 'completed':
            return 'bg-blue-100 text-blue-800 border border-blue-200';
        case 'cancelled':
            return 'bg-red-100 text-red-800 border border-red-200';
        case 'no_show':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'in_progress':
            return 'bg-purple-100 text-purple-800 border border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
};

/**
 * Get display-friendly status text
 */
const getStatusDisplayText = (status: string): string => {
    switch (status.toLowerCase()) {
        case 'scheduled':
            return 'Scheduled';
        case 'confirmed':
            return 'Confirmed';
        case 'completed':
            return 'Completed';
        case 'cancelled':
            return 'Cancelled';
        case 'no_show':
            return 'No Show';
        case 'in_progress':
            return 'In Progress';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
};

/**
 * Converts API UpcomingAppointmentData to Patient format for UI compatibility
 */
const convertAppointmentToPatient = (appointment: UpcomingAppointmentData): {
    date: string;
    address: string;
    channelNo: string;
    fee: string;
    channel: string;
    nic: string;
    verifiedBy: string;
    doctor: string;
    contact: string;
    name: string;
    _appointmentData: string;
    appointmentData: string;
    _id: string;
    time: string;
    id: string;
    email: string;
    age: string;
    status: string
} => {
    const normalizedDate = normalizeDate(appointment.appointmentDate);

    return {
        _id: appointment._id || '',
        nic: appointment.patientNIC || '',
        name: appointment.patientName || '',
        email: appointment.patientEmail || '',
        contact: appointment.patientPhone || '',
        age: appointment.patientAge?.toString() || '',
        channelNo: appointment.channelNo?.toString() || '0',
        verifiedBy: appointment.createdBy || 'System',
        doctor: appointment.doctorName || '',
        time: appointment.appointmentTime || '',
        date: normalizedDate,
        address: appointment.patientAddress || '',
        fee: `Rs. ${appointment.channelFee?.toLocaleString() || '0'}`,
        status: appointment.status?.toLowerCase() || 'unknown',
        appointmentData: appointment.appointmentDate,
        _appointmentData: appointment.appointmentDate,
        id: appointment._id || '', // Add the id property that was missing
        channel: '',
    };
};

//=========== CUSTOM HOOKS ===========//

/**
 * Hook for managing current time and auto-updating dates
 */
const useCurrentTime = () => {
    const [currentDate, setCurrentDate] = useState(getCurrentDate);

    useEffect(() => {
        // Update every minute to catch midnight crossover
        const interval = setInterval(() => {
            const now = getCurrentDate();
            setCurrentDate(now);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    return currentDate;
};

/**
 * Hook for doctor profile management
 */
const useDoctorProfile = () => {
    const [doctorId, setDoctorId] = useState<string>('');
    const [doctorName, setDoctorName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeDoctorData = async () => {
            try {
                setLoading(true);
                setError(null);

                const loggedInUser = getLoggedInUser();
                if (!loggedInUser?.id) {
                    throw new Error('Please log in to view appointments');
                }

                const doctorsResponse = await getAllDoctors();
                if (!doctorsResponse?.success || !Array.isArray(doctorsResponse.data)) {
                    throw new Error('Failed to load doctor information');
                }

                const matchedDoctor = doctorsResponse.data.find((doctor: Doctor) => {
                    const doctorUserId = String(doctor.systemUser?.id || '');
                    const loggedUserId = String(loggedInUser.id);
                    return doctorUserId === loggedUserId;
                });

                if (!matchedDoctor) {
                    throw new Error('No doctor profile found for your account. Please contact administrator.');
                }

                if (!matchedDoctor.propertyId) {
                    throw new Error('Doctor profile is incomplete. Please contact support.');
                }

                setDoctorId(matchedDoctor.propertyId);
                setDoctorName(`Dr. ${matchedDoctor.firstName} ${matchedDoctor.lastName}`);

            } catch (err) {
                console.error('Error initializing doctor data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load doctor information');
            } finally {
                setLoading(false);
            }
        };

        initializeDoctorData();
    }, []);

    return { doctorId, doctorName, loading, error };
};

//=========== LOADING COMPONENTS ===========//

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-3 text-secondary" />
        <p className="text-lg font-medium mb-2">{message}</p>
        <p className="text-sm">Please wait while we fetch your data.</p>
    </div>
);

const EmptyState: React.FC<{ error?: string }> = ({ error }) => (
    <div className="text-center py-16 text-gray-500">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">
            {error ? "Failed to load appointments" : "No appointments for this date"}
        </p>
        <p className="text-sm">
            {error ? "Please check your connection and try again." : "Select a different date to view appointments."}
        </p>
    </div>
);

//=========== MAIN COMPONENT ===========//

const PatientAppointments: React.FC<Partial<PatientAppointmentsProps>> = ({ }) => {
    // State management
    const currentTime = useCurrentTime();
    const dates = useMemo(() => generateDateArray(currentTime), [currentTime]);

    // Find today's index in the dates array
    const todayIndex = useMemo(() => {
        return dates.findIndex(date => date.isToday);
    }, [dates]);

    const [selectedDateIndex, setSelectedDateIndex] = useState(todayIndex >= 0 ? todayIndex : 0);
    const [sortField, setSortField] = useState<keyof Patient | null>('time');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [appointments, setAppointments] = useState<Patient[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    // Doctor profile
    const { doctorId, doctorName, loading: doctorLoading, error: doctorError } = useDoctorProfile();

    // Auto-update selectedDateIndex when dates change (after midnight)
    useEffect(() => {
            const newTodayIndex = dates.findIndex(date => date.isToday);
        if (newTodayIndex >= 0 && newTodayIndex !== todayIndex) {
            setSelectedDateIndex(newTodayIndex);
        }
    }, [dates, todayIndex]);

    const selectedDate = dates[selectedDateIndex];

    // Fetch appointments when doctor ID and selected date change
    const fetchAppointments = useCallback(async () => {
        if (!doctorId || !selectedDate) {
            return;
        }

        setAppointmentsLoading(true);
        setAppointmentsError(null);

        try {
            const appointmentData = await getUpcomingAppointmentsData({
                doctorId: doctorId,
                date: selectedDate.fullDate
            });

            if (Array.isArray(appointmentData)) {
                const convertedPatients = appointmentData.map(convertAppointmentToPatient);
                setAppointments(convertedPatients);
            } else {
                setAppointments([]);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setAppointmentsError('Failed to load appointments. Please try again.');
            setAppointments([]);
        } finally {
            setAppointmentsLoading(false);
        }
    }, [doctorId, selectedDate?.fullDate]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Filter and sort appointments
    const filteredPatients = useMemo(() => {
        return appointments.filter(appointment =>
            appointment.date === selectedDate?.fullDate
        );
    }, [appointments, selectedDate?.fullDate]);

    const sortedPatients = useMemo(() => {
        return [...filteredPatients].sort((a, b) => {
            if (!sortField) return 0;

            const aValue = a[sortField];
            const bValue = b[sortField];

            if (!aValue && !bValue) return 0;
            if (!aValue) return sortDirection === 'asc' ? 1 : -1;
            if (!bValue) return sortDirection === 'asc' ? -1 : 1;

            if (sortField === 'time') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortDirection === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue);
            }

            return 0;
        });
    }, [filteredPatients, sortField, sortDirection]);

    // Event handlers
    const handleSort = useCallback((field: keyof Patient) => {
        const newDirection = (sortField === field && sortDirection === 'asc') ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);
    }, [sortField, sortDirection]);

    const handleAction = useCallback((action: string, patient: Patient) => {
        switch (action) {
            case 'view':
                setSelectedPatient(patient);
                setIsModalOpen(true);
                break;
            case 'edit':
                setPatientToEdit(patient);
                setIsEditModalOpen(true);
                break;
            case 'delete':
                setSelectedPatient(patient);
                setDeleteModalVisible(true);
                break;
            default:
                console.log(`${action} action for patient:`, patient);
        }
    }, []);

    const navigateDate = useCallback((direction: 'prev' | 'next') => {
        const newIndex = direction === 'prev' ? selectedDateIndex - 1 : selectedDateIndex + 1;
        if (newIndex >= 0 && newIndex < dates.length) {
            setSelectedDateIndex(newIndex);
        }
    }, [selectedDateIndex, dates.length]);

    const canNavigatePrev = selectedDateIndex > 0;
    const canNavigateNext = selectedDateIndex < dates.length - 1;

    // Loading state for doctor profile
    if (doctorLoading) {
        return (
            <div className="bg-white p-6 rounded-lg h-full w-full max-w-7xl mx-auto">
                <LoadingSpinner message="Loading doctor profile..." />
            </div>
        );
    }

    // Error state for doctor profile
    if (doctorError) {
        return (
            <div className="bg-white p-6 rounded-lg h-full w-full max-w-7xl mx-auto">
                <div className="text-center py-16">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Unable to Load Appointments</h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">{doctorError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm h-full w-full max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4">
                    <div className="flex items-center mb-2 sm:mb-0">
                        <Calendar className="w-6 h-6 text-secondary mr-2" />
                        <h2 className="text-l font-semibold text-gray-900">Patient Appointments</h2>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="text-gray-600 text-sm">
                            <User className="w-4 h-4 inline mr-1" />
                            {doctorName}
                        </div>
                        <div className="font-semibold text-secondary">
                            {filteredPatients.length} appointments
                        </div>
                        <div className="text-gray-500">
                            {selectedDate?.fullDate}
                        </div>
                        {(appointmentsLoading || appointmentsError) && (
                            <div className="flex items-center">
                                {appointmentsLoading && (
                                    <span className="text-secondary flex items-center">
                                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                        Loading...
                                    </span>
                                )}
                                {appointmentsError && (
                                    <span className="text-red-500 text-xs">{appointmentsError}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enhanced Date Navigation - Removed scrollbar */}
                <div className="bg-gradient-to-r from-secondary/5 to-secondary/10 rounded-xl p-4 mb-6 border border-secondary/10">
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => navigateDate('prev')}
                            disabled={!canNavigatePrev}
                            className="w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>

                        <div className="flex space-x-2 mx-4 overflow-x-auto py-1 scrollbar-thin scrollbar-thumb-secondary scrollbar-track-gray-100">
                            {dates.map((item, index) => {
                                const isSelected = selectedDateIndex === index;
                                const buttonClass = `min-w-[70px] p-3 rounded-xl transition-all duration-200 ${
                                    isSelected
                                        ? 'bg-secondary text-white scale-105 shadow-lg transform'
                                        : item.isToday
                                            ? 'bg-white text-secondary border-2 border-secondary/30 font-semibold'
                                            : item.isPast
                                                ? 'bg-white text-gray-500 hover:bg-gray-50'
                                                : 'bg-white text-gray-700 hover:bg-secondary/5 hover:text-secondary'
                                }`;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDateIndex(index)}
                                        className={buttonClass}
                                    >
                                        <div className="text-xs font-medium mb-1">
                                            {item.isToday ? 'Today' : item.day}
                                        </div>
                                        <div className="text-lg font-bold">
                                            {item.date}
                                        </div>
                                        {item.isToday && (
                                            <div className="text-xs opacity-75">
                                                {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => navigateDate('next')}
                            disabled={!canNavigateNext}
                            className="w-10 h-10 rounded-full bg-white shadow-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Appointments Table */}
                <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    {sortedPatients.length === 0 && !appointmentsLoading ? (
                        <EmptyState />
                    ) : appointmentsLoading ? (
                        <LoadingSpinner message="Loading appointments..." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <tr>
                                    {[
                                        { key: 'name', label: 'Patient', icon: <User className="w-4 h-4" /> },
                                        { key: 'nic', label: 'NIC', icon: null },
                                        { key: 'time', label: 'Time', icon: <Clock className="w-4 h-4" /> },
                                        { key: 'age', label: 'Age', icon: null },
                                        { key: 'status', label: 'Status', icon: null }
                                    ].map(({ key, label, icon }) => (
                                        <th
                                            key={key}
                                            onClick={() => handleSort(key as keyof Patient)}
                                            className="text-left px-6 py-4 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-secondary/5 transition-colors select-none"
                                        >
                                            <div className="flex items-center space-x-2">
                                                {icon}
                                                <span>{label}</span>
                                                {sortField === key && (
                                                    <span className="text-secondary">
                                                            {sortDirection === 'asc' ? '↑' : '↓'}
                                                        </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                {sortedPatients.map((patient, index) => (
                                    <tr
                                        key={`${patient.nic}-${patient.date}-${patient.time}`}
                                        className={`hover:bg-secondary/5 transition-colors ${
                                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center mr-3">
                                                    <User className="w-5 h-5 text-secondary" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{patient.name}</div>
                                                    {patient.email && (
                                                        <div className="text-sm text-gray-500">{patient.email}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-700">
                                            {patient.nic}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center text-sm font-medium">
                                                <Clock className="w-4 h-4 text-secondary mr-2" />
                                                {patient.time}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {patient.age} years
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(patient.status)}`}>
                                                    {getStatusDisplayText(patient.status)}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => handleAction('view', patient)}
                                                    className="p-2 text-secondary hover:text-secondary/80 hover:bg-secondary/10 rounded-full transition-colors group"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction('edit', patient)}
                                                    className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full transition-colors"
                                                    title="Edit Appointment"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleAction('delete', patient)}
                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete Appointment"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer with summary */}
                <div className="mt-4 flex justify-between items-center text-sm text-gray-500 border-t border-gray-100 pt-4">
                    <div className="flex items-center space-x-4">
                        <span>Total: {sortedPatients.length} appointments</span>
                        <span>Date: {selectedDate?.fullDate}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Last updated: {currentTime.toLocaleTimeString()}</span>
                        <button
                            onClick={fetchAppointments}
                            disabled={appointmentsLoading}
                            className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 text-secondary ${appointmentsLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <PatientDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                patient={selectedPatient}
            />
            <PatientEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                patient={patientToEdit}
                selectedPatient={patientToEdit}
                onUpdate={() => {
                    fetchAppointments();
                    setIsEditModalOpen(false);
                }}
            />
            <DeleteConfirmationModal
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={() => {
                    fetchAppointments();
                    setDeleteModalVisible(false);
                }}
                selectedPatientAppointmentId={selectedPatient?.id}
            />
        </>
    );
};

export default PatientAppointments;