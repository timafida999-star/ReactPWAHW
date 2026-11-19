import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import NavBar from './NavBar';
import Loading from './Loading';
import ConnectionBar from './ConnectionBar';
import UpdatePrompt from './UpdatePrompt';

export default function RootLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <NavBar />
      <ConnectionBar />
      <main className="page">
        <Suspense fallback={<Loading text="Loading level..." />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="footer">
        Save Point v{__APP_VERSION__} · student project · game names and images belong to their
        owners
      </footer>
      <UpdatePrompt />
    </>
  );
}
