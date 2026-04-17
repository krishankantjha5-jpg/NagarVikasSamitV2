import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Nav, Tab, Table, Badge } from 'react-bootstrap';
import axios from 'axios';
import { Edit } from 'lucide-react';

const Admin = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Listings
    const [activities, setActivities] = useState([]);
    const [posts, setPosts] = useState([]);
    const [volunteers, setVolunteers] = useState([]);

    // Form State
    const [editMode, setEditMode] = useState({ id: null, type: null }); // {id, type: 'work'|'post'}
    const [workForm, setWorkForm] = useState({ title: '', description: '', media: [] });
    const [postForm, setPostForm] = useState({ subject: '', content: '', post_type: 'thought' });
    const [workFiles, setWorkFiles] = useState([]);
    const [postFile, setPostFile] = useState(null);
    const [videoUrls, setVideoUrls] = useState(['']);
    const [formKey, setFormKey] = useState(0); // increment to force-clear file inputs

    useEffect(() => {
        if (isLoggedIn) {
            refreshData();
        }
    }, [isLoggedIn]);

    const refreshData = async () => {
        try {
            const [aRes, pRes, vRes] = await Promise.all([
                axios.get('http://localhost:8000/activities'),
                axios.get('http://localhost:8000/posts'),
                axios.get('http://localhost:8000/volunteers')
            ]);
            setActivities(aRes.data);
            setPosts(pRes.data);
            setVolunteers(vRes.data);
        } catch (err) { console.error("Refresh failed", err); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:8000/login', credentials);
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
                const res = await axios.post('http://localhost:8000/upload', formData);
                mediaList.push({ url: res.data.image_url, file_type: 'image' });
            }

            // Process video URLs
            videoUrls.filter(v => v.trim() !== '').forEach(v => {
                if (!mediaList.find(m => m.url === v)) {
                    mediaList.push({ url: v, file_type: 'video' });
                }
            });

            const data = { ...workForm, media: mediaList };

            if (editMode.type === 'work') {
                await axios.put(`http://localhost:8000/activities/${editMode.id}`, data);
                setSuccessMsg('Activity updated!');
            } else {
                await axios.post('http://localhost:8000/activities', data);
                setSuccessMsg('Activity added!');
            }

            resetForm();
            refreshData();
        } catch (err) { alert('Operation failed.'); }
        finally { setLoading(false); }
    };

    const handlePostSubmit = async (e, type) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = postForm.image_url;
            if (postFile) {
                const formData = new FormData();
                formData.append('file', postFile);
                const res = await axios.post('http://localhost:8000/upload', formData);
                imageUrl = res.data.image_url;
            }

            const data = { ...postForm, post_type: type, image_url: imageUrl };

            if (editMode.id && editMode.type === type) {
                await axios.put(`http://localhost:8000/posts/${editMode.id}`, data);
                setSuccessMsg('Post updated!');
            } else {
                await axios.post('http://localhost:8000/posts', data);
                setSuccessMsg('Post created!');
            }

            resetForm();
            refreshData();
        } catch (err) { alert('Operation failed.'); }
        finally { setLoading(false); }
    };


    const startEdit = (type, item) => {
        setEditMode({ id: item.id, type: type });
        if (type === 'work') {
            setWorkForm({ title: item.title, description: item.description, media: item.media });
            setVideoUrls(item.media.filter(m => m.file_type === 'video').map(m => m.url));
        } else {
            setPostForm({ subject: item.subject, content: item.content, post_type: item.post_type, image_url: item.image_url });
        }
    };

    const resetForm = () => {
        setEditMode({ id: null, type: null });
        setWorkForm({ title: '', description: '', media: [] });
        setPostForm({ subject: '', content: '', post_type: 'thought' });
        setWorkFiles([]);
        setPostFile(null);
        setVideoUrls(['']);
        setFormKey(k => k + 1); // re-mount forms to clear file inputs
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    const inputStyle = { border: '2px solid #343a40', backgroundColor: '#fff' };
    const navStyle = { backgroundColor: '#1a237e', borderRadius: '12px' };

    if (!isLoggedIn) {
        return (
            <Container className="py-5 d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
                <Card className="p-4 shadow-lg border-0" style={{maxWidth: '400px', width: '100%', borderRadius: '15px'}}>
                    <h2 className="text-center mb-4 text-primary fw-bold">Admin Login</h2>
                    {loginError && <Alert variant="danger">{loginError}</Alert>}
                    <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Username</Form.Label><Form.Control type="text" required style={inputStyle} onChange={e => setCredentials({...credentials, username: e.target.value})} /></Form.Group>
                        <Form.Group className="mb-4"><Form.Label className="fw-bold">Password</Form.Label><Form.Control type="password" required style={inputStyle} onChange={e => setCredentials({...credentials, password: e.target.value})} /></Form.Group>
                        <Button variant="primary" type="submit" className="w-100 py-2 fw-bold">Login</Button>
                    </Form>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <h1 className="mb-4 text-center fw-bold">Nagar Vikas Samiti Management</h1>
            {successMsg && <Alert variant="success" className="mb-4 text-center fw-bold">{successMsg}</Alert>}
            
            <Tab.Container defaultActiveKey="work">
                <Row className="g-4">
                    <Col lg={3}>
                        <Nav variant="pills" className="flex-column p-3 shadow-lg" style={navStyle}>
                            <Nav.Item className="mb-3"><Nav.Link eventKey="work" className="text-white py-3 fw-bold text-center">Manage Our Work</Nav.Link></Nav.Item>
                            <Nav.Item className="mb-3"><Nav.Link eventKey="thoughts" className="text-white py-3 fw-bold text-center">Announcements</Nav.Link></Nav.Item>
                            <Nav.Item className="mb-3"><Nav.Link eventKey="volunteers" className="text-white py-3 fw-bold text-center">Volunteers</Nav.Link></Nav.Item>
                        </Nav>
                        <Button variant="outline-danger" className="w-100 mt-4 fw-bold" onClick={() => setIsLoggedIn(false)}>Logout</Button>
                    </Col>

                    <Col lg={9}>
                        <Tab.Content>
                            <Tab.Pane eventKey="work">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">{editMode.type === 'work' ? 'Edit Activity' : 'Create New Activity'}</h3>
                                    <Form key={formKey} onSubmit={handleWorkSubmit}>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Title</Form.Label><Form.Control type="text" required style={inputStyle} value={workForm.title} onChange={e => setWorkForm({...workForm, title: e.target.value})} /></Form.Group>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Description</Form.Label><Form.Control as="textarea" rows={2} required style={inputStyle} value={workForm.description} onChange={e => setWorkForm({...workForm, description: e.target.value})} /></Form.Group>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Photos (Upload new)</Form.Label><Form.Control type="file" multiple accept="image/*" style={inputStyle} onChange={e => setWorkFiles(Array.from(e.target.files))} /></Form.Group>
                                        <Form.Group className="mb-4"><Form.Label className="fw-bold">YouTube Links (One per line)</Form.Label><Form.Control as="textarea" rows={2} style={inputStyle} value={videoUrls.join('\n')} onChange={e => setVideoUrls(e.target.value.split('\n'))} /></Form.Group>
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
                                                        <Button variant="outline-primary" size="sm" onClick={() => startEdit('work', a)}><Edit size={16} /></Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card>
                            </Tab.Pane>

                            <Tab.Pane eventKey="thoughts">
                                <Card className="p-4 shadow border mb-4">
                                    <h3 className="mb-4 text-indigo fw-bold">{editMode.id ? 'Edit Announcement' : 'New Announcement'}</h3>
                                    <Form key={formKey} onSubmit={e => handlePostSubmit(e, postForm.post_type)}>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Type</Form.Label><Form.Select style={inputStyle} value={postForm.post_type} onChange={e => setPostForm({...postForm, post_type: e.target.value})}><option value="thought">Daily Thought</option><option value="campaign">Announcement</option></Form.Select></Form.Group>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Subject</Form.Label><Form.Control type="text" required style={inputStyle} value={postForm.subject} onChange={e => setPostForm({...postForm, subject: e.target.value})} /></Form.Group>
                                        <Form.Group className="mb-3"><Form.Label className="fw-bold">Content</Form.Label><Form.Control as="textarea" rows={3} required style={inputStyle} value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} /></Form.Group>
                                        <Form.Group className="mb-4"><Form.Label className="fw-bold">Image (Optional)</Form.Label><Form.Control type="file" accept="image/*" style={inputStyle} onChange={e => setPostFile(e.target.files[0])} /></Form.Group>
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
                                                        <Button variant="outline-primary" size="sm" onClick={() => startEdit(p.post_type, p)}><Edit size={16} /></Button>
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
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </Container>
    );
};

export default Admin;
