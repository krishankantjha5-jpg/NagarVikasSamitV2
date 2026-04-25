import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar, Container, Button, Nav } from 'react-bootstrap';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

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

    const navLinks = [
        { to: '/', label: T.home, end: true },
        { to: '/leaders', label: T.ourLeaders },
        { to: '/our-people', label: T.ourPeople },
    ];

    return (
        <Navbar expand="lg" sticky="top" style={navbarStyle} variant="dark">
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
                            onClick={() => window.dispatchEvent(new CustomEvent('openVolunteerModal'))}
                        >
                            {T.joinVolunteer}
                        </Button>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Navigation;
