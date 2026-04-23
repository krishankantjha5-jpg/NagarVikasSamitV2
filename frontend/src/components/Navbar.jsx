import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar, Container, Button } from 'react-bootstrap';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

const navbarStyle = {
    background: 'linear-gradient(90deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    borderBottom: '2px solid rgba(255,165,0,0.4)',
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
    color: '#ffa500',
    borderBottom: '3px solid #ffa500',
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

    const navLinks = [
        { to: '/', label: T.home, end: true },
        { to: '/leaders', label: T.ourLeaders },
    ];

    return (
        <Navbar expand="lg" sticky="top" style={navbarStyle}>
            <Container fluid>
                <Navbar.Toggle aria-controls="main-navbar-nav" style={{ borderColor: 'rgba(255,165,0,0.5)' }} />
                <Navbar.Collapse id="main-navbar-nav">
                    {/* Left nav links */}
                    <div className="d-flex align-items-center me-auto" style={{ flexWrap: 'wrap' }}>
                        {navLinks.map((link, idx) => (
                            <React.Fragment key={link.to}>
                                {idx > 0 && <span style={separatorStyle}>│</span>}
                                <NavLink
                                    to={link.to}
                                    end={link.end}
                                    style={({ isActive }) => isActive ? activeLinkStyle : linkStyle}
                                >
                                    {link.label}
                                </NavLink>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Language toggle */}
                    <button
                        onClick={toggle}
                        title={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,165,0,0.5)',
                            color: '#ffa500',
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
                        variant="warning"
                        className="fw-bold"
                        style={{
                            whiteSpace: 'nowrap',
                            borderRadius: '20px',
                            padding: '7px 22px',
                            background: 'linear-gradient(90deg, #f7971e, #ffd200)',
                            border: 'none',
                            color: '#1a1a1a',
                            boxShadow: '0 2px 10px rgba(247,151,30,0.4)',
                            fontSize: '0.9rem',
                        }}
                        onClick={() => window.dispatchEvent(new CustomEvent('openVolunteerModal'))}
                    >
                        {T.joinVolunteer}
                    </Button>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Navigation;
