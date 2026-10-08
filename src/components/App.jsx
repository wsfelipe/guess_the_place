import { useEffect, useState } from 'react';
import { i18n } from '../lib/i18n';
import { useAuth } from './AuthContext';
import Game from './Game';
import Ranking from './Ranking';
import About from './About';
import AuthDialog from './AuthDialog';

const TABS = [
  { id: 'pais', label: 'País' },
  { id: 'cidade', label: 'Cidade' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'sobre', label: 'Sobre' }
];

function useHashTab() {
  const read = () => {
    const h = (location.hash || '#pais').slice(1);
    return TABS.some(t => t.id === h) ? h : 'pais';
  };
  const [tab, setTab] = useState(read);
  useEffect(() => {
    const on = () => setTab(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return tab;
}

export default function App() {
  const [lang, setLang] = useState('pt');
  const [theme, setTheme] = useState(() => localStorage.getItem('pino:theme') || 'auto');
  const [prefOpen, setPrefOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('pino:theme', theme);
    document.documentElement.setAttribute('data-theme', theme === 'auto' ? '' : theme);
  }, [theme]);
  const t = (k) => i18n[lang]?.[k] || i18n.pt[k];
  const tab = useHashTab();
  const { enabled, user, username, openAuth, signOut } = useAuth();

  return (
    <>
      <header className="top">
        <a className="brand" href="#pais">pino</a>
        <nav className="tabs" aria-label="Seções">
          {TABS.map(t => (
            <a key={t.id} href={`#${t.id}`} aria-current={tab === t.id ? 'page' : undefined}>{t.label}</a>
          ))}
        </nav>
        <button type="button" className="profile-btn" aria-label="Preferências" onClick={() => setPrefOpen(o => !o)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>
          {user && <span className="profile-dot"></span>}
        </button>
        {enabled && (
          <div className="account">
            {user && <span id="who">{username || user.email}</span>}
            <button type="button" className="link" onClick={user ? signOut : () => openAuth('login')}>
              {user ? 'Sair' : 'Entrar'}
            </button>
          </div>
        )}
      </header>

      <main>
        {tab === 'ranking' ? <Ranking lang={lang} /> : tab === 'sobre' ? <About lang={lang} /> : <Game key={tab} mode={tab} lang={lang} />}
      </main>

      <footer className="foot">
        Fotos da Wikipédia/Wikimedia Commons, com licenças livres. Os créditos aparecem abaixo de cada foto.
      </footer>

      <AuthDialog />
      {prefOpen && (
        <div className="pref-modal" role="dialog" aria-modal="true">
          <div className="pref-card">
            <h3>Preferências</h3>
            <div className="pref-row"><label>Idioma</label>
              <div className="pill-group">{['pt','en','es'].map(l => <button key={l} className={lang===l?'on':''} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>)}</div>
            </div>
            <div className="pref-row"><label>Tema</label>
              <div className="pill-group">
                <button className={theme==='auto'?'on':''} onClick={()=>setTheme('auto')}>Auto</button>
                <button className={theme==='light'?'on':''} onClick={()=>setTheme('light')}>Claro</button>
                <button className={theme==='dark'?'on':''} onClick={()=>setTheme('dark')}>Escuro</button>
              </div>
            </div>
            <div className="pref-row"><label>Conta</label>
              {enabled ? <span>{username || 'Logado'}</span> : <span>Não logado</span>}
            </div>
            <button className="btn" type="button" onClick={() => setPrefOpen(false)}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}
