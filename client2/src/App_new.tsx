// App.tsx - Versión simplificada para usuario final
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from './contexts/ThemeContext';
import MqttConnectionStatus from './components/MqttConnectionStatus';
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
  const [mqttConnecting, setMqttConnecting] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
            {/* Estado del Sistema */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Estado del Sistema
              </h2>
              <MqttConnectionStatus
                mqttStatus={mqttStatus}
                mqttConnecting={mqttConnecting}
              />
            </div>

            {/* Sensores */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Sensores Conectados
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
                      <p>No hay sensores conectados en este momento</p>
                      <p className="text-sm mt-1">Los sensores aparecerán aquí automáticamente cuando se conecten.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información del sistema */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Información del Sistema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Estado MQTT:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    mqttStatus.connected
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {mqttStatus.connected ? 'Conectado' : 'Desconectado'}
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
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Sensores activos:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {sensors.filter(s => s.status === 'online').length} de {sensors.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;