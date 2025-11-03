import { useEffect, useRef, useState, useCallback } from 'react';

interface ReconnectConfig {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  maxDelayMs?: number;
}

interface ReconnectState {
  isConnected: boolean;
  isReconnecting: boolean;
  currentAttempt: number;
  maxAttempts: number;
  lastError: string | null;
  nextRetryIn: number; // milisegundos hasta el próximo reintento
}

/**
 * Hook para manejar auto-reconexión de streams RTSP
 * Implementa backoff exponencial y reintentos automáticos
 */
export const useRTSPAutoReconnect = (
  streamUrl: string | null,
  onConnect: () => Promise<void>,
  onDisconnect: () => Promise<void>,
  config: ReconnectConfig = {}
): ReconnectState => {
  const {
    maxAttempts = 5,
    delayMs = 3000,
    backoffMultiplier = 1.5,
    maxDelayMs = 30000,
  } = config;

  const [state, setState] = useState<ReconnectState>({
    isConnected: false,
    isReconnecting: false,
    currentAttempt: 0,
    maxAttempts,
    lastError: null,
    nextRetryIn: 0,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>();
  const connectionAttemptRef = useRef<number>(0);

  /**
   * Actualizar contador de tiempo para próximo reintento
   */
  useEffect(() => {
    if (state.nextRetryIn <= 0) return;

    intervalRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        nextRetryIn: Math.max(0, prev.nextRetryIn - 100),
      }));
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.nextRetryIn]);

  /**
   * Intentar conectar
   */
  const attemptConnect = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isReconnecting: true,
        lastError: null,
      }));

      await onConnect();

      setState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        currentAttempt: 0,
        nextRetryIn: 0,
      }));

      console.log('✅ Conectado al stream RTSP');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      connectionAttemptRef.current += 1;

      if (connectionAttemptRef.current <= maxAttempts) {
        // Calcular delay con backoff exponencial
        const delay = Math.min(
          delayMs * Math.pow(backoffMultiplier, connectionAttemptRef.current - 1),
          maxDelayMs
        );

        console.warn(
          `⚠️ Error de conexión (intento ${connectionAttemptRef.current}/${maxAttempts}): ${errorMessage}`
        );
        console.log(`🔄 Reintentando en ${Math.round(delay / 1000)}s...`);

        setState((prev) => ({
          ...prev,
          isConnected: false,
          isReconnecting: true,
          currentAttempt: connectionAttemptRef.current,
          lastError: errorMessage,
          nextRetryIn: delay,
        }));

        // Programar próximo intento
        timeoutRef.current = setTimeout(() => {
          attemptConnect();
        }, delay);
      } else {
        console.error(
          `❌ Se alcanzó el máximo de intentos de reconexión: ${connectionAttemptRef.current}`
        );

        setState((prev) => ({
          ...prev,
          isConnected: false,
          isReconnecting: false,
          lastError: `Falló después de ${connectionAttemptRef.current} intentos: ${errorMessage}`,
          nextRetryIn: 0,
        }));
      }
    }
  }, [onConnect, maxAttempts, delayMs, backoffMultiplier, maxDelayMs]);

  /**
   * Iniciar conexión cuando streamUrl cambia
   */
  useEffect(() => {
    if (!streamUrl) {
      // Limpiar si no hay URL
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isReconnecting: false,
        currentAttempt: 0,
        nextRetryIn: 0,
      }));
      return;
    }

    // Resetear contador de intentos
    connectionAttemptRef.current = 0;

    // Iniciar primer intento
    attemptConnect();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [streamUrl, attemptConnect]);

  /**
   * Limpiar al desmontar
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Desconectar
      if (state.isConnected) {
        onDisconnect().catch((err) => console.error('Error al desconectar:', err));
      }
    };
  }, [state.isConnected, onDisconnect]);

  /**
   * Método para desconectar manualmente
   */
  const disconnect = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    try {
      await onDisconnect();
    } catch (error) {
      console.error('Error al desconectar:', error);
    }

    connectionAttemptRef.current = maxAttempts; // Detener reintentos
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isReconnecting: false,
      nextRetryIn: 0,
    }));
  }, [onDisconnect, maxAttempts]);

  /**
   * Método para reconectar manualmente
   */
  const reconnect = useCallback(async () => {
    connectionAttemptRef.current = 0;
    await attemptConnect();
  }, [attemptConnect]);

  return {
    ...state,
    disconnect,
    reconnect,
  } as ReconnectState & {
    disconnect: () => Promise<void>;
    reconnect: () => Promise<void>;
  };
};

export default useRTSPAutoReconnect;
