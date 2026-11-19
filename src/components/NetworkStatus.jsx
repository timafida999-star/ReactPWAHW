import { useOnline } from '../pwa/network';

export default function NetworkStatus() {
  const online = useOnline();

  return (
    <span className={online ? 'net net--online' : 'net net--offline'} role="status">
      <span className="net__dot" aria-hidden="true" />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}
