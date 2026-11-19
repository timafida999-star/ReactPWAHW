import { Navigate, useLocation } from 'react-router';

export default function ErrorMessage({ error, onRetry }) {
  const { pathname, search } = useLocation();

  if (error?.offline) {
    return <Navigate to="/offline" replace state={{ from: pathname + search }} />;
  }

  return (
    <div className="message message--error">
      <h3>Game over</h3>
      <p>{error?.message || 'Something went wrong'}</p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Continue?
        </button>
      )}
    </div>
  );
}
