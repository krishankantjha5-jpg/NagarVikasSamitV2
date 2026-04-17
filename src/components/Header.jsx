import logo from '../assets/logo.png';
import WavingFlag from './WavingFlag';
import { useLang } from '../LanguageContext';
import { useT } from '../translations';

const Header = () => {
    const { lang } = useLang();
    const T = useT(lang);

    return (
        <div className="header-container">
            <div className="logo-section">
                <img src={logo} alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#212529' }}>{T.orgName}</h2>
            </div>
            <div className="flag-section" style={{ display: 'flex', alignItems: 'center' }}>
                <WavingFlag width={140} height={93} />
            </div>
        </div>
    );
};

export default Header;
