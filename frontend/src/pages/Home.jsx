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
                if (Array.isArray(workRes.data)) setActivities(workRes.data);
                if (Array.isArray(postsRes.data)) setPosts(postsRes.data);
                if (Array.isArray(datesRes.data)) {
                    setAvailableDates(datesRes.data);
                    if (datesRes.data.length > 0) {
                        setFilterYear(datesRes.data[0].year);
                        setFilterMonth(datesRes.data[0].month);
                    }
                }
            } catch (err) {
                console.error("Fetch error", err);
            }
        };
        fetchData();
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
                <Row className="g-0">
                    {/* Sidebar for Month-Year - Top on mobile, Left on desktop */}
                    <Col xs={12} lg={2} className="bg-light border-end p-3">
                        <h5 className="fw-bold mb-3 text-secondary">{T.selectMonth}</h5>
                        <div className="list-group list-group-horizontal-md list-group-flush mb-4 custom-scrollbar flex-lg-column overflow-auto" style={{ maxHeight: '400px' }}>
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
                    {/* Content Area */}
                    <Col xs={12} lg={10} className="p-3 p-md-4">
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
                                                            <Carousel.Item key={idx} className="responsive-carousel-item" style={{ height: '450px' }}>
                                                                <img src={getMediaUrl(img.url)} className="d-block w-100" style={{ height: '100%', objectFit: 'contain', background: '#f8f9fa' }} alt="Work" />
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
                                                    <div className={`video-scroll-container d-flex flex-column gap-3 ${videos.length === 1 ? 'justify-content-center' : 'justify-content-start'}`} style={{ height: '450px', overflowY: 'auto' }}>
                                                        {videos.map((vid, idx) => (
                                                            <div key={idx} className="rounded shadow-sm overflow-hidden border" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                                                <iframe
                                                                    src={getEmbedUrl(vid.url)}
                                                                    title="Video Documentation"
                                                                    className="w-100 h-100"
                                                                    style={{ border: 'none', position: 'absolute', top: 0, left: 0 }}
                                                                    allowFullScreen
                                                                    referrerPolicy="strict-origin-when-cross-origin"
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
                            {slots.map(({ type, label, headerBg, emptyLabel, post }) => (
                                <Col md={12} lg={6} key={type} className="p-0 border">
                                    <Card className="h-100 border-0 rounded-0">
                                        <div style={{
                                            background: headerBg,
                                            color: '#fff',
                                            padding: '10px 18px',
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                            letterSpacing: '0.5px',
                                            textTransform: 'uppercase',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>{label}</span>
                                            {post && (
                                                <small className="d-none d-sm-inline" style={{ fontWeight: 400, textTransform: 'none', opacity: 0.85, fontSize: '0.8rem' }}>
                                                    {new Date(post.created_at).toLocaleDateString()}
                                                </small>
                                            )}
                                        </div>

                                        {post ? (
                                            <>
                                                {/* Media Area */}
                                                {post.post_type === 'campaign' ? (
                                                    <div style={{ height: 'auto', minHeight: '300px', maxHeight: '448px' }}>
                                                        {post.media && post.media.length > 0 ? (
                                                            <Carousel
                                                                className="post-media-carousel shadow-sm h-100"
                                                                interval={3000}
                                                                pause="hover"
                                                                indicators={post.media.length > 1}
                                                                controls={post.media.length > 1}
                                                            >
                                                                {post.media.map((m, idx) => (
                                                                    <Carousel.Item key={idx} style={{ height: '100%', minHeight: '300px' }}>
                                                                        {m.file_type === 'image' ? (
                                                                            <img src={getMediaUrl(m.url)} className="w-100 h-100" style={{ objectFit: 'contain', background: '#f8f9fa' }} alt="Announcement Media" />
                                                                        ) : (
                                                                            <div className="h-100 bg-black d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                                                                                <iframe
                                                                                    src={getEmbedUrl(m.url)}
                                                                                    title="Announcement Video"
                                                                                    style={{ width: '100%', height: '100%', border: 'none', minHeight: '300px' }}
                                                                                    allowFullScreen
                                                                                    referrerPolicy="strict-origin-when-cross-origin"
                                                                                ></iframe>
                                                                            </div>
                                                                        )}
                                                                    </Carousel.Item>
                                                                ))}
                                                            </Carousel>
                                                        ) : post.image_url ? (
                                                            <img src={getMediaUrl(post.image_url)} className="w-100 h-100" style={{ objectFit: 'contain', background: '#f8f9fa' }} alt="Announcement" />
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    /* Daily Thought: Standard Layout (One image if any) */
                                                    post.image_url && (
                                                        <div style={{ height: 'auto', maxHeight: '220px', overflow: 'hidden' }}>
                                                            <img src={getMediaUrl(post.image_url)} className="w-100" style={{ objectFit: 'contain', background: '#f8f9fa' }} alt="Daily Thought" />
                                                        </div>
                                                    )
                                                )}

                                                {/* Text Area */}
                                                <Card.Body
                                                    className="p-3 d-flex flex-column"
                                                    style={{ height: 'auto', minHeight: post.post_type === 'campaign' ? '112px' : '300px' }}
                                                >
                                                    <h4 className={`${post.post_type === 'campaign' ? 'h6' : 'h5'} fw-bold mb-2`}>{post.subject}</h4>
                                                    <div style={{ overflowY: 'auto', maxHeight: '200px', flexGrow: 1, paddingRight: '5px' }} className="custom-scrollbar">
                                                        <p className="text-dark small text-break mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{post.content}</p>
                                                    </div>
                                                </Card.Body>
                                            </>
                                        ) : (
                                            <Card.Body className="d-flex flex-column align-items-center justify-content-center" style={{ height: '300px', color: '#adb5bd' }}>
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

        </Container>
    );
};

export default Home;
