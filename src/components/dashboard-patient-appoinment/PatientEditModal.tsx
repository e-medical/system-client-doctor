import {useState, useEffect} from 'react';
import {X, User, Phone, Calendar, AlertCircle} from 'lucide-react';
import {
    updateBasicAppointmentInfo,
    validateAppointmentUpdateData,
    convertAppointmentToUpdateRequest,
    type UpdateAppointmentRequest,
    AppointmentStatus,
    PatientGender
} from '../../services/updateAppoinment.ts'; // Fixed import path

interface UpdateAppointmentModalProps {
    selectedPatient: any | null,
    isOpen: boolean,
    onClose: () => void,
    onUpdate: () => void,
    patient?: any,
    onSave?: () => void
}

// A reusable input field component for the form
const FormField = ({
                       label,
                       id,
                       value,
                       onChange,
                       type = 'text',
                       required = false,
                       disabled = false,
                       error = null
                   }: {
    label: string;
    id: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string | null;
}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            id={id}
            name={id}
            value={value || ''}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed ${
                error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
            }`}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
);

const UpdateAppointmentModal = ({
                                    isOpen,
                                    onClose,
                                    selectedPatient,
                                    onUpdate,
                                    patient,
                                }: UpdateAppointmentModalProps) => {

    // Use patient as fallback if selectedPatient is not available
    const appointmentData = selectedPatient || patient;

    console.log('UpdateAppointmentModal - appointmentData:', appointmentData);

    const [formData, setFormData] = useState({
        patientName: '',
        patientNIC: '',
        patientPhone: '',
        patientEmail: '',
        patientAddress: '',
        patientAge: '',
        patientGender: '',
        status: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Helper function to safely get nested values
    const safeGetValue = (obj: any, path: string, defaultValue: string = '') => {
        if (!obj) return defaultValue;
        return obj[path] || defaultValue;
    };

    // Initialize form data when modal opens or appointmentData changes
    useEffect(() => {
        console.log('UpdateAppointmentModal - Effect triggered:', {isOpen, hasAppointmentData: !!appointmentData});

        if (appointmentData && isOpen) {
            console.log('UpdateAppointmentModal - Setting form data from:', appointmentData);

            // Handle different possible property names that might come from your backend
            const patientName = safeGetValue(appointmentData, 'patientName') ||
                safeGetValue(appointmentData, 'name') ||
                safeGetValue(appointmentData, 'patient_name');

            const patientNIC = safeGetValue(appointmentData, 'patientNIC') ||
                safeGetValue(appointmentData, 'nic') ||
                safeGetValue(appointmentData, 'patient_nic');

            const patientPhone = safeGetValue(appointmentData, 'patientPhone') ||
                safeGetValue(appointmentData, 'phone') ||
                safeGetValue(appointmentData, 'contact') ||
                safeGetValue(appointmentData, 'patient_phone');

            const patientEmail = safeGetValue(appointmentData, 'patientEmail') ||
                safeGetValue(appointmentData, 'email') ||
                safeGetValue(appointmentData, 'patient_email');

            const patientAddress = safeGetValue(appointmentData, 'patientAddress') ||
                safeGetValue(appointmentData, 'address') ||
                safeGetValue(appointmentData, 'patient_address');

            const patientAge = appointmentData.patientAge?.toString() ||
                appointmentData.age?.toString() ||
                appointmentData.patient_age?.toString() || '';

            const patientGender = safeGetValue(appointmentData, 'patientGender') ||
                safeGetValue(appointmentData, 'gender') ||
                safeGetValue(appointmentData, 'patient_gender');

            const status = safeGetValue(appointmentData, 'status') ||
                safeGetValue(appointmentData, 'appointment_status');

            console.log('Extracted form data:', {
                patientName,
                patientNIC,
                patientPhone,
                patientEmail,
                patientAddress,
                patientAge,
                patientGender,
                status
            });

            setFormData({
                patientName,
                patientNIC,
                patientPhone,
                patientEmail: patientEmail === 'N/A' ? '' : patientEmail,
                patientAddress: patientAddress === 'N/A' ? '' : patientAddress,
                patientAge,
                patientGender,
                status
            });

            setError(null);
            setValidationErrors({});
        }
    }, [appointmentData, isOpen]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                patientName: '',
                patientNIC: '',
                patientPhone: '',
                patientEmail: '',
                patientAddress: '',
                patientAge: '',
                patientGender: '',
                status: ''
            });
            setError(null);
            setValidationErrors({});
            setLoading(false);
        }
    }, [isOpen]);

    // Debug logging
    console.log('UpdateAppointmentModal - Render:', {
        isOpen,
        hasAppointmentData: !!appointmentData,
        appointmentDataId: appointmentData?._id || appointmentData?.id,
        formDataName: formData.patientName,
        appointmentDataKeys: appointmentData ? Object.keys(appointmentData) : []
    });

    // Early return with proper null checks
    if (!isOpen) {
        console.log('UpdateAppointmentModal - Not open, returning null');
        return null;
    }

    if (!appointmentData) {
        console.log('UpdateAppointmentModal - No appointment data, returning null');
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {name, value} = e.target;
        console.log('UpdateAppointmentModal - Field changed:', {name, value});

        setFormData(prev => ({...prev, [name]: value}));

        // Clear validation error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('UpdateAppointmentModal - Form submitted:', formData);

        setLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            // Ensure we have an appointment ID - try multiple possible property names
            const appointmentId = appointmentData._id ||
                appointmentData.id ||
                appointmentData.appointmentId ||
                appointmentData.appointment_id;

            console.log('Appointment ID found:', appointmentId);
            console.log('Available keys in appointmentData:', Object.keys(appointmentData));

            if (!appointmentId) {
                throw new Error('Appointment ID not found. Available keys: ' + Object.keys(appointmentData).join(', '));
            }

            // Convert form data to update request format using your service
            const updateData: UpdateAppointmentRequest = convertAppointmentToUpdateRequest({
                name: formData.patientName,
                nic: formData.patientNIC,
                contact: formData.patientPhone,
                email: formData.patientEmail,
                address: formData.patientAddress,
                age: formData.patientAge,
                gender: formData.patientGender,
                status: formData.status
            });

            // Validate the data using your service
            const validation = validateAppointmentUpdateData(updateData);
            if (!validation.isValid) {
                setError('Please correct the following errors:');
                // Convert validation errors array to object for field-specific display
                const fieldErrors: Record<string, string> = {};
                validation.errors.forEach(error => {
                    if (error.includes('Patient name')) fieldErrors.patientName = error;
                    else if (error.includes('NIC')) fieldErrors.patientNIC = error;
                    else if (error.includes('Phone')) fieldErrors.patientPhone = error;
                    else if (error.includes('email')) fieldErrors.patientEmail = error;
                    else if (error.includes('Age')) fieldErrors.patientAge = error;
                    else if (error.includes('Gender')) fieldErrors.patientGender = error;
                    else if (error.includes('status')) fieldErrors.status = error;
                });
                setValidationErrors(fieldErrors);
                setLoading(false);
                return;
            }

            console.log('🔄 Updating appointment:', appointmentId);
            console.log('📝 Update data:', updateData);

            // Use your exact service function
            const response = await updateBasicAppointmentInfo(appointmentId, {
                patientName: formData.patientName,
                patientNIC: formData.patientNIC,
                patientPhone: formData.patientPhone,
                patientEmail: formData.patientEmail || undefined, // Don't send empty string
                patientAddress: formData.patientAddress || undefined, // Don't send empty string
                patientAge: formData.patientAge,
                patientGender: formData.patientGender,
                status: formData.status
            });

            console.log('✅ Appointment updated successfully:', response);

            // Call the callback to refresh the appointments list
            onUpdate();
            onClose();

        } catch (err: any) {
            console.error('❌ Error updating appointment:', err);
            setError(err.message || 'Failed to update appointment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        console.log('UpdateAppointmentModal - Close button clicked');
        if (!loading) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div
                        className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-gray-900">Update Appointment</h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                            disabled={loading}
                        >
                            <X className="w-5 h-5 text-gray-500"/>
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"/>
                            <div>
                                <p className="text-sm text-red-600 font-medium">{error}</p>
                                {Object.keys(validationErrors).length > 0 && (
                                    <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                                        {Object.values(validationErrors).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/*/!* Debug Info - Remove in production *!/*/}
                        {/*{process.env.NODE_ENV === 'development' && (*/}
                        {/*    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">*/}
                        {/*        <p className="text-xs text-yellow-800">*/}
                        {/*            <strong>Debug:</strong> Patient ID: {appointmentData._id || appointmentData.id},*/}
                        {/*            Name: {formData.patientName}*/}
                        {/*        </p>*/}
                        {/*        <details className="mt-2">*/}
                        {/*            <summary className="text-xs cursor-pointer">Raw Data</summary>*/}
                        {/*            <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto max-h-20">*/}
                        {/*                {JSON.stringify(appointmentData, null, 2)}*/}
                        {/*            </pre>*/}
                        {/*        </details>*/}
                        {/*    </div>*/}
                        {/*)}*/}

                        {/* Patient Details Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-blue-600"/>
                                Patient Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    label="Full Name"
                                    id="patientName"
                                    value={formData.patientName}
                                    onChange={handleChange}
                                    required
                                    error={validationErrors.patientName}
                                />
                                <FormField
                                    label="NIC Number"
                                    id="patientNIC"
                                    value={formData.patientNIC}
                                    onChange={handleChange}
                                    required
                                    error={validationErrors.patientNIC}
                                />
                                <FormField
                                    label="Age"
                                    id="patientAge"
                                    value={formData.patientAge}
                                    onChange={handleChange}
                                    type="number"
                                    required
                                    error={validationErrors.patientAge}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gender <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="patientGender"
                                        value={formData.patientGender}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                            validationErrors.patientGender ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                    >
                                        <option value="">Select Gender</option>
                                        <option value={PatientGender.MALE}>Male</option>
                                        <option value={PatientGender.FEMALE}>Female</option>
                                        <option value={PatientGender.OTHER}>Other</option>
                                    </select>
                                    {validationErrors.patientGender && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.patientGender}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Information Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Phone className="w-5 h-5 mr-2 text-green-600"/>
                                Contact Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    label="Phone Number"
                                    id="patientPhone"
                                    value={formData.patientPhone}
                                    onChange={handleChange}
                                    required
                                    error={validationErrors.patientPhone}
                                />
                                <FormField
                                    label="Email Address"
                                    id="patientEmail"
                                    value={formData.patientEmail}
                                    onChange={handleChange}
                                    type="email"
                                    error={validationErrors.patientEmail}
                                />
                            </div>
                            <div className="mt-4">
                                <FormField
                                    label="Address"
                                    id="patientAddress"
                                    value={formData.patientAddress}
                                    onChange={handleChange}
                                    error={validationErrors.patientAddress}
                                />
                            </div>
                        </div>

                        {/* Appointment Status Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-orange-600"/>
                                Appointment Status
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                        validationErrors.status ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                >
                                    <option value="">Select Status</option>
                                    <option value={AppointmentStatus.SCHEDULED}>Scheduled</option>
                                    <option value={AppointmentStatus.CONFIRMED}>Confirmed</option>
                                    <option value={AppointmentStatus.IN_PROGRESS}>In Progress</option>
                                    <option value={AppointmentStatus.COMPLETED}>Completed</option>
                                    <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
                                    <option value={AppointmentStatus.NO_SHOW}>No Show</option>
                                </select>
                                {validationErrors.status && (
                                    <p className="mt-1 text-sm text-red-600">{validationErrors.status}</p>
                                )}
                            </div>
                        </div>

                        {/* Read-only Appointment Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="w-5 h-5 mr-2 text-purple-600"/>
                                Appointment Details (Read-only)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Doctor</label>
                                    <p className="text-sm text-gray-900 font-medium">Dr.
                                        {safeGetValue(appointmentData, 'doctorName') ||
                                            safeGetValue(appointmentData, 'doctor_name') ||
                                            safeGetValue(appointmentData, 'doctor') ||
                                            safeGetValue(appointmentData, 'doctorFullName') ||
                                            'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Appointment Date</label>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {(() => {
                                            const date = appointmentData.appointmentDate ||
                                                appointmentData.appointment_date ||
                                                appointmentData.date ||
                                                appointmentData.appointmentDateTime;
                                            if (date) {
                                                try {
                                                    return new Date(date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
                                                } catch {
                                                    return date.split('T')[0];
                                                }
                                            }
                                            return 'N/A';
                                        })()}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Appointment Time</label>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {safeGetValue(appointmentData, 'appointmentTime') ||
                                            safeGetValue(appointmentData, 'appointment_time') ||
                                            safeGetValue(appointmentData, 'time') ||
                                            safeGetValue(appointmentData, 'startTime') ||
                                            'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Channel Fee</label>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {(() => {
                                            const fee = appointmentData.channelFee ||
                                                appointmentData.channel_fee ||
                                                appointmentData.fee ||
                                                appointmentData.consultationFee;
                                            return fee ? `LKR ${fee}` : 'N/A';
                                        })()}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Channel Number</label>
                                    <p className="text-sm text-gray-900 font-medium">
                                        {(() => {
                                            const channelNo = appointmentData.channelNo ||
                                                appointmentData.channel_no ||
                                                appointmentData.channelNumber ||
                                                appointmentData.appointmentNumber;
                                            return channelNo ? `CN${String(channelNo).padStart(3, "0")}` : 'N/A';
                                        })()}
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 sticky bottom-0 z-10">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-secondary text-white rounded-lg  transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div
                                        className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Updating...
                                </>
                            ) : (
                                'Update Appointment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateAppointmentModal;