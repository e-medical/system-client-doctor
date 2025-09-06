import  {useState, useRef, useEffect, ChangeEvent, DragEvent, FormEvent} from 'react';
import { labReportsService, LabReportResponse } from '../services/prescriptions/labReportGetById.ts';
import { Eye, Download, Calendar, User, FileText, RefreshCw, AlertCircle } from 'lucide-react';

interface FileWithPreview extends File {
    preview: string;
}

interface ReportUploadCardProps {
    patientId?: string | undefined
}

const ReportUploadCard = ({patientId}: ReportUploadCardProps) => {
    console.log(patientId);

    // Existing states
    const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    // New states for fetching data
    const [existingReports, setExistingReports] = useState<LabReportResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'existing'>('existing');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Fetch existing reports when component mounts or patientId changes
    useEffect(() => {
        if (patientId) {
            fetchExistingReports();
        }
    }, [patientId]);

    const fetchExistingReports = async () => {
        if (!patientId) return;

        try {
            setLoading(true);
            setError(null);
            const reports = await labReportsService.getLabReports(patientId);
            setExistingReports(reports);
        } catch (err: any) {
            setError(err.message || 'Failed to load existing reports');
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewReport = (url: string) => {
        window.open(url, '_blank');
    };

    const handleDownloadReport = async (url: string, reportDate: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            // Extract file extension from URL
            const fileExtension = url.split('.').pop() || 'jpg';
            const formattedDate = new Date(reportDate).toISOString().split('T')[0];
            link.download = `lab-report-${formattedDate}.${fileExtension}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error downloading report:', error);
            alert('Failed to download report. Please try again.');
        }
    };

    // Existing functions remain the same
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const newFiles: FileWithPreview[] = Array.from(files).map(file =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file),
                })
            );
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const openCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: {ideal: 1280},
                    height: {ideal: 720}
                }
            });

            setStream(mediaStream);
            setIsCameraOpen(true);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Could not access camera. Please check permissions or try uploading a file instead.');
        }
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const fileName = `camera-capture-${timestamp}.jpg`;

                const file = new File([blob], fileName, {type: 'image/jpeg'});
                const fileWithPreview = Object.assign(file, {
                    preview: URL.createObjectURL(file),
                });

                setSelectedFiles(prev => [...prev, fileWithPreview]);
                closeCamera();
            }
        }, 'image/jpeg', 0.8);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const newFiles: FileWithPreview[] = Array.from(files).map(file =>
                Object.assign(file, {
                    preview: URL.createObjectURL(file),
                })
            );
            setSelectedFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prev => {
            const updated = prev.filter((_, i) => i !== index);
            URL.revokeObjectURL(prev[index].preview);
            return updated;
        });
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) {
            alert('Please upload or capture at least one report.');
            return;
        }

        console.log('Submitting reports:', selectedFiles.map(file => ({
            name: file.name,
            type: file.type,
            size: file.size,
        })));

        // Here you would typically upload the files to your backend
        // After successful upload, refresh the existing reports
        alert(`Successfully processed ${selectedFiles.length} report(s)!`);
        selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
        setSelectedFiles([]);

        // Refresh existing reports after upload
        if (patientId) {
            await fetchExistingReports();
        }
    };

    const handleCancel = () => {
        selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
        setSelectedFiles([]);
        closeCamera();
        alert('Operation cancelled.');
    };

    return (
        <div className="w-full mx-auto p-6 bg-white rounded-lg my-1">
            {/* Tab Navigation */}
            <div className="flex mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('existing')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'existing'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FileText className="w-4 h-4 inline-block mr-2" />
                    Existing Reports ({existingReports.length})
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'upload'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    📷 Upload New Report
                </button>
            </div>

            {/* Existing Reports Tab */}
            {activeTab === 'existing' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Lab Reports</h3>
                        <button
                            onClick={fetchExistingReports}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading reports...</span>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                <span className="text-red-700">{error}</span>
                            </div>
                        </div>
                    )}

                    {!loading && !error && existingReports.length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">No lab reports found for this patient.</p>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Upload your first report →
                            </button>
                        </div>
                    )}

                    {!loading && existingReports.length > 0 && (
                        <div className="space-y-4">
                            {existingReports.map((report) => (
                                <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium text-gray-900">
                                                    {formatDate(report.reportDate)}
                                                </span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    report.activeStatus
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {report.activeStatus ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            {report.notes && (
                                                <p className="text-gray-600 text-sm mb-2">{report.notes}</p>
                                            )}

                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <User className="w-4 h-4" />
                                                <span>Created by {report.createdBy.name} ({report.createdBy.role})</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleViewReport(report.labReportUrl)}
                                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDownloadReport(report.labReportUrl, report.reportDate)}
                                                className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                                            >
                                                <Download className="w-4 h-4" />
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div>
                    {/* Camera Modal */}
                    {isCameraOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-4 max-w-lg w-full mx-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold">Capture Photo</h3>
                                    <button
                                        onClick={closeCamera}
                                        className="text-gray-500 hover:text-gray-700 text-2xl"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="relative">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full rounded-lg"
                                    />

                                    <div className="flex justify-center gap-4 mt-4">
                                        <button
                                            onClick={closeCamera}
                                            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={capturePhoto}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            📷 Take Photo
                                        </button>
                                    </div>
                                </div>

                                <canvas ref={canvasRef} className="hidden"/>
                            </div>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div
                        className={`border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} border-dashed rounded-lg p-8 text-center transition-all duration-200`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-4xl mb-4">📷</div>
                            <p className="text-gray-500 text-lg font-medium mb-2">Upload or Capture Reports</p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                                >
                                    Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={openCamera}
                                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 text-sm rounded"
                                >
                                    Open Camera
                                </button>
                            </div>
                        </div>

                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* File Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="mt-6 pt-6">
                            <h4 className="text-md font-semibold text-gray-700 mb-3">Selected Reports:</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {selectedFiles.map((file, index) => (
                                    <div key={index}
                                         className="relative border border-gray-300 rounded-md overflow-hidden shadow-sm">
                                        {file.type.startsWith('image/') ? (
                                            <img src={file.preview} alt={file.name} className="w-full h-24 object-cover"/>
                                        ) : (
                                            <div
                                                className="w-full h-24 bg-gray-100 flex items-center justify-center text-gray-500 text-xs p-2">
                                                <div className="text-2xl mb-1">📄</div>
                                                <span className="text-center break-all">{file.name}</span>
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                                            aria-label={`Remove ${file.name}`}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-8 pt-6">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-base font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-base font-medium"
                        >
                            Complete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportUploadCard;