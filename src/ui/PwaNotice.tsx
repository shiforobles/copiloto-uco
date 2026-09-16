import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaNotice() {
  const { needRefresh: [needRefresh, setNeedRefresh], offlineReady: [offlineReady, setOfflineReady], updateServiceWorker } = useRegisterSW();
  if (!needRefresh && !offlineReady) return null;
  return <aside className="pwa-notice" role="status" aria-label="Estado de la aplicación">
    <p className="font-semibold text-sm text-slate-100">{needRefresh ? 'Hay una nueva versión disponible' : 'Aplicación preparada para uso sin conexión'}</p>
    <p className="text-xs text-slate-300 mt-2">{needRefresh ? 'Actualizar recarga la app y borra los datos de la sesión actual.' : 'El contenido instalado y los cálculos quedan disponibles. Las fuentes externas requieren internet.'}</p>
    <div className="flex gap-2 mt-4">
      {needRefresh && <button className="btn-primary text-xs" onClick={() => void updateServiceWorker(true)}>Actualizar y reiniciar sesión</button>}
      <button className="btn-ghost text-xs" onClick={() => { setNeedRefresh(false); setOfflineReady(false); }}>{needRefresh ? 'Más tarde' : 'Entendido'}</button>
    </div>
  </aside>;
}
