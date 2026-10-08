import { compare } from '../lib/game';

const Arrow = ({ deg }) => (
  <svg viewBox="0 0 10 12" width="10" height="12" aria-hidden="true" style={{ transform: `rotate(${deg}deg)`, flex: 'none' }}>
    <path d="M5 0 10 6H6.5V12h-3V6H0z" fill="currentColor" />
  </svg>
);

export default function GuessTable({ mode, guesses, target, byId, fresh }) {
  if (!guesses.length) return null;
  const heads = (mode === 'cidade' ? ['País'] : []).concat(['Continente', 'Moeda', 'Idiomas', 'População', 'Distância']);
  const n = heads.length;
  const rows = guesses.slice().reverse();   // mais novo no topo

  return (
    <>
      <div className="table-scroll">
        <div className={'table' + (mode === 'cidade' ? ' wide' : '')} style={{ '--n': n }}>
          <div className="row">
            <div className="head">{mode === 'cidade' ? 'Cidade' : 'País'}</div>
            {heads.map(h => <div key={h} className="head">{h}</div>)}
          </div>
          {rows.map((id, idx) => {
            if (id === '__skip__') return <div key={id} className="row skip"><div className="cell name" style={{color:'#888'}}><em>Pulado</em></div></div>;
            const g = byId(id);
            if (!g) return null;
            return (
              <div key={id} className={'row' + (fresh && idx === 0 ? ' fresh' : '')}>
                <div className="cell name">{g.name}</div>
                {compare(mode, g, target).map((c, i) => (
                  <div key={c.k} className={'cell ' + c.cls} style={{ '--i': i }}>
                    <span>{c.text}</span>
                    {c.arrow != null && <Arrow deg={c.arrow} />}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="legend">
        <span><i className="h" />Certo</span>
        <span><i className="n" />Quase (mesmo continente, idioma em comum, população até 2x, tipo de moeda, menos de 1.500 km)</span>
      </div>
    </>
  );
}
