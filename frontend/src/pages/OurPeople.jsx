import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';
import AuthModal from '../components/AuthModal';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const OurPeople = () => {
    const { lang } = useLang();
    const T = useT(lang);
    const navigate = useNavigate();

    const [data, setData] = useState({ seeking: [], providing: [], kpi: { seeking_help: 0, wish_to_help: 0, total_help_done: 0 } });
    const [showAuth, setShowAuth] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitForm, setSubmitForm] = useState({ entry_type: 'seeking', category: 'Books', title: '', description: '' });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [interestSuccess, setInterestSuccess] = useState('');

    const fetchEntries = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/help-entries/public`);
            if (res.data && typeof res.data === 'object' && res.data.seeking) {
                setData(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchEntries();
    }, []);

    const isLoggedIn = !!localStorage.getItem('userToken');

    const handleViewClick = (entry) => {
        if (!isLoggedIn) {
            setShowAuth(true);
        } else {
            setSelectedEntry(entry);
        }
    };

    const handleAuthSuccess = () => {
        setShowAuth(false);
        navigate('/dashboard');
    };

    const [submitSuccess, setSubmitSuccess] = useState('');

    const handleSubmitHelp = async (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            setShowAuth(true);
            return;
        }
        
        setLoading(true);
        setError('');
        try {
            const userId = localStorage.getItem('userId');
            
            let uploadedMedia = [];
            if (submitForm.entry_type === 'providing' && images.length > 0) {
                for (let file of images) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData);
                    uploadedMedia.push({ url: uploadRes.data.image_url, file_type: 'image' });
                }
            }

            const payload = { ...submitForm, media: uploadedMedia };

            await axios.post(`${API_BASE_URL}/help-entries?user_id=${userId}`, payload);
            setSubmitSuccess(T.submissionSuccessMsg);
            
            // Wait 3 seconds then close
            setTimeout(() => {
                setShowSubmitModal(false);
                setSubmitSuccess('');
                setSubmitForm({ entry_type: 'seeking', category: 'Books', title: '', description: '' });
                setImages([]);
                fetchEntries();
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit.');
        } finally {
            setLoading(false);
        }
    };

    const handleInterest = async () => {
        setLoading(true);
        setError('');
        try {
            const userId = localStorage.getItem('userId');
            await axios.post(`${API_BASE_URL}/help-entries/${selectedEntry.id}/interest?user_id=${userId}`);
            setInterestSuccess(T.interestSuccessMsg);
            setTimeout(() => {
                setInterestSuccess('');
                setSelectedEntry(null);
                fetchEntries();
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to submit interest.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '80vh', padding: '2rem 0' }}>
            <Container>
                {/* KPI Counter */}
                <div className="text-center mb-5">
                    <h1 className="fw-bold px-2" style={{ color: '#1a237e', fontSize: 'clamp(1.8rem, 5vw, 2.5rem)' }}>{T.ourPeople}</h1>
                    <div className="d-inline-flex flex-wrap align-items-center justify-content-center p-2 p-md-3 rounded shadow-sm bg-white mt-3 border border-primary w-100 w-md-auto mx-auto">
                        <div className="text-center px-3 px-md-4 border-end mb-2 mb-md-0">
                            <h3 className="mb-0 text-danger fw-bold" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>{data.kpi.seeking_help}</h3>
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>{T.seekingHelp}</small>
                        </div>
                        <div className="text-center px-3 px-md-4 border-end mb-2 mb-md-0">
                            <h3 className="mb-0 text-success fw-bold" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>{data.kpi.wish_to_help}</h3>
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>{T.wishToHelp}</small>
                        </div>
                        <div className="text-center px-3 px-md-4">
                            <h2 className="mb-0 text-primary fw-bold" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)' }}>{data.kpi.total_help_done}</h2>
                            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>{T.totalHelpDone}</small>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-4 d-flex flex-wrap justify-content-center gap-2 gap-md-3">
                    <Button variant="warning" className="fw-bold px-3 px-md-4 rounded-pill shadow-sm" onClick={() => {
                        if (!isLoggedIn) setShowAuth(true);
                        else setShowSubmitModal(true);
                    }}>
                        {T.submitHelp}
                    </Button>
                    {isLoggedIn && (
                        <>
                            <Button variant="outline-primary" className="fw-bold px-3 px-md-4 rounded-pill shadow-sm bg-white" onClick={() => navigate('/dashboard')}>
                                {T.dashboard}
                            </Button>
                            <Button variant="outline-danger" className="fw-bold px-3 px-md-4 rounded-pill shadow-sm bg-white" onClick={() => {
                                localStorage.removeItem('userToken');
                                localStorage.removeItem('userId');
                                localStorage.removeItem('userName');
                                window.location.href = '/our-people';
                            }}>
                                Logout
                            </Button>
                        </>
                    )}
                </div>

                <Row className="g-4">
                    {/* Seeking Help Column */}
                    <Col xs={12} md={6}>
                        <Card className="shadow-sm border-0 h-100 overflow-hidden" style={{ borderRadius: '15px', backgroundColor: '#fff5f5' }}>
                            <Card.Header className="text-white text-center py-3" style={{ backgroundColor: '#be123c', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                <h4 className="mb-0 fw-bold">{T.seekingHelp}</h4>
                            </Card.Header>
                            <Card.Body className="p-0 position-relative" style={{ minHeight: '400px', maxHeight: '600px', height: '50vh' }}>
                                <div className="scrolling-container">
                                    <div className="scrolling-content-up">
                                        {data.seeking.map((entry, idx) => (
                                            <Card key={idx} className="mb-3 mx-3 shadow-sm border-0 border-start border-4" style={{ borderLeftColor: '#be123c' }}>
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <Card.Title className="fw-bold text-dark fs-6 mb-0">{entry.title}</Card.Title>
                                                        <Badge bg="secondary">{entry.category}</Badge>
                                                    </div>
                                                    <p className="text-muted small mb-3 text-truncate">{entry.description}</p>
                                                    <Button variant="outline-danger" size="sm" onClick={() => handleViewClick(entry)}>
                                                        {T.viewDetails}
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Wish to Help Column */}
                    <Col xs={12} md={6}>
                        <Card className="shadow-sm border-0 h-100 overflow-hidden" style={{ borderRadius: '15px', backgroundColor: '#f0fdf4' }}>
                            <Card.Header className="text-white text-center py-3" style={{ backgroundColor: '#059669', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                <h4 className="mb-0 fw-bold">{T.wishToHelp}</h4>
                            </Card.Header>
                            <Card.Body className="p-0 position-relative" style={{ minHeight: '400px', maxHeight: '600px', height: '50vh' }}>
                                <div className="scrolling-container">
                                    <div className="scrolling-content-up">
                                        {data.providing.map((entry, idx) => (
                                            <Card key={idx} className="mb-3 mx-3 shadow-sm border-0 border-start border-4" style={{ borderLeftColor: '#059669' }}>
                                                <Card.Body>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <Card.Title className="fw-bold text-dark fs-6 mb-0">{entry.title}</Card.Title>
                                                        <Badge bg="secondary">{entry.category}</Badge>
                                                    </div>
                                                    <p className="text-muted small mb-3 text-truncate">{entry.description}</p>
                                                    <Button variant="outline-success" size="sm" onClick={() => handleViewClick(entry)}>
                                                        {T.viewDetails}
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <AuthModal show={showAuth} onHide={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />

            {/* View Details Modal */}
            <Modal show={!!selectedEntry} onHide={() => setSelectedEntry(null)} centered>
                <Modal.Header closeButton className={selectedEntry?.entry_type === 'seeking' ? 'bg-danger text-white' : 'bg-success text-white'}>
                    <Modal.Title>{selectedEntry?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {interestSuccess ? (
                        <Alert variant="success" className="text-center py-4">
                            <p className="mb-0 fw-bold">{interestSuccess}</p>
                        </Alert>
                    ) : (
                        <>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <div className="d-flex justify-content-between mb-3">
                                <Badge bg={selectedEntry?.entry_type === 'seeking' ? 'danger' : 'success'}>
                                    {selectedEntry?.entry_type === 'seeking' ? T.seekingHelp : T.wishToHelp}
                                </Badge>
                                <Badge bg="secondary">{selectedEntry?.category}</Badge>
                            </div>
                            <p><strong>{T.name}:</strong> {selectedEntry?.user?.name}</p>
                            <p><strong>{T.description}:</strong></p>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{selectedEntry?.description}</p>
                            {selectedEntry?.media && selectedEntry.media.length > 0 && (
                                <div className="d-flex gap-2 flex-wrap mb-3">
                                    {selectedEntry.media.map(m => (
                                        <img key={m.id} src={`${API_BASE_URL}${m.url}`} alt="Help" style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px'}} />
                                    ))}
                                </div>
                            )}
                            <p className="text-muted small mt-4">Posted on: {new Date(selectedEntry?.created_at).toLocaleDateString()}</p>
                            
                            {selectedEntry && String(selectedEntry.user_id) !== String(localStorage.getItem('userId')) && (
                                <Button 
                                    variant={selectedEntry.entry_type === 'seeking' ? 'danger' : 'success'} 
                                    className="w-100 fw-bold mt-3"
                                    onClick={handleInterest}
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : (selectedEntry.entry_type === 'seeking' ? T.commitToHelp : T.iNeedIt)}
                                </Button>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* Submit Help Modal */}
            <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{T.submitHelp}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {submitSuccess ? (
                        <Alert variant="success" className="text-center py-4">
                            <p className="mb-0 fw-bold">{submitSuccess}</p>
                        </Alert>
                    ) : (
                        <Form onSubmit={handleSubmitHelp}>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form.Group className="mb-3">
                                <Form.Label>Type</Form.Label>
                                <Form.Select 
                                    value={submitForm.entry_type} 
                                    onChange={(e) => setSubmitForm({...submitForm, entry_type: e.target.value})}
                                >
                                    <option value="seeking">{T.seekingHelp}</option>
                                    <option value="providing">{T.wishToHelp}</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{T.category}</Form.Label>
                                <Form.Select 
                                    value={submitForm.category} 
                                    onChange={(e) => setSubmitForm({...submitForm, category: e.target.value})}
                                >
                                    <option value="Books">{T.books}</option>
                                    <option value="Clothes">{T.clothes}</option>
                                    <option value="Medical Equipments">{T.medicalEq}</option>
                                    <option value="Others">{T.others}</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{T.title}</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    required 
                                    value={submitForm.title} 
                                    onChange={(e) => setSubmitForm({...submitForm, title: e.target.value})} 
                                />
                            </Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label>{T.description}</Form.Label>
                                <Form.Control 
                                    as="textarea" 
                                    rows={4} 
                                    required 
                                    value={submitForm.description} 
                                    onChange={(e) => setSubmitForm({...submitForm, description: e.target.value})} 
                                />
                            </Form.Group>
                            {submitForm.entry_type === 'providing' && (
                                <Form.Group className="mb-4">
                                    <Form.Label>Upload Images (Optional)</Form.Label>
                                    <Form.Control 
                                        type="file" 
                                        multiple 
                                        accept="image/*"
                                        onChange={(e) => setImages(Array.from(e.target.files))}
                                    />
                                </Form.Group>
                            )}
                            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit'}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>

        </div>
    );
};

export default OurPeople;
