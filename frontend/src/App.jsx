import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import { LanguageProvider, useLang } from './LanguageContext';
import { useT } from './translations';
import Header from './components/Header';
import Navigation from './components/Navbar';
import Home from './pages/Home';
import Leaders from './pages/Leaders';
import Admin from './pages/Admin';

function AppInner() {
  const { lang } = useLang();
  const T = useT(lang);

  return (
    <div className="app-container">
      <Header />
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/leaders" element={<Leaders />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <footer style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', marginTop: '3rem' }}>
        <Container>
          <div style={{ padding: '2.5rem 0 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 220px' }}>
              <h5 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fff' }}>🏛️ {T.orgName}</h5>
              <p style={{ color: '#adb5bd', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: 0 }}>{T.footerTagline}</p>
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <h6 style={{ fontWeight: 700, color: '#e9ecef', marginBottom: '1rem', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}>{T.followUs}</h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <a href="https://www.facebook.com/share/1AwUAQD1V3/" target="_blank" rel="noopener noreferrer" style={{ color: '#74b9ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
                <a href="https://x.com/NagarVikasSmiti" target="_blank" rel="noopener noreferrer" style={{ color: '#74b9ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.763l7.726-8.835L1.254 2.25H8.08l4.713 5.586zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                </a>
                <a href="https://youtube.com/@nagarvikassamiti?feature=shared" target="_blank" rel="noopener noreferrer" style={{ color: '#74b9ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </a>
                <a href="https://chat.whatsapp.com/JsnHEaAXRY9GdQU1Z0pMZA?mode=gi_t" target="_blank" rel="noopener noreferrer" style={{ color: '#74b9ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  WhatsApp Group
                </a>
              </div>
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <h6 style={{ fontWeight: 700, color: '#e9ecef', marginBottom: '1rem', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}>{T.contactUs}</h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <a href="tel:9217017090" style={{ color: '#55efc4', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#55efc4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3-8.59 2 2 0 0 1 1.98-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  +91 92170 17090
                </a>
                <a href="mailto:nagarvikassamiti32@gmail.com" style={{ color: '#fdcb6e', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fdcb6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  nagarvikassamiti32@gmail.com
                </a>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem 0', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.85rem' }}>{T.footerCopy}</p>
            <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>{T.footerMotto}</small>
          </div>
        </Container>
      </footer>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <Router>
        <AppInner />
      </Router>
    </LanguageProvider>
  );
}
const Container = ({ children }) => <div className="container">{children}</div>;

export default App;
