import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, LogOut, Settings, File, Download, Trash2, Share2, X, Copy, Check, Lock, Calendar, Search, ArrowUpDown, Folder, FolderPlus, Home, ChevronRight, FolderInput, User } from 'lucide-react';
import axios from 'axios';

import { API_URL } from '../config';

interface FileItem {
    id: string;
    name: string;
    original_name: string;
    size: number;
    mime_type: string;
    created_at: string;
    updated_at: string;
}

interface FolderItem {
    id: string;
    name: string;
    parent_folder_id?: string;
    created_at: string;
    updated_at: string;
}

interface FolderPathItem {
    id: string;
    name: string;
}

interface ShareLink {
    id: string;
    share_token: string;
    share_url: string;
    expires_at?: string;
    max_downloads?: number;
    download_count: number;
    created_at: string;
}

type SortField = 'name' | 'size' | 'type' | 'date';
type SortOrder = 'asc' | 'desc';

const FilesPage = () => {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuth();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<FolderPathItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
    const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
    const [sharePassword, setSharePassword] = useState('');
    const [shareEmail, setShareEmail] = useState('');
    const [shareExpiration, setShareExpiration] = useState('7');
    const [shareMaxDownloads, setShareMaxDownloads] = useState('');
    const [creatingShare, setCreatingShare] = useState(false);
    const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [moveFileModalOpen, setMoveFileModalOpen] = useState(false);
    const [fileToMove, setFileToMove] = useState<FileItem | null>(null);
    const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
    // Unused state removed
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            fetchFolderContents();
        }
    }, [isAuthenticated, navigate, currentFolderId]);

    useEffect(() => {
        // Filter and sort files
        let result = [...files];

        // Apply search filter
        if (searchQuery) {
            result = result.filter(file =>
                file.original_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'name':
                    comparison = a.original_name.localeCompare(b.original_name);
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'type':
                    comparison = a.mime_type.localeCompare(b.mime_type);
                    break;
                case 'date':
                    comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        setFilteredFiles(result);
    }, [files, searchQuery, sortField, sortOrder]);

    const fetchFolderContents = async () => {
        try {
            const token = localStorage.getItem('token');
            const folderId = currentFolderId || 'root';
            const response = await axios.get(`${API_URL}/folders/${folderId}/contents`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFiles(response.data.files);
            setFolders(response.data.folders);

            // Fetch folder path for breadcrumbs
            if (currentFolderId) {
                const pathResponse = await axios.get(`${API_URL}/folders/${currentFolderId}/path`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setFolderPath(pathResponse.data.path);
            } else {
                setFolderPath([]);
            }
        } catch (error) {
            console.error('Failed to fetch folder contents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderClick = (folderId: string) => {
        setCurrentFolderId(folderId);
        setLoading(true);
    };

    const handleBreadcrumbClick = (folderId: string | null) => {
        setCurrentFolderId(folderId);
        setLoading(true);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        setCreatingFolder(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/folders`, {
                name: newFolderName.trim(),
                parent_folder_id: currentFolderId,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCreateFolderModalOpen(false);
            setNewFolderName('');
            fetchFolderContents();
        } catch (error) {
            console.error('Failed to create folder:', error);
            alert('Failed to create folder');
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        if (!confirm('Are you sure you want to delete this folder and all its contents?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/folders/${folderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchFolderContents();
        } catch (error) {
            console.error('Delete folder failed:', error);
        }
    };

    const handleMoveFile = async () => {
        if (!fileToMove || !selectedFolder) return;

        try {
            const token = localStorage.getItem('token');
            await axios.patch(`${API_URL}/files/${fileToMove.id}/move`, {
                folder_id: selectedFolder.id,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setMoveFileModalOpen(false);
            setFileToMove(null);
            setSelectedFolder(null);
            fetchFolderContents();
        } catch (error) {
            console.error('Move file failed:', error);
            alert('Failed to move file');
        }
    };

    const openMoveFileModal = (file: FileItem) => {
        setFileToMove(file);
        setMoveFileModalOpen(true);
    };

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.data.downloadUrl) {
                const link = document.createElement('a');
                link.href = response.data.downloadUrl;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed');
        }
    };

    const handleDelete = async (fileId: string) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/files/${fileId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchFolderContents();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleShare = async (file: FileItem) => {
        setSelectedFile(file);
        setShareModalOpen(true);
        setSharePassword('');
        setShareEmail('');
        setShareExpiration('7');
        setShareMaxDownloads('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/files/${file.id}/shares`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setShareLinks(response.data.shares || []);
        } catch (error) {
            console.error('Failed to fetch shares:', error);
            setShareLinks([]);
        }
    };

    const handleCreateShare = async () => {
        if (!selectedFile) return;

        setCreatingShare(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/share`, {
                fileId: selectedFile.id,
                password: sharePassword || undefined,
                sharedWithEmail: shareEmail || undefined,
                expiresIn: parseInt(shareExpiration),
                maxDownloads: shareMaxDownloads ? parseInt(shareMaxDownloads) : undefined,
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setShareLinks(prev => [response.data.share, ...prev]);
            setSharePassword('');
            setShareEmail('');
            setShareMaxDownloads('');
        } catch (error) {
            console.error('Failed to create share:', error);
            alert('Failed to create share link');
        } finally {
            setCreatingShare(false);
        }
    };

    const copyToClipboard = (shareUrl: string, token: string) => {
        navigator.clipboard.writeText(shareUrl);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <Cloud className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                            <span className="text-xl sm:text-2xl font-bold text-gray-900">SecureCloud</span>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <div className="hidden md:block text-right mr-4">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg touch-manipulation"
                                aria-label="Settings"
                            >
                                <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg touch-manipulation"
                                aria-label="Logout"
                            >
                                <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {/* Breadcrumb Navigation */}
                <div className="mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                        <button
                            onClick={() => handleBreadcrumbClick(null)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                            <Home className="h-4 w-4" />
                            <span>Home</span>
                        </button>
                        {folderPath.map((folder, index) => (
                            <div key={folder.id} className="flex items-center space-x-2">
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <button
                                    onClick={() => handleBreadcrumbClick(folder.id)}
                                    className={`font-medium ${index === folderPath.length - 1
                                        ? 'text-gray-900'
                                        : 'text-blue-600 hover:text-blue-800'
                                        }`}
                                >
                                    {folder.name}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Page Header */}
                <div className="mb-4 sm:mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                            {currentFolderId ? folderPath[folderPath.length - 1]?.name || 'Folder' : 'All Files'}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600">
                            {currentFolderId ? 'Browse folder contents' : 'Browse and manage all your uploaded files'}
                        </p>
                    </div>
                    <button
                        onClick={() => setCreateFolderModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold touch-manipulation"
                    >
                        <FolderPlus className="h-5 w-5" />
                        <span className="hidden sm:inline">New Folder</span>
                    </button>
                </div>

                {/* Search and Sort Controls */}
                <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search files by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Sort Controls */}
                        <div className="flex gap-2">
                            <select
                                value={sortField}
                                onChange={(e) => setSortField(e.target.value as SortField)}
                                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="date">Sort by Date</option>
                                <option value="name">Sort by Name</option>
                                <option value="size">Sort by Size</option>
                                <option value="type">Sort by Type</option>
                            </select>

                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 touch-manipulation"
                                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                aria-label="Toggle sort order"
                            >
                                <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden sm:inline">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Results count */}
                    <div className="mt-3 text-xs sm:text-sm text-gray-600">
                        Showing {filteredFiles.length} of {files.length} files
                    </div>
                </div>
            </div>

            {/* Files Table */}
            <div className="bg-white rounded-lg shadow-md p-6">
                {loading ? (
                    <div className="text-center py-12 text-gray-500">
                        <Cloud className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
                        <p className="text-lg">Loading files...</p>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg">
                            {searchQuery ? 'No files found matching your search' : 'No files yet'}
                        </p>
                        {!searchQuery && (
                            <p className="text-sm">Upload your first file to get started</p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('name')}
                                    >
                                        Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('size')}
                                    >
                                        Size {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('type')}
                                    >
                                        Type {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => toggleSort('date')}
                                    >
                                        Uploaded {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {/* Folders */}
                                {folders.map((folder) => (
                                    <tr key={folder.id} className="hover:bg-gray-50 cursor-pointer">
                                        <td
                                            className="px-6 py-4 whitespace-nowrap"
                                            onDoubleClick={() => handleFolderClick(folder.id)}
                                        >
                                            <div className="flex items-center">
                                                <Folder className="h-5 w-5 text-blue-500 mr-3" />
                                                <span className="text-sm font-medium text-gray-900">{folder.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            --
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            Folder
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(folder.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteFolder(folder.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-5 w-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {/* Files */}
                                {filteredFiles.map((file) => (
                                    <tr key={file.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <File className="h-5 w-5 text-gray-400 mr-3" />
                                                <span className="text-sm font-medium text-gray-900">{file.original_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatBytes(file.size)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {file.mime_type}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(file.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDownload(file.id, file.original_name)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                title="Download"
                                            >
                                                <Download className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleShare(file)}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                                title="Share"
                                            >
                                                <Share2 className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => openMoveFileModal(file)}
                                                className="text-purple-600 hover:text-purple-900 mr-3"
                                                title="Move to folder"
                                            >
                                                <FolderInput className="h-5 w-5 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(file.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-5 w-5 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {shareModalOpen && selectedFile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
                    <div className="bg-white rounded-none sm:rounded-lg shadow-xl w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[90vh] overflow-y-auto">
                        <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Share File</h2>
                                <button
                                    onClick={() => setShareModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-2 touch-manipulation"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 truncate">{selectedFile.original_name}</p>
                        </div>

                        <div className="p-4 sm:p-6">
                            {/* Create New Share */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Share Link</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Lock className="h-4 w-4 inline mr-1" />
                                            Password (Optional)
                                        </label>
                                        <input
                                            type="password"
                                            value={sharePassword}
                                            onChange={(e) => setSharePassword(e.target.value)}
                                            placeholder="Leave empty for no password"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <User className="h-4 w-4 inline mr-1" />
                                            Share with Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            value={shareEmail}
                                            onChange={(e) => setShareEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Leave empty to create a public link, or enter an email to share directly with a specific user
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="h-4 w-4 inline mr-1" />
                                                Expires In (Days)
                                            </label>
                                            <select
                                                value={shareExpiration}
                                                onChange={(e) => setShareExpiration(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="1">1 Day</option>
                                                <option value="7">7 Days</option>
                                                <option value="14">14 Days</option>
                                                <option value="30">30 Days</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Max Downloads (Optional)
                                            </label>
                                            <input
                                                type="number"
                                                value={shareMaxDownloads}
                                                onChange={(e) => setShareMaxDownloads(e.target.value)}
                                                placeholder="Unlimited"
                                                min="1"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCreateShare}
                                        disabled={creatingShare}
                                        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {creatingShare ? 'Creating...' : 'Create Share Link'}
                                    </button>
                                </div>
                            </div>

                            {/* Existing Shares */}
                            {shareLinks.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Share Links</h3>
                                    <div className="space-y-3">
                                        {shareLinks.map((share) => (
                                            <div key={share.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-start gap-2 mb-2">
                                                    <code className="flex-1 text-sm bg-gray-100 px-2 py-1 rounded break-all">
                                                        {share.share_url}
                                                    </code>
                                                    <button
                                                        onClick={() => copyToClipboard(share.share_url, share.share_token)}
                                                        className="flex-shrink-0 text-blue-600 hover:text-blue-800 p-1"
                                                        title="Copy to clipboard"
                                                    >
                                                        {copiedToken === share.share_token ? (
                                                            <Check className="h-5 w-5 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-5 w-5" />
                                                        )}
                                                    </button>
                                                </div>
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    {share.expires_at && (
                                                        <span>Expires: {new Date(share.expires_at).toLocaleDateString()}</span>
                                                    )}
                                                    {share.max_downloads && (
                                                        <span>Downloads: {share.download_count}/{share.max_downloads}</span>
                                                    )}
                                                    {!share.max_downloads && (
                                                        <span>Downloads: {share.download_count}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Folder Modal */}
            {createFolderModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Create New Folder</h2>
                                <button
                                    onClick={() => setCreateFolderModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Folder Name
                            </label>
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Enter folder name"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                                autoFocus
                            />
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setCreateFolderModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                disabled={creatingFolder || !newFolderName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {creatingFolder ? 'Creating...' : 'Create Folder'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move File Modal */}
            {moveFileModalOpen && fileToMove && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Move File</h2>
                                <button
                                    onClick={() => setMoveFileModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">Moving: {fileToMove.original_name}</p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Destination Folder
                            </label>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                <button
                                    onClick={() => setSelectedFolder(null as any)}
                                    className={`w-full text-left px-4 py-2 rounded-lg border ${selectedFolder === null
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <Home className="h-5 w-5 mr-2 text-gray-600" />
                                        <span>Root (Home)</span>
                                    </div>
                                </button>
                                {folders.map((folder) => (
                                    <button
                                        key={folder.id}
                                        onClick={() => setSelectedFolder(folder)}
                                        className={`w-full text-left px-4 py-2 rounded-lg border ${selectedFolder?.id === folder.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <Folder className="h-5 w-5 mr-2 text-blue-500" />
                                            <span>{folder.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <button
                                onClick={() => setMoveFileModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMoveFile}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Move File
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilesPage;
