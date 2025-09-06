import React, { useState, useEffect, useCallback } from 'react';
import {
    Calendar,
    User,
    FileText,
    Download,
    Eye,
    AlertCircle,
    CheckCircle,
    Clock,
    Edit,
    Upload,
    Trash2
} from 'lucide-react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { diagnosisCardsService, DiagnosisCardResponse } from '../../services/prescriptions/diagnosisCardGetById';
import { updateDiagnosisCard, UpdateDiagnosisCardRequest } from '../../services/prescriptions/diagnosisCardUpdateService';
import { deleteDiagnosisCard } from '../../services/prescriptions/diagnosisCardDeleteService.ts';

interface SnackbarState {
    open: boolean;
    message: string;
    severity: AlertColor;
}

interface EditFormState {
    diagnosis: string;
    notes: string;
    expiryDate: string;
    diagnosisCardPdf: File | null;
    prescriptionImage: File | null;
}

interface DiagnosisCardsProps {
    patientId: string;
}

const DiagnosisCards: React.FC<DiagnosisCardsProps> = ({ patientId }) => {
    const [cards, setCards] = useState<DiagnosisCardResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [updateLoading, setUpdateLoading] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    // Snackbar state
    const [snackbar, setSnackbar] = useState<SnackbarState>({
        open: false,
        message: '',
        severity: 'info'
    });

    // Form state for editing
    const [editForm, setEditForm] = useState<EditFormState>({
        diagnosis: '',
        notes: '',
        expiryDate: '',
        diagnosisCardPdf: null,
        prescriptionImage: null,
    });

    // Helper function to show snackbar
    const showSnackbar = useCallback((message: string, severity: AlertColor = 'info') => {
        setSnackbar({
            open: true,
            message,
            severity
        });
    }, []);

    // Handle snackbar close
    const handleSnackbarClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    const fetchDiagnosisCards = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await diagnosisCardsService.getDiagnosisCards(patientId);
            setCards(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load diagnosis cards';
            setError(errorMessage);
            showSnackbar(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    }, [patientId, showSnackbar]);

    useEffect(() => {
        if (patientId) {
            fetchDiagnosisCards();
        }
    }, [patientId, fetchDiagnosisCards]);

    const handleEditStart = useCallback((card: DiagnosisCardResponse) => {
        setEditingCard(card.id);
        setEditForm({
            diagnosis: card.diagnosis,
            notes: card.notes || '',
            expiryDate: card.expiryDate ? new Date(card.expiryDate).toISOString().split('T')[0] : '',
            diagnosisCardPdf: null,
            prescriptionImage: null,
        });
    }, []);

    const handleEditCancel = useCallback(() => {
        setEditingCard(null);
        setEditForm({
            diagnosis: '',
            notes: '',
            expiryDate: '',
            diagnosisCardPdf: null,
            prescriptionImage: null,
        });
    }, []);

    const handleInputChange = useCallback((field: keyof EditFormState, value: string) => {
        setEditForm(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleFileChange = useCallback((field: 'diagnosisCardPdf' | 'prescriptionImage', file: File | null) => {
        setEditForm(prev => ({
            ...prev,
            [field]: file
        }));
    }, []);

    const handleDeleteCard = useCallback(async (cardId: string, diagnosis: string) => {
        // Confirm deletion
        const confirmMessage = `Are you sure you want to delete the diagnosis card "${diagnosis}"?\n\nThis action cannot be undone.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            setDeleteLoading(cardId);

            await deleteDiagnosisCard(cardId);

            // Remove the card from local state (or update activeStatus to false)
            setCards(prev => prev.filter(card => card.id !== cardId));

            // If the deleted card was being edited, clear editing state
            if (editingCard === cardId) {
                handleEditCancel();
            }

            showSnackbar('Diagnosis card deleted successfully!', 'success');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete diagnosis card';
            showSnackbar(errorMessage, 'error');
        } finally {
            setDeleteLoading(null);
        }
    }, [editingCard, handleEditCancel, showSnackbar]);

    const handleUpdateCard = useCallback(async (cardId: string) => {
        try {
            setUpdateLoading(cardId);

            const updateData: UpdateDiagnosisCardRequest = {
                diagnosis: editForm.diagnosis,
                notes: editForm.notes,
                expiryDate: editForm.expiryDate ? new Date(editForm.expiryDate) : undefined,
                diagnosisCardPdf: editForm.diagnosisCardPdf || undefined,
                prescriptionImage: editForm.prescriptionImage || undefined,
                patientId: patientId,
            };

            const response = await updateDiagnosisCard(cardId, updateData);

            // Update the card in local state
            setCards(prev =>
                prev.map(card =>
                    card.id === cardId
                        ? {
                            ...card,
                            diagnosis: response.card.diagnosis,
                            notes: response.card.notes || '',
                            expiryDate: response.card.expiryDate || card.expiryDate,
                            diagnosisCardUrl: response.card.diagnosisCardUrl || card.diagnosisCardUrl,
                            prescriptionImageUrl: response.card.prescriptionImageUrl,
                            updatedAt: response.card.updatedAt,
                        }
                        : card
                )
            );

            setEditingCard(null);
            showSnackbar('Diagnosis card updated successfully!', 'success');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update diagnosis card';
            showSnackbar(errorMessage, 'error');
        } finally {
            setUpdateLoading(null);
        }
    }, [editForm, patientId, showSnackbar]);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }, []);

    const isExpired = useCallback((expiryDate: string) => {
        return new Date(expiryDate) < new Date();
    }, []);

    const isExpiringSoon = useCallback((expiryDate: string) => {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }, []);

    const handleViewPDF = useCallback((url: string) => {
        window.open(url, '_blank');
    }, []);

    const handleDownloadPDF = useCallback(async (url: string, diagnosis: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `diagnosis-${diagnosis.replace(/\s+/g, '-').toLowerCase()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            showSnackbar('Failed to download PDF', 'error');
        }
    }, [showSnackbar]);

    const getStatusInfo = useCallback((card: DiagnosisCardResponse) => {
        if (!card.activeStatus) {
            return { status: 'inactive', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: AlertCircle };
        }
        if (isExpired(card.expiryDate)) {
            return { status: 'expired', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle };
        }
        if (isExpiringSoon(card.expiryDate)) {
            return { status: 'expiring', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock };
        }
        return { status: 'active', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    }, [isExpired, isExpiringSoon]);

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="border rounded-lg p-6 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Diagnosis Cards</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDiagnosisCards}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        type="button"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Diagnosis Cards</h2>
                <p className="text-gray-600">Medical diagnosis records and certificates</p>
            </div>

            {cards.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Diagnosis Cards Found</h3>
                    <p className="text-gray-500">No diagnosis cards are available for this patient.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cards.map((card) => {
                        const statusInfo = getStatusInfo(card);
                        const StatusIcon = statusInfo.icon;
                        const isEditing = editingCard === card.id;
                        const isUpdating = updateLoading === card.id;
                        const isDeleting = deleteLoading === card.id;

                        return (
                            <div
                                key={card.id}
                                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.diagnosis}
                                                    onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                                                    className="text-xl font-semibold text-gray-900 border border-gray-300 rounded px-2 py-1 flex-1"
                                                    disabled={isUpdating}
                                                />
                                            ) : (
                                                <h3 className="text-xl font-semibold text-gray-900">{card.diagnosis}</h3>
                                            )}
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}
                                            >
                                                <StatusIcon className="h-3 w-3" />
                                                {statusInfo.status.charAt(0).toUpperCase() + statusInfo.status.slice(1)}
                                            </span>
                                        </div>

                                        {isEditing ? (
                                            <textarea
                                                value={editForm.notes}
                                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                                className="w-full text-gray-600 border border-gray-300 rounded px-2 py-1 mb-3 resize-none"
                                                rows={3}
                                                placeholder="Notes..."
                                                disabled={isUpdating}
                                            />
                                        ) : (
                                            card.notes && (
                                                <p className="text-gray-600 mb-3 leading-relaxed">{card.notes}</p>
                                            )
                                        )}
                                    </div>

                                    {!isEditing && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditStart(card)}
                                                disabled={isDeleting}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    isDeleting
                                                        ? 'text-gray-400 cursor-not-allowed'
                                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                                }`}
                                                title="Edit diagnosis card"
                                                type="button"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCard(card.id, card.diagnosis)}
                                                disabled={isDeleting}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    isDeleting
                                                        ? 'text-gray-400 cursor-not-allowed'
                                                        : 'text-red-500 hover:text-red-700 hover:bg-red-50'
                                                }`}
                                                title={isDeleting ? 'Deleting...' : 'Delete diagnosis card'}
                                                type="button"
                                            >
                                                {isDeleting ? (
                                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span className="font-medium">Issued:</span>
                                        <span>{formatDate(card.issuedDate)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span className="font-medium">Expires:</span>
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={editForm.expiryDate}
                                                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                                className="border border-gray-300 rounded px-2 py-1 text-xs"
                                                disabled={isUpdating}
                                            />
                                        ) : (
                                            <span className={isExpired(card.expiryDate) ? 'text-red-600 font-medium' : ''}>
                                                {formatDate(card.expiryDate)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="h-4 w-4" />
                                        <span className="font-medium">Created by:</span>
                                        <span>{card.createdBy.name} ({card.createdBy.role})</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        <span className="font-medium">Created:</span>
                                        <span>{formatDate(card.createdAt)}</span>
                                    </div>
                                </div>

                                {/* File Upload Section - Only show when editing */}
                                {isEditing && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <label htmlFor={`diagnosisCardPdf-${card.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                                                Diagnosis Card PDF:
                                            </label>
                                            <input
                                                id={`diagnosisCardPdf-${card.id}`}
                                                type="file"
                                                accept=".pdf"
                                                onChange={(e) => handleFileChange('diagnosisCardPdf', e.target.files?.[0] || null)}
                                                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                                disabled={isUpdating}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor={`prescriptionImage-${card.id}`} className="block text-sm font-medium text-gray-700 mb-2">
                                                Prescription Image:
                                            </label>
                                            <input
                                                id={`prescriptionImage-${card.id}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange('prescriptionImage', e.target.files?.[0] || null)}
                                                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                                disabled={isUpdating}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <div className="flex gap-3">
                                        {card.diagnosisCardUrl && !isEditing && !isDeleting && (
                                            <>
                                                <button
                                                    onClick={() => handleViewPDF(card.diagnosisCardUrl)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg transition-colors text-sm font-medium"
                                                    type="button"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    View Certificate
                                                </button>

                                                <button
                                                    onClick={() => handleDownloadPDF(card.diagnosisCardUrl, card.diagnosis)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                                    type="button"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Download PDF
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {isEditing && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleEditCancel}
                                                disabled={isUpdating || isDeleting}
                                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                type="button"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdateCard(card.id)}
                                                disabled={isUpdating || isDeleting}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                type="button"
                                            >
                                                {isUpdating ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4" />
                                                        Update Card
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MUI Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default DiagnosisCards;