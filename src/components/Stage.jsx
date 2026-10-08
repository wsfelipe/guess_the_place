import { useEffect, useRef, useState } from 'react';
import { UNLOCK, ZOOM } from '../lib/game';

// Foto principal com zoom que abre a cada palpite + miniaturas que destravam.
export default function Stage({ photos, status, tries, done, focus, onRetry }) {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  const unlocked = i => done || i === 0 || tries >= UNLOCK[i];
  const idx = photos && photos[active] && unlocked(active) ? active : 0;
  const cur = photos && photos[idx];

  useEffect(() => {
    setLoaded(false);
    if (imgRef.current && imgRef.current.complete) setLoaded(true);
  }, [cur && cur.src]);

  const failed = status === 'error' || (status === 'ready' && photos.length === 0);
  const scale = idx === 0 && !done ? ZOOM[Math.min(tries, ZOOM.length - 1)] : 1;

  return (
    <div>
      <div className={'frame' + (!failed && !loaded ? ' loading' : '')}>
        {cur && (
          <img
            ref={imgRef}
            src={cur.src}
            alt="Foto do lugar misterioso"
            onLoad={() => setLoaded(true)}
            style={{ transform: `scale(${scale})`, transformOrigin: `${focus.x}% ${focus.y}%`, visibility: loaded ? 'visible' : 'hidden' }}
          />
        )}
        {failed && (
          <div className="note">
            <span>Não consegui carregar a foto de hoje.</span>
            <button type="button" className="btn ghost" onClick={onRetry}>Tentar de novo</button>
          </div>
        )}
      </div>
      <p className="credit">{cur ? 'Foto: ' + cur.credit : ''}</p>

      {photos && photos.length > 0 && (
        <div className="thumbs">
          {photos.map((p, i) => unlocked(i) ? (
            <button key={p.src} type="button" className="thumb" aria-pressed={i === idx} aria-label={`Foto ${i + 1}`} onClick={() => setActive(i)}>
              <img src={p.src} alt="" loading="lazy" />
            </button>
          ) : (
            <span key={p.src} className="thumb locked">Foto {i + 1} na tentativa {UNLOCK[i] + 1}</span>
          ))}
        </div>
      )}
    </div>
  );
}
