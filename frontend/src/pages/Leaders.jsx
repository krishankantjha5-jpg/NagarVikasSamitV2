import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner, Form, Button, Carousel, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

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
    const [realityForm, setRealityForm] = useState({ area: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), video_url: '' });
    const [realityFiles, setRealityFiles] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [availableDates, setAvailableDates] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/leaders`)
            .then(res => {
                if (Array.isArray(res.data)) {
                    setLeaders(res.data);
                    if (res.data.length > 0) {
                        const randomLeader = res.data[Math.floor(Math.random() * res.data.length)];
                        setSelectedLeaderId(randomLeader.id.toString());
                    }
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedLeaderId) {
            axios.get(`${API_BASE_URL}/leaders/${selectedLeaderId}/available-dates`)
                .then(res => {
                    if (Array.isArray(res.data)) {
                        setAvailableDates(res.data);
                        if (res.data.length > 0) {
                            setPromiseFilters({ month: res.data[0].month, year: res.data[0].year });
                            setRealityFilters({ month: res.data[0].month, year: res.data[0].year });
                        } else {
                            setPromiseFilters({ month: '', year: '' });
                            setRealityFilters({ month: '', year: '' });
                        }
                    }
                })
                .catch(err => console.error(err));
        }
    }, [selectedLeaderId]);

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
        return url;
    };

    const handleRealitySubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const uploadedMedia = [];
            if (realityForm.video_url) {
                uploadedMedia.push({ url: realityForm.video_url, file_type: 'video' });
            }
            for (let file of realityFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await axios.post(`${API_BASE_URL}/upload`, formData);
                uploadedMedia.push({ url: res.data.image_url, file_type: 'image' });
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
            setRealityForm({ area: '', month: now.getMonth() + 1, year: now.getFullYear(), video_url: '' });
            setRealityFiles([]);
            setTimeout(() => setSubmitSuccess(false), 5000);
        } catch (err) {
            console.error(err);
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
        <Container fluid className="p-0 animate-fadeIn" style={{ minHeight: '80vh', backgroundColor: '#f8f9fa' }}>
            <div className="bg-white border-bottom py-3 mb-4">
                <h1 className="text-center mb-0 fw-bold text-primary">{T.ourLeaders}</h1>
            </div>

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
                                    {leaders.sort((a, b) => a.name.localeCompare(b.name)).map(l => (
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
                <div className="animate-fadeIn px-0">
                    <Row className="g-0 border-top">
                        {/* Sidebar for Month-Year - 10% */}
                        <Col style={{ flex: '0 0 10%', maxWidth: '10%' }} className="bg-white border-end p-3">
                            <h5 className="fw-bold mb-3 text-secondary text-uppercase small ls-1">Select Date</h5>
                            <div className="list-group list-group-flush mb-4 custom-scrollbar" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {availableDates.map((d, i) => (
                                    <button
                                        key={i}
                                        className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 fw-bold text-nowrap ${promiseFilters.month === d.month && promiseFilters.year === d.year ? 'bg-warning text-dark shadow-sm' : ''}`}
                                        style={{ fontSize: '0.75rem' }}
                                        onClick={() => {
                                            setPromiseFilters({ month: d.month, year: d.year });
                                            setRealityFilters({ month: d.month, year: d.year });
                                        }}
                                    >
                                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.month - 1]} {d.year}
                                    </button>
                                ))}
                                {availableDates.length === 0 && <p className="text-muted small">No records available</p>}
                            </div>
                        </Col>

                        {/* Content Area - 90% */}
                        <Col style={{ flex: '0 0 90%', maxWidth: '90%' }} className="bg-white">
                            {/* PERFORMANCE TRACKING HEADER */}
                            <div className="p-4 border-bottom bg-white d-flex justify-content-between align-items-center">
                                <h2 className="mb-0 fw-bold text-dark">{T.performanceTracking}</h2>
                                <Badge bg="warning" text="dark" className="px-3 py-2 fs-6 rounded-pill">
                                    {promiseFilters.month && promiseFilters.year ?
                                        `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][promiseFilters.month - 1]} ${promiseFilters.year}` :
                                        'Select Date'
                                    }
                                </Badge>
                            </div>

                            {/* PROMISE SECTION */}
                            <div className="p-4 border-bottom">
                                <h4 className="fw-bold mb-4 text-warning">{T.promiseSlot}</h4>
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
                                                                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][p.month - 1]} {p.year}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </Col>
                                                        {p.video_url && (
                                                            <Col md={7}>
                                                                <div className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid #ddd', height: '300px' }}>
                                                                    <iframe
                                                                        src={getYouTubeEmbedUrl(p.video_url)}
                                                                        title="Promise Video"
                                                                        className="w-100 h-100"
                                                                        style={{ border: 'none' }}
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
                                        <p className="mt-2 text-uppercase ls-1">No promises recorded for this date.</p>
                                    </div>
                                )}
                            </div>

                            {/* REALITY SECTION */}
                            <div className="p-4">
                                <div className="rounded-4 overflow-hidden border shadow-sm">
                                    <div className="p-3 fw-bold text-center bg-success text-white fs-5 d-flex justify-content-between align-items-center px-4">
                                        <div className="d-flex gap-3 align-items-center">
                                            <span className="text-uppercase ls-1 small">{T.realitySlot}</span>
                                            <div className="btn-group bg-white rounded-pill p-1 shadow-sm" style={{ height: '36px' }}>
                                                <Button
                                                    variant={realityTab === 'see' ? 'success' : 'light'}
                                                    size="sm"
                                                    className="rounded-pill px-3 py-0 border-0"
                                                    onClick={() => setRealityTab('see')}
                                                >
                                                    {T.seeReality}
                                                </Button>
                                                <Button
                                                    variant={realityTab === 'show' ? 'success' : 'light'}
                                                    size="sm"
                                                    className="rounded-pill px-3 py-0 border-0"
                                                    onClick={() => setRealityTab('show')}
                                                >
                                                    {T.showReality}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white">
                                        {realityTab === 'see' ? (
                                            filteredRealities.length > 0 ? (
                                                <Row className="g-4">
                                                    {filteredRealities.map(r => (
                                                        <Col key={r.id} md={12}>
                                                            <div className="bg-light p-4 rounded-4 border shadow-sm">
                                                                <h5 className="fw-bold text-dark mb-3">{r.area_details}</h5>
                                                                <Row className="g-4">
                                                                    {/* Photos Section */}
                                                                    {r.media.filter(m => m.file_type === 'image').length > 0 && (
                                                                        <Col lg={r.media.filter(m => m.file_type === 'video').length > 0 ? 6 : 12}>
                                                                            <h6 className="fw-bold text-secondary mb-2 small text-uppercase">Photos</h6>
                                                                            <Carousel indicators={true} className="rounded-3 overflow-hidden shadow-sm">
                                                                                {r.media.filter(m => m.file_type === 'image').map((m, idx) => (
                                                                                    <Carousel.Item key={idx} style={{ height: '300px' }}>
                                                                                        <img src={getMediaUrl(m.url)} className="d-block w-100 h-100" style={{ objectFit: 'cover' }} alt="Reality" />
                                                                                    </Carousel.Item>
                                                                                ))}
                                                                            </Carousel>
                                                                        </Col>
                                                                    )}
                                                                    {/* Videos Section */}
                                                                    {r.media.filter(m => m.file_type === 'video').length > 0 && (
                                                                        <Col lg={r.media.filter(m => m.file_type === 'image').length > 0 ? 6 : 12}>
                                                                            <h6 className="fw-bold text-secondary mb-2 small text-uppercase">Videos</h6>
                                                                            <div className="d-flex flex-column gap-3">
                                                                                {r.media.filter(m => m.file_type === 'video').map((m, idx) => (
                                                                                    <div key={idx} className="rounded-3 overflow-hidden shadow-sm" style={{ border: '1px solid #ddd', height: '300px' }}>
                                                                                        <iframe
                                                                                            src={getYouTubeEmbedUrl(m.url)}
                                                                                            title="Reality Video"
                                                                                            className="w-100 h-100"
                                                                                            style={{ border: 'none' }}
                                                                                            allowFullScreen
                                                                                        ></iframe>
                                                                                    </div>
                                                                                ))}
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
                                                                    onChange={e => setRealityForm({ ...realityForm, area: e.target.value })}
                                                                    required
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={12}>
                                                            <Form.Group className="mb-4">
                                                                <Form.Label className="small fw-bold">Video URL (YouTube link)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                                    value={realityForm.video_url}
                                                                    onChange={e => setRealityForm({ ...realityForm, video_url: e.target.value })}
                                                                    style={{ borderRadius: '12px', border: '2px solid #ddd' }}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={12}>
                                                            <Form.Group>
                                                                <Form.Label className="small fw-bold">Upload Photos</Form.Label>
                                                                <Form.Control
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    onChange={e => setRealityFiles([...e.target.files])}
                                                                    style={{ borderRadius: '12px', border: '2px solid #ddd' }}
                                                                />
                                                            </Form.Group>
                                                        </Col>
                                                        <Col md={12} className="text-center mt-4">
                                                            <Button variant="success" type="submit" className="px-5 rounded-pill shadow-sm" disabled={submitting}>
                                                                {submitting ? <Spinner size="sm" className="me-2" /> : null}
                                                                {T.submitReality}
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </Form>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </div>
            )}

            <div className="text-center text-muted small py-4 bg-white border-top">Nagar Vikas Samiti Performance Tracking System</div>
        </Container>
    );
};

export default Leaders;