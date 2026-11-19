import { useEffect, useState } from 'react';
import {
  applyUpdate,
  dismissOfflineReady,
  dismissUpdate,
  useServiceWorker,
} from '../pwa/serviceWorker';

export default function UpdatePrompt() {
  const { updateReady, offlineReady } = useServiceWorker();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(dismissOfflineReady, 6000);
    return () => clearTimeout(timer);
  }, [offlineReady]);

  function handleUpdate() {
    setUpdating(true);
    applyUpdate();
  }

  if (updateReady) {
    return (
      <div className="toast toast--update" role="alertdialog" aria-labelledby="update-title">
        <p className="toast__title" id="update-title">
          New version available
        </p>
        <p>Update to load the latest Save Point. Your login and wishlist stay as they are.</p>
        <div className="toast__actions">
          <button type="button" className="btn" onClick={handleUpdate} disabled={updating}>
            {updating ? 'Updating...' : 'Update now'}
          </button>
          <button type="button" className="btn btn--light" onClick={dismissUpdate}>
            Later
          </button>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="toast" role="status">
        <p className="toast__title">Ready to work offline</p>
        <p>Save Point is saved on this device. Opened pages and games will work without internet.</p>
        <div className="toast__actions">
          <button type="button" className="btn btn--light" onClick={dismissOfflineReady}>
            OK
          </button>
        </div>
      </div>
    );
  }

  return null;
}
