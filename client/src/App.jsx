import { useState, useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import SensorManagement from './components/SensorManagement'
import { useFormValidation, validationRules } from './hooks/useFormValidation'

// API URL - hardcoded for now to fix the issue
const API_URL = 'http://localhost:3001'

function App() {
  const [sensors, setSensors] = useState([])
  const [newSensor, setNewSensor] = useState({ type: '', name: '', data: {} })
  const [currentSection, setCurrentSection] = useState('Dashboard')
  const [configTab, setConfigTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingStartTime, setRecordingStartTime] = useState(null)
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [theme, setTheme] = useState('light')
  const [recordingAutoStart, setRecordingAutoStart] = useState(false)

  // MQTT Topics and Sensors Management
  const [mqttTopics, setMqttTopics] = useState([])
  const [sensorTypes, setSensorTypes] = useState([])
  const [selectedSensor, setSelectedSensor] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [showNewSensorModal, setShowNewSensorModal] = useState(false)
  const [showNewTopicModal, setShowNewTopicModal] = useState(false)
  const [sensorData, setSensorData] = useState({})

  // Camera IPs state
  const [cameraIPs, setCameraIPs] = useState([])
  const [newCameraIP, setNewCameraIP] = useState({ name: '', ip: '', port: '554', username: '', password: '' })

  // Configurations state
  const [configurations, setConfigurations] = useState({
    general: {
      theme: 'light',
      recordingAutoStart: false,
      language: 'es',
      timezone: 'America/Mexico_City'
    },
    recordings: {
      directory: '/home/roberto/galgo-recordings',
      format: 'MP4 (H.264)',
      maxDuration: 60,
      quality: 'Alta (1080p)'
    },
    mqtt: {
      defaultBroker: 'EMQX Remoto (100.107.238.60:1883)',
      host: '100.107.238.60',
      port: 1883,
      username: 'admin',
      password: 'galgo2526',
      ssl: false
    },
    cameras: {
      defaultRtspPort: 554,
      defaultRtspPath: '/stream',
      connectionTimeout: 10,
      defaultQuality: '1080p (Alta)',
      defaultFrameRate: '30 FPS',
      autoReconnect: true,
      videoBuffer: true,
      bufferSize: 5,
      cameraIPs: []
    }
  })

  // Load configurations from API on mount
  useEffect(() => {
    loadConfigurations()
  }, [])

  // Load camera IPs from localStorage on mount (temporary, will be moved to API)
  useEffect(() => {
    const savedIPs = localStorage.getItem('galgo-camera-ips')
    if (savedIPs) {
      try {
        setCameraIPs(JSON.parse(savedIPs))
      } catch (error) {
        console.error('Error loading camera IPs:', error)
      }
    }
  }, [])

  // Save camera IPs to localStorage whenever they change (temporary)
  useEffect(() => {
    localStorage.setItem('galgo-camera-ips', JSON.stringify(cameraIPs))
  }, [cameraIPs])

  // Load configurations from API
  const loadConfigurations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/configurations`)
      if (response.ok) {
        const data = await response.json()
        const loadedConfigs = data.configurations || {}

        // Merge loaded configurations with defaults
        const mergedConfigs = {
          general: { ...configurations.general, ...loadedConfigs.general },
          recordings: { ...configurations.recordings, ...loadedConfigs.recordings },
          mqtt: { ...configurations.mqtt, ...loadedConfigs.mqtt },
          cameras: { ...configurations.cameras, ...loadedConfigs.cameras }
        }

        setConfigurations(mergedConfigs)

        // Apply loaded theme
        if (mergedConfigs.general.theme) {
          setTheme(mergedConfigs.general.theme)
        }

        // Apply loaded recording auto start
        if (mergedConfigs.general.recordingAutoStart !== undefined) {
          setRecordingAutoStart(mergedConfigs.general.recordingAutoStart)
        }

        // Apply loaded camera IPs
        if (mergedConfigs.cameras.cameraIPs) {
          setCameraIPs(mergedConfigs.cameras.cameraIPs)
        }

        console.log('Configurations loaded from API')
        
        // Apply MQTT configuration after loading
        setTimeout(() => {
          applyMqttConfiguration()
        }, 1000)
      }
    } catch (error) {
      console.error('Error loading configurations:', error)
      toast.error('Error al cargar configuraciones desde el servidor', { duration: 3000 })
    }
  }

  // Save configurations to API
  const saveConfigurations = async (category, key, value) => {
    try {
      const response = await fetch(`${API_URL}/api/configurations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, key, value })
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      console.log(`Configuration saved: ${category}.${key}`)
      return true
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error('Error al guardar configuración', { duration: 3000 })
      return false
    }
  }

  // Save all configurations to API
  const saveAllConfigurations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/configurations/bulk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configurations })
      })

      if (!response.ok) {
        throw new Error('Failed to save configurations')
      }

      toast.success('Todas las configuraciones guardadas exitosamente', { duration: 3000 })
      return true
    } catch (error) {
      console.error('Error saving configurations:', error)
      toast.error('Error al guardar configuraciones', { duration: 3000 })
      return false
    }
  }

  const addCameraIP = async () => {
    if (!newCameraIP.name.trim() || !newCameraIP.ip.trim()) {
      toast.error('Nombre e IP son requeridos', { duration: 3000 })
      return
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(newCameraIP.ip)) {
      toast.error('Formato de IP inválido', { duration: 3000 })
      return
    }

    const newIP = {
      id: Date.now(),
      ...newCameraIP
    }

    const updatedIPs = [...cameraIPs, newIP]
    setCameraIPs(updatedIPs)
    setNewCameraIP({ name: '', ip: '', port: '554', username: '', password: '' })

    // Update configurations and save to API
    const updatedConfigs = {
      ...configurations,
      cameras: {
        ...configurations.cameras,
        cameraIPs: updatedIPs
      }
    }
    setConfigurations(updatedConfigs)
    await saveConfigurations('cameras', 'cameraIPs', updatedIPs)

    toast.success('IP de cámara agregada exitosamente', { duration: 3000 })
  }

  const removeCameraIP = async (id) => {
    const updatedIPs = cameraIPs.filter(ip => ip.id !== id)
    setCameraIPs(updatedIPs)

    // Update configurations and save to API
    const updatedConfigs = {
      ...configurations,
      cameras: {
        ...configurations.cameras,
        cameraIPs: updatedIPs
      }
    }
    setConfigurations(updatedConfigs)
    await saveConfigurations('cameras', 'cameraIPs', updatedIPs)

    toast.success('IP de cámara eliminada', { duration: 2000 })
  }

  const updateCameraIP = async (id, updates) => {
    const updatedIPs = cameraIPs.map(ip => ip.id === id ? { ...ip, ...updates } : ip)
    setCameraIPs(updatedIPs)

    // Update configurations and save to API
    const updatedConfigs = {
      ...configurations,
      cameras: {
        ...configurations.cameras,
        cameraIPs: updatedIPs
      }
    }
    setConfigurations(updatedConfigs)
    await saveConfigurations('cameras', 'cameraIPs', updatedIPs)

    toast.success('IP de cámara actualizada', { duration: 2000 })
  }

  // Generic function to update configurations
  const updateConfiguration = async (category, key, value) => {
    const updatedConfigs = {
      ...configurations,
      [category]: {
        ...configurations[category],
        [key]: value
      }
    }
    setConfigurations(updatedConfigs)

    // Apply immediate changes for certain settings
    if (category === 'general' && key === 'theme') {
      setTheme(value)
    } else if (category === 'general' && key === 'recordingAutoStart') {
      setRecordingAutoStart(value)
    }

    // Save to API
    await saveConfigurations(category, key, value)
  }

  // Handle theme change with API save
  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme)
    await updateConfiguration('general', 'theme', newTheme)
  }

  // Handle recording auto start change with API save
  const handleRecordingAutoStartChange = async (value) => {
    setRecordingAutoStart(value)
    await updateConfiguration('general', 'recordingAutoStart', value)
  }

  // Apply MQTT configuration and connect
  const applyMqttConfiguration = async () => {
    const mqttConfig = configurations.mqtt
    if (mqttConfig.host && mqttConfig.port) {
      const brokerUrl = `${mqttConfig.ssl ? 'mqtts' : 'mqtt'}://${mqttConfig.host}:${mqttConfig.port}`
      setMqttBroker(brokerUrl)
      
      // Auto-connect if configuration is complete
      if (mqttConfig.host !== 'localhost' || mqttConfig.username) {
        try {
          await connectMqttWithConfig(brokerUrl, {
            username: mqttConfig.username,
            password: mqttConfig.password
          })
        } catch (error) {
          console.log('Auto-connect failed, manual connection required:', error.message)
        }
      }
    }
  }

  // Handle MQTT preset selection
  const handleMqttPresetChange = async (presetName) => {
    await updateConfiguration('mqtt', 'defaultBroker', presetName)
    
    // Apply preset configurations
    const presets = {
      'EMQX Local (localhost:1883)': {
        host: 'localhost',
        port: 1883,
        ssl: false,
        username: '',
        password: ''
      },
      'EMQX Remoto (100.107.238.60:1883)': {
        host: '100.107.238.60',
        port: 1883,
        ssl: false,
        username: 'admin',
        password: 'galgo2526'
      },
      'HiveMQ Cloud': {
        host: '',
        port: 8883,
        ssl: true,
        username: '',
        password: ''
      },
      'Mosquitto Local': {
        host: 'localhost',
        port: 1883,
        ssl: false,
        username: '',
        password: ''
      },
      'Custom': {
        host: configurations.mqtt.host,
        port: configurations.mqtt.port,
        ssl: configurations.mqtt.ssl,
        username: configurations.mqtt.username,
        password: configurations.mqtt.password
      }
    }
    
    const preset = presets[presetName] || presets['Custom']
    
    if (presetName !== 'Custom') {
      await updateConfiguration('mqtt', 'host', preset.host)
      await updateConfiguration('mqtt', 'port', preset.port)
      await updateConfiguration('mqtt', 'ssl', preset.ssl)
      await updateConfiguration('mqtt', 'username', preset.username)
      await updateConfiguration('mqtt', 'password', preset.password)
    }
  }

  // Connect MQTT with specific configuration
  const connectMqttWithConfig = async (brokerUrl, options = {}) => {
    setMqttLoading(true)
    try {
      const payload = { broker: brokerUrl }
      if (options.username) payload.username = options.username
      if (options.password) payload.password = options.password
      
      const response = await fetch(`${API_URL}/api/mqtt/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchMqttStatus()
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Connection failed')
      }
    } catch (error) {
      console.error('MQTT connect error:', error)
      throw error
    } finally {
      setMqttLoading(false)
    }
  }

  // MQTT States
  const [mqttStatus, setMqttStatus] = useState({ connected: false, broker: '', clientId: '' })
  const [mqttMessages, setMqttMessages] = useState([])
  const [newTopic, setNewTopic] = useState({ topic: '', description: '', qos: 0, retained: false })
  const [mqttLoading, setMqttLoading] = useState(false)
  const [mqttBroker, setMqttBroker] = useState('mqtt://localhost:1883')

  // Form validation hooks
  const sensorForm = useFormValidation(
    { type: '', name: '', data: {} },
    {
      type: [validationRules.required('El tipo de sensor es requerido')],
      name: [
        validationRules.required('El nombre del sensor es requerido'),
        validationRules.minLength(2, 'El nombre debe tener al menos 2 caracteres'),
        validationRules.maxLength(50, 'El nombre no puede tener más de 50 caracteres')
      ],
      data: (value, formValues) => {
        const errors = {}
        if (formValues.type === 'rtsp') {
          if (!value.host || !value.host.trim()) {
            errors.host = 'La dirección IP o host es requerida'
          } else if (!/^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value.host) && !/^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(value.host)) {
            errors.host = 'Formato de IP o dominio inválido'
          }
          if (!value.port || !value.port.toString().trim()) {
            errors.port = 'El puerto RTSP es requerido'
          } else if (value.port < 1 || value.port > 65535) {
            errors.port = 'El puerto debe estar entre 1 y 65535'
          }
          if (!value.path || !value.path.trim()) {
            errors.path = 'El path del stream es requerido'
          }
          // Usuario y contraseña son opcionales, no requieren validación
        } else if (formValues.type === 'emotibit') {
          if (!value.deviceId || !value.deviceId.trim()) {
            errors.deviceId = 'El ID del dispositivo es requerido'
          }
          if (!value.samplingRate || !value.samplingRate.trim()) {
            errors.samplingRate = 'La frecuencia de muestreo es requerida'
          }
        } else if (formValues.type === 'environmental') {
          if (!value.location || !value.location.trim()) {
            errors.location = 'La ubicación es requerida'
          }
          if (!value.parameters || !value.parameters.trim()) {
            errors.parameters = 'Los parámetros son requeridos'
          }
        }
        return Object.keys(errors).length > 0 ? errors : undefined
      }
    }
  )

  const topicForm = useFormValidation(
    { topic: '', description: '', qos: 0, retained: false },
    {
      topic: [
        validationRules.required('El topic es requerido'),
        validationRules.mqttTopic('Formato de topic MQTT inválido'),
        validationRules.maxLength(100, 'El topic no puede tener más de 100 caracteres')
      ],
      description: [
        validationRules.maxLength(200, 'La descripción no puede tener más de 200 caracteres')
      ]
    }
  )

  const messageForm = useFormValidation(
    { topic: '', message: '', qos: 0, retain: false },
    {
      topic: [
        validationRules.required('El topic es requerido'),
        validationRules.mqttTopic('Formato de topic MQTT inválido')
      ],
      message: [
        validationRules.required('El mensaje es requerido')
      ]
    }
  )

  useEffect(() => {
    if (currentSection === 'Sensores') {
      fetchSensors()
      fetchSensorTypes()
      fetchTopics()
    }
  }, [currentSection])

  // MQTT useEffect
  useEffect(() => {
    if (currentSection === 'MQTT') {
      fetchMqttStatus()
      fetchMqttTopics()
      fetchMqttMessages()
      
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMqttMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [currentSection])

  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    let interval;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date() - recordingStartTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  const fetchSensors = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/api/sensors`)
      if (!response.ok) {
        throw new Error('Failed to fetch sensors')
      }
      const data = await response.json()
      setSensors(data.sensors || [])
    } catch (error) {
      console.error('Error fetching sensors:', error)
      setError('Failed to load sensors')
      toast.error('Error al cargar sensores', { duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  // Fetch sensor types
  const fetchSensorTypes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sensors/types`)
      if (response.ok) {
        const data = await response.json()
        setSensorTypes(data.types || [])
      }
    } catch (error) {
      console.error('Error fetching sensor types:', error)
    }
  }

  // Fetch MQTT topics
  const fetchTopics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/topics`)
      if (response.ok) {
        const data = await response.json()
        setMqttTopics(data.topics || [])
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  // Create new sensor
  const createSensor = async (sensorData) => {
    try {
      const response = await fetch(`${API_URL}/api/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensorData)
      })

      if (response.ok) {
        await fetchSensors()
        toast.success('Sensor creado exitosamente')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create sensor')
      }
    } catch (error) {
      console.error('Error creating sensor:', error)
      toast.error(`Error al crear sensor: ${error.message}`)
      return false
    }
  }

  // Update sensor
  const updateSensor = async (id, sensorData) => {
    try {
      const response = await fetch(`${API_URL}/api/sensors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensorData)
      })

      if (response.ok) {
        await fetchSensors()
        toast.success('Sensor actualizado exitosamente')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update sensor')
      }
    } catch (error) {
      console.error('Error updating sensor:', error)
      toast.error(`Error al actualizar sensor: ${error.message}`)
      return false
    }
  }

  // Delete sensor
  const deleteSensor = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/sensors/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSensors()
        toast.success('Sensor eliminado exitosamente')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete sensor')
      }
    } catch (error) {
      console.error('Error deleting sensor:', error)
      toast.error(`Error al eliminar sensor: ${error.message}`)
      return false
    }
  }

  // Create new topic
  const createTopic = async (topicData) => {
    try {
      const response = await fetch(`${API_URL}/api/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicData)
      })

      if (response.ok) {
        await fetchTopics()
        toast.success('Topic creado exitosamente')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create topic')
      }
    } catch (error) {
      console.error('Error creating topic:', error)
      toast.error(`Error al crear topic: ${error.message}`)
      return false
    }
  }

  // Subscribe to topic
  const subscribeToTopic = async (topicId) => {
    try {
      const response = await fetch(`${API_URL}/api/topics/${topicId}/subscribe`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchTopics()
        toast.success('Suscrito al topic exitosamente')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to subscribe to topic')
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error)
      toast.error(`Error al suscribirse: ${error.message}`)
      return false
    }
  }

  // Unsubscribe from topic
  const unsubscribeFromTopic = async (topicId) => {
    try {
      const response = await fetch(`${API_URL}/api/topics/${topicId}/unsubscribe`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchTopics()
        toast.success('Desuscrito del topic exitosamente')
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to unsubscribe from topic')
      }
    } catch (error) {
      console.error('Error unsubscribing from topic:', error)
      toast.error(`Error al desuscribirse: ${error.message}`)
      return false
    }
  }

  const addSensor = async () => {
    // Validate form before submission
    const isValid = sensorForm.validateForm()
    if (!isValid) {
      toast.error('Por favor corrige los errores del formulario', {
        duration: 4000
      })
      return
    }

    setLoading(true)
    setError(null)

    // Prepare sensor data in the format expected by the backend
    let sensorData = { ...sensorForm.values }

    // Map the data based on sensor type
    let backendData = {
      name: sensorData.name,
      type: sensorData.type,
      topic: '', // Will be set based on type
      description: '',
      unit: '',
      min_value: null,
      max_value: null,
      active: true
    }

    // Set type-specific data
    if (sensorData.type === 'rtsp') {
      const { host, port, path, username, password } = sensorData.data
      let url = `rtsp://${host}:${port}${path}`
      
      // Add authentication if provided
      if (username && password) {
        url = `rtsp://${username}:${password}@${host}:${port}${path}`
      }
      
      backendData.topic = `rtsp/${sensorData.name.replace(/\s+/g, '_').toLowerCase()}`
      backendData.description = `Cámara RTSP: ${url}`
      backendData.unit = 'stream'
      backendData.data = {
        host,
        port,
        path,
        username,
        password,
        url
      }
    } else if (sensorData.type === 'emotibit') {
      backendData.topic = `emotibit/${sensorData.name.replace(/\s+/g, '_').toLowerCase()}`
      backendData.description = `EmotiBit Device: ${sensorData.data.deviceId}`
      backendData.unit = 'data'
      backendData.data = {
        deviceId: sensorData.data.deviceId,
        samplingRate: sensorData.data.samplingRate
      }
    } else if (sensorData.type === 'environmental') {
      backendData.topic = `environmental/${sensorData.name.replace(/\s+/g, '_').toLowerCase()}`
      backendData.description = `Sensor Ambiental: ${sensorData.data.location}`
      backendData.unit = sensorData.data.parameters || 'value'
      backendData.data = {
        location: sensorData.data.location,
        parameters: sensorData.data.parameters
      }
    }

    try {
      const response = await fetch(`${API_URL}/api/sensors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add sensor')
      }

      const result = await response.json()
      
      // Store additional sensor data locally if needed
      // For now, we'll just use the backend response
      fetchSensors()
      sensorForm.resetForm()
      toast.success(`Sensor "${sensorData.name}" agregado exitosamente`, {
        duration: 3000,
        icon: '✅'
      })
    } catch (err) {
      toast.error('Error al agregar el sensor. Verifica la conexión con el servidor.', {
        duration: 5000
      })
      console.error('Error adding sensor:', err)
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      setIsRecording(true)
      setRecordingStartTime(new Date())
      toast.success('Grabación iniciada - Todos los sensores activos', {
        duration: 3000,
        icon: '🎥'
      })

      // Call API to start recording on server
      const response = await fetch(`${API_URL}/api/recording/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensors: sensors.map(s => s.id), // Send list of active sensor IDs
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start recording on server')
      }

      const data = await response.json()
      console.log('Server recording started:', data)
    } catch (error) {
      console.error('Error starting recording:', error)
      setIsRecording(false)
      setRecordingStartTime(null)
      toast.error('Error al iniciar la grabación. Verifica la conexión con el servidor.', {
        duration: 5000
      })
    }
  }

  const stopRecording = async () => {
    try {
      const duration = new Date() - recordingStartTime
      const durationText = `${Math.floor(duration / 60000)}:${Math.floor((duration % 60000) / 1000).toString().padStart(2, '0')}`
      toast.success(`Grabación detenida - Duración: ${durationText}`, {
        duration: 4000,
        icon: '⏹️'
      })

      // Call API to stop recording on server
      const response = await fetch(`${API_URL}/api/recording/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: Math.round(duration / 1000),
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to stop recording on server')
      }

      const data = await response.json()
      console.log('Server recording stopped:', data)

      setIsRecording(false)
      setRecordingStartTime(null)
    } catch (error) {
      console.error('Error stopping recording:', error)
      toast.error('Error al detener la grabación. Los datos pueden no haberse guardado correctamente.', {
        duration: 5000
      })
      // Still reset the local state even if server call fails
      setIsRecording(false)
      setRecordingStartTime(null)
    }
  }

  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera)
    toast.success(`Cámara seleccionada: ${camera.name}`, {
      duration: 2000,
      icon: '📹'
    })
  }

  // MQTT Functions
  const fetchMqttStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mqtt/status`)
      if (response.ok) {
        const data = await response.json()
        setMqttStatus(data)
      }
    } catch (error) {
      console.error('Error fetching MQTT status:', error)
    }
  }

  const fetchMqttTopics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mqtt/topics`)
      if (response.ok) {
        const data = await response.json()
        setMqttTopics(data.topics)
      }
    } catch (error) {
      console.error('Error fetching MQTT topics:', error)
    }
  }

  const fetchMqttMessages = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mqtt/messages?limit=20`)
      if (response.ok) {
        const data = await response.json()
        setMqttMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching MQTT messages:', error)
    }
  }

  const connectMqtt = async () => {
    if (!mqttBroker.trim()) {
      toast.error('Por favor ingresa una URL de broker MQTT válida', {
        duration: 4000
      })
      return
    }

    setMqttLoading(true)
    const loadingToast = toast.loading('Conectando al broker MQTT...', {
      duration: 10000
    })

    try {
      const response = await fetch(`${API_URL}/api/mqtt/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker: mqttBroker })
      })

      if (response.ok) {
        await fetchMqttStatus()
        toast.dismiss(loadingToast)
        toast.success(`Conectado exitosamente al broker MQTT: ${mqttBroker}`, {
          duration: 4000,
          icon: '🔗'
        })
        setError('')
      } else {
        const errorData = await response.json()
        toast.dismiss(loadingToast)
        toast.error(`Error de conexión MQTT: ${errorData.error || 'Error desconocido'}`, {
          duration: 5000
        })
        setError(errorData.error || 'Error connecting to MQTT')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Error conectando al broker MQTT. Verifica la URL y la conexión.', {
        duration: 5000
      })
      setError('Error connecting to MQTT broker')
      console.error('MQTT connect error:', error)
    } finally {
      setMqttLoading(false)
    }
  }

  const disconnectMqtt = async () => {
    setMqttLoading(true)
    const loadingToast = toast.loading('Desconectando del broker MQTT...', {
      duration: 5000
    })

    try {
      const response = await fetch(`${API_URL}/api/mqtt/disconnect`, {
        method: 'POST'
      })

      if (response.ok) {
        await fetchMqttStatus()
        toast.dismiss(loadingToast)
        toast.success('Desconectado exitosamente del broker MQTT', {
          duration: 3000,
          icon: '🔌'
        })
        setError('')
      } else {
        const errorData = await response.json()
        toast.dismiss(loadingToast)
        toast.error(`Error al desconectar: ${errorData.error || 'Error desconocido'}`, {
          duration: 5000
        })
        setError(errorData.error || 'Error disconnecting from MQTT')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Error desconectando del broker MQTT', {
        duration: 5000
      })
      setError('Error disconnecting from MQTT broker')
      console.error('MQTT disconnect error:', error)
    } finally {
      setMqttLoading(false)
    }
  }

  const addMqttTopic = async () => {
    // Validate form before submission
    const isValid = topicForm.validateForm()
    if (!isValid) {
      toast.error('Por favor corrige los errores del formulario', {
        duration: 4000
      })
      return
    }

    setMqttLoading(true)
    const loadingToast = toast.loading('Agregando topic MQTT...', {
      duration: 5000
    })

    try {
      const response = await fetch(`${API_URL}/api/mqtt/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(topicForm.values)
      })

      if (response.ok) {
        await fetchMqttTopics()
        topicForm.resetForm()
        toast.dismiss(loadingToast)
        toast.success(`Topic "${topicForm.values.topic}" agregado exitosamente`, {
          duration: 3000,
          icon: '📡'
        })
        setError('')
      } else {
        const errorData = await response.json()
        toast.dismiss(loadingToast)
        toast.error(`Error al agregar topic: ${errorData.error || 'Error desconocido'}`, {
          duration: 5000
        })
        setError(errorData.error || 'Error adding topic')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Error agregando topic MQTT', {
        duration: 5000
      })
      setError('Error adding MQTT topic')
      console.error('Add topic error:', error)
    } finally {
      setMqttLoading(false)
    }
  }

  const updateMqttTopic = async (id, updates) => {
    setMqttLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/mqtt/topics/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchMqttTopics()
        const action = updates.active ? 'activado' : 'desactivado'
        toast.success(`Topic ${action} exitosamente`, {
          duration: 2000,
          icon: updates.active ? '▶️' : '⏸️'
        })
        setError('')
      } else {
        const errorData = await response.json()
        toast.error(`Error al actualizar topic: ${errorData.error || 'Error desconocido'}`, {
          duration: 5000
        })
        setError(errorData.error || 'Error updating topic')
      }
    } catch (error) {
      toast.error('Error actualizando topic MQTT', {
        duration: 5000
      })
      setError('Error updating MQTT topic')
      console.error('Update topic error:', error)
    } finally {
      setMqttLoading(false)
    }
  }

  const deleteMqttTopic = async (id) => {
    const topic = mqttTopics.find(t => t.id === id)
    if (!confirm(`¿Estás seguro de que quieres eliminar el topic "${topic?.topic}"?`)) return

    setMqttLoading(true)
    const loadingToast = toast.loading('Eliminando topic...', {
      duration: 5000
    })

    try {
      const response = await fetch(`${API_URL}/api/mqtt/topics/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMqttTopics()
        toast.dismiss(loadingToast)
        toast.success(`Topic "${topic?.topic}" eliminado exitosamente`, {
          duration: 3000,
          icon: '🗑️'
        })
        setError('')
      } else {
        const errorData = await response.json()
        toast.dismiss(loadingToast)
        toast.error(`Error al eliminar topic: ${errorData.error || 'Error desconocido'}`, {
          duration: 5000
        })
        setError(errorData.error || 'Error deleting topic')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Error eliminando topic MQTT', {
        duration: 5000
      })
      setError('Error deleting MQTT topic')
      console.error('Delete topic error:', error)
    } finally {
      setMqttLoading(false)
    }
  }

  const publishMqttMessage = async () => {
    // Validate form before submission
    const isValid = messageForm.validateForm()
    if (!isValid) {
      toast.error('Por favor corrige los errores del formulario', {
        duration: 4000
      })
      return
    }

    setMqttLoading(true)
    const loadingToast = toast.loading('Publicando mensaje MQTT...', {
      duration: 5000
    })

    try {
      const response = await fetch(`${API_URL}/api/mqtt/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageForm.values)
      })

      if (response.ok) {
        messageForm.resetForm()
        toast.dismiss(loadingToast)
        toast.success(`Mensaje publicado en "${messageForm.values.topic}"`, {
          duration: 3000,
          icon: '📤'
        })
        setError('')
        // Refresh messages after publishing
        setTimeout(fetchMqttMessages, 1000)
      } else {
        const errorData = await response.json()
        toast.dismiss(loadingToast)
        toast.error(`Error al publicar mensaje: ${errorData.error || 'Error desconocido'}`, {
          duration: 5000
        })
        setError(errorData.error || 'Error publishing message')
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Error publicando mensaje MQTT', {
        duration: 5000
      })
      setError('Error publishing MQTT message')
      console.error('Publish message error:', error)
    } finally {
      setMqttLoading(false)
    }
  }

  const renderDataFields = (sensorType, form) => {
    switch (sensorType) {
      case 'rtsp':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Dirección IP o Host</label>
              <input
                type="text"
                placeholder="192.168.1.100"
                value={form.values.data.host || ''}
                onChange={(e) => form.handleChange('data', {...form.values.data, host: e.target.value})}
                onBlur={() => form.handleBlur('data')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  form.errors.data?.host ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {form.errors.data?.host && form.touched.data && (
                <p className="text-red-500 text-sm mt-1">{form.errors.data.host}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Puerto RTSP</label>
              <input
                type="number"
                placeholder="554"
                value={form.values.data.port || ''}
                onChange={(e) => form.handleChange('data', {...form.values.data, port: e.target.value})}
                onBlur={() => form.handleBlur('data')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  form.errors.data?.port ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {form.errors.data?.port && form.touched.data && (
                <p className="text-red-500 text-sm mt-1">{form.errors.data.port}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Path del Stream</label>
              <input
                type="text"
                placeholder="/stream"
                value={form.values.data.path || ''}
                onChange={(e) => form.handleChange('data', {...form.values.data, path: e.target.value})}
                onBlur={() => form.handleBlur('data')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  form.errors.data?.path ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {form.errors.data?.path && form.touched.data && (
                <p className="text-red-500 text-sm mt-1">{form.errors.data.path}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Usuario (opcional)</label>
                <input
                  type="text"
                  placeholder="admin"
                  value={form.values.data.username || ''}
                  onChange={(e) => form.handleChange('data', {...form.values.data, username: e.target.value})}
                  onBlur={() => form.handleBlur('data')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    form.errors.data?.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {form.errors.data?.username && form.touched.data && (
                  <p className="text-red-500 text-sm mt-1">{form.errors.data.username}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Contraseña (opcional)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.values.data.password || ''}
                  onChange={(e) => form.handleChange('data', {...form.values.data, password: e.target.value})}
                  onBlur={() => form.handleBlur('data')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    form.errors.data?.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {form.errors.data?.password && form.touched.data && (
                  <p className="text-red-500 text-sm mt-1">{form.errors.data.password}</p>
                )}
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                <strong>URL RTSP generada:</strong>
                <div className="mt-1 font-mono text-xs bg-white dark:bg-gray-800 p-2 rounded border">
                  rtsp://{form.values.data.username && form.values.data.password ? `${form.values.data.username}:${form.values.data.password}@` : ''}{form.values.data.host || 'host'}:{form.values.data.port || '554'}{form.values.data.path || '/stream'}
                </div>
              </div>
            </div>
          </div>
        )
      case 'emotibit':
        return (
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Device ID"
                value={form.values.data.deviceId || ''}
                onChange={(e) => form.handleChange('data', {...form.values.data, deviceId: e.target.value})}
                onBlur={() => form.handleBlur('data')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  form.errors.data?.deviceId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {form.errors.data?.deviceId && form.touched.data && (
                <p className="text-red-500 text-sm mt-1">{form.errors.data.deviceId}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Sampling Rate"
                value={form.values.data.samplingRate || ''}
                onChange={(e) => form.handleChange('data', {...form.values.data, samplingRate: e.target.value})}
                onBlur={() => form.handleBlur('data')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  form.errors.data?.samplingRate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {form.errors.data?.samplingRate && form.touched.data && (
                <p className="text-red-500 text-sm mt-1">{form.errors.data.samplingRate}</p>
              )}
            </div>
          </div>
        )
      case 'environmental':
        return (
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Location"
                value={form.values.data.location || ''}
                onChange={(e) => form.handleChange('data', {...form.values.data, location: e.target.value})}
                onBlur={() => form.handleBlur('data')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  form.errors.data?.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {form.errors.data?.location && form.touched.data && (
                <p className="text-red-500 text-sm mt-1">{form.errors.data.location}</p>
              )}
            </div>
            <div>
              <input
                type="text"
                placeholder="Parameters (e.g., temperature, humidity)"
                value={form.values.data.parameters || ''}
                onChange={(e) => form.handleChange('data', {...form.values.data, parameters: e.target.value})}
                onBlur={() => form.handleBlur('data')}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  form.errors.data?.parameters ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {form.errors.data?.parameters && form.touched.data && (
                <p className="text-red-500 text-sm mt-1">{form.errors.data.parameters}</p>
              )}
            </div>
          </div>
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
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h2>
              <p className="text-gray-600 dark:text-gray-300">Vista general del sistema Galgo-School</p>
            </div>
            
            {/* Estado de conexión MQTT */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-4 h-4 rounded-full ${mqttStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">Estado MQTT</h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {mqttStatus.connected ? `Conectado a ${mqttStatus.broker}` : 'Desconectado'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{mqttTopics.filter(t => t.active).length}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Topics activos</div>
                </div>
              </div>
            </div>
            {isRecording && (
              <div className="mb-8 relative overflow-hidden bg-gradient-to-r from-red-500 via-red-600 to-red-700 dark:from-red-600 dark:via-red-700 dark:to-red-800 p-6 rounded-2xl shadow-2xl border border-red-300 dark:border-red-600 animate-pulse">
                {/* Patrón de fondo animado */}
                <div className="absolute inset-0 bg-red-400 dark:bg-red-500 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer opacity-20"></div>
                </div>
                
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    {/* Indicador circular animado */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-ping">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-xs">REC</span>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">🎥 Grabación Activa</h3>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                            <path d="M12 6v6l4 2" strokeWidth="2"/>
                          </svg>
                          <p className="text-white font-medium">
                            {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                          </p>
                        </div>
                        <div className="text-white/80 text-sm">
                          • {sensors.length} sensores activos
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={stopRecording}
                    className="group relative bg-white hover:bg-gray-50 text-red-600 font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                      </svg>
                      <span>Detener</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            {/* Grid de métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-1">Total Sensores</h3>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{sensors.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">Cámaras RTSP</h3>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{sensors.filter(s => s.type === 'rtsp').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl shadow-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-1">Sensores Ambientales</h3>
                    <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{sensors.filter(s => s.type === 'environmental').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-xl shadow-lg border border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400 mb-1">EmotiBit</h3>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{sensors.filter(s => s.type === 'emotibit').length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600"></div>
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Control de Grabación
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Inicia una grabación sincronizada de todos los sensores conectados
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Sensores listos</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{sensors.length}</div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-6 md:mb-0 md:mr-8">
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Sensores ambientales: {sensors.filter(s => s.type === 'environmental').length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Cámaras RTSP: {sensors.filter(s => s.type === 'rtsp').length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">EmotiBit: {sensors.filter(s => s.type === 'emotibit').length}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Todos los datos se guardarán en la ubicación configurada en Ajustes
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`group relative flex items-center justify-center w-32 h-32 rounded-full font-bold text-lg shadow-2xl transition-all duration-500 transform hover:scale-105 ${
                        isRecording
                          ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/50'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/50'
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                        isRecording ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      
                      <div className="relative flex flex-col items-center">
                        {isRecording ? (
                          <>
                            <svg className="w-8 h-8 mb-1 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                            </svg>
                            <span className="text-sm">Detener</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-8 h-8 mb-1 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" fill="currentColor" />
                            </svg>
                            <span className="text-sm">Iniciar</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actividad Reciente */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Actividad Reciente
              </h3>
              
              <div className="space-y-3">
                {/* Últimos mensajes MQTT */}
                {mqttMessages.slice(0, 3).map(message => (
                  <div key={`mqtt-${message.timestamp}`} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Mensaje MQTT en {message.topic}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(message.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      MQTT
                    </div>
                  </div>
                ))}
                
                {/* Eventos de sensores simulados */}
                <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      Sensor Ambiental A1 reportando datos
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Hace 2 minutos
                    </div>
                  </div>
                  <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    Sensor
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      EmotiBit P001 conectado exitosamente
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Hace 5 minutos
                    </div>
                  </div>
                  <div className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                    EmotiBit
                  </div>
                </div>
                
                {mqttMessages.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No hay actividad reciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      case 'Sensores':
        return (
          <div className="p-8">
            <SensorManagement
              sensors={sensors}
              mqttTopics={mqttTopics}
              onSensorUpdate={fetchSensors}
              onTopicUpdate={fetchTopics}
            />
          </div>
        )
      case 'Configuración':
        return (
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Configuración del Sistema</h2>
            
            {/* Tabs Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
                    { id: 'sensors', label: 'Sensores', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                    { id: 'cameras', label: 'Cámaras RTSP', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
                    { id: 'mqtt', label: 'MQTT', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
                    { id: 'recordings', label: 'Grabaciones', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setConfigTab(tab.id)}
                      className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        configTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                      </svg>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[600px]">
              {configTab === 'general' && (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configuración General
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Modo Oscuro</span>
                      <button
                        onClick={() => handleThemeChange(theme === 'dark' ? 'light' : 'dark')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                          theme === 'dark' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Inicio Automático de Grabación</span>
                      <button
                        onClick={() => handleRecordingAutoStartChange(!recordingAutoStart)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                          recordingAutoStart ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            recordingAutoStart ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Idioma</label>
                      <select
                        value={configurations.general.language}
                        onChange={(e) => updateConfiguration('general', 'language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="es">Español</option>
                        <option value="en">Inglés</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Zona Horaria</label>
                      <select
                        value={configurations.general.timezone}
                        onChange={(e) => updateConfiguration('general', 'timezone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="America/Mexico_City">America/Mexico_City</option>
                        <option value="Europe/Madrid">Europe/Madrid</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <button
                      onClick={() => saveAllConfigurations()}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Guardar Configuración General
                    </button>
                  </div>
                </div>
              )}

              {configTab === 'sensors' && (
                <div className="p-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Gestión de Sensores y Topics MQTT</h2>
                    <p className="text-gray-600 dark:text-gray-300">Administra sensores conectados y topics de mensajería</p>
                  </div>

                  {/* Estado de conexión MQTT */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl shadow-lg border border-green-200 dark:border-green-700 mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-4 h-4 rounded-full ${mqttStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <div>
                          <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">Estado MQTT</h3>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {mqttStatus.connected ? `Conectado a ${mqttStatus.broker}` : 'Desconectado'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{mqttTopics.filter(t => t.active).length}</div>
                        <div className="text-sm text-green-700 dark:text-green-300">Topics activos</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Gestión de Sensores */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Sensores Registrados ({sensors.length})
                        </h3>

                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando sensores...</span>
                          </div>
                        ) : sensors.length === 0 ? (
                          <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay sensores registrados</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comienza agregando tu primer sensor</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {sensors.map(sensor => (
                              <div key={sensor.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${
                                      sensor.type === 'rtsp' ? 'bg-green-500' :
                                      sensor.type === 'environmental' ? 'bg-blue-500' :
                                      sensor.type === 'emotibit' ? 'bg-purple-500' : 'bg-gray-500'
                                    }`}></div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 dark:text-white">{sensor.name}</h4>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{sensor.type}</p>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                                    {sensor.type === 'rtsp' && sensor.data?.url && (
                                      <span>RTSP: {sensor.data.url}</span>
                                    )}
                                    {sensor.type === 'environmental' && sensor.data?.location && (
                                      <span>Ubicación: {sensor.data.location}</span>
                                    )}
                                    {sensor.type === 'emotibit' && sensor.data?.deviceId && (
                                      <span>Device ID: {sensor.data.deviceId}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      const newName = prompt('Nuevo nombre:', sensor.name)
                                      if (newName && newName.trim() && newName !== sensor.name) {
                                        updateSensor(sensor.id, { ...sensor, name: newName.trim() })
                                      }
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                    title="Editar nombre"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`¿Estás seguro de que quieres eliminar el sensor "${sensor.name}"?`)) {
                                        deleteSensor(sensor.id)
                                      }
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                                    title="Eliminar sensor"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Agregar Nuevo Sensor */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Agregar Nuevo Sensor
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tipo de Sensor</label>
                            <select
                              value={sensorForm.values.type}
                              onChange={(e) => sensorForm.handleChange('type', e.target.value)}
                              onBlur={() => sensorForm.handleBlur('type')}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                sensorForm.errors.type ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              disabled={loading}
                            >
                              <option value="">Seleccionar Tipo de Sensor</option>
                              <option value="environmental">Ambiental</option>
                              <option value="emotibit">EmotiBit</option>
                              <option value="rtsp">Cámara RTSP</option>
                            </select>
                            {sensorForm.errors.type && sensorForm.touched.type && (
                              <p className="text-red-500 text-sm mt-1">{sensorForm.errors.type}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nombre del Sensor</label>
                            <input
                              type="text"
                              placeholder="Ej: Sensor Temperatura Principal"
                              value={sensorForm.values.name}
                              onChange={(e) => sensorForm.handleChange('name', e.target.value)}
                              onBlur={() => sensorForm.handleBlur('name')}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                sensorForm.errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              disabled={loading}
                            />
                            {sensorForm.errors.name && sensorForm.touched.name && (
                              <p className="text-red-500 text-sm mt-1">{sensorForm.errors.name}</p>
                            )}
                          </div>

                          {renderDataFields(sensorForm.values.type, sensorForm)}

                          <button
                            onClick={addSensor}
                            disabled={loading || !sensorForm.isValid}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Agregando...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Agregar Sensor
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Gestión de Topics MQTT */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v5a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1h4zM7 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M7 10H4a1 1 0 00-1 1v8a1 1 0 001 1h3m0-10h10m0 0V8a1 1 0 00-1-1H7a1 1 0 00-1 1v2z" />
                          </svg>
                          Topics MQTT ({mqttTopics.length})
                        </h3>

                        {mqttTopics.length === 0 ? (
                          <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v5a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1h4zM7 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M7 10H4a1 1 0 00-1 1v8a1 1 0 001 1h3m0-10h10m0 0V8a1 1 0 00-1-1H7a1 1 0 00-1 1v2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay topics configurados</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Agrega topics para recibir mensajes MQTT</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {mqttTopics.map(topic => (
                              <div key={topic.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-3 h-3 rounded-full ${topic.active ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                    <div>
                                      <h4 className="font-medium text-gray-900 dark:text-white">{topic.topic}</h4>
                                      {topic.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{topic.description}</p>
                                      )}
                                      <div className="text-xs text-gray-400 dark:text-gray-500">
                                        QoS: {topic.qos} | Retained: {topic.retained ? 'Sí' : 'No'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      if (topic.active) {
                                        unsubscribeFromTopic(topic.id)
                                      } else {
                                        subscribeToTopic(topic.id)
                                      }
                                    }}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                      topic.active
                                        ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                                        : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
                                    }`}
                                  >
                                    {topic.active ? 'Desuscribir' : 'Suscribir'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`¿Estás seguro de que quieres eliminar el topic "${topic.topic}"?`)) {
                                        // Implementar deleteTopic si es necesario
                                        toast.error('Función de eliminación no implementada aún')
                                      }
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors"
                                    title="Eliminar topic"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Agregar Nuevo Topic */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Agregar Nuevo Topic
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Topic MQTT</label>
                            <input
                              type="text"
                              placeholder="Ej: sensors/temperature/room1"
                              value={topicForm.values.topic}
                              onChange={(e) => topicForm.handleChange('topic', e.target.value)}
                              onBlur={() => topicForm.handleBlur('topic')}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                topicForm.errors.topic ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              disabled={mqttLoading}
                            />
                            {topicForm.errors.topic && topicForm.touched.topic && (
                              <p className="text-red-500 text-sm mt-1">{topicForm.errors.topic}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Descripción (opcional)</label>
                            <input
                              type="text"
                              placeholder="Descripción del topic"
                              value={topicForm.values.description}
                              onChange={(e) => topicForm.handleChange('description', e.target.value)}
                              onBlur={() => topicForm.handleBlur('description')}
                              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                                topicForm.errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              disabled={mqttLoading}
                            />
                            {topicForm.errors.description && topicForm.touched.description && (
                              <p className="text-red-500 text-sm mt-1">{topicForm.errors.description}</p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">QoS</label>
                              <select
                                value={topicForm.values.qos}
                                onChange={(e) => topicForm.handleChange('qos', parseInt(e.target.value))}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                disabled={mqttLoading}
                              >
                                <option value={0}>0 - Al menos una vez</option>
                                <option value={1}>1 - Al menos una vez</option>
                                <option value={2}>2 - Exactamente una vez</option>
                              </select>
                            </div>
                            <div className="flex items-center">
                              <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                                <input
                                  type="checkbox"
                                  checked={topicForm.values.retained}
                                  onChange={(e) => topicForm.handleChange('retained', e.target.checked)}
                                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                                  disabled={mqttLoading}
                                />
                                <span>Retained</span>
                              </label>
                            </div>
                          </div>

                          <button
                            onClick={addMqttTopic}
                            disabled={mqttLoading || !topicForm.isValid}
                            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            {mqttLoading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Agregando...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Agregar Topic
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {configTab === 'cameras' && (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    Configuración de Cámaras RTSP
                  </h3>
                  
                  {/* Agregar nueva IP de cámara */}
                  <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Agregar Nueva IP de Cámara</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                        <input
                          type="text"
                          placeholder="Cámara Entrada Principal"
                          value={newCameraIP.name}
                          onChange={(e) => setNewCameraIP({...newCameraIP, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Dirección IP</label>
                        <input
                          type="text"
                          placeholder="192.168.1.100"
                          value={newCameraIP.ip}
                          onChange={(e) => setNewCameraIP({...newCameraIP, ip: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Puerto RTSP</label>
                        <input
                          type="number"
                          placeholder="554"
                          value={newCameraIP.port}
                          onChange={(e) => setNewCameraIP({...newCameraIP, port: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Usuario (opcional)</label>
                        <input
                          type="text"
                          placeholder="admin"
                          value={newCameraIP.username}
                          onChange={(e) => setNewCameraIP({...newCameraIP, username: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Contraseña (opcional)</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={newCameraIP.password}
                          onChange={(e) => setNewCameraIP({...newCameraIP, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addCameraIP}
                      className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Agregar IP de Cámara
                    </button>
                  </div>

                  {/* Lista de IPs guardadas */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">IPs de Cámaras Guardadas</h4>
                    {cameraIPs.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay IPs de cámaras guardadas</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {cameraIPs.map(camera => (
                          <div key={camera.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-white">{camera.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {camera.ip}:{camera.port}
                                {camera.username && (
                                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                                    (Usuario: {camera.username})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  const newName = prompt('Nuevo nombre:', camera.name)
                                  if (newName && newName.trim()) {
                                    updateCameraIP(camera.id, { name: newName.trim() })
                                  }
                                }}
                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                title="Editar nombre"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removeCameraIP(camera.id)}
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Configuración global */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Configuración Global</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Puerto RTSP Predeterminado</label>
                        <input
                          type="number"
                          value={configurations.cameras.defaultRtspPort}
                          onChange={(e) => updateConfiguration('cameras', 'defaultRtspPort', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Path RTSP Predeterminado</label>
                        <input
                          type="text"
                          value={configurations.cameras.defaultRtspPath}
                          onChange={(e) => updateConfiguration('cameras', 'defaultRtspPath', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tiempo de Espera de Conexión (segundos)</label>
                        <input
                          type="number"
                          value={configurations.cameras.connectionTimeout}
                          onChange={(e) => updateConfiguration('cameras', 'connectionTimeout', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Calidad de Video Predeterminada</label>
                        <select
                          value={configurations.cameras.defaultQuality}
                          onChange={(e) => updateConfiguration('cameras', 'defaultQuality', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option>1080p (Alta)</option>
                          <option>720p (Media)</option>
                          <option>480p (Baja)</option>
                          <option>360p (Muy Baja)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Frame Rate Predeterminado</label>
                        <select
                          value={configurations.cameras.defaultFrameRate}
                          onChange={(e) => updateConfiguration('cameras', 'defaultFrameRate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option>30 FPS</option>
                          <option>25 FPS</option>
                          <option>15 FPS</option>
                          <option>10 FPS</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Reintento Automático de Conexión</span>
                        <button
                          onClick={() => updateConfiguration('cameras', 'autoReconnect', !configurations.cameras.autoReconnect)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            configurations.cameras.autoReconnect ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              configurations.cameras.autoReconnect ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Buffer de Video</span>
                        <button
                          onClick={() => updateConfiguration('cameras', 'videoBuffer', !configurations.cameras.videoBuffer)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            configurations.cameras.videoBuffer ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              configurations.cameras.videoBuffer ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tamaño de Buffer (segundos)</label>
                        <input
                          type="number"
                          value={configurations.cameras.bufferSize}
                          onChange={(e) => updateConfiguration('cameras', 'bufferSize', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <button
                        onClick={() => saveAllConfigurations()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Guardar Configuración de Cámaras
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {configTab === 'mqtt' && (
                <div className="space-y-6">
                  {/* Estado de conexión MQTT */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Estado de Conexión MQTT
                    </h3>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full ${mqttStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                          <span className={`font-medium ${mqttStatus.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {mqttStatus.connected ? 'Conectado' : 'Desconectado'}
                          </span>
                          {mqttStatus.broker && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              • {mqttStatus.broker}
                            </span>
                          )}
                        </div>
                        {mqttStatus.connected && (
                          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Client ID: {mqttStatus.clientId}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => fetchMqttStatus()}
                          className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          title="Actualizar estado"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={mqttStatus.connected ? disconnectMqtt : () => applyMqttConfiguration()}
                          disabled={mqttLoading}
                          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            mqttStatus.connected
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          } disabled:opacity-50`}
                        >
                          {mqttLoading ? (
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {mqttStatus.connected ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              )}
                            </svg>
                          )}
                          {mqttStatus.connected ? 'Desconectar' : 'Conectar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Configuración MQTT */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configuración del Broker MQTT
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Broker Predeterminado</label>
                        <select
                          value={configurations.mqtt.defaultBroker || 'EMQX Local (localhost:1883)'}
                          onChange={(e) => handleMqttPresetChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="EMQX Local (localhost:1883)">EMQX Local (localhost:1883)</option>
                          <option value="EMQX Remoto (100.107.238.60:1883)">EMQX Remoto (100.107.238.60:1883)</option>
                          <option value="HiveMQ Cloud">HiveMQ Cloud</option>
                          <option value="Mosquitto Local">Mosquitto Local</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Host/IP</label>
                          <input
                            type="text"
                            placeholder="localhost"
                            value={configurations.mqtt.host}
                            onChange={(e) => updateConfiguration('mqtt', 'host', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Puerto</label>
                          <input
                            type="number"
                            placeholder="1883"
                            value={configurations.mqtt.port}
                            onChange={(e) => updateConfiguration('mqtt', 'port', parseInt(e.target.value) || 1883)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Usuario</label>
                          <input
                            type="text"
                            placeholder="Opcional"
                            value={configurations.mqtt.username}
                            onChange={(e) => updateConfiguration('mqtt', 'username', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
                          <input
                            type="password"
                            placeholder="Opcional"
                            value={configurations.mqtt.password}
                            onChange={(e) => updateConfiguration('mqtt', 'password', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Conexión SSL/TLS</span>
                        <button
                          onClick={() => updateConfiguration('mqtt', 'ssl', !configurations.mqtt.ssl)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            configurations.mqtt.ssl ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              configurations.mqtt.ssl ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">URL de Conexión Generada</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Esta URL se usará para conectar al broker</p>
                          </div>
                        </div>
                        <div className="font-mono text-sm bg-gray-100 dark:bg-gray-900 p-3 rounded border">
                          {`${configurations.mqtt.ssl ? 'mqtts' : 'mqtt'}://${configurations.mqtt.host || 'localhost'}:${configurations.mqtt.port || 1883}`}
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={() => applyMqttConfiguration()}
                          disabled={mqttLoading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Probar Conexión
                        </button>
                        <button
                          onClick={() => saveAllConfigurations()}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Guardar Configuración
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Topics MQTT */}
                  {mqttStatus.connected && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h3a1 1 0 011 1v2h4a1 1 0 011 1v5a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1h4zM7 10v6a1 1 0 001 1h8a1 1 0 001-1v-6M7 10H4a1 1 0 00-1 1v8a1 1 0 001 1h3m0-10h10m0 0V8a1 1 0 00-1-1H7a1 1 0 00-1 1v2z" />
                        </svg>
                        Topics MQTT ({mqttTopics.filter(t => t.active).length} activos)
                      </h3>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {mqttTopics.length === 0 ? (
                          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No hay topics configurados</p>
                        ) : (
                          mqttTopics.map(topic => (
                            <div key={topic.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">{topic.topic}</div>
                                {topic.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">{topic.description}</div>
                                )}
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  QoS: {topic.qos} | Retained: {topic.retained ? 'Sí' : 'No'}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  topic.active 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                }`}>
                                  {topic.active ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {configTab === 'recordings' && (
                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Configuración de Grabaciones
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Directorio de Grabaciones</label>
                      <input
                        type="text"
                        value={configurations.recordings.directory}
                        onChange={(e) => updateConfiguration('recordings', 'directory', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Formato de Video</label>
                      <select
                        value={configurations.recordings.format}
                        onChange={(e) => updateConfiguration('recordings', 'format', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option>MP4 (H.264)</option>
                        <option>AVI</option>
                        <option>MKV</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Duración Máxima (minutos)</label>
                      <input
                        type="number"
                        value={configurations.recordings.maxDuration}
                        onChange={(e) => updateConfiguration('recordings', 'maxDuration', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Calidad de Compresión</label>
                      <select
                        value={configurations.recordings.quality}
                        onChange={(e) => updateConfiguration('recordings', 'quality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option>Alta (1080p)</option>
                        <option>Media (720p)</option>
                        <option>Baja (480p)</option>
                      </select>
                    </div>
                    <button
                      onClick={() => saveAllConfigurations()}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Guardar Configuración de Grabaciones
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Navbar currentSection={currentSection} setCurrentSection={setCurrentSection} setConfigTab={setConfigTab} mqttStatus={mqttStatus} />
      {renderSection()}
    </div>
  )
}

export default App
