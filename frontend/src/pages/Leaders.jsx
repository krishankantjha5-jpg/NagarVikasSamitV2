import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Form, Button, Carousel, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';
import { ExternalLink, Play, Eye, Upload, Filter, Calendar } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Leaders = () => {
    const { lang } = useLang();
    const T = useT(lang);
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLeaderId, setSelectedLeaderId] = useState('');
    
    // Filters and Toggles
    const [promiseFilters, setPromiseFilters] = useState({ month: '', year: '' });
    const [realityFilters, setRealityFilters] = useState({ month: '', year: '' });
    const [realityTab, setRealityTab] = useState('see'); // 'see' or 'show'
    
    // Reality Submission State
    const [realityForm, setRealityForm] = useState({ area: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [realityFiles, setRealityFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/leaders`)
            .then(res => {
                setLeaders(res.data);
                if (res.data.length > 0) {
                    const randomLeader = res.data[Math.floor(Math.random() * res.data.length)];
                    setSelectedLeaderId(randomLeader.id.toString());
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const selectedLeader = leaders.find(l => l.id === parseInt(selectedLeaderId));

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    const getYouTubeEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/embed/${match[2]}`;
        }
        return url; // Return as is if not YouTube
    };

    const handleRealitySubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const uploadedMedia = [];
            for (let file of realityFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await axios.post(`${API_BASE_URL}/upload`, formData);
                uploadedMedia.push({ url: res.data.image_url, file_type: file.type.startsWith('image') ? 'image' : 'video' });
            }

            const now = new Date();
            await axios.post(`${API_BASE_URL}/realities`, {
                leader_id: parseInt(selectedLeaderId),
                month: now.getMonth() + 1,
                year: now.getFullYear(),
                area_details: realityForm.area,
                media: uploadedMedia
            });

            setSubmitSuccess(true);
            setRealityForm({ area: '', month: now.getMonth() + 1, year: now.getFullYear() });
            setRealityFiles([]);
            setTimeout(() => setSubmitSuccess(false), 5000);
        } catch (err) {
            console.error(err);
            alert("Failed to submit reality check.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

    // Filtered Lists
    const filteredPromises = (selectedLeader?.promises || []).filter(p => {
        const mMatch = !promiseFilters.month || p.month === parseInt(promiseFilters.month);
        const yMatch = !promiseFilters.year || p.year === parseInt(promiseFilters.year);
        return mMatch && yMatch;
    });

    const filteredRealities = (selectedLeader?.realities || []).filter(r => {
        const approved = r.status === 'approved';
        const mMatch = !realityFilters.month || r.month === parseInt(realityFilters.month);
        const yMatch = !realityFilters.year || r.year === parseInt(realityFilters.year);
        return approved && mMatch && yMatch;
    });

    return (
        <Container className="py-5 bg-white shadow-sm rounded-4 mt-4" style={{ minHeight: '80vh' }}>
            <h1 className="text-center mb-5 fw-bold text-indigo">{T.ourLeaders}</h1>
            
            {/* Upper Spotlight Section */}
            <Card className="border-0 shadow-sm mb-5 overflow-hidden bg-light" style={{ borderRadius: '24px' }}>
                <Card.Body className="p-0">
                    <Row className="g-0">
                        {/* Left/Main Side: Selection and Details */}
                        <Col lg={7} className="p-4 p-md-5 d-flex flex-column justify-content-center">
                            <div className="mb-4">
                                <Form.Label className="fw-bold text-secondary mb-2 small text-uppercase ls-1">{T.selectLeaderToView}</Form.Label>
                                <Form.Select 
                                    style={{ borderRadius: '12px', padding: '14px', border: '2px solid #e2e8f0', fontSize: '1.1rem' }} 
                                    value={selectedLeaderId} 
                                    onChange={e => setSelectedLeaderId(e.target.value)}
                                    className="shadow-sm border-0 bg-white"
                                >
                                    <option value="">{T.chooseALeader}</option>
                                    {leaders.sort((a,b) => a.name.localeCompare(b.name)).map(l => (
                                        <option key={l.id} value={l.id}>{l.name} ({l.role === 'MP' ? T.mp : (l.role === 'MLA' ? T.mla : T.councillor)})</option>
                                    ))}
                                </Form.Select>
                            </div>

                            {selectedLeader && (
                                <div className="animate-fadeIn">
                                    <Badge bg={selectedLeader.role === 'MP' ? 'danger' : (selectedLeader.role === 'MLA' ? 'primary' : 'info')} className="px-3 py-2 mb-3 fs-6">
                                        {selectedLeader.role} {selectedLeader.ward ? `- Ward ${selectedLeader.ward}` : ''}
                                    </Badge>
                                    <h2 className="display-5 fw-bold text-dark mb-2">{selectedLeader.name}</h2>
                                    <p className="text-muted fs-5 mb-0"> {selectedLeader.role === 'Councillor' ? `Representing Ward No. ${selectedLeader.ward}` : `Elected Representative for the region`}</p>
                                </div>
                            )}
                        </Col>

                        {/* Right Side: Photo */}
                        <Col lg={5} className="position-relative" style={{ minHeight: '400px' }}>
                            {selectedLeader && (
                                <img 
                                    src={getMediaUrl(selectedLeader.image_url) || 'https://via.placeholder.com/600x800?text=No+Photo'} 
                                    alt={selectedLeader.name} 
                                    className="w-100 h-100 position-absolute top-0 start-0" 
                                    style={{ objectFit: 'cover' }} 
                                />
                            )}
                            <div className="position-absolute top-0 start-0 w-100 h-100 shadow-inset" style={{ background: 'linear-gradient(to right, rgba(248, 249, 250, 1) 0%, rgba(248, 249, 250, 0) 20%)' }}></div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Bottom Performance Section */}
            {selectedLeader && (
                <div className="animate-fadeIn">
                    {/* PROMISE SLOT - Full Width */}
                    <Card className="border-0 shadow-sm mb-4 overflow-hidden" style={{ borderRadius: '24px' }}>
                        <div className="p-3 fw-bold text-center bg-warning text-dark fs-5 d-flex justify-content-between align-items-center px-4">
                            <span>{T.promiseSlot}</span>
                            <div className="d-flex gap-2 align-items-center">
                                <Filter size={16} />
                                <Form.Select 
                                    size="sm" 
                                    className="border-0 bg-white" 
                                    style={{ width: '120px' }}
                                    value={promiseFilters.month}
                                    onChange={e => setPromiseFilters({...promiseFilters, month: e.target.value})}
                                >
                                    <option value="">{T.allMonths}</option>
                                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{T.months[m-1]}</option>)}
                                </Form.Select>
                                <Form.Select 
                                    size="sm" 
                                    className="border-0 bg-white" 
                                    style={{ width: '100px' }}
                                    value={promiseFilters.year}
                                    onChange={e => setPromiseFilters({...promiseFilters, year: e.target.value})}
                                >
                                    <option value="">{T.allYears}</option>
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                </Form.Select>
                            </div>
                        </div>
                        <Card.Body className="p-4 bg-white">
                            {filteredPromises.length > 0 ? (
                                <Row className="g-4">
                                    {filteredPromises.map(p => (
                                        <Col key={p.id} lg={p.video_url ? 12 : 6}>
                                            <div className="p-4 rounded-4 border-start border-4 border-warning bg-light shadow-sm">
                                                <Row className="align-items-center">
                                                    <Col md={p.video_url ? 5 : 12}>
                                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                                            <div>
                                                                <h4 className="fw-bold text-dark mb-1">₹ {p.amount}</h4>
                                                                <Badge bg="dark" className="px-3 py-2 fs-6">
                                                                    <Calendar size={14} className="me-2" />
                                                                    {T.months[p.month-1]} {p.year}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </Col>
                                                    {p.video_url && (
                                                        <Col md={7}>
                                                            <div className="ratio ratio-16x9 rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid #ddd' }}>
                                                                <iframe 
                                                                    src={getYouTubeEmbedUrl(p.video_url)} 
                                                                    title="Promise Video" 
                                                                    allowFullScreen
                                                                ></iframe>
                                                            </div>
                                                        </Col>
                                                    )}
                                                </Row>
                                            </div>
                                        </Col>
                                    ))}
                                </Row>
                            ) : (
                                <div className="py-5 text-center text-muted">
                                    <div style={{ fontSize: '3rem', opacity: 0.2 }}>📜</div>
                                    <p className="mt-2 text-uppercase ls-1">No promises match these filters.</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>

                    {/* REALITY SLOT - Full Width */}
                    <Card className="border-0 shadow-sm mb-5 overflow-hidden" style={{ borderRadius: '24px' }}>
                        <div className="p-3 fw-bold text-center bg-success text-white fs-5 d-flex justify-content-between align-items-center px-4">
                            <div className="d-flex gap-3 align-items-center">
                                <span>{T.realitySlot}</span>
                                <div className="btn-group bg-white rounded-pill p-1 shadow-sm" style={{ height: '36px' }}>
                                    <Button 
                                        variant={realityTab === 'see' ? 'success' : 'light'} 
                                        size="sm" 
                                        className="rounded-pill px-3 py-0 border-0"
                                        onClick={() => setRealityTab('see')}
                                    >
                                        <Eye size={14} className="me-2" /> {T.seeReality}
                                    </Button>
                                    <Button 
                                        variant={realityTab === 'show' ? 'success' : 'light'} 
                                        size="sm" 
                                        className="rounded-pill px-3 py-0 border-0"
                                        onClick={() => setRealityTab('show')}
                                    >
                                        <Play size={14} className="me-2" /> {T.showReality}
                                    </Button>
                                </div>
                            </div>
                            
                            {realityTab === 'see' && (
                                <div className="d-flex gap-2 align-items-center">
                                    <Filter size={16} />
                                    <Form.Select 
                                        size="sm" 
                                        className="border-0 text-dark" 
                                        style={{ width: '120px' }}
                                        value={realityFilters.month}
                                        onChange={e => setRealityFilters({...realityFilters, month: e.target.value})}
                                    >
                                        <option value="">{T.allMonths}</option>
                                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{T.months[m-1]}</option>)}
                                    </Form.Select>
                                    <Form.Select 
                                        size="sm" 
                                        className="border-0 text-dark" 
                                        style={{ width: '100px' }}
                                        value={realityFilters.year}
                                        onChange={e => setRealityFilters({...realityFilters, year: e.target.value})}
                                    >
                                        <option value="">{T.allYears}</option>
                                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </div>
                            )}
                        </div>
                        <Card.Body className="p-4 bg-white">
                            {realityTab === 'see' ? (
                                filteredRealities.length > 0 ? (
                                    <Row className="g-4">
                                        {filteredRealities.map(r => (
                                            <Col key={r.id} lg={12}>
                                                <div className="p-4 rounded-4 border-start border-4 border-success bg-light shadow-sm">
                                                    <Row className="align-items-center">
                                                        <Col md={5}>
                                                            <div className="mb-3">
                                                                <Badge bg="success" className="px-3 py-2 mb-2">{T.months[r.month-1]} {r.year}</Badge>
                                                                <h5 className="fw-bold">{T.fullArea}</h5>
                                                                <p className="text-secondary">{r.area_details}</p>
                                                            </div>
                                                        </Col>
                                                        <Col md={7}>
                                                            <Carousel indicators={true} className="rounded-3 overflow-hidden shadow-sm">
                                                                {r.media.map((m, idx) => (
                                                                    <Carousel.Item key={idx} style={{ height: '300px' }}>
                                                                        {m.file_type === 'image' ? (
                                                                            <img src={getMediaUrl(m.url)} className="d-block w-100 h-100" style={{ objectFit: 'cover' }} alt="Reality" />
                                                                        ) : (
                                                                            <video src={getMediaUrl(m.url)} className="d-block w-100 h-100" controls style={{ objectFit: 'cover' }} />
                                                                        )}
                                                                    </Carousel.Item>
                                                                ))}
                                                            </Carousel>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                ) : (
                                    <div className="py-5 text-center text-muted">
                                        <div style={{ fontSize: '3rem', opacity: 0.1 }}>✅</div>
                                        <p className="mt-2 text-uppercase fs-6 ls-1">{T.trackActualProgress}</p>
                                    </div>
                                )
                            ) : (
                                <div className="max-w-600 mx-auto p-3">
                                    <h4 className="fw-bold text-center mb-4">{T.showReality}</h4>
                                    {submitSuccess && <Alert variant="success">{T.realitySubmitted}</Alert>}
                                    <Form onSubmit={handleRealitySubmit}>
                                        <Row className="g-3">
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold">{T.leaderType}</Form.Label>
                                                    <Form.Control value={`${selectedLeader?.name} (${selectedLeader?.role === 'MP' ? T.mp : (selectedLeader?.role === 'MLA' ? T.mla : T.councillor)})`} disabled className="bg-light" />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold">{T.fullArea}</Form.Label>
                                                    <Form.Control 
                                                        as="textarea" 
                                                        rows={3} 
                                                        placeholder={T.fullArea} 
                                                        value={realityForm.area}
                                                        onChange={e => setRealityForm({...realityForm, area: e.target.value})}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12}>
                                                <Form.Group>
                                                    <Form.Label className="small fw-bold">{T.uploadImagesVideos}</Form.Label>
                                                    <Form.Control 
                                                        type="file" 
                                                        multiple 
                                                        accept="image/*,video/*"
                                                        onChange={e => setRealityFiles([...e.target.files])}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={12} className="text-center mt-4">
                                                <Button variant="success" type="submit" className="px-5 rounded-pill shadow-sm" disabled={submitting}>
                                                    {submitting ? <Spinner size="sm" className="me-2" /> : <Upload size={18} className="me-2" />}
                                                    {T.submitReality}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </Form>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            )}

            <div className="text-center text-muted small mt-5 pt-4">Nagar Vikas Samiti Performance Tracking System</div>
        </Container>
    );
};

export default Leaders;
