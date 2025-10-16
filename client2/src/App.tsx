// App.tsx - Versión simplificada para usuario final
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from './contexts/ThemeContext';
import SensorCard from './components/SensorCard';
import type { MqttStatus, Sensor } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [mqttStatus, setMqttStatus] = useState<MqttStatus>({
    connected: false,
    broker: null,
    clientId: null,
    lastChecked: null
  });
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Fetch initial MQTT status
  const fetchInitialMqttStatus = async () => {
    console.log('🚀 fetchInitialMqttStatus - Consultando estado inicial del broker MQTT...');
    try {
      const response = await axios.get(`${API_URL}/api/mqtt/status`);
      console.log('✅ fetchInitialMqttStatus - Estado recibido del servidor:', response.data);

      setMqttStatus(prev => ({
        ...prev,
        connected: response.data.connected,
        broker: response.data.broker,
        clientId: response.data.clientId,
        lastChecked: new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ fetchInitialMqttStatus - Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sensors
  const fetchSensors = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/sensors`);
      setSensors(response.data);
    } catch (error) {
      console.error('❌ Error fetching sensors:', error);
    }
  };

  // Recording timer
  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isRecording]);

  // Toggle recording
  const toggleRecording = async () => {
    try {
      if (isRecording) {
        // Stop recording
        await axios.post(`${API_URL}/api/recording/stop`);
        setIsRecording(false);
        setRecordingDuration(0);
      } else {
        // Start recording
        await axios.post(`${API_URL}/api/recording/start`);
        setIsRecording(true);
        setRecordingDuration(0);
      }
    } catch (error) {
      console.error('❌ Error toggling recording:', error);
    }
  };

  // Fallback polling every 10 seconds
  useEffect(() => {
    console.log('⏰ Polling de respaldo iniciado - Verificación cada 10 segundos');

    const fallbackInterval = setInterval(async () => {
      console.log('🔄 Polling de respaldo - Consultando estado MQTT...');
      try {
        const response = await axios.get(`${API_URL}/api/mqtt/status`);
        console.log('✅ Polling de respaldo - Estado recibido:', response.data);

        setMqttStatus(prev => ({
          ...prev,
          connected: response.data.connected,
          broker: response.data.broker,
          clientId: response.data.clientId,
          lastChecked: new Date().toISOString()
        }));
      } catch (error) {
        console.error('❌ Polling de respaldo - Error:', error);
      }
    }, 10000);

    return () => {
      console.log('⏹️ Polling de respaldo detenido');
      clearInterval(fallbackInterval);
    };
  }, []);

  // Initial load
  useEffect(() => {
    fetchInitialMqttStatus();
    fetchSensors();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando Galgo Config...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header simple */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Galgo Config
                </h1>
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                  Monitor de Sistema
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                v2.0.0
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Sistema de Grabación */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Sistema de Grabación
              </h2>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {isRecording ? 'Grabando...' : 'Detenido'}
                      </p>
                      {isRecording && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Duración: {formatDuration(recordingDuration)}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={toggleRecording}
                    className={`btn-primary ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={!mqttStatus.connected}
                  >
                    {isRecording ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Detener
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3 7.5A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 2.5z" />
                        </svg>
                        Iniciar Grabación
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Broker Conectado */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Broker MQTT
              </h2>
              <div className="card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      mqttStatus.connected
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {mqttStatus.connected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Broker:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {mqttStatus.broker || 'No disponible'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Client ID:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {mqttStatus.clientId || 'No disponible'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Última verificación:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {mqttStatus.lastChecked
                        ? new Date(mqttStatus.lastChecked).toLocaleTimeString('es-ES')
                        : 'Nunca'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Dispositivos Conectados */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Dispositivos Conectados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensors.length > 0 ? (
                  sensors.map(sensor => (
                    <SensorCard key={sensor.id} sensor={sensor} />
                  ))
                ) : (
                  <div className="col-span-full card text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>No hay dispositivos conectados en este momento</p>
                      <p className="text-sm mt-1">Los dispositivos aparecerán aquí automáticamente cuando se conecten.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;