import { useEffect, useState } from 'react';
import { PINO } from '../lib/data';
import { getDay, pickTarget, MODES } from '../lib/game';
import { loadPhotos } from '../lib/photos';

export default function About({ lang = 'pt' }) {
  const [target, setTarget] = useState(null);
  const [text, setText] = useState('');

  useEffect(() => {
    const d = getDay();
    const cfg = MODES.cidade;
    setTarget(pickTarget(cfg, d));
  }, []);

  const [photos, setPhotos] = useState([]);
  useEffect(() => {
    if (!target) return;
    loadPhotos('cidade', getDay(), target, getDay() * 7 + MODES.cidade.seed, true).then(p => setPhotos(p || [])).catch(() => setPhotos([]));
  }, [target]);

  useEffect(() => {
    if (!target) return;
    (async () => {
      try {
        // tenta extrato de introdução em pt/en/es da wikipedia
        const langMap = { pt: 'pt', en: 'en', es: 'es' };
        const host = langMap[lang] || 'pt';
        const clean = target.wiki.replace(/\s*\(.*\)/, '').replace(/,/g, '');
        const u = `https://${host}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&exsentences=5&redirects=1&format=json&origin=*&titles=${encodeURIComponent(clean)}`;
        const r = await fetch(u);
        const d = await r.json();
        const page = Object.values(d.query.pages)[0];
        setText(page.extract || '');
      } catch { setText(''); }
    })();
  }, [target, lang]);

  if (!target) return <p>Carregando...</p>;

  return (
    <section className="about">
      <h2>Sobre o lugar de hoje</h2>
      <h3>{target.name} — {target.country}</h3>
      <p className="lead">{text || 'Um lugar fascinante, com histórias que atravessam séculos.'}</p>

      <div className="cards">
        <article className="card">
          <h4>História</h4>
          <p>Desde suas origens, {target.name} foi palco de encontros entre culturas. Seu desenvolvimento urbano mistura tradição e modernidade, com marcos que contam a evolução de uma sociedade ao longo do tempo.</p>
        </article>
        <article className="card">
          <h4>Curiosidades</h4>
          <p>Você sabia? {target.name} tem uma geografia singular que influencia clima, arquitetura e até a gastronomia local. Fatos pouco conhecidos aguardam quem se aventura além das imagens principais.</p>
        </article>
      </div>

      <div className="gallery-small">
        {photos.map(p => <img key={p.src} src={p.src} alt={target.name} />)}
        <p className="credit">Fonte: Wikimedia Commons</p>
      </div>
    </section>
  );
}
