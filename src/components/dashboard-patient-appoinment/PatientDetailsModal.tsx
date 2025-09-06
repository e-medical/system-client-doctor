import { X, User, Mail, Phone, MapPin, Calendar, Clock, CreditCard } from 'lucide-react';
import { PatientDetailsModalProps } from './types.ts'; // Assuming types are in a separate file

/**
 * Returns Tailwind CSS classes based on the appointment status.
 */
const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
        case 'processing':
            return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        case 'complete':
            return 'bg-green-100 text-green-800 border border-green-200';
        case 'cancelled':
        case 'cancel':
            return 'bg-red-100 text-red-800 border border-red-200';
        default:
            return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
};

const PatientDetailsModal = ({ patient, isOpen, onClose }: PatientDetailsModalProps) => {
    if (!isOpen || !patient) return null;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatTime = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-in fade-in-0 zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Patient Details</h2>
                            <p className="text-sm text-gray-500">Complete appointment information</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Patient Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><User className="w-5 h-5 mr-2 text-blue-600" />Patient Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500 block">Full Name</label><p className="text-lg font-semibold text-gray-900">{patient.name}</p></div>
                            <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500 block">NIC Number</label><p className="text-lg font-mono text-gray-900">{patient.nic}</p></div>
                            <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500 block">Age</label><p className="text-lg font-semibold text-gray-900">{patient.age} years</p></div>
                            <div className="bg-gray-50 p-4 rounded-lg"><label className="text-sm font-medium text-gray-500 block">Status</label><span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(patient.status)}`}>{patient.status}</span></div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Phone className="w-5 h-5 mr-2 text-green-600" />Contact Information</h3>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg flex items-center"><Mail className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" /><div><label className="text-sm font-medium text-gray-500">Email Address</label><p className="text-gray-900">{patient.email}</p></div></div>
                            <div className="bg-gray-50 p-4 rounded-lg flex items-center"><Phone className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" /><div><label className="text-sm font-medium text-gray-500">Phone Number</label><p className="text-gray-900">{patient.contact}</p></div></div>
                            <div className="bg-gray-50 p-4 rounded-lg flex items-start"><MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1 flex-shrink-0" /><div><label className="text-sm font-medium text-gray-500">Address</label><p className="text-gray-900">{patient.address}</p></div></div>
                        </div>
                    </div>

                    {/* Appointment Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><Calendar className="w-5 h-5 mr-2 text-purple-600" />Appointment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg flex items-center"><Calendar className="w-5 h-5 text-gray-400 mr-3" /><div><label className="text-sm font-medium text-gray-500">Date</label><p className="text-gray-900">{formatDate(patient.date)}</p></div></div>
                            <div className="bg-gray-50 p-4 rounded-lg flex items-center"><Clock className="w-5 h-5 text-gray-400 mr-3" /><div><label className="text-sm font-medium text-gray-500">Time</label><p className="text-gray-900">{formatTime(patient.time)}</p></div></div>
                            <div className="bg-gray-50 p-4 rounded-lg flex items-center"><User className="w-5 h-5 text-gray-400 mr-3" /><div><label className="text-sm font-medium text-gray-500">Doctor</label><p className="text-gray-900">{patient.doctor}</p></div></div>
                            <div className="bg-gray-50 p-4 rounded-lg flex items-center"><CreditCard className="w-5 h-5 text-gray-400 mr-3" /><div><label className="text-sm font-medium text-gray-500">Fee</label><p className="text-gray-900">{patient.fee}</p></div></div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end sticky bottom-0">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold">Close</button>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsModal;
