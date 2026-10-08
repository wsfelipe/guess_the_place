import { useEffect, useState } from 'react';
import { MAX, compare } from '../lib/game';
import { ptSummary } from '../lib/photos';
import { useAuth } from './AuthContext';

function Countdown() {
  const calc = () => {
    const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return Math.max(0, Math.floor((next - now) / 1000));
  };
  const [s, setS] = useState(calc);
  useEffect(() => { const iv = setInterval(() => setS(calc()), 1000); return () => clearInterval(iv); }, []);
  const p = n => String(n).padStart(2, '0');
  return <p className="next">Próximo desafio em {p(Math.floor(s / 3600))}:{p(Math.floor(s % 3600 / 60))}:{p(s % 60)}</p>;
}

export default function Result({ mode, label, day, target, st, byId }) {
  const { enabled, user, openAuth } = useAuth();
  const [about, setAbout] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let off = false;
    ptSummary(target.name).then(t => { if (!off) setAbout(t); });
    return () => { off = true; };
  }, [target.name]);

  const wikiUrl = 'https://pt.wikipedia.org/wiki/' + encodeURIComponent(target.name.replace(/\s*\(.*\)/, '').replace(/ /g, '_'));

  function shareText() {
    const sq = { hit: '🟩', near: '🟨', miss: '⬜' };
    const grid = st.guesses.map(id => compare(mode, byId(id), target).map(c => sq[c.cls]).join('')).join('\n');
    return `Pino · ${label} #${day + 1}\n${st.won ? st.guesses.length : 'X'}/${MAX} · ${st.score} pontos\n${grid}\n${location.origin}${location.pathname}`;
  }
  async function copy() {
    try { await navigator.clipboard.writeText(shareText()); setCopied(true); }
    catch { window.prompt('Copie o resultado:', shareText()); }
  }

  return (
    <div className="result">
      <h2>{st.won ? 'Acertou! ' : 'Era '}{target.name}{mode === 'cidade' ? `, ${target.country}` : ''}</h2>
      <p className="pts">{st.score} pontos</p>
      {about && <p className="about">{about}</p>}
      <div className="actions">
        <button className="btn" type="button" onClick={copy}>{copied ? 'Copiado' : 'Copiar resultado'}</button>
        <a className="btn ghost" style={{ display: 'inline-grid', placeContent: 'center', textDecoration: 'none' }}
           href={wikiUrl} target="_blank" rel="noopener noreferrer">Ler na Wikipédia</a>
        {enabled && !user && (
          <button className="link" type="button" onClick={() => openAuth('signup')}>Entre para salvar sua pontuação</button>
        )}
      </div>
      <Countdown />
    </div>
  );
}
