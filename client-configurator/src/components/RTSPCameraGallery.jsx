import { useState, useEffect, useCallback } from 'react';
import VideoPreview from './VideoPreview';
import toast from 'react-hot-toast';

/**
 * Componente para gestionar y mostrar múltiples cámaras RTSP
 * @param {string} apiUrl - URL del servidor API
 * @param {Array} configuredCameras - Cámaras configuradas del sistema (prop from App.jsx)
 * @param {Object} cameraConfig - Configuración global de cámaras
 */
const RTSPCameraGallery = ({ apiUrl, configuredCameras = [], cameraConfig = {} }) => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [streamStatus, setStreamStatus] = useState({});

  // Cargar cámaras desde props o API
  const loadCameras = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let loadedCameras = [];

      // Si hay cámaras configuradas en props, usarlas
      if (configuredCameras && configuredCameras.length > 0) {
        console.log(`📹 Cargando ${configuredCameras.length} cámaras configuradas...`);
        loadedCameras = configuredCameras.map(cam => ({
          id: cam.id,
          name: cam.name,
          ip: cam.ip,
          port: cam.port || 554,
          username: cam.username || '',
          password: cam.password || '',
          path: cam.path || '/stream',
          rtspUrl: `rtsp://${cam.username}${cam.password ? ':' + cam.password : ''}${cam.username ? '@' : ''}${cam.ip}:${cam.port}${cam.path || '/stream'}`,
          connectionTimeout: cameraConfig?.connectionTimeout || 10,
          autoReconnect: cameraConfig?.autoReconnect !== false
        }));
        console.log('✅ Cámaras cargadas desde props:', loadedCameras);
      } else {
        // Si no hay props, intentar cargar del API
        console.log('🔄 Intentando cargar cámaras del API...');
        const response = await fetch(`${apiUrl}/api/cameras`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        loadedCameras = data;
        console.log('✅ Cámaras cargadas del API:', loadedCameras);
      }

      setCameras(loadedCameras);
      if (loadedCameras.length > 0 && !activeCameraId) {
        setActiveCameraId(loadedCameras[0].id);
        console.log(`📌 Cámara activa seleccionada: ${loadedCameras[0].name}`);
      }
    } catch (err) {
      console.error('❌ Error cargando cámaras:', err);
      setError(err.message);
      toast.error(`Error al cargar cámaras: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, configuredCameras, cameraConfig, activeCameraId]);

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  // Iniciar streaming para una cámara con reintentos
  const startStreamPreview = async (cameraId, maxRetries = 2) => {
    const camera = cameras.find(c => c.id === cameraId);
    if (!camera) {
      toast.error(`❌ Cámara no encontrada`);
      return;
    }

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`🔄 Intento ${attempt}/${maxRetries + 1} - Iniciando stream para cámara "${camera.name}" (${camera.ip}:${camera.port})`);
        setStreamStatus(prev => ({
          ...prev,
          [cameraId]: { status: 'connecting', hlsUrl: null, error: null, attempt }
        }));

        const response = await fetch(`${apiUrl}/api/stream/preview/${cameraId}`, {
          method: 'POST',
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Stream iniciado exitosamente para ${camera.name}:`, data);
        setStreamStatus(prev => ({
          ...prev,
          [cameraId]: { status: 'connected', hlsUrl: data.hlsUrl, error: null }
        }));
        toast.success(`✅ Stream de "${camera.name}" iniciado correctamente`);
        return data.hlsUrl;
      } catch (err) {
        console.error(`❌ Intento ${attempt} fallido para ${camera.name}:`, err.message);
        
        if (attempt <= maxRetries) {
          const delay = attempt * 1000; // Delay creciente: 1s, 2s
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          setStreamStatus(prev => ({
            ...prev,
            [cameraId]: { 
              status: 'retrying', 
              hlsUrl: null, 
              error: `Reintentando... (${attempt}/${maxRetries + 1})`,
              attempt
            }
          }));
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          const errorMsg = `No se pudo iniciar stream después de ${maxRetries + 1} intentos: ${err.message}`;
          console.error(`❌ ${errorMsg}`);
          setStreamStatus(prev => ({
            ...prev,
            [cameraId]: { status: 'error', hlsUrl: null, error: errorMsg }
          }));
          toast.error(errorMsg);
          throw err;
        }
      }
    }
  };

  // Detener streaming
  const stopStreamPreview = async (cameraId) => {
    try {
      console.log(`🛑 Deteniendo stream para cámara ${cameraId}`);
      const response = await fetch(`${apiUrl}/api/stream/preview/${cameraId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      console.log('✅ Stream detenido exitosamente');
      toast.success('Stream detenido');
      setStreamStatus((prev) => ({
        ...prev,
        [cameraId]: { ...prev[cameraId], hlsUrl: null },
      }));
    } catch (err) {
      console.error(`❌ Error deteniendo stream para cámara ${cameraId}:`, err.message);
      toast.error(`Error al detener stream: ${err.message}`);
    }
  };

  // Manejo de cambio de estado
  const handleCameraStatusChange = (cameraId, status) => {
    setStreamStatus((prev) => ({
      ...prev,
      [cameraId]: status,
    }));
  };

  // Obtener cámara activa
  const activeCamera = cameras.find((c) => c.id === activeCameraId);
  const activeStreamStatus = streamStatus[activeCameraId];
  const activeHlsPath = activeStreamStatus?.hlsUrl;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        <button
          onClick={loadCameras}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 mx-auto text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-blue-800 dark:text-blue-200 font-medium">Sin cámaras configuradas</p>
        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">Agrega cámaras RTSP en la sección de configuración</p>
        <div className="mt-4 text-xs text-blue-500 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/50 p-3 rounded">
          <p>💡 <strong>Tip:</strong> Accede a <strong>Configuración → Cámaras RTSP</strong> y haz clic en <strong>"Agregar Cámara"</strong></p>
          <p className="mt-2">Necesitarás:</p>
          <ul className="list-disc list-inside text-left mt-1 ml-2">
            <li>IP de la cámara (ej: 192.168.1.100)</li>
            <li>Puerto RTSP (típicamente 554)</li>
            <li>Usuario y contraseña (si aplica)</li>
            <li>Ruta del stream (típicamente /stream)</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Preview Principal */}
      {activeCamera && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeCamera.name}
            </h3>
            <div className="flex gap-2">
              {!activeHlsPath ? (
                <button
                  onClick={() =>
                    startStreamPreview(activeCameraId).then((hlsUrl) => {
                      setStreamStatus((prev) => ({
                        ...prev,
                        [activeCameraId]: {
                          status: 'connecting',
                          hlsUrl,
                          cameraId: activeCameraId,
                          error: null,
                        },
                      }));
                    })
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Iniciar
                </button>
              ) : (
                <button
                  onClick={() => stopStreamPreview(activeCameraId)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h12v12H6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Detener
                </button>
              )}
            </div>
          </div>

          {activeHlsPath ? (
            <VideoPreview
              cameraId={activeCameraId}
              cameraName={activeCamera.name}
              hlsUrl={new URL(activeHlsPath, apiUrl).href}
              onStatusChange={(status) => handleCameraStatusChange(activeCameraId, status)}
              showControls={true}
              autoPlay={true}
            />
          ) : (
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              <p className="text-gray-400">Haz clic en "Iniciar" para ver el stream</p>
            </div>
          )}

          {/* Información de la Cámara */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">IP:</span>
              <span className="font-mono text-gray-900 dark:text-white">{activeCamera.ip}:{activeCamera.port}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Ruta RTSP:</span>
              <span className="font-mono text-gray-900 dark:text-white text-xs">{activeCamera.path || '/stream'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Estado:</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  activeStreamStatus?.status === 'connected' ? 'bg-green-500' :
                  activeStreamStatus?.status === 'connecting' || activeStreamStatus?.status === 'retrying' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></span>
                <span className={`font-semibold ${
                  activeStreamStatus?.status === 'connected' ? 'text-green-600 dark:text-green-400' :
                  activeStreamStatus?.status === 'connecting' ? 'text-yellow-600 dark:text-yellow-400' :
                  activeStreamStatus?.status === 'retrying' ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {activeStreamStatus?.status === 'connected' && '🟢 Conectado'}
                  {activeStreamStatus?.status === 'connecting' && '🟡 Conectando...'}
                  {activeStreamStatus?.status === 'retrying' && `🔄 ${activeStreamStatus.error}`}
                  {activeStreamStatus?.status === 'error' && '🔴 Error'}
                  {!activeStreamStatus?.status && '⚫ Inactivo'}
                </span>
              </div>
            </div>
            {activeStreamStatus?.error && activeStreamStatus?.status !== 'retrying' && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Error:</span>
                <span className="text-red-600 dark:text-red-400 text-right text-xs max-w-xs">{activeStreamStatus.error}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Galería de Cámaras */}
      {cameras.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Otras Cámaras</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cameras.map((camera) => (
              <button
                key={camera.id}
                onClick={() => setActiveCameraId(camera.id)}
                className={`p-3 rounded-lg border-2 transition ${
                  activeCameraId === camera.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {camera.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {camera.ip}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RTSPCameraGallery;
