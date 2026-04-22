import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import AuthParams from './pages/Auth';
import Dashboard from './pages/Dashboard';
import './index.css';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!user) return <Navigate to="/auth" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="app-container">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" />} />
                        <Route path="/auth" element={<AuthParams />} />
                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
