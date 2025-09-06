import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown, Calendar, RefreshCw, User, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { getUpcomingAppointmentsData, type UpcomingAppointmentData } from '../../services/getUpcomingAppointments.ts';
import { getAllDoctors } from '../../services/doctorService.ts';
import { getLoggedInUser } from '../../services/authService.ts';
import { createPatient, type CreatePatientRequest } from '../../services/patient/patientService.ts';
import {
    changeAppointmentStatus,
    AppointmentStatus,
    getStatusDisplayName
} from '../../services/prescriptions/changeAppointmentStatus.ts';

// Types
interface GroupedAppointments {
    [timeSlot: string]: AppointmentData[];
}

interface AppointmentData {
    time: string;
    title: string;
    active: boolean;
    completed: boolean;
    patient: string;
    duration: string;
    doctor: string;
    doctorCategory: string;
    channelNo: number;
    status: string;
    patientNIC: string;
    patientPhone: string;
    appointmentId: string;
    patientEmail?: string;
    patientAge?: number;
    patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
    patientAddress?: string;
    appointmentDate: string;
}

// Constants
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, '0')}:00`
);

// Utility functions
const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    return `${hours.toString().padStart(2, '0')}:${(minutes || 0).toString().padStart(2, '0')}`;
};

const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const formatDisplayDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (formatDate(date) === formatDate(today)) return 'Today';
    if (formatDate(date) === formatDate(yesterday)) return 'Yesterday';
    if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
};

const calculateDateOfBirth = (age: number, appointmentDate: string): string => {
    try {
        const currentDate = new Date(appointmentDate);
        const birthYear = currentDate.getFullYear() - age;
        return new Date(birthYear, 0, 1).toISOString().split('T')[0];
    } catch {
        return '';
    }
};

// Custom hooks
const useDoctorProfile = () => {
    const [doctorId, setDoctorId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDoctorProfile = async () => {
            try {
                const loggedInUser = getLoggedInUser();
                if (!loggedInUser) {
                    throw new Error('User not logged in');
                }

                const doctorsResponse = await getAllDoctors();
                if (!doctorsResponse.success || !doctorsResponse.data) {
                    throw new Error('Failed to load doctor data');
                }

                const currentDoctor = doctorsResponse.data.find(
                    (doctor: any) =>
                        doctor.applicationUserId === loggedInUser.id ||
                        String(doctor.applicationUserId) === String(loggedInUser.id) ||
                        doctor._id === loggedInUser.id ||
                        doctor.email === loggedInUser.email
                );

                if (!currentDoctor) {
                    throw new Error(`Doctor profile not found for user ID: ${loggedInUser.id}`);
                }

                setDoctorId(currentDoctor.propertyId);
            } catch (err) {
                console.error('Error fetching doctor profile:', err);
                setError(err instanceof Error ? err.message : 'Failed to load doctor profile');
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorProfile();
    }, []);

    return { doctorId, loading, error };
};

const useAppointments = (doctorId: string, selectedDate: string) => {
    const [appointments, setAppointments] = useState<UpcomingAppointmentData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAppointments = useCallback(async () => {
        if (!doctorId || !selectedDate) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getUpcomingAppointmentsData({
                doctorId,
                date: selectedDate
            });

            if (Array.isArray(data)) {
                setAppointments(data);
            } else {
                setAppointments([]);
            }
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError('Failed to load appointments');
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    }, [doctorId, selectedDate]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    return { appointments, loading, error, refetch: fetchAppointments };
};

// Group appointments by time slots
const useGroupedAppointments = (appointments: UpcomingAppointmentData[]): GroupedAppointments => {
    return useMemo(() => {
        const grouped: GroupedAppointments = {};

        // Initialize all time slots
        TIME_SLOTS.forEach(slot => {
            grouped[slot] = [];
        });

        appointments.forEach(appointment => {
            const hour = appointment.appointmentTime.split(':')[0].padStart(2, '0');
            const timeKey = `${hour}:00`;

            if (grouped[timeKey]) {
                grouped[timeKey].push({
                    time: formatTime(appointment.appointmentTime),
                    title: `CN${appointment.channelNo.toString().padStart(3, '0')}`,
                    active: ['SCHEDULED', 'CONFIRMED'].includes(appointment.status.toUpperCase()),
                    completed: appointment.status.toUpperCase() === 'COMPLETED',
                    patient: appointment.patientName,
                    duration: `${formatTime(appointment.appointmentTime)} - ${calculateEndTime(appointment.appointmentTime, appointment.duration)}`,
                    doctor: appointment.doctorName,
                    doctorCategory: appointment.doctorSpecialty,
                    channelNo: appointment.channelNo,
                    status: appointment.status,
                    patientNIC: appointment.patientNIC,
                    patientPhone: appointment.patientPhone,
                    appointmentId: appointment._id,
                    patientEmail: appointment.patientEmail,
                    patientAge: appointment.patientAge,
                    patientGender: appointment.patientGender,
                    patientAddress: appointment.patientAddress,
                    appointmentDate: appointment.appointmentDate
                });
            }
        });

        return grouped;
    }, [appointments]);
};

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStatusConfig = (status: string) => {
        const normalizedStatus = status.toLowerCase();
        switch (normalizedStatus) {
            case 'scheduled':
                return { color: 'bg-secondary', text: 'text-white' };
            case 'confirmed':
                return { color: 'bg-green-500', text: 'text-white' };
            case 'completed':
                return { color: 'bg-gray-500', text: 'text-white' };
            case 'cancelled':
                return { color: 'bg-red-500', text: 'text-white' };
            case 'in_progress':
                return { color: 'bg-secondary/80', text: 'text-white' };
            case 'no_show':
                return { color: 'bg-yellow-500', text: 'text-black' };
            default:
                return { color: 'bg-gray-300', text: 'text-gray-700' };
        }
    };

    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.text}`}>
            {getStatusDisplayName(status)}
        </span>
    );
};

// Loading component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-2 text-secondary" />
        <p className="text-sm">{message}</p>
    </div>
);

// Error component
const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <div className="text-2xl mb-2">❌</div>
        <p className="text-sm text-center mb-3">{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="text-secondary text-sm hover:text-secondary/80 transition-colors font-medium"
            >
                Try Again
            </button>
        )}
    </div>
);

// Empty state component
const EmptyState: React.FC<{ date: string }> = ({ date }) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Calendar className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-lg font-medium mb-1">No appointments</p>
        <p className="text-sm">for {formatDisplayDate(date)}</p>
    </div>
);

// Schedule Card Component
const ScheduleCard: React.FC<{
    appointment: AppointmentData;
    doctorId: string;
    onStatusChange: () => void;
}> = React.memo(({ appointment, doctorId, onStatusChange }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [action, setAction] = useState("");
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [isPatientCreated, setIsPatientCreated] = useState(false);
    const [isChangingStatus, setIsChangingStatus] = useState(false);

    const handleStatusChange = useCallback(async (newStatus: AppointmentStatus) => {
        const appointmentId = appointment.appointmentId;
        if (!appointmentId) {
            alert('Appointment ID not found');
            return;
        }

        const confirmationMessages: Record<AppointmentStatus, string> = {
            [AppointmentStatus.SCHEDULED]: 'Schedule this appointment?',
            [AppointmentStatus.COMPLETED]: 'Mark this appointment as completed?',
            [AppointmentStatus.CANCELLED]: 'Cancel this appointment?',
            [AppointmentStatus.NO_SHOW]: 'Mark this appointment as no-show?',
            [AppointmentStatus.CONFIRMED]: 'Confirm this appointment?',
            [AppointmentStatus.IN_PROGRESS]: 'Start this appointment?'
        };

        const message = confirmationMessages[newStatus] || `Change status to ${getStatusDisplayName(newStatus)}?`;
        if (!confirm(message)) {
            setAction("");
            return;
        }

        setIsChangingStatus(true);

        try {
            const response = await changeAppointmentStatus(appointmentId, newStatus);

            if (response.success) {
                alert(`Appointment status changed to ${getStatusDisplayName(newStatus)} successfully!\n\nPatient: ${appointment.patient}\nTime: ${appointment.time}\nChannel: ${appointment.title}`);
                onStatusChange();
                setAction("");
            } else {
                throw new Error(response.message || 'Failed to change status');
            }
        } catch (error: any) {
            console.error('Error changing appointment status:', error);
            alert(`Failed to change appointment status: ${error.message}`);
            setAction("");
        } finally {
            setIsChangingStatus(false);
        }
    }, [appointment, onStatusChange]);

    const handleActionChange = useCallback((selectedAction: string) => {
        setAction(selectedAction);
        if (!selectedAction) return;

        const actionToStatus: Record<string, AppointmentStatus> = {
            'confirm': AppointmentStatus.CONFIRMED,
            'start': AppointmentStatus.IN_PROGRESS,
            'complete': AppointmentStatus.COMPLETED,
            'cancel': AppointmentStatus.CANCELLED,
            'no_show': AppointmentStatus.NO_SHOW
        };

        const newStatus = actionToStatus[selectedAction];
        if (newStatus) {
            handleStatusChange(newStatus);
        }
    }, [handleStatusChange]);

    const handleCreatePatient = useCallback(async () => {
        if (isPatientCreated) {
            alert('Patient has already been created for this appointment.');
            return;
        }

        setIsCreatingPatient(true);

        try {
            // Validate and normalize gender if present
            const normalizeGender = (gender: string | undefined): 'MALE' | 'FEMALE' | 'OTHER' | undefined => {
                if (!gender) return undefined;
                const upperGender = gender.toUpperCase();
                if (['MALE', 'FEMALE', 'OTHER'].includes(upperGender)) {
                    return upperGender as 'MALE' | 'FEMALE' | 'OTHER';
                }
                // Default fallback for unknown gender values
                return 'OTHER';
            };

            const patientData: CreatePatientRequest = {
                patientName: appointment.patient,
                patientNIC: appointment.patientNIC,
                patientPhone: appointment.patientPhone,
                ...(appointment.patientEmail && { patientEmail: appointment.patientEmail }),
                ...(appointment.patientAge && { patientAge: appointment.patientAge }),
                ...(appointment.patientGender && { patientGender: normalizeGender(appointment.patientGender) }),
                ...(appointment.patientAddress && { patientAddress: appointment.patientAddress }),
                ...(appointment.patientAge && appointment.appointmentDate && {
                    dateOfBirth: calculateDateOfBirth(appointment.patientAge, appointment.appointmentDate)
                }),
            };

            const response = await createPatient(patientData);
            setIsPatientCreated(true);

            const successMessage = `Patient "${response.patient.patientName}" created successfully!\n\nPatient ID: ${response.patient.propertyId}\nNIC: ${response.patient.patientNIC}\nPhone: ${response.patient.patientPhone}`;
            alert(successMessage);

        } catch (error: any) {
            console.error('Error creating patient:', error);
            let errorMessage = 'Failed to create patient. Please try again.';

            if (error.response?.status === 409) {
                errorMessage = `Patient with NIC "${appointment.patientNIC}" already exists.`;
                setIsPatientCreated(true);
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            alert(errorMessage);
        } finally {
            setIsCreatingPatient(false);
        }
    }, [appointment, isPatientCreated]);

    const getAvailableActions = () => {
        const status = appointment.status.toUpperCase();

        switch (status) {
            case 'SCHEDULED':
                return [
                    { value: 'confirm', label: 'Confirm' },
                    { value: 'cancel', label: 'Cancel' },
                    { value: 'no_show', label: 'Mark No Show' }
                ];
            case 'CONFIRMED':
                return [
                    { value: 'start', label: 'Start Appointment' },
                    { value: 'cancel', label: 'Cancel' },
                    { value: 'no_show', label: 'Mark No Show' }
                ];
            case 'IN_PROGRESS':
                return [
                    { value: 'complete', label: 'Complete' },
                    { value: 'cancel', label: 'Cancel' }
                ];
            case 'CANCELLED':
            case 'NO_SHOW':
                return [{ value: 'confirm', label: 'Reschedule' }];
            default:
                return [];
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${appointment.active ? 'bg-secondary' : appointment.completed ? 'bg-gray-400' : 'bg-yellow-500'}`} />
                    <span className="font-medium text-secondary">{appointment.time}</span>
                    <span className="text-sm text-gray-600">{appointment.title}</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 hover:bg-secondary/10 rounded-full transition-colors"
                >
                    {isOpen ? <ChevronUp size={16} className="text-secondary" /> : <ChevronDown size={16} className="text-secondary" />}
                </button>
            </div>

            {/* Details */}
            {isOpen && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="font-medium">{appointment.patient}</span>
                        </div>

                        <div className="pl-6 space-y-1 text-xs text-gray-600">
                            <div>NIC: {appointment.patientNIC}</div>
                            <div>Phone: {appointment.patientPhone}</div>
                            {appointment.patientAge && <div>Age: {appointment.patientAge}</div>}
                            {appointment.patientGender && <div>Gender: {appointment.patientGender}</div>}
                        </div>

                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{appointment.duration}</span>
                        </div>

                        <div className="pl-6 space-y-1 text-xs text-gray-600">
                            <div>Dr. {appointment.doctor}</div>
                            <div>{appointment.doctorCategory}</div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Status:</span>
                            <StatusBadge status={appointment.status} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleCreatePatient}
                                disabled={isCreatingPatient || isPatientCreated}
                                className={`p-2 rounded-full transition-colors ${
                                    isPatientCreated
                                        ? 'text-green-600 bg-green-50'
                                        : 'text-gray-600 hover:text-secondary hover:bg-secondary/10'
                                } disabled:opacity-50`}
                                title={isPatientCreated ? "Patient Created" : "Create Patient Record"}
                            >
                                {isCreatingPatient ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : isPatientCreated ? (
                                    <User className="w-4 h-4" />
                                ) : (
                                    <User className="w-4 h-4" />
                                )}
                            </button>

                            <Link to={`/process/doctor/patient-management/patient-management-create?doctorId=${doctorId}&appointmentId=${appointment.appointmentId}&patientNIC=${appointment.patientNIC}`}>
                                <button className="p-2 rounded-full text-gray-600 hover:text-secondary hover:bg-secondary/10 transition-colors">
                                    <span className="text-sm">+</span>
                                </button>
                            </Link>
                        </div>

                        <select
                            value={action}
                            onChange={(e) => handleActionChange(e.target.value)}
                            disabled={isChangingStatus}
                            className="text-xs border border-gray-300 rounded px-2 py-1 text-secondary focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary disabled:opacity-50"
                        >
                            <option value="">
                                {isChangingStatus ? 'Updating...' : 'Actions'}
                            </option>
                            {getAvailableActions().map(action => (
                                <option key={action.value} value={action.value}>
                                    {action.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
});

// Main Component
const UpcomingScheduleCard: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
    const { doctorId, loading: doctorLoading, error: doctorError } = useDoctorProfile();
    const { appointments, loading: appointmentsLoading, error: appointmentsError, refetch } = useAppointments(doctorId, selectedDate);
    const groupedAppointments = useGroupedAppointments(appointments);

    const handleDateChange = useCallback((date: string) => {
        setSelectedDate(date);
    }, []);

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const getDateOptions = () => {
        const dates = [];
        const today = new Date();

        // Add previous 7 days
        for (let i = 7; i >= 1; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(formatDate(date));
        }

        // Add today
        dates.push(formatDate(today));

        // Add next 7 days
        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            dates.push(formatDate(date));
        }

        return dates;
    };

    if (doctorLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
                <LoadingSpinner message="Loading doctor profile..." />
            </div>
        );
    }

    if (doctorError) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 w-full max-w-md">
                <ErrorMessage message={doctorError} />
            </div>
        );
    }

    const hasAppointments = appointments.length > 0;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-md">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Upcoming Schedule
                    </h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                            ({appointments.length})
                        </span>
                        <button
                            onClick={handleRefresh}
                            disabled={appointmentsLoading}
                            className="p-1 hover:bg-secondary/10 rounded-full transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 text-secondary ${appointmentsLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Date Selector */}
                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-secondary" />
                    <select
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
                    >
                        {getDateOptions().map(date => (
                            <option key={date} value={date}>
                                {formatDisplayDate(date)} - {date}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {appointmentsLoading ? (
                    <LoadingSpinner message="Loading appointments..." />
                ) : appointmentsError ? (
                    <ErrorMessage message={appointmentsError} onRetry={handleRefresh} />
                ) : !hasAppointments ? (
                    <EmptyState date={selectedDate} />
                ) : (
                    <div className="space-y-4">
                        {/* Timeline */}
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>

                            {TIME_SLOTS.map(timeSlot => {
                                const timeAppointments = groupedAppointments[timeSlot];
                                if (!timeAppointments?.length) return null;

                                return (
                                    <div key={timeSlot} className="relative mb-6">
                                        {/* Time marker */}
                                        <div className="flex items-center mb-3">
                                            <div className="bg-white border-2 border-secondary w-3 h-3 rounded-full"></div>
                                            <span className="ml-3 text-sm font-medium text-secondary">
                                                {timeSlot}
                                            </span>
                                        </div>

                                        {/* Appointments */}
                                        <div className="ml-6 space-y-3">
                                            {timeAppointments.map((appointment, index) => (
                                                <ScheduleCard
                                                    key={`${appointment.appointmentId}-${index}`}
                                                    appointment={appointment}
                                                    doctorId={doctorId}
                                                    onStatusChange={handleRefresh}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpcomingScheduleCard;