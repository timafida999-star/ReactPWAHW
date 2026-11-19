import { promptInstall, useInstallPrompt } from '../pwa/install';

export default function InstallButton() {
  const installPrompt = useInstallPrompt();
  if (!installPrompt) return null;

  return (
    <button type="button" className="nav-install" onClick={promptInstall}>
      Install app
    </button>
  );
}
