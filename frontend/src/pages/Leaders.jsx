import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Leaders = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/leaders`)
            .then(res => setLeaders(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const mp = leaders.find(l => l.role === 'MP');
    const mla = leaders.find(l => l.role === 'MLA');
    const councillors = leaders.filter(l => l.role === 'Councillor');

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

    return (
        <Container className="py-5">
            <h1 className="text-center mb-5 fw-bold text-indigo">Our Elected Representatives</h1>
            
            {/* Top Tier: MP & MLA */}
            <Row className="justify-content-center mb-5 g-4">
                {mp && (
                    <Col md={5}>
                        <LeaderCard leader={mp} getMediaUrl={getMediaUrl} />
                    </Col>
                )}
                {mla && (
                    <Col md={5}>
                        <LeaderCard leader={mla} getMediaUrl={getMediaUrl} />
                    </Col>
                )}
            </Row>

            {/* Middle Tier: Councillors */}
            {councillors.length > 0 && (
                <>
                    <h2 className="text-center mb-4 fw-bold text-secondary">Our Councillors</h2>
                    <Row className="g-4">
                        {councillors.map(l => (
                            <Col key={l.id} lg={3} md={4} sm={6}>
                                <LeaderCard leader={l} getMediaUrl={getMediaUrl} />
                            </Col>
                        ))}
                    </Row>
                </>
            )}

            {leaders.length === 0 && (
                <div className="text-center py-5 text-muted">No leaders information available.</div>
            )}
        </Container>
    );
};

const LeaderCard = ({ leader, getMediaUrl }) => (
    <Card className="h-100 shadow border-0 overflow-hidden text-center leader-card">
        <div style={{ height: '300px', overflow: 'hidden', position: 'relative' }}>
            <img 
                src={getMediaUrl(leader.image_url) || 'https://via.placeholder.com/300x400?text=No+Photo'} 
                alt={leader.name} 
                className="w-100 h-100" 
                style={{ objectFit: 'cover' }} 
            />
            <div className="position-absolute bottom-0 start-0 w-100 p-2" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                <Badge bg={leader.role === 'MP' ? 'danger' : (leader.role === 'MLA' ? 'primary' : 'info')} className="px-3 py-2">
                    {leader.role} {leader.ward ? `- Ward ${leader.ward}` : ''}
                </Badge>
            </div>
        </div>
        <Card.Body className="bg-white">
            <Card.Title className="fw-bold mb-0" style={{ fontSize: '1.25rem' }}>{leader.name}</Card.Title>
        </Card.Body>
    </Card>
);

export default Leaders;
