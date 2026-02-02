import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSharedWithMe, downloadSharedFile, removeShare, type SharedFile } from '../services/shareService';
import {
    ArrowLeft,
    Download,
    Eye,
    Share2,
    Trash2,
    Search,
    Filter,
    Calendar,
    User,
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    Archive,
    File as FileIcon,
    Clock,
    Shield,
    X,
    EyeOff,
    Lock
} from 'lucide-react';



const SharedFilesPage = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos' | 'other'>('all');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Password modal state
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [pendingDownloadFile, setPendingDownloadFile] = useState<SharedFile | null>(null);

    // Preview modal state
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<SharedFile | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        fetchSharedFiles();
    }, []);

    const fetchSharedFiles = async () => {
        try {
            setLoading(true);
            setError(null);
            const files = await getSharedWithMe();
            setSharedFiles(files);
        } catch (err: any) {
            console.error('Error fetching shared files:', err);
            setError(err.response?.data?.error || 'Failed to load shared files');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (file: SharedFile) => {
        if (file.isPasswordProtected) {
            // Open password modal
            setPendingDownloadFile(file);
            setPasswordModalOpen(true);
            setPasswordInput('');
            setPasswordError('');
        } else {
            // Download directly
            await performDownload(file, undefined);
        }
    };

    const performDownload = async (file: SharedFile, password?: string) => {
        try {
            const response = await downloadSharedFile(file.shareToken, password);
            if (response.downloadUrl) {
                const link = document.createElement('a');
                link.href = response.downloadUrl;
                link.setAttribute('download', file.file.name);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                // If downloadUrl is not present, it means the service returned a Blob directly
                // This case should ideally not happen if the service consistently returns { downloadUrl: string }
                // but as a fallback or if the service can return a Blob, we handle it.
                // However, the instruction is to remove blob handling, so we'll throw an error if no downloadUrl.
                throw new Error('No download URL received for direct download.');
            }

            // Close password modal if open
            setPasswordModalOpen(false);
            setPendingDownloadFile(null);
            setPasswordInput('');
        } catch (err: any) {
            console.error('Download error:', err);
            const errorMsg = err.response?.data?.error || 'Failed to download file';

            if (passwordModalOpen) {
                setPasswordError(errorMsg);
            } else {
                alert(errorMsg);
            }
        }
    };

    const handlePasswordSubmit = async () => {
        if (!pendingDownloadFile || !passwordInput) {
            setPasswordError('Please enter a password');
            return;
        }

        await performDownload(pendingDownloadFile, passwordInput);
    };

    const handleRemove = async (shareId: string) => {
        if (!confirm('Are you sure you want to remove this shared file from your list?')) {
            return;
        }

        try {
            await removeShare(shareId);
            setSharedFiles(prev => prev.filter(f => f.id !== shareId));
        } catch (err: any) {
            console.error('Remove error:', err);
            alert(err.response?.data?.error || 'Failed to remove share');
        }
    };

    const handlePreview = async (file: SharedFile) => {
        if (file.isPasswordProtected) {
            alert('Password-protected files cannot be previewed. Please download the file instead.');
            return;
        }

        setPreviewFile(file);
        setPreviewModalOpen(true);
        setPreviewLoading(true);
        setPreviewUrl(null);

        try {
            const response = await downloadSharedFile(file.shareToken);
            if (response.downloadUrl) {
                setPreviewUrl(response.downloadUrl);
            } else {
                throw new Error('No preview URL received');
            }
        } catch (err: any) {
            console.error('Preview error:', err);
            alert(err.response?.data?.error || 'Failed to preview file');
            setPreviewModalOpen(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        if (previewUrl) {
            window.URL.revokeObjectURL(previewUrl);
        }
        setPreviewModalOpen(false);
        setPreviewFile(null);
        setPreviewUrl(null);
    };

    const canPreview = (fileType: string) => {
        return (
            fileType.startsWith('image/') ||
            fileType === 'application/pdf' ||
            fileType.startsWith('video/') ||
            fileType.startsWith('text/') ||
            fileType === 'application/json'
        );
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6 text-blue-500" />;
        if (fileType.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />;
        if (fileType.startsWith('audio/')) return <Music className="h-6 w-6 text-green-500" />;
        if (fileType.includes('pdf') || fileType.includes('document')) return <FileText className="h-6 w-6 text-red-500" />;
        if (fileType.includes('zip') || fileType.includes('rar')) return <Archive className="h-6 w-6 text-yellow-500" />;
        return <FileIcon className="h-6 w-6 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const getDaysUntilExpiry = (expiresAt?: string) => {
        if (!expiresAt) return null;
        const expiry = new Date(expiresAt);
        const now = new Date();
        const diffTime = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const toggleFileSelection = (fileId: string) => {
        setSelectedFiles(prev =>
            prev.includes(fileId)
                ? prev.filter(id => id !== fileId)
                : [...prev, fileId]
        );
    };

    const filteredFiles = sharedFiles.filter(file => {
        const matchesSearch = file.file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.sharedBy.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterType === 'all') return matchesSearch;
        if (filterType === 'images') return matchesSearch && file.file.type.startsWith('image/');
        if (filterType === 'documents') return matchesSearch && (file.file.type.includes('pdf') || file.file.type.includes('document'));
        if (filterType === 'videos') return matchesSearch && file.file.type.startsWith('video/');
        if (filterType === 'other') return matchesSearch && !file.file.type.startsWith('image/') && !file.file.type.startsWith('video/') && !file.file.type.includes('pdf');

        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition touch-manipulation"
                                aria-label="Back to dashboard"
                            >
                                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Shared with Me</h1>
                                <p className="text-xs sm:text-sm text-gray-600">{filteredFiles.length} files shared</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Loading State */}
                {loading && (
                    <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading shared files...</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800">{error}</p>
                        <button
                            onClick={fetchSharedFiles}
                            className="mt-2 text-red-600 hover:text-red-800 font-medium"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* Content - only show when not loading */}
                {!loading && (
                    <>
                        {/* Search and Filter Bar */}
                        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                                {/* Search */}
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search files or people..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Filter */}
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as any)}
                                        className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="all">All Files</option>
                                        <option value="images">Images</option>
                                        <option value="documents">Documents</option>
                                        <option value="videos">Videos</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Files List */}
                        {filteredFiles.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 text-center">
                                <Share2 className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                    {searchQuery ? 'No files found' : 'No shared files yet'}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600">
                                    {searchQuery
                                        ? 'Try adjusting your search or filter'
                                        : 'Files shared with you will appear here'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="px-6 py-3 text-left">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-gray-300"
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedFiles(filteredFiles.map(f => f.id));
                                                                } else {
                                                                    setSelectedFiles([]);
                                                                }
                                                            }}
                                                        />
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Name
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Shared By
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Size
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Shared
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Expires
                                                    </th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filteredFiles.map((file) => {
                                                    const daysUntilExpiry = getDaysUntilExpiry(file.expiresAt);
                                                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

                                                    return (
                                                        <tr key={file.id} className="hover:bg-gray-50 transition">
                                                            <td className="px-6 py-4">
                                                                <input
                                                                    type="checkbox"
                                                                    className="rounded border-gray-300"
                                                                    checked={selectedFiles.includes(file.id)}
                                                                    onChange={() => toggleFileSelection(file.id)}
                                                                />
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center space-x-3">
                                                                    {getFileIcon(file.file.type)}
                                                                    <div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="font-medium text-gray-900">{file.file.name}</span>
                                                                            {file.isPasswordProtected && (
                                                                                <span title="Password protected">
                                                                                    <Shield className="h-4 w-4 text-yellow-500" />
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                                            {file.permissions.map((perm) => (
                                                                                <span key={perm} className="bg-gray-100 px-2 py-0.5 rounded">
                                                                                    {perm}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center space-x-2">
                                                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                        <User className="h-4 w-4 text-blue-600" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {file.sharedBy.name}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">{file.sharedBy.email}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                {formatFileSize(file.file.size)}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                                <div className="flex items-center space-x-1">
                                                                    <Calendar className="h-4 w-4" />
                                                                    <span>{formatDate(file.sharedAt)}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm">
                                                                {daysUntilExpiry !== null ? (
                                                                    <div className={`flex items-center space-x-1 ${isExpiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
                                                                        <Clock className="h-4 w-4" />
                                                                        <span>
                                                                            {daysUntilExpiry > 0
                                                                                ? `${daysUntilExpiry} days`
                                                                                : 'Expired'}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-400">Never</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex items-center justify-end space-x-2">
                                                                    {file.permissions.includes('view') && (
                                                                        <button
                                                                            onClick={() => handlePreview(file)}
                                                                            disabled={file.isPasswordProtected || !canPreview(file.file.type)}
                                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            title={file.isPasswordProtected ? 'Password-protected files cannot be previewed' : !canPreview(file.file.type) ? 'Preview not available for this file type' : 'Preview'}
                                                                        >
                                                                            <Eye className="h-5 w-5" />
                                                                        </button>
                                                                    )}
                                                                    {file.permissions.includes('download') && (
                                                                        <button
                                                                            onClick={() => handleDownload(file)}
                                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition touch-manipulation"
                                                                            title="Download"
                                                                        >
                                                                            <Download className="h-5 w-5" />
                                                                        </button>
                                                                    )}
                                                                    {file.permissions.includes('share') && (
                                                                        <button
                                                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition touch-manipulation"
                                                                            title="Share"
                                                                        >
                                                                            <Share2 className="h-5 w-5" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => handleRemove(file.id)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition touch-manipulation"
                                                                        title="Remove from shared"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredFiles.map((file) => {
                                        const daysUntilExpiry = getDaysUntilExpiry(file.expiresAt);
                                        const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7;

                                        return (
                                            <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                                {/* File Header */}
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center flex-1 min-w-0 mr-2">
                                                        {getFileIcon(file.file.type)}
                                                        <div className="ml-2 flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900 truncate">{file.file.name}</span>
                                                                {file.isPasswordProtected && (
                                                                    <span title="Password protected">
                                                                        <Shield className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {file.permissions.map((perm) => (
                                                                    <span key={perm} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                                        {perm}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 flex-shrink-0 mt-1"
                                                        checked={selectedFiles.includes(file.id)}
                                                        onChange={() => toggleFileSelection(file.id)}
                                                    />
                                                </div>

                                                {/* File Details */}
                                                <div className="space-y-2 mb-3 text-sm">
                                                    {/* Shared By */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <User className="h-3 w-3 text-blue-600" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs font-medium text-gray-900 truncate">{file.sharedBy.name}</div>
                                                            <div className="text-xs text-gray-500 truncate">{file.sharedBy.email}</div>
                                                        </div>
                                                    </div>

                                                    {/* Size and Date */}
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <span className="text-gray-500">Size:</span>
                                                            <span className="ml-1 text-gray-900 font-medium">{formatFileSize(file.file.size)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 text-gray-400" />
                                                            <span className="text-gray-600">{formatDate(file.sharedAt)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Expiration */}
                                                    {daysUntilExpiry !== null && (
                                                        <div className={`flex items-center gap-1 text-xs ${isExpiringSoon ? 'text-red-600' : 'text-gray-600'}`}>
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                Expires: {daysUntilExpiry > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                                    {file.permissions.includes('view') && (
                                                        <button
                                                            onClick={() => handlePreview(file)}
                                                            disabled={file.isPasswordProtected || !canPreview(file.file.type)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                            <span className="text-sm font-medium">View</span>
                                                        </button>
                                                    )}
                                                    {file.permissions.includes('download') && (
                                                        <button
                                                            onClick={() => handleDownload(file)}
                                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition touch-manipulation"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Download</span>
                                                        </button>
                                                    )}
                                                    {file.permissions.includes('share') && (
                                                        <button className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition touch-manipulation" title="Share">
                                                            <Share2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemove(file.id)}
                                                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition touch-manipulation"
                                                        title="Remove"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Password Modal */}
                {passwordModalOpen && pendingDownloadFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-gray-900">Password Required</h2>
                                    <button
                                        onClick={() => {
                                            setPasswordModalOpen(false);
                                            setPendingDownloadFile(null);
                                            setPasswordInput('');
                                            setPasswordError('');
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">This file is password protected. Please enter the password to download.</p>
                            </div>

                            <div className="p-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Lock className="h-4 w-4 inline mr-1" />
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={passwordInput}
                                        onChange={(e) => {
                                            setPasswordInput(e.target.value);
                                            setPasswordError('');
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                        placeholder="Enter password"
                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {passwordError && (
                                    <p className="text-sm text-red-600 mt-2">{passwordError}</p>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setPasswordModalOpen(false);
                                        setPendingDownloadFile(null);
                                        setPasswordInput('');
                                        setPasswordError('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordSubmit}
                                    disabled={!passwordInput}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Modal */}
                {previewModalOpen && previewFile && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                        <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-semibold text-gray-900 truncate">{previewFile.file.name}</h2>
                                    <p className="text-sm text-gray-500">{formatFileSize(previewFile.file.size)}</p>
                                </div>
                                <button
                                    onClick={closePreview}
                                    className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="pt-20 pb-4 px-4 h-full overflow-auto">
                                {previewLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                            <p className="text-gray-600">Loading preview...</p>
                                        </div>
                                    </div>
                                ) : previewUrl ? (
                                    <div className="flex items-center justify-center h-full">
                                        {previewFile.file.type.startsWith('image/') && (
                                            <img src={previewUrl} alt={previewFile.file.name} className="max-w-full max-h-full object-contain" />
                                        )}
                                        {previewFile.file.type === 'application/pdf' && (
                                            <iframe src={previewUrl} className="w-full h-full border-0" title={previewFile.file.name} />
                                        )}
                                        {previewFile.file.type.startsWith('video/') && (
                                            <video src={previewUrl} controls className="max-w-full max-h-full">
                                                Your browser does not support the video tag.
                                            </video>
                                        )}
                                        {(previewFile.file.type.startsWith('text/') || previewFile.file.type === 'application/json') && (
                                            <iframe src={previewUrl} className="w-full h-full border-0 bg-white" title={previewFile.file.name} />
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-600">Failed to load preview</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SharedFilesPage;