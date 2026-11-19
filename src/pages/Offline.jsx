import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { checkConnection, useOnline } from '../pwa/network';

export default function Offline() {
  const online = useOnline();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from;
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);
  const wasOffline = useRef(!online);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current && from) navigate(from, { replace: true });
  }, [online, from, navigate]);

  async function retry() {
    setChecking(true);
    setFailed(false);
    const ok = await checkConnection();
    setChecking(false);
    if (ok) navigate(from ?? '/', { replace: true });
    else setFailed(true);
  }

  return (
    <div className="offline">
      <section className="offline__box">
        <p className="offline__label">{online ? 'Signal found' : 'No signal'}</p>
        <div className={online ? 'signal signal--on' : 'signal'} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>

        <h1>{online ? 'You are online' : 'You are offline'}</h1>
        {from ? (
          <p>
            The page <code>{from}</code> is not saved on this device yet, so it needs the internet.
          </p>
        ) : (
          <p>This page opens when something cannot load without the internet.</p>
        )}
        <p className="muted">Pages and games you opened before still work offline.</p>

        <p className={online ? 'net net--online' : 'net net--offline'} role="status">
          <span className="net__dot" aria-hidden="true" />
          {online ? 'Connection: online' : 'Connection: offline'}
        </p>

        <button type="button" className="btn offline__retry" onClick={retry} disabled={checking}>
          {checking ? 'Checking...' : 'Retry connection'}
        </button>
        {failed && (
          <p className="field-error">Still no connection. Check your Wi-Fi or mobile data.</p>
        )}

        <div className="offline__links">
          <Link to="/" className="btn btn--light">
            Home
          </Link>
          <Link to="/games" className="btn btn--light">
            Games
          </Link>
          <Link to="/wishlist" className="btn btn--light">
            Wishlist
          </Link>
        </div>
      </section>
    </div>
  );
}
