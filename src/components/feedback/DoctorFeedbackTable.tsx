import { useState, useEffect } from 'react';
import CreateFeedbackModal from "./CreateFeedbackModal.tsx";
import ViewFeedbackModal from "./ViewFeedbackModal.tsx";
import DeleteConfirmationModal from "../basic/DeleteConfirmationModal.tsx";
import UpdateFeedbackModal from './UpdateFeedbackModal.tsx';
import {
    getDoctorsWithTestimonials,

} from '../../services/doctorTestermonialService.ts';
import { getLoggedInUser } from '../../services/authService.ts';

interface Doctor {
    id: string;
    doctorName: string;
    category: string;
    feedback: string;
    isActive: boolean;
    date: string;
    canEdit: boolean; // New field for access control
    originalData: any; // Store original API data
}

export default function DoctorFeedbackTable() {
    const [openCreate, setOpenCreate] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Get current user ID for access control
    useEffect(() => {
        const loggedInUser = getLoggedInUser();
        if (loggedInUser) {
            setCurrentUserId(loggedInUser.id);
        }
    }, []);

    // Fetch doctors with testimonials
    useEffect(() => {
        const fetchDoctorsWithTestimonials = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('🔍 Fetching doctors with testimonials...');

                const response = await getDoctorsWithTestimonials({
                    page: 1,
                    limit: 100, // Get all testimonials
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                });

                console.log('📋 Testimonials response:', response);

                if (response.success && response.data.doctors) {
                    // Convert API data to table format
                    const convertedDoctors: Doctor[] = response.data.doctors.map((doctor: any) => {
                        // Check if current user can edit this doctor's testimonial
                        const canEdit = doctor.applicationUserId?._id === currentUserId;

                        return {
                            id: doctor._id,
                            doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                            category: doctor.specialization,
                            feedback: doctor.testimonial?.message || '',
                            isActive: doctor.isActive,
                            date: doctor.testimonial?.date ?
                                new Date(doctor.testimonial.date).toISOString().split('T')[0] :
                                new Date(doctor.createdAt).toISOString().split('T')[0],
                            canEdit: canEdit,
                            originalData: doctor
                        };
                    });

                    setDoctors(convertedDoctors);
                    console.log('✅ Converted doctors for table:', convertedDoctors);
                } else {
                    setError('Failed to load testimonials');
                    setDoctors([]);
                }
            } catch (err) {
                console.error('❌ Error fetching testimonials:', err);
                setError('Failed to load testimonials. Please try again.');
                setDoctors([]);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) {
            fetchDoctorsWithTestimonials();
        }
    }, [currentUserId]);

    // Refresh testimonials after creating a new one
    const refreshTestimonials = async () => {
        try {
            const response = await getDoctorsWithTestimonials({
                page: 1,
                limit: 100,
                sortBy: 'createdAt',
                sortOrder: 'desc'
            });

            if (response.success && response.data.doctors) {
                const convertedDoctors: Doctor[] = response.data.doctors.map((doctor: any) => {
                    const canEdit = doctor.applicationUserId?._id === currentUserId;

                    return {
                        id: doctor._id,
                        doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                        category: doctor.specialization,
                        feedback: doctor.testimonial?.message || '',
                        isActive: doctor.isActive,
                        date: doctor.testimonial?.date ?
                            new Date(doctor.testimonial.date).toISOString().split('T')[0] :
                            new Date(doctor.createdAt).toISOString().split('T')[0],
                        canEdit: canEdit,
                        originalData: doctor
                    };
                });

                setDoctors(convertedDoctors);
            }
        } catch (err) {
            console.error('Error refreshing testimonials:', err);
        }
    };

    const handleToggleActive = (id: string) => {
        // Only allow toggle if user can edit this doctor
        const doctor = doctors.find(d => d.id === id);
        if (!doctor?.canEdit) {
            console.log('Cannot toggle active status - no edit permission');
            return;
        }

        setDoctors(prev =>
            prev.map(doc =>
                doc.id === id ? { ...doc, isActive: !doc.isActive } : doc
            )
        );
    };

    const handleView = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setOpenView(true);
    };

    const handleEdit = (doctor: Doctor) => {
        // Only allow edit if user has permission
        if (!doctor.canEdit) {
            console.log('Cannot edit - no permission');
            return;
        }

        setSelectedDoctor(doctor);
        setOpenUpdate(true);
    };

    const handleDelete = (id: string) => {
        // Only allow delete if user has permission
        const doctor = doctors.find(d => d.id === id);
        if (!doctor?.canEdit) {
            console.log('Cannot delete - no permission');
            return;
        }

        console.log('Delete testimonial:', id);
        setDeleteModalVisible(true);
    };

    const handleCreateFeedback = (feedback: string) => {
        console.log('Testimonial created:', feedback);
        // Refresh the testimonials list to show the new one
        refreshTestimonials();
        setOpenCreate(false);
    };

    const handleUpdateFeedback = (updatedFeedback: string) => {
        if (selectedDoctor) {
            setDoctors(prev =>
                prev.map(doc =>
                    doc.id === selectedDoctor.id ? { ...doc, feedback: updatedFeedback } : doc
                )
            );
        }
        setOpenUpdate(false);
    };

    if (loading) {
        return (
            <div className="p-4 bg-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl mb-2">⏳</div>
                    <p className="text-gray-600">Loading testimonials...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-white min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl mb-2">❌</div>
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/80"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 bg-white min-h-screen relative">
            <div className="w-full mx-auto bg-white rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex bg-gray-200 text-gray-900 font-semibold text-sm border-b border-gray-200">
                    <div className="w-1/12 p-3 text-center">#ID</div>
                    <div className="w-2/12 p-3">Doctor Name</div>
                    <div className="w-2/12 p-3">Category</div>
                    <div className="w-3/12 p-3">Feedback</div>
                    <div className="w-1/12 p-3 text-center">Active</div>
                    <div className="w-1/12 p-3">Date</div>
                    <div className="w-2/12 p-3 text-center">Actions</div>
                </div>

                {/* Table Rows */}
                {doctors.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No testimonials found.</div>
                ) : (
                    doctors.map((doctor, index) => (
                        <div key={doctor.id} className="flex items-center border-b border-gray-200 hover:bg-gray-50">
                            <div className="w-1/12 p-3 text-center text-sm">{index + 1}</div>
                            <div className="w-2/12 p-3 text-sm">{doctor.doctorName}</div>
                            <div className="w-2/12 p-3 text-sm">{doctor.category}</div>
                            <div className="w-3/12 p-3 text-sm truncate" title={doctor.feedback}>
                                {doctor.feedback}
                            </div>
                            <div className="w-1/12 p-3 flex justify-center">
                                <label className={`relative inline-flex items-center ${doctor.canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={doctor.isActive}
                                        onChange={() => handleToggleActive(doctor.id)}
                                        disabled={!doctor.canEdit}
                                    />
                                    <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-secondary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                </label>
                            </div>
                            <div className="w-1/12 p-3 text-sm">{doctor.date}</div>
                            <div className="w-2/12 p-3 flex justify-center gap-2">
                                {/* View - Always enabled */}
                                <span
                                    onClick={() => handleView(doctor)}
                                    className="material-symbols-outlined text-gray-600 text-[15px] cursor-pointer hover:text-blue-600"
                                    title="View"
                                >
                                    visibility
                                </span>

                                {/* Edit - Only enabled if user can edit */}
                                <span
                                    onClick={() => doctor.canEdit && handleEdit(doctor)}
                                    className={`material-symbols-outlined text-[15px] ${
                                        doctor.canEdit
                                            ? 'text-gray-600 cursor-pointer hover:text-green-600'
                                            : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                    title={doctor.canEdit ? "Edit" : "Cannot edit (not your testimonial)"}
                                >
                                    edit
                                </span>

                                {/* Delete - Only enabled if user can edit */}
                                <span
                                    onClick={() => doctor.canEdit && handleDelete(doctor.id)}
                                    className={`material-symbols-outlined text-[15px] ${
                                        doctor.canEdit
                                            ? 'text-red-500 cursor-pointer hover:text-red-700'
                                            : 'text-gray-300 cursor-not-allowed'
                                    }`}
                                    title={doctor.canEdit ? "Delete" : "Cannot delete (not your testimonial)"}
                                >
                                    delete
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setOpenCreate(true)}
                className="fixed bottom-6 right-6 bg-secondary text-white p-4 rounded-full shadow-lg hover:bg-secondary/80"
                title="Add Feedback"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>

            {/* Modals */}
            <CreateFeedbackModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreate={handleCreateFeedback}
            />

            {selectedDoctor && (
                <ViewFeedbackModal
                    open={openView}
                    onClose={() => setOpenView(false)}
                    doctorName={selectedDoctor.doctorName}
                    doctorRole={selectedDoctor.category}
                    feedback={selectedDoctor.feedback}
                />
            )}

            {selectedDoctor && (
                <UpdateFeedbackModal
                    open={openUpdate}
                    onClose={() => setOpenUpdate(false)}
                    doctorName={selectedDoctor.doctorName}
                    doctorRole={selectedDoctor.category}
                    feedback={selectedDoctor.feedback}
                    onUpdate={handleUpdateFeedback}
                />
            )}

            <DeleteConfirmationModal
                isOpen={deleteModalVisible}
                onClose={() => setDeleteModalVisible(false)}
                onConfirm={() => setDeleteModalVisible(false)}
            />
        </div>
    );
}
