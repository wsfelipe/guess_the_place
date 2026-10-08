import { useMemo, useRef, useState } from 'react';
import { norm } from '../lib/game';

export default function GuessInput({ mode, list, taken, onPick, lang = 'pt' }) {
  const [value, setValue] = useState('');
  const [hi, setHi] = useState(0);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const shown = useMemo(() => {
    const nq = norm(value);
    if (!nq) return [];
    const left = list.filter(x => !taken.includes(x.id));
    // filtro por país (ex: 'uruguai' -> cidades do UR)
    const countryMatch = left.filter(x => x.country && norm(x.country).includes(nq));
    const starts = left.filter(x => norm(x.name).startsWith(nq));
    const incl = left.filter(x => !norm(x.name).startsWith(nq) && norm(x.name).includes(nq));
    // se digitou nome de país, prioriza as cidades dele + match por nome
    const combined = countryMatch.length ? countryMatch.concat(starts.filter(x => !countryMatch.includes(x))).concat(incl.filter(x => !countryMatch.includes(x) && !starts.includes(x))) : starts.concat(incl);
    return combined.slice(0, 8);
  }, [value, list, taken]);

  const listOpen = open && shown.length > 0;

  function choose(g) {
    setValue(''); setOpen(false); setError('');
    onPick(g);
    inputRef.current && inputRef.current.focus();
  }
  function submit(e) {
    e.preventDefault();
    const nq = norm(value);
    const g = (listOpen && shown[hi]) || list.find(x => norm(x.name) === nq && !taken.includes(x.id));
    if (!g) { setError('Escolha um item da lista.'); return; }
    choose(g);
  }
  function onKey(e) {
    if (!shown.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi(h => (h + 1) % shown.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setHi(h => (h - 1 + shown.length) % shown.length); }
    else if (e.key === 'Escape') setOpen(false);
  }

  return (
    <>
      <form className="guess" onSubmit={submit} autoComplete="off">
        <div className="combo">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={listOpen}
            aria-controls="opts"
            aria-label="Seu palpite"
            placeholder={mode === 'cidade' ? 'Digite uma cidade' : 'Digite um país'}
            spellCheck={false}
            value={value}
            onChange={e => { setValue(e.target.value); setHi(0); setOpen(true); setError(''); }}
            onKeyDown={onKey}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
          />
          {listOpen && (
            <ul className="opts" id="opts" role="listbox">
              {shown.map((x, i) => (
                <li
                  key={x.id}
                  role="option"
                  aria-selected={i === hi}
                  onMouseDown={e => { e.preventDefault(); choose(x); }}
                  onMouseEnter={() => setHi(i)}
                >
                  {x.name}{mode === 'cidade' && <small>{x.country}</small>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="btn" type="button" onClick={() => { setValue(''); onPick({ id: '__skip__', name: 'Pular' }); }}>{lang === 'en' ? 'Skip' : lang === 'es' ? 'Saltar' : 'Pular'}</button>
        <button className="btn" type="submit">{lang === 'en' ? 'Guess' : lang === 'es' ? 'Adivinar' : 'Chutar'}</button>
      </form>
      <p className={'msg' + (error ? ' err' : '')}>{error}</p>
    </>
  );
}
