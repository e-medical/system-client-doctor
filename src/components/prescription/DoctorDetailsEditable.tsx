import React, { useState } from 'react';
import { X } from 'lucide-react';

// Define the shape of doctorData
interface DoctorData {
    name: string;
    qualification: string;
    title: string;
    hospital: string;
}

// Define valid field keys
type DoctorField = keyof DoctorData;

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    label: string | null;
    value: string;
    onSave: (value: string) => void;
}

const Modal = ({ isOpen, onClose, label, value, onSave }: ModalProps) => {
    const [tempValue, setTempValue] = useState(value);

    const handleSave = () => {
        onSave(tempValue);
        onClose();
    };

    // Prevent state from being stale if value changes
    React.useEffect(() => {
        setTempValue(value);
    }, [value]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-black"
                >
                    <X size={20} />
                </button>

                <h3 className="text-lg font-semibold mb-4">Edit {label || 'Field'}</h3>

                <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full border rounded p-2 mb-4"
                />

                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:underline"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function DoctorDetailsEditable() {
    const [doctorData, setDoctorData] = useState<DoctorData>({
        name: 'Dr. Sadun Perera',
        qualification: 'MBBS, University Of Peradeniya',
        title: 'Consultant in General Internal Medicine',
        hospital: 'Teaching Hospital Ratnapura',
    });

    const [editingField, setEditingField] = useState<DoctorField | null>(null);

    const handleEditClick = (field: DoctorField) => {
        setEditingField(field);
    };

    const handleSave = (newValue: string) => {
        if (editingField) {
            setDoctorData((prev) => ({
                ...prev,
                [editingField]: newValue,
            }));
        }
        setEditingField(null);
    };

    return (
        <div className="grid grid-cols-1 gap-2 bg-white p-4 rounded shadow-md max-w-md">
            {Object.entries(doctorData).map(([field, value]) => (
                <div key={field} className="flex justify-between items-center">
                    <p className="text-sm text-gray-800">{value}</p>
                    <button
                        onClick={() => handleEditClick(field as DoctorField)}
                        className="text-xs bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
                    >
                        Edit
                    </button>
                </div>
            ))}

            <Modal
                isOpen={!!editingField}
                onClose={() => setEditingField(null)}
                label={editingField}
                value={editingField ? doctorData[editingField] : ''}
                onSave={handleSave}
            />
        </div>
    );
}