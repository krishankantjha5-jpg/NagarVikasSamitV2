import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Nav, Tab, Table, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');

const Admin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Listings
    const [activities, setActivities] = useState([]);
    const [posts, setPosts] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [leaders, setLeaders] = useState([]);
    const [realities, setRealities] = useState([]);
    const [helpEntries, setHelpEntries] = useState([]);
    const [previewReality, setPreviewReality] = useState(null);
    const [previewHelpEntry, setPreviewHelpEntry] = useState(null);
    const [adminComment, setAdminComment] = useState('');

    // Form State
    const [editMode, setEditMode] = useState({ id: null, type: null }); 
    const [workForm, setWorkForm] = useState({ title: '', description: '', media: [], month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [postForm, setPostForm] = useState({ subject: '', content: '', post_type: 'thought', media: [] });
    const [leaderForm, setLeaderForm] = useState({ name: '', role: 'Councillor', ward: '', image_url: '' });
    const [workFiles, setWorkFiles] = useState([]);
    const [postFiles, setPostFiles] = useState([]);
    const [leaderFiles, setLeaderFiles] = useState([]);
    const [videoUrls, setVideoUrls] = useState(['']);
    const [postVideoUrls, setPostVideoUrls] = useState(['']);
    const [formKey, setFormKey] = useState(0); // increment to force-clear file inputs
    const [promiseForm, setPromiseForm] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: '', video_url: '' });
    const [donationGoal, setDonationGoal] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), target_amount: '', add_collection: '' });
    const [selectedLeaderId, setSelectedLeaderId] = useState('');

    useEffect(() => {
        if (isLoggedIn) {
            refreshData();
        }
    }, [isLoggedIn]);

    const refreshData = async () => {
        try {
            const [aRes, pRes, vRes, lRes, rRes, hRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/activities`),
                axios.get(`${API_BASE_URL}/posts`),
                axios.get(`${API_BASE_URL}/volunteers`),
                axios.get(`${API_BASE_URL}/leaders`),
                axios.get(`${API_BASE_URL}/admin/realities?status=all`),
                axios.get(`${API_BASE_URL}/admin/help-entries`),
            ]);
            if (Array.isArray(aRes.data)) setActivities(aRes.data);
            if (Array.isArray(pRes.data)) setPosts(pRes.data);
            if (Array.isArray(vRes.data)) setVolunteers(vRes.data);
            if (Array.isArray(lRes.data)) setLeaders(lRes.data);
            if (Array.isArray(rRes.data)) setRealities(rRes.data);
            if (Array.isArray(hRes.data)) setHelpEntries(hRes.data);
        } catch (err) { console.error("Refresh failed", err); }
    };

    const handleRealityStatus = async (id, status) => {
        try {
            const updateData = { status };
            // If we've removed media during preview, send the updated list
            if (previewReality && previewReality.id === id) {
                updateData.media = previewReality.media.map(m => ({ url: m.url, file_type: m.file_type }));
            }
            await axios.patch(`${API_BASE_URL}/admin/realities/${id}`, updateData);
            setSuccessMsg(`Reality ${status}!`);
            setErrorMsg('');
            setPreviewReality(null);
            refreshData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) { 
            console.error("Status update failed", err);
            setErrorMsg('Failed to update reality status.');
        }
    };

    const handleDeleteReality = async (id) => {
        if (!window.confirm('Are you sure you want to delete this reality record?')) return;
        try {
            await axios.delete(`${API_BASE_URL}/admin/realities/${id}`);
            setSuccessMsg('Reality record deleted!');
            setErrorMsg('');
            refreshData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) { 
            console.error("Delete failed", err);
            setErrorMsg('Failed to delete reality record.');
        }
    };

    const handleHelpStatus = async (id, status, comment) => {
        if (!comment || comment.trim() === '') {
            setErrorMsg('A comment is required to approve or reject an entry.');
            return;
        }
        try {
            await axios.patch(`${API_BASE_URL}/admin/help-entries/${id}`, { status, comment });
            setSuccessMsg(`Help entry ${status}!`);
            setErrorMsg('');
            setPreviewHelpEntry(null);
            setAdminComment('');
            refreshData();
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) { 
            console.error("Status update failed", err);
            setErrorMsg(err.response?.data?.detail || 'Failed to update status');
        }
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE_URL}/login`, credentials);
            if (res.data.access_token) {
                setIsLoggedIn(true);
                setLoginError('');
            }
        } catch (err) { setLoginError('Invalid credentials.'); }
    };

    const handleWorkSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let mediaList = [...workForm.media];

            // Upload new files if any
            for (let file of workFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await axios.post(`${API_BASE_URL}/upload`, formData);
                mediaList.push({ url: res.data.image_url, file_type: 'image' });
            }

            videoUrls.filter(v => v.trim() !== '').forEach(v => {
                if (!mediaList.find(m => m.url === v)) {
                    mediaList.push({ url: v, file_type: 'video' });
                }
            });

            const data = { ...workForm, media: mediaList };

            if (editMode.type === 'work') {
                await axios.put(`${API_BASE_URL}/activities/${editMode.id}`, data);
                setSuccessMsg('Activity updated!');
            } else {
                await axios.post(`${API_BASE_URL}/activities`, data);
                setSuccessMsg('Activity added!');
            }

            resetForm();
            refreshData();
        } catch (err) { 
            const msg = err.response?.data?.detail || 'Operation failed.';
            alert(msg); 
        }
        finally { setLoading(false); }
    };

    const handlePostSubmit = async (e, type) => {
        e.preventDefault();
        setLoading(true);
        try {
            let mediaList = [...(postForm.media || [])];

            // Upload new photos
            for (let file of postFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await axios.post(`${API_BASE_URL}/upload`, formData);
                mediaList.push({ url: res.data.image_url, file_type: 'image' });
            }

            postVideoUrls.filter(v => v.trim() !== '').forEach(v => {
                if (!mediaList.find(m => m.url === v)) {
                    mediaList.push({ url: v, file_type: 'video' });
                }
            });


            let finalImageUrl = postForm.image_url;
            if (type === 'thought' && postFiles.length > 0) {
                finalImageUrl = mediaList.find(m => m.file_type === 'image')?.url || finalImageUrl;
            }

            const data = { ...postForm, post_type: type, media: mediaList, image_url: finalImageUrl };

            if (editMode.id) {
                await axios.put(`${API_BASE_URL}/posts/${editMode.id}`, data);
                setSuccessMsg('Post updated!');
            } else {
                await axios.post(`${API_BASE_URL}/posts`, data);
                setSuccessMsg('Post created!');
            }

            resetForm();
            refreshData();
        } catch (err) { 
            const msg = err.response?.data?.detail || 'Operation failed.';
            setErrorMsg(msg);
            setSuccessMsg('');
        }
        finally { setLoading(false); }
    };

    const handleLeaderSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalImageUrl = leaderForm.image_url;

            if (leaderFiles.length > 0) {
                const formData = new FormData();
                formData.append('file', leaderFiles[0]);
                const res = await axios.post(`${API_BASE_URL}/upload`, formData);
                finalImageUrl = res.data.image_url;
            }

            const data = { ...leaderForm, image_url: finalImageUrl };

            if (editMode.type === 'leader') {
                await axios.put(`${API_BASE_URL}/leaders/${editMode.id}`, data);
                setSuccessMsg('Leader details updated!');
            } else {
                await axios.post(`${API_BASE_URL}/leaders`, data);
                setSuccessMsg('Leader added successfully!');
            }

            resetForm();
            refreshData();
        } catch (err) { 
            const msg = err.response?.data?.detail || 'Operation failed.';
            setErrorMsg(msg);
            setSuccessMsg('');
        }
        finally { setLoading(false); }
    };

    const handlePromiseSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLeaderId) {
            setErrorMsg('Please select a leader first.');
            return;
        }
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/promises`, { 
                ...promiseForm, 
                leader_id: parseInt(selectedLeaderId) 
            });
            setSuccessMsg('Promise recorded!');
            setErrorMsg('');
            setPromiseForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: '', video_url: '' });
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) { 
            const msg = err.response?.data?.detail || 'Failed to record promise.';
            setErrorMsg(msg);
            setSuccessMsg('');
        }
        finally { setLoading(false); }
    };

    const handleDonationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/admin/donation-goal`, {
                month: parseInt(donationGoal.month),
                year: parseInt(donationGoal.year),
                target_amount: donationGoal.target_amount ? parseFloat(donationGoal.target_amount) : null,
                add_collection: donationGoal.add_collection ? parseFloat(donationGoal.add_collection) : null
            });
            setSuccessMsg('Donation goal/collection updated successfully!');
            setErrorMsg('');
            setDonationGoal({ ...donationGoal, target_amount: '', add_collection: '' });
            setTimeout(() => setSuccessMsg(''), 4000);
        } catch (err) {
            setErrorMsg(err.response?.data?.detail || 'Failed to update donation goal.');
            setSuccessMsg('');
        } finally {
            setLoading(false);
        }
    };

    const getMediaUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API_BASE_URL}${url}`;
    };

    const removeFromWorkMedia = (index) => {
        const item = workForm.media[index];
        const newMedia = workForm.media.filter((_, i) => i !== index);
        setWorkForm({ ...workForm, media: newMedia });
        if (item.file_type === 'video') {
            setVideoUrls(newMedia.filter(m => m.file_type === 'video').map(m => m.url));
        }
    };

    const removeFromPostMedia = (index) => {
        const newMedia = (postForm.media || []).filter((_, i) => i !== index);
        setPostForm({ ...postForm, media: newMedia });
    };


    const startEdit = (type, item) => {
        setEditMode({ id: item.id, type: type });
        if (type === 'work') {
            setWorkForm({ 
                title: item.title, 
                description: item.description, 
                media: item.media,
                month: item.month || new Date().getMonth() + 1,
                year: item.year || new Date().getFullYear()
            });
        } else if (type === 'leader') {
            setLeaderForm({ name: item.name, role: item.role, ward: item.ward || '', image_url: item.image_url || '' });
        } else {
            setPostForm({ subject: item.subject, content: item.content, post_type: item.post_type, image_url: item.image_url, media: item.media });
        }
    };

    const resetForm = () => {
        setEditMode({ id: null, type: null });
        setWorkForm({ title: '', description: '', media: [], month: new Date().getMonth() + 1, year: new Date().getFullYear() });
        setPostForm({ subject: '', content: '', post_type: 'thought', media: [] });
        setLeaderForm({ name: '', role: 'Councillor', ward: '', image_url: '' });
        setWorkFiles([]);
        setPostFiles([]);
        setLeaderFiles([]);
        setPostVideoUrls(['']);
        setVideoUrls(['']);
        setFormKey(k => k + 1);
        setErrorMsg('');
        setTimeout(() => setSuccessMsg(''), 4000);
    };

    const inputStyle = { border: '2px solid #343a40', backgroundColor: '#fff' };
    const navStyle = { backgroundColor: '#1a237e', borderRadius: '12px' };

    const crossButtonStyle = {
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '26px',
        height: '26px',
        borderRadius: '50%',
        backgroundColor: '#ff0000',
        color: 'white',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: '900',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        padding: '0',
        lineHeight: '1',
        zIndex: '100',
        transition: 'transform 0.2s'
    };

    const removeFromLeaderPhoto = () => {
        setLeaderForm({ ...leaderForm, image_url: '' });
        setLeaderFiles([]);
    };

    const removeFromRealityMedia = (idx) => {
        if (!previewReality) return;
        const newMedia = previewReality.media.filter((_, i) => i !== idx);
        setPreviewReality({ ...previewReality, media: newMedia });
    };

    if (!isLoggedIn) {
        return (
            <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <Card className="p-4 shadow-lg border-0" style={{ maxWidth: '400px', width: '100%', borderRadius: '15px' }}>
                    <h2 className="text-center mb-4 text-primary fw-bold">Admin Login</h2>
                    {loginError && <Alert variant="danger">{loginError}</Alert>}
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Username</Form.Label><Form.Control type="text" required style={inputStyle} onChange={e => setCredentials({ ...credentials, username: e.target.value })} /></Form.Group>
                        <Form.Group className="mb-4"><Form.Label className="fw-bold">Password</Form.Label><Form.Control type="password" required style={inputStyle} onChange={e => setCredentials({ ...credentials, password: e.target.value })} /></Form.Group>
                        <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">Login</Button>
                    </Form>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <h1 className="mb-4 text-center fw-bold">Nagar Vikas Samiti Management</h1>
            {successMsg && <Alert variant="success" className="mb-4 text-center fw-bold shadow-sm animate-fadeIn" onClose={() => setSuccessMsg('')} dismissible>{successMsg}</Alert>}
            {errorMsg && <Alert variant="danger" className="mb-4 text-center fw-bold shadow-sm animate-fadeIn" onClose={() => setErrorMsg('')} dismissible>{errorMsg}</Alert>}

            <Tab.Container defaultActiveKey="work">
                <Row className="g-4">
                    <Col lg={3}>
                        <Nav variant="pills" className="flex-lg-column p-2 p-md-3 shadow-lg flex-row overflow-auto text-nowrap mb-4 mb-lg-0" style={navStyle}>
                            <Nav.Item className="mb-lg-3"><Nav.Link eventKey="work" className="text-white py-2 py-md-3 px-3 fw-bold text-center">Manage Our Work</Nav.Link></Nav.Item>
                            <Nav.Item className="mb-lg-3"><Nav.Link eventKey="leaders" className="text-white py-2 py-md-3 px-3 fw-bold text-center">Manage Leaders</Nav.Link></Nav.Item>
                            <Nav.Item className="mb-lg-3"><Nav.Link eventKey="approvals" className="text-white py-2 py-md-3 px-3 fw-bold text-center">Reality Approvals <Badge bg="danger" className="ms-1 ms-md-2">{realities.length}</Badge></Nav.Link></Nav.Item>
                            <Nav.Item className="mb-lg-3"><Nav.Link eventKey="thoughts" className="text-white py-2 py-md-3 px-3 fw-bold text-center">Announcements</Nav.Link></Nav.Item>
                            <Nav.Item className="mb-lg-3"><Nav.Link eventKey="help" className="text-white py-2 py-md-3 px-3 fw-bold text-center">Community Help <Badge bg="danger" className="ms-1 ms-md-2">{helpEntries.length}</Badge></Nav.Link></Nav.Item>
                            <Nav.Item className="mb-lg-3"><Nav.Link eventKey="volunteers" className="text-white py-2 py-md-3 px-3 fw-bold text-center">Volunteers</Nav.Link></Nav.Item>
                            <Nav.Item className="mb-lg-3"><Nav.Link eventKey="donations" className="text-white py-2 py-md-3 px-3 fw-bold text-center">Manage Donations</Nav.Link></Nav.Item>
                        </Nav>
                        <Button variant="outline-danger" className="w-100 mt-2 mt-md-4 fw-bold" onClick={() => setIsLoggedIn(false)}>Logout</Button>
                    </Col>

                    <Col lg={9}>
                        <Tab.Content>
                            <Tab.Pane eventKey="work">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">{editMode.type === 'work' ? 'Edit Activity' : 'Create New Activity'}</h3>
                                    <Form key={formKey} onSubmit={handleWorkSubmit}>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Title</Form.Label><Form.Control type="text" required style={inputStyle} value={workForm.title} onChange={e => setWorkForm({ ...workForm, title: e.target.value })} /></Form.Group>
                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group><Form.Label className="fw-bold">Year</Form.Label><Form.Control type="number" style={inputStyle} value={workForm.year} onChange={e => setWorkForm({ ...workForm, year: parseInt(e.target.value) })} /></Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label className="fw-bold">Month</Form.Label>
                                                    <Form.Select style={inputStyle} value={workForm.month} onChange={e => setWorkForm({ ...workForm, month: parseInt(e.target.value) })}>
                                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                                            <option key={m} value={i + 1}>{m}</option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Description</Form.Label><Form.Control as="textarea" rows={2} required style={inputStyle} value={workForm.description} onChange={e => setWorkForm({ ...workForm, description: e.target.value })} /></Form.Group>
                                        
                                        {workForm.media.length > 0 && (
                                            <div className="mb-4">
                                                <Form.Label className="fw-bold text-secondary mb-2">Attached Media</Form.Label>
                                                <div className="d-flex flex-wrap gap-3 p-3 border rounded bg-light">
                                                    {workForm.media.map((m, idx) => (
                                                        <div key={idx} className="position-relative" style={{ width: '100px', height: '100px' }}>
                                                            {m.file_type === 'image' && (
                                                                <img src={getMediaUrl(m.url)} alt="" className="w-100 h-100 rounded border" style={{ objectFit: 'cover' }} />
                                                            )}
                                                            <button 
                                                                type="button"
                                                                className="shadow-sm d-flex align-items-center justify-content-center"
                                                                style={crossButtonStyle}
                                                                onClick={() => removeFromWorkMedia(idx)}
                                                                title="Remove Media"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold">Upload Photos</Form.Label>
                                            <Form.Control type="file" multiple accept="image/*" style={inputStyle} onChange={e => setWorkFiles(Array.from(e.target.files))} />
                                        </Form.Group>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold">Video URLs (YouTube links, one per line)</Form.Label>
                                            <Form.Control as="textarea" rows={2} style={inputStyle} value={videoUrls.join('\n')} onChange={e => setVideoUrls(e.target.value.split('\n'))} />
                                        </Form.Group>
                                        <div className="d-flex gap-2">
                                            <Button variant={editMode.type === 'work' ? 'warning' : 'success'} type="submit" disabled={loading} className="px-5 fw-bold">{loading ? <Spinner size="sm" /> : (editMode.type === 'work' ? 'Update Activity' : 'Save Activity')}</Button>
                                            {editMode.id && <Button variant="secondary" onClick={resetForm}>Cancel Edit</Button>}
                                        </div>
                                    </Form>
                                </Card>

                                <Card className="p-4 shadow border">
                                    <h4 className="mb-3 fw-bold">Current Activities</h4>
                                    <Table responsive hover>
                                        <thead className="table-dark">
                                            <tr><th>Title</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {activities.map(a => (
                                                <tr key={a.id}>
                                                    <td>{a.title}</td>
                                                    <td>
                                                        <Button variant="outline-primary" size="sm" onClick={() => startEdit('work', a)}>Edit</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="leaders">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">{editMode.type === 'leader' ? 'Edit Leader' : 'Add New Leader'}</h3>
                                    <Form key={formKey} onSubmit={handleLeaderSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3"><Form.Label className="fw-bold">Name</Form.Label><Form.Control type="text" required style={inputStyle} value={leaderForm.name} onChange={e => setLeaderForm({ ...leaderForm, name: e.target.value })} /></Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3"><Form.Label className="fw-bold">Role</Form.Label><Form.Select style={inputStyle} value={leaderForm.role} onChange={e => setLeaderForm({ ...leaderForm, role: e.target.value })}><option value="MP">MP</option><option value="MLA">MLA</option><option value="Councillor">Councillor</option></Form.Select></Form.Group>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3"><Form.Label className="fw-bold">Ward No. (For Councillors)</Form.Label><Form.Control type="text" style={inputStyle} value={leaderForm.ward} onChange={e => setLeaderForm({ ...leaderForm, ward: e.target.value })} disabled={leaderForm.role !== 'Councillor'} /></Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-bold">Photo</Form.Label>
                                                    {leaderForm.image_url && (
                                                        <div className="mb-2 d-flex align-items-center gap-3">
                                                            <div className="position-relative">
                                                                <img src={getMediaUrl(leaderForm.image_url)} alt="Current" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '50%' }} className="border shadow-sm" />
                                                                <button 
                                                                    type="button"
                                                                    style={{ ...crossButtonStyle, width: '20px', height: '20px', fontSize: '14px', top: '-5px', right: '-5px' }}
                                                                    onClick={removeFromLeaderPhoto}
                                                                    title="Remove Photo"
                                                                >
                                                                    &times;
                                                                </button>
                                                            </div>
                                                            <small className="text-muted fw-bold">Current photo</small>
                                                        </div>
                                                    )}
                                                    <Form.Control type="file" accept="image/*" style={inputStyle} onChange={e => setLeaderFiles(e.target.files)} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <div className="d-flex gap-2 mt-2">
                                            <Button variant={editMode.type === 'leader' ? 'warning' : 'success'} type="submit" disabled={loading} className="px-5 fw-bold">{loading ? <Spinner size="sm" /> : (editMode.type === 'leader' ? 'Update' : 'Add Leader')}</Button>
                                            {editMode.type === 'leader' && <Button variant="secondary" onClick={resetForm}>Cancel</Button>}
                                        </div>
                                    </Form>
                                </Card>

                                <div className="mt-5 pt-4 border-top">
                                    <h2 className="text-center mb-4 fw-bold text-dark">Leader Performance Tracker</h2>
                                    
                                    <Card className="p-4 shadow border mb-4 bg-light">
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold fs-5">Select a Leader to Manage Performance</Form.Label>
                                            <Form.Select 
                                                style={inputStyle} 
                                                value={selectedLeaderId} 
                                                onChange={e => setSelectedLeaderId(e.target.value)}
                                                className="py-2"
                                            >
                                                <option value="">-- Choose a Leader --</option>
                                                {leaders.map(l => (
                                                    <option key={l.id} value={l.id}>{l.name} ({l.role})</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>

                                        {selectedLeaderId && (
                                            <Row className="g-4">
                                                <Col md={12}>
                                                    <Card className="h-100 shadow-sm border-0">
                                                        <Card.Header className="bg-warning text-dark fw-bold py-3">
                                                            <span className="fs-5">Promise Slot</span>
                                                        </Card.Header>
                                                        <Card.Body>
                                                            <Form onSubmit={handlePromiseSubmit}>
                                                                <Row className="mb-3">
                                                                    <Col sm={6}>
                                                                        <Form.Group>
                                                                            <Form.Label className="fw-bold">Year</Form.Label>
                                                                            <Form.Control 
                                                                                type="number" 
                                                                                style={inputStyle} 
                                                                                value={promiseForm.year} 
                                                                                onChange={e => setPromiseForm({ ...promiseForm, year: parseInt(e.target.value) })} 
                                                                            />
                                                                        </Form.Group>
                                                                    </Col>
                                                                    <Col sm={6}>
                                                                        <Form.Group>
                                                                            <Form.Label className="fw-bold">Month</Form.Label>
                                                                            <Form.Select 
                                                                                style={inputStyle} 
                                                                                value={promiseForm.month} 
                                                                                onChange={e => setPromiseForm({ ...promiseForm, month: parseInt(e.target.value) })}
                                                                            >
                                                                                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                                                                                    <option key={m} value={i + 1}>{m}</option>
                                                                                ))}
                                                                            </Form.Select>
                                                                        </Form.Group>
                                                                    </Col>
                                                                </Row>
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label className="fw-bold">Amount</Form.Label>
                                                                    <Form.Control 
                                                                        type="text" 
                                                                        placeholder="e.g. 50 Lakhs" 
                                                                        required 
                                                                        style={inputStyle} 
                                                                        value={promiseForm.amount} 
                                                                        onChange={e => setPromiseForm({ ...promiseForm, amount: e.target.value })} 
                                                                    />
                                                                </Form.Group>
                                                                <Form.Group className="mb-3">
                                                                    <Form.Label className="fw-bold">YouTube Video Link (Optional)</Form.Label>
                                                                    <Form.Control 
                                                                        type="text" 
                                                                        placeholder="e.g. https://www.youtube.com/watch?v=..." 
                                                                        style={inputStyle} 
                                                                        value={promiseForm.video_url} 
                                                                        onChange={e => setPromiseForm({ ...promiseForm, video_url: e.target.value })} 
                                                                    />
                                                                </Form.Group>
                                                                <Button variant="dark" type="submit" className="w-100 fw-bold py-2" disabled={loading}>
                                                                    {loading ? <Spinner size="sm" /> : 'Feed Promise'}
                                                                </Button>
                                                            </Form>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            </Row>
                                        )}
                                    </Card>
                                </div>
                            </Tab.Pane>


                            <Tab.Pane eventKey="approvals">
                                 <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">Pending Reality Submissions</h3>
                                    {realities.filter(r => r.status === 'pending').length === 0 ? (
                                        <p className="text-center py-5 text-muted">No pending submissions to review.</p>
                                    ) : (
                                        <Table responsive hover>
                                            <thead className="table-dark">
                                                <tr>
                                                    <th>Leader</th>
                                                    <th>Area/Details</th>
                                                    <th>Timeline</th>
                                                    <th>Media</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {realities.filter(r => r.status === 'pending').map(r => {
                                                    const leader = leaders.find(l => l.id === r.leader_id);
                                                    return (
                                                        <tr key={r.id}>
                                                            <td>{leader ? leader.name : 'Unknown'}</td>
                                                            <td><div className="text-truncate" style={{maxWidth: '150px'}}>{r.area_details}</div></td>
                                                            <td>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][r.month-1]} {r.year}</td>
                                                            <td>
                                                                <Badge bg="secondary" className="px-2">{r.media.length} Items</Badge>
                                                            </td>
                                                            <td className="d-flex gap-2">
                                                                <Button variant="outline-primary" size="sm" onClick={() => setPreviewReality(r)}>
                                                                    View & Moderate
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card>

                                <Card className="p-4 shadow border">
                                    <h3 className="mb-4 text-success fw-bold">Approved Realities (Live)</h3>
                                    {realities.filter(r => r.status === 'approved').length === 0 ? (
                                        <p className="text-center py-5 text-muted">No approved realities yet.</p>
                                    ) : (
                                        <Table responsive hover>
                                            <thead className="table-success">
                                                <tr>
                                                    <th>Leader</th>
                                                    <th>Area/Details</th>
                                                    <th>Timeline</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {realities.filter(r => r.status === 'approved').map(r => {
                                                    const leader = leaders.find(l => l.id === r.leader_id);
                                                    return (
                                                        <tr key={r.id}>
                                                            <td>{leader ? leader.name : 'Unknown'}</td>
                                                            <td><div className="text-truncate" style={{maxWidth: '200px'}}>{r.area_details}</div></td>
                                                            <td>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][r.month-1]} {r.year}</td>
                                                            <td>
                                                                <div className="d-flex gap-2">
                                                                    <Button variant="info" size="sm" onClick={() => setPreviewReality(r)}>View</Button>
                                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteReality(r.id)}>Delete</Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card>

                                <Modal show={previewReality !== null} onHide={() => setPreviewReality(null)} size="lg" centered>
                                    <Modal.Header closeButton className="bg-light">
                                        <Modal.Title className="fw-bold text-indigo">Reality Check Moderation</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body className="p-4">
                                        {previewReality && (
                                            <Row>
                                                <Col md={12} className="mb-4">
                                                    <div className="p-3 bg-light rounded border border-primary border-opacity-25">
                                                        <div className="row g-3">
                                                            <div className="col-sm-6">
                                                                <small className="text-muted d-block text-uppercase fw-bold">Leader</small>
                                                                <span className="fs-5 fw-bold">{leaders.find(l => l.id === previewReality.leader_id)?.name || 'Unknown'}</span>
                                                            </div>
                                                            <div className="col-sm-6">
                                                                <small className="text-muted d-block text-uppercase fw-bold">Timeline</small>
                                                                <span className="fs-5 fw-bold">{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][previewReality.month-1]} {previewReality.year}</span>
                                                            </div>
                                                            <div className="col-sm-12 mt-3">
                                                                <small className="text-muted d-block text-uppercase fw-bold">Area & Details</small>
                                                                <p className="mb-0 bg-white p-2 rounded border">{previewReality.area_details}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col md={12}>
                                                    <h5 className="fw-bold mb-3 d-flex align-items-center">Submitted Media</h5>
                                                    <div className="d-flex flex-wrap gap-3 p-3 border rounded bg-white" style={{ minHeight: '200px' }}>
                                                        {previewReality.media.map((m, idx) => (
                                                            <div key={idx} className="border rounded shadow-sm overflow-hidden position-relative" style={{ width: '220px' }}>
                                                                <button 
                                                                    type="button"
                                                                    style={crossButtonStyle}
                                                                    onClick={() => removeFromRealityMedia(idx)}
                                                                    title="Remove from submission"
                                                                >
                                                                    &times;
                                                                </button>
                                                                {m.file_type === 'image' ? (
                                                                    <img src={getMediaUrl(m.url)} className="w-100" style={{ height: '160px', objectFit: 'cover' }} alt="" />
                                                                ) : (
                                                                    <div className="bg-dark text-white d-flex align-items-center justify-content-center w-100" style={{ height: '160px' }}>
                                                                        <small>Video Link</small>
                                                                    </div>
                                                                )}
                                                                <div className="p-2 bg-light text-center">
                                                                    <a href={getMediaUrl(m.url)} target="_blank" rel="noreferrer" className="btn btn-sm btn-link text-decoration-none p-0 w-100 text-truncate">
                                                                        {m.file_type === 'image' ? 'Open Full Photo' : 'Open Video Link'}
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Col>
                                            </Row>
                                        )}
                                    </Modal.Body>
                                    <Modal.Footer className="bg-light p-3">
                                        <div className="d-flex gap-3 w-100 justify-content-between">
                                            <Button variant="outline-secondary" onClick={() => setPreviewReality(null)} className="px-4">Close</Button>
                                            <div className="d-flex gap-2">
                                                <Button variant="danger" disabled={!previewReality} onClick={() => handleRealityStatus(previewReality.id, 'rejected')} className="px-4 d-flex align-items-center">
                                                    Reject
                                                </Button>
                                                <Button variant="success" disabled={!previewReality} onClick={() => handleRealityStatus(previewReality.id, 'approved')} className="px-5 fw-bold d-flex align-items-center">
                                                    {previewReality?.status === 'approved' ? 'Close' : 'Approve & Publish'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Modal.Footer>
                                </Modal>
                            </Tab.Pane>
                            <Tab.Pane eventKey="thoughts">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">{editMode.id ? 'Edit Announcement' : 'New Announcement'}</h3>
                                    <Form key={formKey} onSubmit={e => handlePostSubmit(e, postForm.post_type)}>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Type</Form.Label><Form.Select style={inputStyle} value={postForm.post_type} onChange={e => setPostForm({ ...postForm, post_type: e.target.value })}><option value="thought">Daily Thought</option><option value="campaign">Announcement</option></Form.Select></Form.Group>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Subject</Form.Label><Form.Control type="text" required style={inputStyle} value={postForm.subject} onChange={e => setPostForm({ ...postForm, subject: e.target.value })} /></Form.Group>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Content</Form.Label><Form.Control as="textarea" rows={3} required style={inputStyle} value={postForm.content} onChange={e => setPostForm({ ...postForm, content: e.target.value })} /></Form.Group>
                                        
                                        {postForm.media && postForm.media.length > 0 && (
                                            <div className="mb-4">
                                                <Form.Label className="fw-bold text-secondary mb-2">Attached Media</Form.Label>
                                                <div className="d-flex flex-wrap gap-3 p-3 border rounded bg-light">
                                                    {postForm.media.map((m, idx) => (
                                                        <div key={idx} className="position-relative" style={{ width: '80px', height: '80px' }}>
                                                            {m.file_type === 'image' && (
                                                                <img src={getMediaUrl(m.url)} alt="" className="w-100 h-100 rounded border" style={{ objectFit: 'cover' }} />
                                                            )}
                                                            <button 
                                                                type="button"
                                                                className="shadow-sm d-flex align-items-center justify-content-center"
                                                                style={crossButtonStyle}
                                                                onClick={() => removeFromPostMedia(idx)}
                                                                title="Remove Media"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {postForm.post_type === 'campaign' ? (
                                            <>
                                                <Form.Group className="mb-3"><Form.Label className="fw-bold">Photos (Upload multiple)</Form.Label><Form.Control type="file" multiple accept="image/*" style={inputStyle} onChange={e => setPostFiles(Array.from(e.target.files))} /></Form.Group>
                                                <Form.Group className="mb-4"><Form.Label className="fw-bold">YouTube Links (One per line)</Form.Label><Form.Control as="textarea" rows={2} style={inputStyle} value={postVideoUrls.join('\n')} onChange={e => setPostVideoUrls(e.target.value.split('\n'))} /></Form.Group>
                                            </>
                                        ) : (
                                            <Form.Group className="mb-4"><Form.Label className="fw-bold">Image (Optional)</Form.Label><Form.Control type="file" accept="image/*" style={inputStyle} onChange={e => setPostFiles(e.target.files[0] ? [e.target.files[0]] : [])} /></Form.Group>
                                        )}
                                        <div className="d-flex gap-2">
                                            <Button variant="primary" type="submit" disabled={loading} className="px-5 fw-bold">{loading ? <Spinner size="sm" /> : (editMode.id ? 'Update' : 'Post Now')}</Button>
                                            {editMode.id && <Button variant="secondary" onClick={resetForm}>Cancel</Button>}
                                        </div>
                                    </Form>
                                </Card>

                                <Card className="p-4 shadow border">
                                    <h4 className="mb-3 fw-bold">Current Announcements & Thoughts</h4>
                                    <Table responsive hover>
                                        <thead className="table-dark">
                                            <tr><th>Subject</th><th>Type</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {posts.map(p => (
                                                <tr key={p.id}>
                                                    <td>{p.subject}</td>
                                                    <td className="text-capitalize">{p.post_type}</td>
                                                    <td>
                                                        <Button variant="outline-primary" size="sm" onClick={() => startEdit(p.post_type, p)}>Edit</Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card>
                            </Tab.Pane>
                            <Tab.Pane eventKey="volunteers">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">Verified Volunteers</h3>
                                    <Table responsive hover>
                                        <thead className="table-dark">
                                            <tr><th>Name</th><th>Mobile</th><th>Pincode</th><th>Level</th><th>Date</th></tr>
                                        </thead>
                                        <tbody>
                                            {volunteers.map(v => (
                                                <tr key={v.id}>
                                                    <td className="fw-bold">{v.name}</td>
                                                    <td>{v.number}</td>
                                                    <td><Badge bg="success">{v.pincode}</Badge></td>
                                                    <td>{v.association}</td>
                                                    <td>{new Date(v.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                            {volunteers.length === 0 && (
                                                <tr><td colSpan="5" className="text-center text-muted py-4">No volunteers found.</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card>
                            </Tab.Pane>
                            <Tab.Pane eventKey="help">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">Pending Help Entries</h3>
                                    {helpEntries.length === 0 ? (
                                        <p className="text-center py-5 text-muted">No pending help entries.</p>
                                    ) : (
                                        <Table responsive hover>
                                            <thead className="table-dark">
                                                <tr><th>Type</th><th>Category</th><th>Title</th><th>Description</th><th>Date</th><th>Actions</th></tr>
                                            </thead>
                                            <tbody>
                                                {helpEntries.map(h => (
                                                    <tr key={h.id}>
                                                        <td><Badge bg={h.entry_type === 'seeking' ? 'danger' : 'success'}>{h.entry_type === 'seeking' ? 'Seeking' : 'Providing'}</Badge></td>
                                                        <td><Badge bg="secondary">{h.category}</Badge></td>
                                                        <td className="fw-bold">{h.title}</td>
                                                        <td>
                                                            <div className="text-truncate" style={{maxWidth: '200px'}}>{h.description}</div>
                                                        </td>
                                                        <td>{new Date(h.created_at).toLocaleDateString()}</td>
                                                        <td>
                                                            <Button variant="info" size="sm" onClick={() => {
                                                                setPreviewHelpEntry(h);
                                                                setAdminComment('');
                                                            }}>View Details</Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="donations">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-primary fw-bold">Update Donation Goal & Collections</h3>
                                    <Form onSubmit={handleDonationSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-bold">Month</Form.Label>
                                                    <Form.Select required value={donationGoal.month} onChange={e => setDonationGoal({ ...donationGoal, month: e.target.value })}>
                                                        {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-bold">Year</Form.Label>
                                                    <Form.Control type="number" required value={donationGoal.year} onChange={e => setDonationGoal({ ...donationGoal, year: e.target.value })} />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-bold">Set Monthly Target (₹)</Form.Label>
                                                    <Form.Control type="number" placeholder="e.g., 50000" value={donationGoal.target_amount} onChange={e => setDonationGoal({ ...donationGoal, target_amount: e.target.value })} />
                                                    <Form.Text className="text-muted">Leave blank to keep existing target.</Form.Text>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="fw-bold text-success">Add Today's Collection (₹)</Form.Label>
                                                    <Form.Control type="number" placeholder="e.g., 500" value={donationGoal.add_collection} onChange={e => setDonationGoal({ ...donationGoal, add_collection: e.target.value })} />
                                                    <Form.Text className="text-muted">This amount will be added to the total collected so far.</Form.Text>
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Button variant="primary" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
                                            {loading ? <Spinner size="sm" /> : 'Update Donations'}
                                        </Button>
                                    </Form>
                                </Card>
                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>

            {/* Help Entry Preview Modal */}
            <Modal show={!!previewHelpEntry} onHide={() => { setPreviewHelpEntry(null); setAdminComment(''); }} size="lg" centered>
                <Modal.Header closeButton className={previewHelpEntry?.entry_type === 'seeking' ? 'bg-danger text-white' : 'bg-success text-white'}>
                    <Modal.Title>Review Help Entry: {previewHelpEntry?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex justify-content-between mb-3">
                        <Badge bg={previewHelpEntry?.entry_type === 'seeking' ? 'danger' : 'success'}>
                            {previewHelpEntry?.entry_type === 'seeking' ? 'Seeking Help' : 'Providing Help'}
                        </Badge>
                        <Badge bg="secondary">{previewHelpEntry?.category}</Badge>
                    </div>
                    <p><strong>Description:</strong></p>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{previewHelpEntry?.description}</p>
                    
                    {previewHelpEntry?.media && previewHelpEntry.media.length > 0 && (
                        <div className="mb-4">
                            <strong>Attached Images:</strong>
                            <div className="d-flex gap-3 mt-2 flex-wrap">
                                {previewHelpEntry.media.map(m => (
                                    <img key={m.id} src={`${API_BASE_URL}${m.url}`} alt="Attached" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <Form.Group className="mb-3 mt-4">
                        <Form.Label className="fw-bold">Admin Comment (Required)</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            placeholder="Enter reason for approval or rejection..."
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={() => handleHelpStatus(previewHelpEntry.id, 'rejected', adminComment)}>
                        Reject
                    </Button>
                    <Button variant="success" onClick={() => handleHelpStatus(previewHelpEntry.id, 'approved', adminComment)}>
                        Approve
                    </Button>
                </Modal.Footer>
            </Modal>

        </Container>
    );
};

export default Admin;
