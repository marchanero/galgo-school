import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'

function App() {
  const [sensors, setSensors] = useState([])
  const [newSensor, setNewSensor] = useState({ type: '', name: '', data: {} })
  const [currentSection, setCurrentSection] = useState('Sensors')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState(null)
  const [selectedCamera, setSelectedCamera] = useState(null)

  useEffect(() => {
    if (currentSection === 'Sensors') {
      fetchSensors()
    }
  }, [currentSection])

  const fetchSensors = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3001/api/sensors')
      if (!response.ok) {
        throw new Error('Failed to fetch sensors')
      }
      const data = await response.json()
      setSensors(data.sensors)
    } catch (err) {
      // Fallback to mock data for development
      console.warn('Using mock data due to server connection error')
      setSensors([
        { id: 1, type: 'environmental', name: 'Temperature Sensor A1', data: { location: 'Lab 1', parameters: 'temperature' } },
        { id: 2, type: 'rtsp', name: 'Camera Lab Entrance', data: { url: 'rtsp://192.168.1.100:554/stream' } },
        { id: 3, type: 'emotibit', name: 'EmotiBit Participant 001', data: { deviceId: 'EB001', samplingRate: '250Hz' } }
      ])
      setError('Server not available. Using sample data for demonstration.')
    } finally {
      setLoading(false)
    }
  }

  const addSensor = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3001/api/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSensor)
      })
      if (!response.ok) {
        throw new Error('Failed to add sensor')
      }
      fetchSensors()
      setNewSensor({ type: '', name: '', data: {} })
    } catch (err) {
      setError('Unable to add sensor. Please check the server connection.')
      console.error('Error adding sensor:', err)
    } finally {
      setLoading(false)
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordingStartTime(new Date())
    console.log('Started recording all sensors')
    // En una implementación real, aquí se enviaría una petición al servidor
    // para comenzar la grabación de todos los sensores simultáneamente
  }

  const stopRecording = () => {
    setIsRecording(false)
    const duration = new Date() - recordingStartTime
    console.log(`Stopped recording. Duration: ${Math.round(duration / 1000)} seconds`)
    setRecordingStartTime(null)
    // En una implementación real, aquí se enviaría una petición al servidor
    // para detener la grabación y guardar los datos
  }

  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera)
    console.log(`Selected camera: ${camera.name}`)
  }

  const renderDataFields = () => {
    switch (newSensor.type) {
      case 'rtsp':
        return (
          <input
            type="text"
            placeholder="RTSP URL"
            value={newSensor.data.url || ''}
            onChange={e => setNewSensor({...newSensor, data: {...newSensor.data, url: e.target.value}})}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        )
      case 'emotibit':
        return (
          <>
            <input
              type="text"
              placeholder="Device ID"
              value={newSensor.data.deviceId || ''}
              onChange={e => setNewSensor({...newSensor, data: {...newSensor.data, deviceId: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Sampling Rate"
              value={newSensor.data.samplingRate || ''}
              onChange={e => setNewSensor({...newSensor, data: {...newSensor.data, samplingRate: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </>
        )
      case 'environmental':
        return (
          <>
            <input
              type="text"
              placeholder="Location"
              value={newSensor.data.location || ''}
              onChange={e => setNewSensor({...newSensor, data: {...newSensor.data, location: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Parameters (e.g., temperature, humidity)"
              value={newSensor.data.parameters || ''}
              onChange={e => setNewSensor({...newSensor, data: {...newSensor.data, parameters: e.target.value}})}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </>
        )
      default:
        return null
    }
  }

  const renderSection = () => {
    switch (currentSection) {
      case 'Dashboard':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h2>
            
            {/* Estado de grabación global */}
            {isRecording && (
              <div className="mb-8 bg-red-50 dark:bg-red-900 p-4 rounded-xl shadow-lg border border-red-200 dark:border-red-700 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-3"></div>
                  <div>
                    <h3 className="font-semibold text-red-600 dark:text-red-300">Grabación en progreso</h3>
                    <p className="text-sm text-red-500 dark:text-red-400">
                      Tiempo transcurrido: {Math.floor((new Date() - recordingStartTime) / 1000)} segundos
                    </p>
                  </div>
                </div>
                <button
                  onClick={stopRecording}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Detener
                </button>
              </div>
            )}
            
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Total Sensores</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{sensors.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Cámaras Activas</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{sensors.filter(s => s.type === 'rtsp').length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Sensores Ambientales</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{sensors.filter(s => s.type === 'environmental').length}</p>
              </div>
            </div>
            
            {/* Control rápido de grabación */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Control de Grabación</h3>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Inicia una grabación sincronizada de todos los sensores conectados.
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Todos los datos se guardarán en la ubicación configurada en Ajustes.
                  </p>
                </div>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center px-6 py-3 rounded-lg font-semibold ${
                    isRecording
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                      </svg>
                      Detener Grabación
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                      </svg>
                      Iniciar Grabación
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Vista previa de sensores activos */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Vista Rápida de Sensores</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensors.slice(0, 3).map(sensor => (
                  <div key={sensor.id} className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{sensor.name}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{sensor.type}</span>
                      </div>
                      <div className={`h-2 w-2 rounded-full ${sensor.type === 'rtsp' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                    </div>
                    
                    {sensor.type === 'rtsp' ? (
                      <div className="bg-black rounded mt-2 aspect-video flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    ) : sensor.type === 'environmental' ? (
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-300">Temperatura</span>
                          <span className="font-medium text-gray-900 dark:text-white">24.5°C</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">Humedad</span>
                          <span className="font-medium text-gray-900 dark:text-white">65%</span>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="h-20 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Datos EmotiBit</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 flex justify-end">
                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case 'Sensors':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Sensors Management</h2>
            {error && (
              <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sensor List</h3>
                {loading ? (
                  <p className="text-gray-900 dark:text-white">Loading sensors...</p>
                ) : (
                  <ul className="space-y-3">
                    {sensors.map(sensor => (
                      <li key={sensor.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{sensor.name}</span>
                          <span className="ml-2 text-sm text-primary-600 dark:text-primary-400">({sensor.type})</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{JSON.stringify(sensor.data)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Sensor</h3>
                <div className="space-y-4">
                  <select
                    value={newSensor.type}
                    onChange={e => setNewSensor({...newSensor, type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={loading}
                  >
                    <option value="">Select Sensor Type</option>
                    <option value="environmental">Environmental</option>
                    <option value="emotibit">EmotiBit</option>
                    <option value="rtsp">RTSP Camera</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Sensor Name"
                    value={newSensor.name}
                    onChange={e => setNewSensor({...newSensor, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                  {renderDataFields()}
                  <button
                    onClick={addSensor}
                    disabled={loading}
                    className="w-full bg-gradient-primary hover:bg-gradient-secondary text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Adding...' : 'Add Sensor'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      case 'Cameras':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Camera Management</h2>
            
            {/* Control de grabación global */}
            <div className="mb-8 bg-blue-50 dark:bg-blue-900 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-300 mb-2">Data Recording Control</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Grab synchronized data from all sensors simultaneously.
                  </p>
                  {isRecording && recordingStartTime && (
                    <div className="flex items-center mb-3">
                      <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-2"></div>
                      <p className="text-red-600 dark:text-red-300">
                        Recording for {Math.floor((new Date() - recordingStartTime) / 1000)} seconds
                      </p>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center ${
                    isRecording 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                      </svg>
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" fill="currentColor" />
                      </svg>
                      Start Recording
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de cámaras */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[600px]">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Cameras</h3>
                {loading ? (
                  <p className="text-gray-500">Loading cameras...</p>
                ) : (
                  <ul className="space-y-2">
                    {sensors.filter(sensor => sensor.type === 'rtsp').length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">No cameras available</p>
                    ) : (
                      sensors
                        .filter(sensor => sensor.type === 'rtsp')
                        .map(camera => (
                          <li key={camera.id}>
                            <button
                              onClick={() => handleCameraSelect(camera)}
                              className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                                selectedCamera && selectedCamera.id === camera.id
                                  ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <div className="font-medium text-gray-900 dark:text-white">{camera.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{camera.data.url}</div>
                            </button>
                          </li>
                        ))
                    )}
                  </ul>
                )}
              </div>

              {/* Visualizador de video */}
              <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                {selectedCamera ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedCamera.name}
                      </h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Stream: {selectedCamera.data.url}
                      </div>
                    </div>
                    
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                      {/* Aquí iría el reproductor de video real. Por ahora es un placeholder */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <svg className="w-20 h-20 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <p className="mt-2 text-gray-400 dark:text-gray-500">
                          RTSP stream would display here
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          (Requiere integración con una biblioteca como JSMPEG o WebRTC)
                        </p>
                      </div>
                      
                      {isRecording && (
                        <div className="absolute top-4 right-4 flex items-center bg-black bg-opacity-50 rounded-full px-3 py-1">
                          <div className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                          <span className="text-white text-xs">REC</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                        <button className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-white">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>
                          </svg>
                        </button>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isRecording && `Recording in progress: ${Math.floor((new Date() - recordingStartTime) / 1000)}s`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px]">
                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">Select a camera to view</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      case 'Settings':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recording Configuration</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Storage Location
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="/data/recordings"
                        defaultValue="/data/recordings"
                      />
                      <button className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 rounded-r-lg border-t border-r border-b border-gray-300 dark:border-gray-600">
                        Browse
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      File Format
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="csv">CSV (Datos de sensores)</option>
                      <option value="mp4">MP4 (Video)</option>
                      <option value="combined">Combinado (CSV + Video)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5" defaultChecked />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Sincronizar todos los sensores</span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5" defaultChecked />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Añadir timestamp a los archivos</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Visualización</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Calidad de video (RTSP)
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="low">Baja (480p)</option>
                      <option value="medium" selected>Media (720p)</option>
                      <option value="high">Alta (1080p)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Frecuencia de actualización de sensores
                    </label>
                    <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      <option value="1000">1 segundo</option>
                      <option value="500">0.5 segundos</option>
                      <option value="100" selected>0.1 segundos</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 h-5 w-5" defaultChecked />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">Mostrar gráficas en tiempo real</span>
                    </label>
                  </div>
                  
                  <div>
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                      Guardar Configuración
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Administración del Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">Versión del sistema: <span className="font-semibold">1.0.0</span></p>
                    <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                      Verificar actualizaciones
                    </button>
                  </div>
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">Espacio de almacenamiento: <span className="font-semibold">45% usado</span></p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                      Administrar almacenamiento
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Navbar currentSection={currentSection} setCurrentSection={setCurrentSection} />
      {renderSection()}
    </div>
  )
}

export default App
