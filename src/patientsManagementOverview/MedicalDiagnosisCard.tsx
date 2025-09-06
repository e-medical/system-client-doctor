import React, {useState, useEffect} from 'react';
import {Calendar, User, FileText, Download, Eye, AlertCircle, CheckCircle, Clock} from 'lucide-react';
import {diagnosisCardsService, DiagnosisCardResponse} from '../services/prescriptions/diagnosisCardGetById.ts';


interface MedicalDiagnosisCardProps {
    patientId:string | undefined,
}

const DiagnosisCards: React.FC<MedicalDiagnosisCardProps> = ({patientId}:any) => {

    const [cards, setCards] = useState<DiagnosisCardResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDiagnosisCards();
    }, [patientId]);

    const fetchDiagnosisCards = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await diagnosisCardsService.getDiagnosisCards(patientId);
            setCards(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load diagnosis cards');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const isExpired = (expiryDate: string) => {
        return new Date(expiryDate) < new Date();
    };

    const isExpiringSoon = (expiryDate: string) => {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const handleViewPDF = (url: string) => {
        window.open(url, '_blank');
    };

    const handleDownloadPDF = async (url: string, diagnosis: string) => {
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
        }
    };

    const getStatusInfo = (card: DiagnosisCardResponse) => {
        if (!card.activeStatus) {
            return {status: 'inactive', color: 'text-gray-500', bgColor: 'bg-gray-100', icon: AlertCircle};
        }
        if (isExpired(card.expiryDate)) {
            return {status: 'expired', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertCircle};
        }
        if (isExpiringSoon(card.expiryDate)) {
            return {status: 'expiring', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Clock};
        }
        return {status: 'active', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle};
    };

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-6 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3"/>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Diagnosis Cards</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={fetchDiagnosisCards}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
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
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Diagnosis Cards Found</h3>
                    <p className="text-gray-500">No diagnosis cards are available for this patient.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {cards.map((card) => {
                        const statusInfo = getStatusInfo(card);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={card.id}
                                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">{card.diagnosis}</h3>
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
                        <StatusIcon className="h-3 w-3"/>
                                                {statusInfo.status.charAt(0).toUpperCase() + statusInfo.status.slice(1)}
                      </span>
                                        </div>

                                        {card.notes && (
                                            <p className="text-gray-600 mb-3 leading-relaxed">{card.notes}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4"/>
                                        <span className="font-medium">Issued:</span>
                                        <span>{formatDate(card.issuedDate)}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar className="h-4 w-4"/>
                                        <span className="font-medium">Expires:</span>
                                        <span className={isExpired(card.expiryDate) ? 'text-red-600 font-medium' : ''}>
                      {formatDate(card.expiryDate)}
                    </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User className="h-4 w-4"/>
                                        <span className="font-medium">Created by:</span>
                                        <span>{card.createdBy.name} ({card.createdBy.role})</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="h-4 w-4"/>
                                        <span className="font-medium">Created:</span>
                                        <span>{formatDate(card.createdAt)}</span>
                                    </div>
                                </div>

                                {card.diagnosisCardUrl && (
                                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleViewPDF(card.diagnosisCardUrl)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg  transition-colors text-sm font-medium"
                                        >
                                            <Eye className="h-4 w-4"/>
                                            View Certificate
                                        </button>

                                        <button
                                            onClick={() => handleDownloadPDF(card.diagnosisCardUrl, card.diagnosis)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                                        >
                                            <Download className="h-4 w-4"/>
                                            Download PDF
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DiagnosisCards;