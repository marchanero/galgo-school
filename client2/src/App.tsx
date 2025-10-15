// App.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './components/Navbar';
import MqttConnectionStatus from './components/MqttConnectionStatus';
import SensorCard from './components/SensorCard';
import type { MqttStatus, Sensor, Configuration } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [activeTab, setActiveTab] = useState('general');
  const [mqttStatus, setMqttStatus] = useState<MqttStatus>({
    connected: false,
    broker: null,
    clientId: null,
    lastChecked: null
  });
  const [mqttConnecting, setMqttConnecting] = useState(false);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [configuration, setConfiguration] = useState<Configuration>({
    mqtt: {
      broker: 'mqtt://100.107.238.60:1883',
      username: 'admin',
      password: 'galgo2526',
      autoConnect: true,
      autoPolling: true
    },
    recording: {
      autoStart: false,
      duration: 60,
      format: 'mp4'
    },
    cameras: [],
    sensors: []
  });

  // Fetch initial MQTT status
  const fetchInitialMqttStatus = async () => {
    console.log('🚀 fetchInitialMqttStatus - Consultando estado inicial del broker MQTT...');
    console.log('🌐 URL:', `${API_URL}/api/mqtt/status`);
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

  // Monitor MQTT status changes
  useEffect(() => {
    console.log('🔔 Estado MQTT actualizado:', mqttStatus);
  }, [mqttStatus]);

  // Initial load
  useEffect(() => {
    fetchInitialMqttStatus();
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Configuración General
              </h2>
              <div className="card">
                <p className="text-gray-600 dark:text-gray-300">
                  Configuración general del sistema Galgo.
                </p>
              </div>
            </div>

            <MqttConnectionStatus
              mqttStatus={mqttStatus}
              mqttConnecting={mqttConnecting}
            />
          </div>
        );

      case 'sensors':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Sensores
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sensors.length > 0 ? (
                  sensors.map(sensor => (
                    <SensorCard key={sensor.id} sensor={sensor} />
                  ))
                ) : (
                  <div className="col-span-full card text-center">
                    <p className="text-gray-600 dark:text-gray-300">
                      No hay sensores configurados
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'cameras':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Cámaras
              </h2>
              <div className="card">
                <p className="text-gray-600 dark:text-gray-300">
                  Gestión de cámaras IP.
                </p>
              </div>
            </div>
          </div>
        );

      case 'recordings':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Grabaciones
              </h2>
              <div className="card">
                <p className="text-gray-600 dark:text-gray-300">
                  Gestión de grabaciones automáticas.
                </p>
              </div>
            </div>
          </div>
        );

      case 'mqtt':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Configuración MQTT
              </h2>
              <div className="card">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Broker URL
                    </label>
                    <input
                      type="text"
                      value={configuration.mqtt.broker}
                      onChange={(e) => setConfiguration(prev => ({
                        ...prev,
                        mqtt: { ...prev.mqtt, broker: e.target.value }
                      }))}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Usuario
                      </label>
                      <input
                        type="text"
                        value={configuration.mqtt.username}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          mqtt: { ...prev.mqtt, username: e.target.value }
                        }))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        value={configuration.mqtt.password}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          mqtt: { ...prev.mqtt, password: e.target.value }
                        }))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={configuration.mqtt.autoConnect}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          mqtt: { ...prev.mqtt, autoConnect: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Conexión automática
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={configuration.mqtt.autoPolling}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          mqtt: { ...prev.mqtt, autoPolling: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Polling automático
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <MqttConnectionStatus
              mqttStatus={mqttStatus}
              mqttConnecting={mqttConnecting}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderTabContent()}
      </main>
    </div>
  );
}

export default App;
