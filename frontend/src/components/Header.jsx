import logo from '../assets/logo.png';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';
import { Link } from 'react-router-dom';

const Header = () => {
    const { lang } = useLang();
    const T = useT(lang);

    return (
        <>
            <Link to="/encourage-us" style={{ textDecoration: 'none', display: 'block', backgroundColor: '#1e3a8a', overflow: 'hidden', width: '100%' }}>
                <div style={{ 
                    color: '#fbbf24', 
                    padding: '8px 0', 
                    fontSize: '1rem', 
                    fontWeight: '700', 
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                    animation: 'marquee 20s linear infinite',
                    textTransform: 'uppercase',
                    display: 'inline-block'
                }}>
                    {T.helpSamitiMsg}
                </div>
            </Link>
            <style>
                {`
                    @keyframes marquee {
                        0% { transform: translateX(100vw); }
                        100% { transform: translateX(-100%); }
                    }
                `}
            </style>
            <div className="header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
                <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#1e293b', fontWeight: '700', letterSpacing: '-0.5px' }}>{T.orgName}</h2>
                </div>
                <div className="chakra-section" style={{ display: 'flex', alignItems: 'center', animation: 'spin 20s linear infinite' }}>
                    <svg viewBox="0 0 100 100" width="55" height="55" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#1e3a8a" strokeWidth="3"/>
                        <circle cx="50" cy="50" r="7" fill="#1e3a8a"/>
                        {Array.from({length: 24}).map((_, i) => (
                            <path key={i} d="M 50 43 L 48 5 L 50 5 L 52 5 Z" fill="#1e3a8a" transform={`rotate(${i * 15} 50 50)`} />
                        ))}
                        <style>
                            {`
                                @keyframes spin { 100% { transform: rotate(360deg); } }
                            `}
                        </style>
                    </svg>
                </div>
            </div>
        </>
    );
};

export default Header;
