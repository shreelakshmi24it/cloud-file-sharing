import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cloud, Upload, LogOut, Settings, HardDrive, File, Download, Trash2, Share2, X, Copy, Check, Lock, Calendar, User } from 'lucide-react';
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

interface ShareLink {
  id: string;
  share_token: string;
  share_url: string;
  expires_at?: string;
  max_downloads?: number;
  download_count: number;
  created_at: string;
}

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [sharePassword, setSharePassword] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiration, setShareExpiration] = useState('7');
  const [shareMaxDownloads, setShareMaxDownloads] = useState('');
  const [creatingShare, setCreatingShare] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      fetchFiles();
    }
  }, [isAuthenticated, navigate]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/files`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.data.downloadUrl) {
        // Direct S3 download (handled by browser, no Auth headers sent to S3)
        const link = document.createElement('a');
        link.href = response.data.downloadUrl;
        link.setAttribute('download', fileName); // Hint to browser
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Fallback for local files (if any) or legacy response
        console.error('Unexpected download response format');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Refresh file list
      fetchFiles();
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

    // Fetch existing shares for this file
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

      // Add new share to list
      setShareLinks(prev => [response.data.share, ...prev]);

      // Reset form
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

  const storagePercentage = user
    ? (user.storage_used / user.storage_limit) * 100
    : 0;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
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
        {/* Storage Info Card */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Storage Usage</h2>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between sm:justify-end text-sm">
                <span className="text-gray-600 sm:mr-2">Used</span>
                <span className="font-medium">{formatBytes(user.storage_used)} / {formatBytes(user.storage_limit)}</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${storagePercentage > 90 ? 'bg-red-500' :
                storagePercentage > 70 ? 'bg-yellow-500' :
                  'bg-blue-600'
                }`}
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {storagePercentage.toFixed(1)}% used
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => navigate('/upload')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left"
          >
            <Upload className="h-12 w-12 text-blue-600 mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Files</h3>
            <p className="text-sm text-gray-600">Securely upload and encrypt your files</p>
          </button>

          <button
            onClick={() => navigate('/files')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left"
          >
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <File className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Files</h3>
            <p className="text-sm text-gray-600">Browse and manage all your files</p>
          </button>

          <button
            onClick={() => navigate('/shared')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left"
          >
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Shared Files</h3>
            <p className="text-sm text-gray-600">View files shared with you</p>
          </button>
        </div>

        {/* Recently Uploaded Files */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recently Uploaded Files</h2>
            <button
              onClick={() => navigate('/files')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View All Files
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <Cloud className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
              <p className="text-lg">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Cloud className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg">No files yet</p>
              <p className="text-sm">Upload your first file to get started</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.slice(0, 5).map((file) => (
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
                            className="text-blue-600 hover:text-blue-900 mr-3 touch-manipulation"
                            title="Download"
                          >
                            <Download className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => handleShare(file)}
                            className="text-green-600 hover:text-green-900 mr-3 touch-manipulation"
                            title="Share"
                          >
                            <Share2 className="h-5 w-5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="text-red-600 hover:text-red-900 touch-manipulation"
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

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {files.slice(0, 5).map((file) => (
                  <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center flex-1 min-w-0 mr-2">
                        <File className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate">{file.original_name}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <span className="ml-1 text-gray-900">{formatBytes(file.size)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1 text-gray-900 truncate block">{file.mime_type}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Uploaded:</span>
                        <span className="ml-1 text-gray-900">{formatDate(file.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleDownload(file.id, file.original_name)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition touch-manipulation"
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-sm font-medium">Download</span>
                      </button>
                      <button
                        onClick={() => handleShare(file)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition touch-manipulation"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition touch-manipulation"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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
        </div >
      )}
    </div >
  );
};

export default DashboardPage;