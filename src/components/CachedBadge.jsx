import { useDataSource } from '../pwa/dataSource';
import { useOnline } from '../pwa/network';

function formatTime(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CachedBadge() {
  const online = useOnline();
  const { fromCache, savedAt } = useDataSource();

  if (online && !fromCache) return null;

  let text = 'You are offline. Showing data loaded earlier.';
  if (fromCache) {
    text = savedAt ? `Cached data saved ${formatTime(savedAt)}.` : 'Cached data.';
    text += online ? ' The network is slow, showing the saved copy.' : ' You are offline.';
  }

  return (
    <p className="cached" role="status">
      <span className="cached__tag">Cached</span>
      {text}
    </p>
  );
}
