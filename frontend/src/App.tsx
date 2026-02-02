import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FileUploadPage from './pages/FileUploadPage';
import FilesPage from './pages/FilesPage';
import SharedFilesPage from './pages/SharedFilesPage';
import SettingsPage from './pages/SettingsPage';
import PublicLinkAccessPage from './pages/PublicLinkAccessPage';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<FileUploadPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/shared" element={<SharedFilesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/share/:token" element={<PublicLinkAccessPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;