import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';
import { Navigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const UserDashboard = () => {
    const { lang } = useLang();
    const T = useT(lang);
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'User';
    const isLoggedIn = !!localStorage.getItem('userToken');

    const [entries, setEntries] = useState([]);
    const [interestedEntries, setInterestedEntries] = useState([]);

    const fetchDashboard = async () => {
        if (!userId) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/users/${userId}/dashboard`);
            setEntries(res.data.entries);
            setInterestedEntries(res.data.interested_entries || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) fetchDashboard();
    }, [isLoggedIn]);

    if (!isLoggedIn) {
        return <Navigate to="/our-people" />;
    }

    const handleMarkComplete = async (entryId) => {
        try {
            await axios.patch(`${API_BASE_URL}/help-entries/${entryId}/complete?user_id=${userId}`);
            fetchDashboard();
        } catch (err) {
            alert('Failed to mark complete.');
        }
    };

    const seekingEntries = entries.filter(e => e.entry_type === 'seeking');
    const providingEntries = entries.filter(e => e.entry_type === 'providing');

    const renderEntryCard = (entry) => (
        <Card className="mb-4 shadow-sm border-0" key={entry.id}>
            <Card.Header className={entry.entry_type === 'seeking' ? 'bg-danger text-white' : 'bg-success text-white'}>
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold">{entry.title}</h5>
                    <Badge bg="light" text="dark">{entry.category}</Badge>
                </div>
            </Card.Header>
            <Card.Body>
                <p className="text-muted small">{new Date(entry.created_at).toLocaleDateString()}</p>
                <p>{entry.description}</p>
                {entry.admin_comment && (
                    <div className="alert alert-info mt-3 p-2 small">
                        <strong>Admin Note:</strong> {entry.admin_comment}
                    </div>
                )}
                <hr />
                <h6 className="fw-bold text-primary">{T.interestedPeople} ({entry.interests?.length || 0})</h6>
                {entry.interests && entry.interests.length > 0 ? (
                    <ul className="list-unstyled">
                        {entry.interests.map(interest => (
                            <li key={interest.id} className="p-2 border rounded mb-2 bg-light">
                                <strong>{interest.user.name}</strong> - {interest.user.mobile} ({interest.user.location})
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted small">No one has shown interest yet.</p>
                )}
                
                {entry.status !== 'completed' && (
                    <Button 
                        variant={entry.entry_type === 'seeking' ? 'outline-danger' : 'outline-success'} 
                        className="mt-3 w-100 fw-bold"
                        onClick={() => handleMarkComplete(entry.id)}
                    >
                        {T.markComplete}
                    </Button>
                )}
                {entry.status === 'completed' && (
                    <Badge bg="secondary" className="w-100 p-2 mt-3 fs-6">Completed</Badge>
                )}
            </Card.Body>
        </Card>
    );

    return (
        <div style={{ backgroundColor: '#f8f9fa', minHeight: '80vh', padding: '3rem 0' }}>
            <Container>
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h2 className="mb-0 fw-bold text-primary">{userName}'s {T.dashboard}</h2>
                    <Button variant="outline-danger" onClick={() => {
                        localStorage.removeItem('userToken');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('userName');
                        window.location.href = '/our-people';
                    }}>Logout</Button>
                </div>
                <Row className="g-4">
                    <Col lg={4} md={6}>
                        <h4 className="fw-bold mb-4 text-danger border-bottom pb-2">{T.myRequests}</h4>
                        {seekingEntries.length === 0 ? <p className="text-muted">No seeking requests.</p> : seekingEntries.map(renderEntryCard)}
                    </Col>
                    <Col lg={4} md={6}>
                        <h4 className="fw-bold mb-4 text-success border-bottom pb-2">{T.myOffers}</h4>
                        {providingEntries.length === 0 ? <p className="text-muted">No providing offers.</p> : providingEntries.map(renderEntryCard)}
                    </Col>
                    <Col lg={4} md={12}>
                        <h4 className="fw-bold mb-4 text-primary border-bottom pb-2">{T.interestedIn}</h4>
                        {interestedEntries.length === 0 ? (
                            <p className="text-muted">You haven't shown interest in any help requests yet.</p>
                        ) : (
                            interestedEntries.map(entry => (
                                <Card key={entry.id} className="mb-3 shadow-sm border-0 border-start border-4 border-primary">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-2">
                                            <Card.Title className="fw-bold text-dark fs-6 mb-0">{entry.title}</Card.Title>
                                            <Badge bg={entry.entry_type === 'seeking' ? 'danger' : 'success'}>{entry.category}</Badge>
                                        </div>
                                        <p className="text-muted small mb-2">{entry.description}</p>
                                        <div className="bg-light p-2 rounded small border">
                                            <div><strong>Initiator:</strong> {entry.user?.name}</div>
                                            <div><strong>Contact:</strong> {entry.user?.mobile}</div>
                                            <div><strong>Location:</strong> {entry.user?.location}</div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))
                        )}
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default UserDashboard;
