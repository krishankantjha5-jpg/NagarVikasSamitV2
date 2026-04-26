import React, { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const AuthModal = ({ show, onHide, onSuccess }) => {
    const { lang } = useLang();
    const T = useT(lang);
    
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [location, setLocation] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            if (isForgotPassword) {
                await axios.post(`${API_BASE_URL}/users/reset-password`, { mobile, new_password: password });
                setError('');
                setSuccess('Password updated successfully! Please login with your new password.');
                setIsForgotPassword(false);
                setIsLogin(true);
            } else {
                const endpoint = isLogin ? '/users/login' : '/users/register';
                const payload = isLogin ? { mobile, password } : { name, mobile, password, location };
                
                const res = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
                
                if (isLogin) {
                // Save token and close
                localStorage.setItem('userToken', res.data.access_token);
                localStorage.setItem('userId', res.data.user_id);
                localStorage.setItem('userName', res.data.user_name);
                onSuccess();
            } else {
                // If register successful, try to login automatically
                const loginRes = await axios.post(`${API_BASE_URL}/users/login`, { mobile, password });
                localStorage.setItem('userToken', loginRes.data.access_token);
                localStorage.setItem('userId', loginRes.data.user_id);
                localStorage.setItem('userName', loginRes.data.user_name);
                onSuccess();
            }
        }
        } catch (err) {
            setError(err.response?.data?.detail || 'An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{isForgotPassword ? 'Reset Password' : (isLogin ? T.login : T.register)}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleSubmit}>
                    {!isLogin && !isForgotPassword && (
                        <Form.Group className="mb-3">
                            <Form.Label>{T.name}</Form.Label>
                            <Form.Control 
                                type="text" 
                                required 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="Enter full name" 
                            />
                        </Form.Group>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>{T.mobile}</Form.Label>
                        <Form.Control 
                            type="text" 
                            required 
                            value={mobile} 
                            onChange={(e) => setMobile(e.target.value)} 
                            placeholder="Enter mobile number" 
                        />
                    </Form.Group>
                    {!isLogin && !isForgotPassword && (
                        <Form.Group className="mb-3">
                            <Form.Label>{T.address}</Form.Label>
                            <Form.Control 
                                type="text" 
                                required 
                                value={location} 
                                onChange={(e) => setLocation(e.target.value)} 
                                placeholder="Enter your area/location" 
                            />
                        </Form.Group>
                    )}
                    <Form.Group className="mb-4">
                        <Form.Label>{isForgotPassword ? 'New Password' : T.password}</Form.Label>
                        <Form.Control 
                            type="password" 
                            required 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder={isForgotPassword ? 'Enter new password' : 'Enter password'} 
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" className="w-100 mb-3" disabled={loading}>
                        {loading ? '...' : (isForgotPassword ? 'Reset Password' : (isLogin ? T.login : T.register))}
                    </Button>
                    <div className="text-center">
                        {isForgotPassword ? (
                            <a 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setIsForgotPassword(false); setIsLogin(true); setError(''); }}
                                className="text-decoration-none"
                            >
                                Back to Login
                            </a>
                        ) : (
                            <>
                                <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                                    className="text-decoration-none d-block mb-2"
                                >
                                    {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                                </a>
                                {isLogin && (
                                    <a 
                                        href="#" 
                                        onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); setError(''); setSuccess(''); }}
                                        className="text-decoration-none text-muted small"
                                    >
                                        Forgot Password?
                                    </a>
                                )}
                            </>
                        )}
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AuthModal;
