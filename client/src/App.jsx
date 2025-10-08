import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'

function App() {
  const [sensors, setSensors] = useState([])
  const [newSensor, setNewSensor] = useState({ type: '', name: '', data: {} })
  const [currentSection, setCurrentSection] = useState('Sensors')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Total Sensors</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{sensors.length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-2">Active Cameras</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{sensors.filter(s => s.type === 'rtsp').length}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">Environmental Sensors</h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{sensors.filter(s => s.type === 'environmental').length}</p>
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
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white">RTSP Camera configuration and monitoring will be implemented here.</p>
            </div>
          </div>
        )
      case 'Settings':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white">Application settings and preferences.</p>
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
