import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Upload,
    X,
    File,
    Image,
    FileText,
    Music,
    Video,
    Archive,
    Lock,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Folder
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { API_URL } from '../config';

interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'encrypting' | 'uploading' | 'completed' | 'error';
    error?: string;
}

const FileUploadPage = () => {
    const navigate = useNavigate();
    const { } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<string>('root');

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <Image className="h-8 w-8 text-blue-500" />;
        if (fileType.startsWith('video/')) return <Video className="h-8 w-8 text-purple-500" />;
        if (fileType.startsWith('audio/')) return <Music className="h-8 w-8 text-green-500" />;
        if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="h-8 w-8 text-red-500" />;
        if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-8 w-8 text-yellow-500" />;
        return <File className="h-8 w-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const newFiles: UploadFile[] = Array.from(files).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            progress: 0,
            status: 'pending'
        }));

        setUploadFiles(prev => [...prev, ...newFiles]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (id: string) => {
        setUploadFiles(prev => prev.filter(f => f.id !== id));
    };

    const uploadFile = async (fileId: string) => {
        const uploadFile = uploadFiles.find(f => f.id === fileId);
        if (!uploadFile) return;

        try {
            // Simulate encryption phase
            setUploadFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, status: 'encrypting' as const, progress: 0 } : f
            ));

            // Simulate encryption progress
            for (let i = 0; i <= 30; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                setUploadFiles(prev => prev.map(f =>
                    f.id === fileId ? { ...f, progress: i } : f
                ));
            }

            // Start upload phase
            setUploadFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, status: 'uploading' as const } : f
            ));

            // Create FormData
            const formData = new FormData();
            formData.append('file', uploadFile.file);

            // Get token
            const token = localStorage.getItem('token');

            // Upload to backend
            await axios.post(`${API_URL}/files/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = progressEvent.total
                        ? Math.round(((progressEvent.loaded * 70) / progressEvent.total) + 30)
                        : 30;
                    setUploadFiles(prev => prev.map(f =>
                        f.id === fileId ? { ...f, progress: percentCompleted } : f
                    ));
                },
            });

            // Complete
            setUploadFiles(prev => prev.map(f =>
                f.id === fileId ? { ...f, status: 'completed' as const, progress: 100 } : f
            ));
        } catch (error: any) {
            console.error('Upload error:', error);
            setUploadFiles(prev => prev.map(f =>
                f.id === fileId ? {
                    ...f,
                    status: 'error' as const,
                    error: error.response?.data?.error || 'Upload failed'
                } : f
            ));
        }
    };

    const handleUploadAll = async () => {
        const pendingFiles = uploadFiles.filter(f => f.status === 'pending');

        for (const file of pendingFiles) {
            await uploadFile(file.id);
        }
    };

    const getStatusIcon = (status: UploadFile['status']) => {
        switch (status) {
            case 'encrypting':
                return <Lock className="h-5 w-5 text-yellow-500 animate-pulse" />;
            case 'uploading':
                return <Upload className="h-5 w-5 text-blue-500 animate-bounce" />;
            case 'completed':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return null;
        }
    };

    const getStatusText = (status: UploadFile['status']) => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'encrypting':
                return 'Encrypting...';
            case 'uploading':
                return 'Uploading...';
            case 'completed':
                return 'Completed';
            case 'error':
                return 'Error';
        }
    };

    const totalSize = uploadFiles.reduce((sum, f) => sum + f.file.size, 0);
    const completedCount = uploadFiles.filter(f => f.status === 'completed').length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition touch-manipulation flex-shrink-0"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                            </button>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Upload Files</h1>
                        </div>
                        {uploadFiles.length > 0 && (
                            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
                                    {completedCount} / {uploadFiles.length} completed
                                </span>
                                <button
                                    onClick={handleUploadAll}
                                    disabled={uploadFiles.every(f => f.status !== 'pending')}
                                    className="bg-blue-600 text-white px-3 sm:px-6 py-2 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                                >
                                    <span className="hidden sm:inline">Upload All</span>
                                    <span className="sm:hidden">Upload</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Folder Selection */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        Upload to Folder
                    </label>
                    <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <select
                            value={selectedFolder}
                            onChange={(e) => setSelectedFolder(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="root">Root Directory</option>
                            <option value="documents">Documents</option>
                            <option value="images">Images</option>
                            <option value="videos">Videos</option>
                            <option value="music">Music</option>
                        </select>
                    </div>
                </div>

                {/* Drop Zone */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`bg-white rounded-lg shadow-md p-6 sm:p-8 mb-4 sm:mb-6 transition-all ${isDragging ? 'border-4 border-blue-500 bg-blue-50' : 'border-2 border-dashed border-gray-300'
                        }`}
                >
                    <div className="text-center">
                        <Upload className={`h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                            {isDragging ? 'Drop files here' : 'Drag & Drop Files'}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                            or click below to browse
                        </p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={(e) => handleFileSelect(e.target.files)}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base rounded-lg hover:bg-blue-700 transition touch-manipulation"
                        >
                            Choose Files
                        </button>
                        <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                            <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Files are encrypted before upload</span>
                        </div>
                    </div>
                </div>

                {/* Upload Queue */}
                {uploadFiles.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                Upload Queue ({uploadFiles.length})
                            </h2>
                            <span className="text-xs sm:text-sm text-gray-600">
                                Total: {formatFileSize(totalSize)}
                            </span>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            {uploadFiles.map((uploadFile) => (
                                <div
                                    key={uploadFile.id}
                                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition"
                                >
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        {/* File Icon */}
                                        <div className="flex-shrink-0">
                                            {getFileIcon(uploadFile.file.type)}
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2 gap-2">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                    {uploadFile.file.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeFile(uploadFile.id)}
                                                    disabled={uploadFile.status === 'uploading' || uploadFile.status === 'encrypting'}
                                                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition disabled:opacity-50 touch-manipulation"
                                                    aria-label="Remove file"
                                                >
                                                    <X className="h-4 w-4 text-gray-500" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
                                                <span>{formatFileSize(uploadFile.file.size)}</span>
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(uploadFile.status)}
                                                    <span>{getStatusText(uploadFile.status)}</span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            {(uploadFile.status === 'encrypting' || uploadFile.status === 'uploading') && (
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-300 ${uploadFile.status === 'encrypting' ? 'bg-yellow-500' : 'bg-blue-600'
                                                            }`}
                                                        style={{ width: `${uploadFile.progress}%` }}
                                                    />
                                                </div>
                                            )}

                                            {uploadFile.status === 'completed' && (
                                                <div className="w-full bg-green-100 rounded-full h-2">
                                                    <div className="h-full bg-green-500 w-full" />
                                                </div>
                                            )}

                                            {uploadFile.error && (
                                                <p className="text-xs sm:text-sm text-red-600 mt-2">{uploadFile.error}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileUploadPage;