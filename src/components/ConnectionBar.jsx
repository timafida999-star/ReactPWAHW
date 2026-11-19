import { useEffect, useState } from 'react';
import { useOnline } from '../pwa/network';

export default function ConnectionBar() {
  const online = useOnline();
  const [lastOnline, setLastOnline] = useState(online);
  const [restored, setRestored] = useState(false);

  if (online !== lastOnline) {
    setLastOnline(online);
    setRestored(online);
  }

  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(() => setRestored(false), 3000);
    return () => clearTimeout(timer);
  }, [restored]);

  if (!online) {
    return (
      <div className="conn conn--offline" role="status">
        You are offline. Pages and games you opened before still work.
      </div>
    );
  }

  if (restored) {
    return (
      <div className="conn conn--online" role="status">
        Back online. Fresh data is loading.
      </div>
    );
  }

  return null;
}
