import { useCallback, useEffect, useMemo, useState } from 'react';
import { MAX, MODES, getDay, mulberry32, pickTarget, pointsFor, readJSON, writeJSON } from '../lib/game';
import { loadPhotos } from '../lib/photos';
import { useAuth } from './AuthContext';
import Stage from './Stage';
import GuessInput from './GuessInput';
import GuessTable from './GuessTable';
import Result from './Result';

function usePhotos(mode, day, target, seed) {
  const [state, setState] = useState({ status: 'loading', photos: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let off = false;
    setState({ status: 'loading', photos: null });
    loadPhotos(mode, day, target, seed, attempt > 0)
      .then(photos => { if (!off) setState({ status: 'ready', photos }); })
      .catch(() => { if (!off) setState({ status: 'error', photos: [] }); });
    return () => { off = true; };
  }, [mode, day, target.id, seed, attempt]);

  return { ...state, retry: () => setAttempt(a => a + 1) };
}

export default function Game({ mode, lang = 'pt' }) {
  const cfg = MODES[mode];
  const day = useMemo(getDay, []);
  const target = useMemo(() => pickTarget(cfg, day), [cfg, day]);
  const byId = useCallback(id => cfg.list.find(x => x.id === id), [cfg]);
  const focus = useMemo(() => {
    const r = mulberry32(day * 31 + cfg.seed);           // ponto focal do zoom do dia
    return { x: 25 + r() * 50, y: 25 + r() * 50 };
  }, [day, cfg]);

  const key = `pino:state:${mode}:${day}`;
  const [st, setSt] = useState(() => readJSON(key) || { guesses: [], done: false, won: false, score: 0 });
  const [fresh, setFresh] = useState(false);
  const { savePending } = useAuth();
  const photos = usePhotos(mode, day, target, day * 7 + cfg.seed);

  const tries = st.guesses.length;

  // quando o jogo termina, manda a pontuação (se estiver logado)
  useEffect(() => { if (st.done) savePending(); }, [st.done, savePending]);

  function pick(g) {
    if (st.done) return;
    if (g.id === '__skip__') {
      // pular: não conta como tentativa, apenas avança? Ou conta como palpites usados sem pontos?
      // Sistema de pontos: pular reseta? Melhor: conta como errado mas com pontos reduzidos?
      // Vamos manter: pular = consome uma tentativa sem acertar (mesmo que chutar errado) mas sem penalizar pontos?
      // Vou fazer: pular consome tentativa como errado, mas mantém o sistema de pontos normal
      const guesses = [...st.guesses, '__skip__'];
      const done = guesses.length >= MAX;
      const won = false;
      const next = { guesses, done, won, score: 0 };
      writeJSON(key, next);
      setSt(next);
      setFresh(true);
      return;
    }
    const guesses = [...st.guesses, g.id];
    const won = g.id === target.id;
    const done = won || guesses.length >= MAX;
    const next = { guesses, done, won: done && won, score: done && won ? pointsFor(guesses.length - 1) : 0 };
    writeJSON(key, next);
    setSt(next);
    setFresh(true);
  }

  return (
    <section>
      <Stage photos={photos.photos} status={photos.status} tries={tries} done={st.done} focus={focus} onRetry={photos.retry} />

      <div className="status">
        <span>
          {st.done
            ? (st.won ? `Resolvido em ${tries} ${tries === 1 ? 'tentativa' : 'tentativas'}` : 'Fim das tentativas')
            : <>Tentativa <strong>{tries + 1}</strong> de {MAX}</>}
        </span>
        {!st.done && <span>Vale <strong>{pointsFor(tries)}</strong> pontos</span>}
      </div>

      {!st.done && <GuessInput mode={mode} list={cfg.list} taken={st.guesses} onPick={pick} lang={lang} />}

      <GuessTable mode={mode} guesses={st.guesses} target={target} byId={byId} fresh={fresh} />

      {st.done && <Result mode={mode} label={cfg.label} day={day} target={target} st={st} byId={byId} />}
    </section>
  );
}
