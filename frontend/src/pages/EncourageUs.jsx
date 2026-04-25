import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const EncourageUs = () => {
    const { lang } = useLang();
    const T = useT(lang);
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchGoal = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/donation-goal/current`);
                setGoal(res.data);
            } catch (err) {
                console.error("Failed to fetch donation goal", err);
                setError(T.failedToLoadGoal);
            } finally {
                setLoading(false);
            }
        };
        fetchGoal();
    }, [T.failedToLoadGoal]);

    if (loading) return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;

    const target = goal?.target_amount || 0;
    const collected = goal?.collected_amount || 0;
    const percentage = target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;

    return (
        <div style={{ backgroundColor: '#f8fafc', minHeight: '80vh', padding: '4rem 0' }}>
            <Container>
                <div className="text-center mb-5">
                    <div className="text-uppercase tracking-widest fw-bold mb-2" style={{ color: '#d97706', fontSize: '0.9rem', letterSpacing: '2px' }}>
                        {T.helpSamitiMsg}
                    </div>
                    <h1 className="fw-bold" style={{ color: '#1e3a8a', fontSize: '2.5rem' }}>{T.encourageUs}</h1>
                    <p className="text-muted fs-5 mt-3 mx-auto" style={{ maxWidth: '700px' }}>
                        {T.encourageUsTagline}
                    </p>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                <Card className="shadow-sm border-0 mx-auto" style={{ borderRadius: '15px', overflow: 'hidden', maxWidth: '800px' }}>
                    <Card.Body className="p-5">
                        <div className="text-center mb-4">
                            <h3 className="fw-bold mb-1" style={{ color: '#d97706' }}>{T.monthlyTargetGoal}</h3>
                            <h4 className="text-muted">{T.months[new Date().getMonth()]} {new Date().getFullYear()}</h4>
                        </div>

                        <div className="d-flex justify-content-between mb-2 mt-5 px-2">
                            <span className="fw-bold fs-5" style={{ color: '#059669' }}>{T.received}: ₹{collected.toLocaleString()}</span>
                            <span className="fw-bold fs-5 text-secondary">{T.target}: ₹{target.toLocaleString()}</span>
                        </div>
                        
                        <div style={{ height: '30px', backgroundColor: '#e2e8f0', borderRadius: '15px', overflow: 'hidden' }}>
                            <div 
                                style={{ 
                                    height: '100%', 
                                    width: `${percentage}%`, 
                                    backgroundColor: '#d97706',
                                    transition: 'width 1s ease-in-out',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {percentage > 5 ? `${percentage}%` : ''}
                            </div>
                        </div>
                        
                        <div className="text-center mt-5">
                            <p className="text-muted mb-4">{T.upiContributionNote}</p>
                            <div className="d-inline-flex align-items-center gap-3 p-3 border rounded shadow-sm" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                <span className="fw-bold fs-5" style={{ color: '#1e3a8a' }}>UPI ID: 9716601464@PTBSI</span>
                                <button className="btn btn-sm text-white fw-bold px-3" style={{ backgroundColor: '#d97706', borderRadius: '20px' }} onClick={() => {
                                    navigator.clipboard.writeText("9716601464@PTBSI");
                                    alert(T.upiCopied);
                                }}>
                                    {T.copy}
                                </button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default EncourageUs;
