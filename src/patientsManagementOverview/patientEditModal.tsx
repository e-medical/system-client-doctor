import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateBasicPatientInfo, validatePatientUpdateData, convertPatientToUpdateRequest } from '../services/patient/patientUpdateService.ts';

// Patient interface matching your table structure
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

interface PatientEditModalProps {
    patient: Patient | null;
    open: boolean;
    onClose: () => void;
    onSave: (updatedPatient: Patient) => void;
}

// Validation functions
const validateField = (field: string, value: string): string | null => {
    if (!value || !value.trim()) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    switch (field) {
        case 'name':
            if (value.trim().length < 2) {
                return 'Name must be at least 2 characters';
            }
            if (value.trim().length > 100) {
                return 'Name must not exceed 100 characters';
            }
            break;
        case 'nic':
            if (!/^(\d{9}[VXvx]|\d{12})$/.test(value.trim())) {
                return 'Invalid NIC format. Use XXXXXXXXXV or XXXXXXXXXXXX';
            }
            break;
        case 'contact':
            if (!/^\d{10}$/.test(value.trim())) {
                return 'Contact number must be 10 digits';
            }
            break;
        case 'email':
            if (value.trim() !== 'N/A' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                return 'Invalid email format';
            }
            break;
        case 'age':
            const ageNum = parseInt(value);
            if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
                return 'Age must be between 0 and 150';
            }
            break;
        case 'gender':
            if (!['MALE', 'FEMALE', 'OTHER'].includes(value)) {
                return 'Please select a valid gender';
            }
            break;
    }

    return null;
};

const PatientEditModal: React.FC<PatientEditModalProps> = ({
                                                               patient,
                                                               open,
                                                               onClose,
                                                               onSave
                                                           }) => {
    const [formData, setFormData] = useState<Patient | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize form data when patient changes
    useEffect(() => {
        if (patient) {
            setFormData({ ...patient });
            setErrors({});
            setHasChanges(false);
        }
    }, [patient]);

    // Check for changes
    useEffect(() => {
        if (patient && formData) {
            const changed =
                formData.name !== patient.name ||
                formData.nic !== patient.nic ||
                formData.email !== patient.email ||
                formData.contact !== patient.contact ||
                formData.age !== patient.age ||
                formData.gender !== patient.gender ||
                formData.address !== patient.address ||
                formData.medicalHistory !== patient.medicalHistory ||
                formData.isActive !== patient.isActive;

            setHasChanges(changed);
        }
    }, [formData, patient]);

    const handleInputChange = (field: keyof Patient, value: string | boolean) => {
        if (!formData) return;

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }

        setFormData(prev => ({
            ...prev!,
            [field]: value,
            // Update status when isActive changes
            ...(field === 'isActive' ? {
                status: value ? 'Active' : 'Inactive',
                statusColor: value
                    ? 'bg-green-200 text-green-700'
                    : 'bg-red-200 text-red-700'
            } : {})
        }));
    };

    const validateForm = (): boolean => {
        if (!formData) return false;

        const newErrors: Record<string, string> = {};
        const fieldsToValidate = ['name', 'nic', 'contact', 'email', 'age', 'gender'];

        fieldsToValidate.forEach(field => {
            const value = String(formData[field as keyof Patient] || '');
            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!formData || !validateForm()) {
            return;
        }

        setLoading(true);
        try {
            console.log('🔄 Saving patient data:', formData);

            // Convert form data to API format and validate
            const updateData = convertPatientToUpdateRequest({
                name: formData.name,
                nic: formData.nic,
                email: formData.email,
                contact: formData.contact,
                age: formData.age,
                gender: formData.gender,
                address: formData.address,
                medicalHistory: formData.medicalHistory
            });

            // Additional validation using the service
            const validation = validatePatientUpdateData(updateData);
            if (!validation.isValid) {
                console.error('❌ Validation failed:', validation.errors);
                // Set the first validation error
                setErrors({ general: validation.errors[0] });
                return;
            }

            // Call the API to update the patient
            const response = await updateBasicPatientInfo(formData.id, {
                name: formData.name,
                nic: formData.nic,
                contact: formData.contact,
                email: formData.email,
                age: formData.age,
                gender: formData.gender,
                address: formData.address,
                medicalHistory: formData.medicalHistory,
                isActive: formData.isActive
            });

            console.log('✅ Patient updated successfully:', response);

            // Update the form data with the response data if needed
            const updatedPatient: Patient = {
                ...formData,
                // Update with any server-side changes
                updatedDate: new Date().toLocaleDateString(),
            };

            // Call the parent component's onSave with updated data
            onSave(updatedPatient);

            // Close modal
            onClose();

        } catch (error: any) {
            console.error('❌ Error saving patient:', error);
            setErrors({
                general: error.message || 'Failed to update patient. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (hasChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!open || !formData) return null;

    const fieldLabels = {
        name: 'Patient Name',
        nic: 'NIC Number',
        email: 'Email Address',
        contact: 'Contact Number',
        age: 'Age',
        gender: 'Gender',
        address: 'Address',
        medicalHistory: 'Medical History',
        isActive: 'Status'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Edit Patient Details
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6">
                    {/* Show general error if any */}
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm">{errors.general}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Patient Name */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.name} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Enter patient name"
                                disabled={loading}
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        {/* NIC Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.nic} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nic}
                                onChange={(e) => handleInputChange('nic', e.target.value.toUpperCase())}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.nic ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="XXXXXXXXXV or XXXXXXXXXXXX"
                                disabled={loading}
                            />
                            {errors.nic && <p className="text-red-500 text-xs mt-1">{errors.nic}</p>}
                        </div>

                        {/* Contact Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.contact} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.contact}
                                onChange={(e) => handleInputChange('contact', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.contact ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="0771234567"
                                disabled={loading}
                            />
                            {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.email}
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="patient@example.com or N/A"
                                disabled={loading}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        {/* Age */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.age} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                value={formData.age}
                                onChange={(e) => handleInputChange('age', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.age ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="25"
                                min="0"
                                max="150"
                                disabled={loading}
                            />
                            {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.gender} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.gender}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.gender ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <option value="">Select Gender</option>
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                            {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.isActive}
                            </label>
                            <div className="flex items-center space-x-4 pt-2">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="isActive"
                                        checked={formData.isActive === true}
                                        onChange={() => handleInputChange('isActive', true)}
                                        className="mr-2"
                                        disabled={loading}
                                    />
                                    <span className="text-green-600">Active</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="isActive"
                                        checked={formData.isActive === false}
                                        onChange={() => handleInputChange('isActive', false)}
                                        className="mr-2"
                                        disabled={loading}
                                    />
                                    <span className="text-red-600">Inactive</span>
                                </label>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.address}
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter patient address"
                                rows={2}
                                disabled={loading}
                            />
                        </div>

                        {/* Medical History */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {fieldLabels.medicalHistory}
                            </label>
                            <textarea
                                value={formData.medicalHistory}
                                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter medical history or notes"
                                rows={3}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Form Status */}
                    <div className="mt-4 text-center">
                        {hasChanges && !loading && (
                            <p className="text-blue-600 text-sm">
                                Changes detected - click "Save Changes" to update
                            </p>
                        )}
                        {!hasChanges && !loading && (
                            <p className="text-gray-500 text-sm">
                                No changes to save
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || loading || Object.keys(errors).length > 0}
                        className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                            hasChanges && Object.keys(errors).length === 0 && !loading
                                ? 'bg-secondary text-white  shadow-md hover:shadow-lg'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientEditModal;