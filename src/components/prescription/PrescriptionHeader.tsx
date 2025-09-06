import { PaintBucket, X, Edit3, Check, Phone, MapPin, Building2, Calendar, User, Award, Stethoscope } from "lucide-react";
import UploadableAvatar from "./UploadableAvatar";
import { useEffect, useState, FC } from "react";
import { useNavigate } from "react-router-dom";

// Import services and types
import { getCurrentUserDetails } from "../../services/UserService.ts";
import { getHospitalDetails } from "../../services/hospitals/hospitalGetById.ts";
import { getAllDoctors, Doctor } from "../../services/doctorService";

// --- TYPE DEFINITIONS ---

interface EditableFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    icon?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

interface InfoItem {
    label: string;
    value: string;
}

interface PrescriptionHeaderProps {
    sendHeaderColorToParent: (color: string) => void;
    color: string;
}

const EditableField: FC<EditableFieldProps> = ({ label, value, onChange, icon, size = 'md' }) => {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
        onChange(tempValue);
        setEditing(false);
    };

    const handleCancel = () => {
        setTempValue(value);
        setEditing(false);
    };

    useEffect(() => {
        if (!editing) {
            setTempValue(value);
        }
    }, [value, editing]);

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-xl font-semibold'
    };

    return (
        <div className="group flex items-center space-x-3 mb-3 transition-all duration-200 hover:bg-white/10 rounded-lg p-2 -m-2">
            {icon && (
                <div className="text-white/80 flex-shrink-0">
                    {icon}
                </div>
            )}

            {!editing ? (
                <>
                    <span className={`text-white ${sizeClasses[size]} flex-grow`}>
                        {value}
                    </span>
                    <button
                        onClick={() => {
                            setEditing(true);
                            setTempValue(value);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all duration-200 p-1 rounded hover:bg-white/20"
                        title={`Edit ${label}`}
                    >
                        <Edit3 size={14} />
                    </button>
                </>
            ) : (
                <div className="flex items-center space-x-2 flex-grow">
                    <input
                        type="text"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="bg-white/20 text-white placeholder-white/60 rounded-lg px-3 py-2 text-sm flex-grow backdrop-blur-sm border border-white/30 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/20"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') handleCancel();
                        }}
                    />
                    <button
                        onClick={handleSave}
                        className="text-white bg-green-500/80 hover:bg-green-500 px-3 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-1"
                    >
                        <Check size={14} />
                    </button>
                    <button
                        onClick={handleCancel}
                        className="text-white bg-red-500/80 hover:bg-red-500 px-3 py-2 rounded-lg transition-colors duration-200"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default function PrescriptionHeader({ sendHeaderColorToParent, color }: PrescriptionHeaderProps) {
    const navigate = useNavigate();

    // --- STATE MANAGEMENT ---
    const [headerBgColor, setHeaderBgColor] = useState<string>('');
    const [doctorInfo, setDoctorInfo] = useState<InfoItem[]>([]);
    const [contactInfo, setContactInfo] = useState<InfoItem[]>([]);
    const [, setLogoUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Predefined color palette
    const colorPalette = [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#8B5CF6', // Purple
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#6B7280', // Gray
        '#06B6D4', // Cyan
        '#84CC16'  // Lime
    ];

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            const user = await getCurrentUserDetails();
            if (!user?._id) {
                setError("Could not identify logged-in user.");
                setIsLoading(false);
                return;
            }

            setLogoUrl(user.avatarUrl || '');

            try {
                const [doctorResponse, hospitalData] = await Promise.all([
                    getAllDoctors(),
                    user.hospital ? getHospitalDetails(user.hospital) : Promise.resolve(null)
                ]);

                const currentDoctor = doctorResponse.data?.find((doc: Doctor) => doc.systemUser?.id === user._id);

                if (!currentDoctor) {
                    setError("Your user profile is not linked to a doctor profile.");
                    return;
                }

                setDoctorInfo([
                    { label: 'name', value: `Dr. ${currentDoctor.doctorName}` },
                    { label: 'qualification', value: currentDoctor.qualification || 'Not specified' },
                    { label: 'title', value: currentDoctor.specialization || 'Not specified' },
                    { label: 'hospital', value: hospitalData?.businessName || 'Not specified' },
                ]);

                setContactInfo([
                    { label: 'company', value: hospitalData?.businessName || 'E-medihealth (Pvt) Ltd' },
                    { label: 'address', value: hospitalData?.address || 'Address not found' },
                    { label: 'hotline', value: hospitalData?.adminContact || 'Contact not found' },
                ]);

            } catch (err) {
                console.error("❌ Error fetching data:", err);
                setError("Failed to load required prescription data.");
            } finally {
                setIsLoading(false);
            }
        };

        void fetchData();
    }, []);

    useEffect(() => {
        setHeaderBgColor(color);
    }, [color]);

    // --- HANDLERS ---
    const updateDoctorInfo = (index: number, newValue: string) => {
        const updated = [...doctorInfo];
        updated[index].value = newValue;
        setDoctorInfo(updated);
    };

    const updateContactInfo = (index: number, newValue: string) => {
        const updated = [...contactInfo];
        updated[index].value = newValue;
        setContactInfo(updated);
    };

    const handleCancel = () => navigate(-1);

    const handleColorChange = (newColor: string) => {
        setHeaderBgColor(newColor);
        sendHeaderColorToParent(newColor);
    };

    const getIconForField = (label: string) => {
        switch (label) {
            case 'name': return <User size={18} />;
            case 'qualification': return <Award size={18} />;
            case 'title': return <Stethoscope size={18} />;
            case 'hospital': return <Building2 size={18} />;
            case 'company': return <Building2 size={18} />;
            case 'address': return <MapPin size={18} />;
            case 'hotline': return <Phone size={18} />;
            default: return null;
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Enhanced Top Bar */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-200 flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Prescription Overview</h1>
                    <p className="text-sm text-gray-600 mt-1">Create and manage medical prescriptions</p>
                </div>
                <button
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
                    onClick={handleCancel}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Enhanced Header with Better Layout */}
            <div
                className="relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${headerBgColor} 0%, ${headerBgColor}dd 100%)`,
                    minHeight: '320px'
                }}
            >
                {/* Decorative Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
                </div>

                {/* Color Picker Section */}
                <div className="absolute top-4 right-6 z-20 print:hidden">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                        <div className="flex items-center space-x-3 mb-3">
                            <PaintBucket className="text-white" size={18} />
                            <span className="text-white text-sm font-medium">Theme</span>
                        </div>

                        {/* Color Palette */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                            {colorPalette.map((paletteColor) => (
                                <button
                                    key={paletteColor}
                                    onClick={() => handleColorChange(paletteColor)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                        headerBgColor === paletteColor ? 'border-white shadow-lg' : 'border-white/50'
                                    }`}
                                    style={{ backgroundColor: paletteColor }}
                                    title={`Select ${paletteColor}`}
                                />
                            ))}
                        </div>

                        {/* Custom Color Picker */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={headerBgColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="w-8 h-8 rounded border-2 border-white/50 cursor-pointer"
                                title="Custom color"
                            />
                            <span className="text-white text-xs">Custom</span>
                        </div>
                    </div>
                </div>

                {/* Content Layout */}
                <div className="relative z-10 p-8">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                                <p className="text-white text-lg">Loading Details...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center bg-red-500/20 rounded-lg p-6 border border-red-300/30">
                                <p className="text-red-100 text-lg">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Doctor Information */}
                            <div className="lg:col-span-2 space-y-2">
                                <div className="mb-6">
                                    <h2 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-4">
                                        Doctor Information
                                    </h2>
                                    {doctorInfo.map((item, idx) => (
                                        <EditableField
                                            key={item.label}
                                            label={item.label}
                                            value={item.value}
                                            onChange={(val: string) => updateDoctorInfo(idx, val)}
                                            icon={getIconForField(item.label)}
                                            size={item.label === 'name' ? 'lg' : 'md'}
                                        />
                                    ))}
                                </div>

                                {/* Contact Information */}
                                <div>
                                    <h2 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-4">
                                        Contact Information
                                    </h2>
                                    {contactInfo.map((item, idx) => (
                                        <EditableField
                                            key={item.label}
                                            label={item.label}
                                            value={item.value}
                                            onChange={(val: string) => updateContactInfo(idx, val)}
                                            icon={getIconForField(item.label)}
                                            size="sm"
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Right Side - Avatar and Date */}
                            <div className="flex flex-col items-center lg:items-end space-y-6">
                                {/* Avatar */}
                                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                                    <div className="w-24 h-24 mx-auto">
                                        <UploadableAvatar />
                                    </div>
                                </div>

                                {/* Date and Time */}
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30 text-center lg:text-right">
                                    <div className="flex items-center justify-center lg:justify-end space-x-2 mb-2">
                                        <Calendar className="text-white/80" size={16} />
                                        <span className="text-white/80 text-sm font-medium">Date and Time</span>
                                    </div>
                                    <p className="text-white text-sm">
                                        {new Date().toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-white/80 text-xs mt-1">
                                        {new Date().toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}