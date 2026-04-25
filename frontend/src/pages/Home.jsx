import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Modal, Alert, Carousel, Badge } from 'react-bootstrap';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

const Home = () => {
    const { lang } = useLang();
    const T = useT(lang);
    const [activities, setActivities] = useState([]);
    const [posts, setPosts] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const [volunteerData, setVolunteerData] = useState({ name: '', number: '', address: '', association: 'Serious', pincode: '' });
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState({ type: '', message: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Filters
    const [filterYear, setFilterYear] = useState(null);
    const [filterMonth, setFilterMonth] = useState(null);
    const [availableDates, setAvailableDates] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [workRes, postsRes, datesRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/activities`),
                    axios.get(`${API_BASE_URL}/posts`),
                    axios.get(`${API_BASE_URL}/activities/available-dates`)
                ]);
                setActivities(workRes.data);
                setPosts(postsRes.data);
                setAvailableDates(datesRes.data);
                if (datesRes.data.length > 0) {
                    setFilterYear(datesRes.data[0].year);
                    setFilterMonth(datesRes.data[0].month);
                }
            } catch (err) {
                console.error("Fetch error", err);
            }
        };
        fetchData();
    }, []);

    // Listen for navbar button trigger
    useEffect(() => {
        const handler = () => { setShowVolunteerModal(true); detectLocationAndPincode(); };
        window.addEventListener('openVolunteerModal', handler);
        return () => window.removeEventListener('openVolunteerModal', handler);
    }, []);

    useEffect(() => {
        const filtered = activities.filter(a => a.year === filterYear && a.month === filterMonth);
        if (filtered.length > 0) {
            // Always try to pick the fresh object from the 'activities' array if we have a current selection
            const freshSelection = selectedActivity ? filtered.find(f => f.id === selectedActivity.id) : null;

            if (freshSelection) {
                setSelectedActivity(freshSelection);
            } else {
                setSelectedActivity(filtered[0]);
            }
        } else {
            setSelectedActivity(null);
        }
    }, [filterYear, filterMonth, activities]);

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    const getEmbedUrl = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
    };

    const detectLocationAndPincode = () => {
        setVerificationLoading(true);
        setVerificationStatus({ type: 'info', message: T.detectingLocation });
        if (!navigator.geolocation) {
            setVerificationStatus({ type: 'danger', message: T.geolocationNotSupported });
            setVerificationLoading(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const data = await res.json();
                const allowed = ["121013", "121003", "201310", "210308", "110091"];
                if (data.postcode) {
                    setVolunteerData(prev => ({ ...prev, pincode: data.postcode }));
                    if (allowed.includes(data.postcode)) {
                        setVerificationStatus({ type: 'success', message: T.locationVerified(data.postcode) });
                    } else {
                        setVerificationStatus({ type: 'warning', message: T.autofillFailed });
                    }
                } else {
                    setVerificationStatus({ type: 'warning', message: T.autofillFailed });
                }
            } catch (err) { setVerificationStatus({ type: 'warning', message: T.autofillFailed }); }
            finally { setVerificationLoading(false); }
        }, () => {
            setVerificationStatus({ type: 'danger', message: T.accessDenied });
            setVerificationLoading(false);
        });
    };

    const images = selectedActivity?.media.filter(m => m.file_type === 'image') || [];
    const videos = selectedActivity?.media.filter(m => m.file_type === 'video') || [];

    // Always show both slots — campaign first, then thought
    const slots = [
        { type: 'campaign', label: T.announcement, headerBg: 'linear-gradient(90deg, #b45309, #d97706)', emptyLabel: T.noAnnouncement, post: posts.find(p => p.post_type === 'campaign') },
        { type: 'thought', label: T.dailyThought, headerBg: 'linear-gradient(90deg, #0f766e, #0d9488)', emptyLabel: T.noDailyThought, post: posts.find(p => p.post_type === 'thought') },
    ];


    return (
        <Container fluid className="p-0">

            {/* OUR WORK SECTION */}
            <section id="our-work" className="bg-white border-bottom border-top">
                <div className="px-4 py-3 border-bottom bg-white d-flex align-items-center">
                    <h2 className="mb-0 fw-bold text-dark">{T.ourWork}</h2>
                </div>
                <Row className="g-0 h-100">
                    {/* Sidebar for Month-Year - 10% */}
                    <Col style={{ flex: '0 0 10%', maxWidth: '10%' }} className="bg-light border-end p-3">
                        <h5 className="fw-bold mb-3 text-secondary">{T.selectMonth}</h5>
                        <div className="list-group list-group-flush mb-4 custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {availableDates.map((d, i) => (
                                <button
                                    key={i}
                                    className={`list-group-item list-group-item-action border-0 rounded-3 mb-2 fw-bold text-nowrap ${filterYear === d.year && filterMonth === d.month ? 'bg-primary text-white shadow-sm' : ''}`}
                                    style={{ fontSize: '0.75rem' }}
                                    onClick={() => {
                                        setFilterYear(d.year);
                                        setFilterMonth(d.month);
                                    }}
                                >
                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.month - 1]} {d.year}
                                </button>
                            ))}
                            {availableDates.length === 0 && <p className="text-muted small">No activities recorded.</p>}
                        </div>
                    </Col>
                    {/* Content Area - 90% */}
                    <Col style={{ flex: '0 0 90%', maxWidth: '90%' }} className="p-4">
                        {filterMonth && filterYear ? (
                            <>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold text-secondary small text-uppercase ls-1">Select Activity</Form.Label>
                                    <Form.Select
                                        style={{ width: '100%', borderRadius: '12px' }}
                                        className="shadow-sm border-2 border-dark p-3"
                                        value={selectedActivity?.id || ''}
                                        onChange={(e) => setSelectedActivity(activities.find(a => a.id === parseInt(e.target.value)))}
                                    >
                                        {activities
                                            .filter(a => a.year === filterYear && a.month === filterMonth)
                                            .map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                        {activities.filter(a => a.year === filterYear && a.month === filterMonth).length === 0 && <option value="">{T.noActivitiesForMonth}</option>}
                                    </Form.Select>
                                </Form.Group>

                                {selectedActivity && (
                                    <div className="activity-content mt-4">
                                        <h3 className="text-primary fw-bold mb-3">{selectedActivity.title}</h3>
                                        <p className="lead text-muted mb-5 text-break">{selectedActivity.description}</p>

                                        <Row className="gy-5">
                                            {images.length > 0 && (
                                                <Col lg={videos.length > 0 ? 6 : 12}>
                                                    <div className="mb-3 text-secondary">
                                                        <h4 className="mb-0 fw-bold">{T.images}</h4>
                                                    </div>
                                                    <Carousel className="rounded shadow overflow-hidden" pause="hover" interval={3000}>
                                                        {images.map((img, idx) => (
                                                            <Carousel.Item key={idx} style={{ height: '450px' }}>
                                                                <img src={getMediaUrl(img.url)} className="d-block w-100 h-100" style={{ objectFit: 'cover' }} alt="Work" />
                                                            </Carousel.Item>
                                                        ))}
                                                    </Carousel>
                                                </Col>
                                            )}

                                            {videos.length > 0 && (
                                                <Col lg={images.length > 0 ? 6 : 12}>
                                                    <div className="mb-3 text-secondary">
                                                        <h4 className="mb-0 fw-bold">{T.videos}</h4>
                                                    </div>
                                                    <div className="video-scroll-container d-flex flex-column gap-3" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                                                        {videos.map((vid, idx) => (
                                                            <div key={idx} className="rounded shadow-sm overflow-hidden border" style={{ height: '450px' }}>
                                                                <iframe
                                                                    src={getEmbedUrl(vid.url)}
                                                                    title="Video Documentation"
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
                                )}
                            </>
                        ) : (
                            <div className="text-center py-5">
                                <p className="text-muted">{T.selectMonthToView}</p>
                            </div>
                        )}
                    </Col>
                </Row>
            </section>


            {/* NOTICE BOARD SECTION */}
            <section id="notice-board">
                <Card className="premium-card shadow-lg border-0 bg-white">
                    <Card.Header className="bg-primary text-white p-4">
                        <h2 className="mb-0 fs-3 fw-bold">{T.noticeBoard}</h2>
                    </Card.Header>
                    <Card.Body className="p-0">
                        <Row className="g-0">
                            {slots.map(({ type, icon, label, headerBg, emptyLabel, post }) => (
                                <Col md={6} lg={6} key={type} className="p-0 border">
                                    <Card className="h-100 border-0 rounded-0">
                                        {/* Section Name Header */}
                                        <div style={{
                                            background: headerBg,
                                            color: '#fff',
                                            padding: '10px 18px',
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                        }}>
                                            <span>{label}</span>
                                            {post && (
                                                <small style={{ marginLeft: 'auto', fontWeight: 400, textTransform: 'none', opacity: 0.85, fontSize: '0.8rem' }}>
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </small>
                                            )}
                                        </div>

                                        {post ? (
                                            <>
                                                {/* Media Area */}
                                                {post.post_type === 'campaign' ? (
                                                    <div style={{ height: '448px' }}>
                                                        {post.media && post.media.length > 0 ? (
                                                            <Carousel
                                                                className="post-media-carousel shadow-sm h-100"
                                                                interval={3000}
                                                                pause="hover"
                                                                indicators={post.media.length > 1}
                                                                controls={post.media.length > 1}
                                                            >
                                                                {post.media.map((m, idx) => (
                                                                    <Carousel.Item key={idx} style={{ height: '448px' }}>
                                                                        {m.file_type === 'image' ? (
                                                                            <img src={getMediaUrl(m.url)} className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Announcement Media" />
                                                                        ) : (
                                                                            <div className="h-100 bg-black d-flex align-items-center justify-content-center">
                                                                                <iframe
                                                                                    src={getEmbedUrl(m.url)}
                                                                                    title="Announcement Video"
                                                                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                                                                    allowFullScreen
                                                                                ></iframe>
                                                                            </div>
                                                                        )}
                                                                    </Carousel.Item>
                                                                ))}
                                                            </Carousel>
                                                        ) : post.image_url ? (
                                                            <img src={getMediaUrl(post.image_url)} className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Announcement" />
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    /* Daily Thought: Standard Layout (One image if any) */
                                                    post.image_url && (
                                                        <div style={{ height: '220px', overflow: 'hidden' }}>
                                                            <img src={getMediaUrl(post.image_url)} className="w-100 h-100" style={{ objectFit: 'cover' }} alt="Daily Thought" />
                                                        </div>
                                                    )
                                                )}

                                                {/* Text Area */}
                                                <Card.Body
                                                    className="p-3 d-flex flex-column"
                                                    style={{ height: post.post_type === 'campaign' ? '112px' : '340px' }}
                                                >
                                                    <h4 className={`${post.post_type === 'campaign' ? 'h6' : 'h5'} fw-bold mb-2`}>{post.subject}</h4>
                                                    <div style={{ overflowY: 'auto', flexGrow: 1, paddingRight: '5px' }} className="custom-scrollbar">
                                                        <p className="text-dark small text-break mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{post.content}</p>
                                                    </div>
                                                </Card.Body>
                                            </>
                                        ) : (
                                            <Card.Body className="d-flex flex-column align-items-center justify-content-center" style={{ height: '420px', color: '#adb5bd' }}>
                                                <p className="fw-bold mb-1" style={{ fontSize: '1rem' }}>{emptyLabel || label}</p>
                                                <small>{T.checkBackSoon}</small>
                                            </Card.Body>
                                        )}
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            </section>

            {/* VOLUNTEER MODAL */}
            <Modal show={showVolunteerModal} onHide={() => setShowVolunteerModal(false)} centered backdrop="static">
                <Modal.Header closeButton><Modal.Title className="fw-bold">{T.volunteerApplication}</Modal.Title></Modal.Header>
                <Modal.Body className="p-4">
                    {isSubmitted ? (
                        <div className="text-center py-4">
                            <h4 className="fw-bold">{T.applicationReceived}</h4>
                        </div>
                    ) : (
                        <Form onSubmit={async (e) => {
                            e.preventDefault();
                            if (volunteerData.pincode) {
                                setVerificationLoading(true);
                                try {
                                    await axios.post(`${API_BASE_URL}/volunteers`, volunteerData);
                                    setIsSubmitted(true);
                                    setTimeout(() => setShowVolunteerModal(false), 3000);
                                } catch (err) {
                                    const errorMsg = err.response?.data?.detail || 'Failed to submit.';
                                    setVerificationStatus({ type: 'danger', message: errorMsg });
                                } finally {
                                    setVerificationLoading(false);
                                }
                            }
                        }}>
                            {verificationStatus.message && <Alert variant={verificationStatus.type} className="fw-bold">{verificationStatus.message}</Alert>}
                            <Form.Group className="mb-3"><Form.Label className="fw-bold">{T.fullName}</Form.Label><Form.Control type="text" required onChange={e => setVolunteerData({ ...volunteerData, name: e.target.value })} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label className="fw-bold">{T.mobile}</Form.Label><Form.Control type="tel" required pattern="[0-9]{10}" maxLength={10} placeholder="10-digit mobile number" onChange={e => setVolunteerData({ ...volunteerData, number: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label className="fw-bold">{T.address}</Form.Label><Form.Control as="textarea" rows={2} required onChange={e => setVolunteerData({ ...volunteerData, address: e.target.value })} /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label className="fw-bold">{T.pincode}</Form.Label><Form.Control type="text" required value={volunteerData.pincode} onChange={e => setVolunteerData({ ...volunteerData, pincode: e.target.value })} /></Form.Group>
                            <Form.Group className="mb-4">
                                <Form.Label className="fw-bold">{T.level}</Form.Label>
                                <Form.Select onChange={e => setVolunteerData({ ...volunteerData, association: e.target.value })}><option value="Serious">{T.serious}</option><option value="Casual">{T.casual}</option></Form.Select>
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={verificationLoading}>
                                {verificationLoading ? T.verifying : T.submitApplication}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default Home;
