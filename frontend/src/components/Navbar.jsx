import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar, Container, Button, Nav, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const navbarStyle = {
    background: '#1e293b',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    padding: '0 1rem',
};

const linkStyle = {
    color: '#e0e0e0',
    fontWeight: 600,
    fontSize: '0.95rem',
    padding: '0.75rem 1.4rem',
    letterSpacing: '0.5px',
    textDecoration: 'none',
    transition: 'color 0.2s',
    display: 'inline-block',
};

const activeLinkStyle = {
    ...linkStyle,
    color: '#d97706',
    borderBottom: '3px solid #d97706',
};

const separatorStyle = {
    color: 'rgba(255,255,255,0.25)',
    padding: '0',
    lineHeight: '1',
    fontSize: '1.2rem',
    alignSelf: 'center',
    userSelect: 'none',
};

const Navigation = () => {
    const { lang, toggle } = useLang();
    const T = useT(lang);

    const isLoggedIn = !!localStorage.getItem('userToken');
    const [navExpanded, setNavExpanded] = useState(false);

    // Volunteer Modal States
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const [volunteerData, setVolunteerData] = useState({ name: '', number: '', address: '', association: 'Serious', pincode: '' });
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState({ type: '', message: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

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

    const handleVolunteerClick = () => {
        setNavExpanded(false);
        setShowVolunteerModal(true);
        detectLocationAndPincode();
    };

    const navLinks = [
        { to: '/', label: T.home, end: true },
        { to: '/leaders', label: T.ourLeaders },
        { to: '/our-people', label: T.ourPeople },
    ];

    return (
        <>
        <Navbar expand="lg" sticky="top" style={navbarStyle} variant="dark" expanded={navExpanded} onToggle={setNavExpanded}>
            <Container fluid>
                <Navbar.Toggle aria-controls="main-navbar-nav" style={{ 
                    borderColor: 'rgba(217,119,6,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.05)'
                }} />
                <style>
                    {`
                        .navbar-toggler-icon {
                            filter: invert(53%) sepia(91%) saturate(1352%) hue-rotate(359deg) brightness(102%) contrast(107%);
                        }
                    `}
                </style>
                <Navbar.Collapse id="main-navbar-nav">
                    <Nav className="me-auto align-items-lg-center py-2 py-lg-0">
                        {navLinks.map((link, idx) => (
                            <React.Fragment key={link.to}>
                                {idx > 0 && <span style={separatorStyle} className="d-none d-lg-inline">│</span>}
                                <Nav.Link
                                    as={NavLink}
                                    to={link.to}
                                    end={link.end}
                                    style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                                    className="px-lg-3 py-2 py-lg-0"
                                >
                                    {link.label}
                                </Nav.Link>
                            </React.Fragment>
                        ))}
                    </Nav>

                    <div className="d-flex align-items-center mt-3 mt-lg-0">
                        {/* Language toggle */}
                        <button
                            onClick={toggle}
                            title={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(217,119,6,0.5)',
                                color: '#d97706',
                                borderRadius: '20px',
                                padding: '5px 16px',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                marginRight: '12px',
                                letterSpacing: '0.5px',
                                transition: 'background 0.2s',
                            }}
                        >
                            {lang === 'en' ? 'हिंदी' : 'EN'}
                        </button>

                        {/* Volunteer button */}
                        <Button
                            className="fw-bold text-white"
                            style={{
                                whiteSpace: 'nowrap',
                                borderRadius: '20px',
                                padding: '7px 22px',
                                background: '#d97706',
                                border: 'none',
                                boxShadow: '0 2px 10px rgba(217,119,6,0.3)',
                                fontSize: '0.9rem',
                            }}
                            onClick={handleVolunteerClick}
                        >
                            {T.joinVolunteer}
                        </Button>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>

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
        </>
    );
};

export default Navigation;
