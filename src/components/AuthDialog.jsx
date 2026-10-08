import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { sb } from '../lib/supabase';

export default function AuthDialog() {
  const { dialog, closeAuth, setDialogMode } = useAuth();
  const ref = useRef(null);
  const mode = dialog || 'login';
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [msg, setMsg] = useState({ text: '', err: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (dialog && !d.open) d.showModal();
    if (!dialog && d.open) d.close();
    if (dialog) setMsg({ text: '', err: false });
  }, [dialog]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const fail = text => setMsg({ text, err: true });

  async function submit(e) {
    e.preventDefault();
    const email = form.email.trim(), username = form.username.trim();
    if (!email || form.password.length < 6) return fail('Informe e-mail e uma senha de 6+ caracteres.');
    if (mode === 'signup' && !/^[A-Za-z0-9_]{3,20}$/.test(username)) return fail('Usuário: 3 a 20 caracteres, só letras, números e _.');
    setBusy(true); setMsg({ text: '', err: false });
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password: form.password });
        if (error) throw error;
      } else {
        const { data, error } = await sb.auth.signUp({ email, password: form.password, options: { data: { username } } });
        if (error) throw error;
        if (!data.session) setMsg({ text: 'Conta criada. Confirme o e-mail para entrar.', err: false });
      }
    } catch (err) {
      fail(/Invalid login/i.test(err.message) ? 'E-mail ou senha incorretos.' : err.message);
    } finally { setBusy(false); }
  }

  return (
    <dialog ref={ref} onClose={closeAuth} aria-labelledby="authTitle">
      <form onSubmit={submit} noValidate>
        <div className="dlg-head">
          <h2 id="authTitle">{mode === 'login' ? 'Entrar' : 'Criar conta'}</h2>
          <button type="button" className="link" onClick={closeAuth}>Fechar</button>
        </div>
        <div className="seg" role="tablist">
          {[['login', 'Entrar'], ['signup', 'Criar conta']].map(([m, label]) => (
            <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setDialogMode(m)}>{label}</button>
          ))}
        </div>
        {mode === 'signup' && (
          <label className="f">Nome de usuário
            <input value={form.username} onChange={set('username')} autoComplete="username" maxLength={20} placeholder="letras, números e _" />
          </label>
        )}
        <label className="f">E-mail
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </label>
        <label className="f">Senha
          <input type="password" value={form.password} onChange={set('password')} minLength={6} required
                 autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </label>
        <p className={'msg' + (msg.err ? ' err' : '')} role="alert">{msg.text}</p>
        <button type="submit" className="btn" disabled={busy}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      </form>
    </dialog>
  );
}
