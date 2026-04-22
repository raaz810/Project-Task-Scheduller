import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState(null);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!isLogin && !/^\d{8}$/.test(formData.password)) {
            setError('Password must be exactly 8 digits long');
            return;
        }

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
            const payload = isLogin ? { email: formData.email, password: formData.password } : formData;
            const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
            
            login(res.data.user, res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        }
    };

    return (
        <div className="auth-view">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p>{isLogin ? 'Log in to continue your journey.' : 'Sign up to get started with zero friction.'}</p>
                </div>
                
                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    {!isLogin && (
                        <div className="input-group">
                            <User className="input-icon" size={18} />
                            <input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    )}
                    <div className="input-group">
                        <Mail className="input-icon" size={18} />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <Lock className="input-icon" size={18} />
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="primary-btn">
                        {isLogin ? 'Log In' : 'Sign Up'}
                        <ArrowRight size={18} />
                    </button>
                </form>
                
                <div className="auth-footer">
                    <p>
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <span onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
                            {isLogin ? ' Sign Up' : ' Log In'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
