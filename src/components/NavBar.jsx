import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import NetworkStatus from './NetworkStatus';
import InstallButton from './InstallButton';

export default function NavBar() {
  const { user, nickname, loading, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { pathname } = useLocation();
  const [menuPath, setMenuPath] = useState(null);
  const open = menuPath === pathname;

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') setMenuPath(null);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  function closeOnItem(e) {
    if (e.target.closest('a, button')) setMenuPath(null);
  }

  return (
    <>
      <header className={open ? 'navbar navbar--open' : 'navbar'}>
        <Link to="/" className="logo">
          SAVE<span>POINT</span>
        </Link>

        <div className="navbar__tools">
          <NetworkStatus />
          <button
            type="button"
            className="burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="main-menu"
            onClick={() => setMenuPath(open ? null : pathname)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav id="main-menu" aria-label="Main" onClick={closeOnItem}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/games">Games</NavLink>
          <NavLink to="/wishlist">Wishlist ({wishlist.length})</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/about">About</NavLink>
          {!loading && !user && (
            <>
              <NavLink to="/login" className="nav-player">
                Login
              </NavLink>
              <NavLink to="/signup" className="nav-player">
                Signup
              </NavLink>
            </>
          )}
          {!loading && user && (
            <>
              <NavLink to="/profile" className="nav-player" title={nickname}>
                Profile
              </NavLink>
              <button type="button" className="nav-logout" onClick={logout}>
                Logout
              </button>
            </>
          )}
          <InstallButton />
        </nav>
      </header>
      {open && <div className="nav-backdrop" onClick={() => setMenuPath(null)} />}
    </>
  );
}
