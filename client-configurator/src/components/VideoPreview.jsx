import { useEffect, useRef, useState } from 'react';

/**
 * Componente para reproducir video HLS con controles y estado
 * Requiere: hls.js (https://github.com/video-dev/hls.js)
 */
const VideoPreview = ({
  cameraId,
  cameraName,
  hlsUrl,
  onStatusChange,
  showControls = true,
  autoPlay = true,
  muted = true,
}) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [uptime, setUptime] = useState(0);

  const uptimeIntervalRef = useRef(null);

  // Formatear tiempo en HH:MM:SS
  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
  };

  // Inicializar HLS
  useEffect(() => {
    if (!videoRef.current) return;

    const initHLS = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Comprobar si HLS.js está disponible
        if (window.HLS) {
          const hls = new window.HLS({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            maxBufferLength: 5,
            maxMaxBufferLength: 10,
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoRef.current);

          // Manejo de errores HLS
          hls.on('hlsError', (event, data) => {
            console.error('❌ Error HLS:', data);
            if (data.fatal) {
              setError(`Error fatal: ${data.details}`);
              onStatusChange?.({
                cameraId,
                status: 'error',
                error: data.details,
              });
            }
          });

          hls.on('hlsManifestParsed', () => {
            console.log('✅ Manifest HLS parseado correctamente');
            setIsLoading(false);
            setIsPlaying(autoPlay);
            if (autoPlay && videoRef.current) {
              videoRef.current.play().catch((e) => {
                console.warn('No se pudo autoplay:', e);
              });
            }
            onStatusChange?.({
              cameraId,
              status: 'connected',
              error: null,
            });
          });

          hlsRef.current = hls;
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          videoRef.current.src = hlsUrl;
          videoRef.current.addEventListener('loadedmetadata', () => {
            setIsLoading(false);
            if (autoPlay) {
              videoRef.current.play().catch((e) => {
                console.warn('No se pudo autoplay:', e);
              });
            }
          });
        } else {
          setError('Tu navegador no soporta reproducción HLS');
          onStatusChange?.({
            cameraId,
            status: 'error',
            error: 'Navegador no soportado',
          });
        }
      } catch (err) {
        console.error('Error inicializando HLS:', err);
        setError(err.message);
        onStatusChange?.({
          cameraId,
          status: 'error',
          error: err.message,
        });
      }
    };

    initHLS();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [hlsUrl, cameraId, autoPlay, onStatusChange]);

  // Actualizar uptime
  useEffect(() => {
    if (!isPlaying) {
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
      }
      return;
    }

    uptimeIntervalRef.current = setInterval(() => {
      setUptime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (uptimeIntervalRef.current) {
        clearInterval(uptimeIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Manejadores de eventos
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime);
  };

  const handleLoadedMetadata = (e) => {
    setDuration(e.target.duration);
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
      {/* Video Container */}
      <div className="relative bg-gray-900 aspect-video">
        <video
          ref={videoRef}
          className="w-full h-full"
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
        />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-center text-red-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Live Badge */}
        {isLive && !error && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            EN VIVO
          </div>
        )}

        {/* Uptime Badge */}
        {!error && (
          <div className="absolute top-3 left-3 bg-gray-900/80 text-white px-3 py-1 rounded-full text-xs font-mono">
            Tiempo: {formatTime(uptime)}
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && !error && (
        <div className="bg-gray-900 p-4 space-y-3">
          {/* Camera Name */}
          <div className="text-white font-semibold">{cameraName}</div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = parseFloat(e.target.value);
                }
              }}
              className="w-full h-1 bg-gray-700 rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={handlePlayPause}
                className="text-white hover:text-blue-400 transition"
                title={isPlaying ? 'Pausar' : 'Reproducir'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Mute */}
              <button
                onClick={handleMute}
                className="text-white hover:text-blue-400 transition"
                title={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.26 2.5-4.02zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C21.63 14.91 22 13.5 22 12s-.37-2.91-.99-4.15L19.5 9.36c.34.82.54 1.7.54 2.64z" />
                  </svg>
                )}
              </button>

              {/* Volume */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-700 rounded cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="text-white hover:text-blue-400 transition"
              title="Pantalla completa"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
