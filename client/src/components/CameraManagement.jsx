import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import axios from 'axios'
import CameraPreview from './CameraPreview'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'

export default function CameraManagement() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [testing, setTesting] = useState(null)
  const [selectedCameraForPreview, setSelectedCameraForPreview] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    ip: '',
    port: '554',
    username: '',
    password: '',
    path: '/stream'
  })

  // Load cameras on mount
  useEffect(() => {
    loadCameras()
  }, [])

  /**
   * Load all cameras from API
   */
  const loadCameras = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/cameras`)
      setCameras(response.data.cameras || [])
    } catch (error) {
      console.error('Error loading cameras:', error)
      toast.error('Error al cargar cámaras')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Reset form
   */
  const resetForm = () => {
    setFormData({
      name: '',
      ip: '',
      port: '554',
      username: '',
      password: '',
      path: '/stream'
    })
    setEditingId(null)
    setShowForm(false)
  }

  /**
   * Handle form input change
   */
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Create or update camera
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validations
    if (!formData.name.trim()) {
      toast.error('El nombre de la cámara es requerido')
      return
    }
    if (!formData.ip.trim()) {
      toast.error('La dirección IP es requerida')
      return
    }

    try {
      setLoading(true)

      if (editingId) {
        // Update existing camera
        await axios.put(`${API_URL}/api/cameras/${editingId}`, formData)
        toast.success('Cámara actualizada exitosamente')
      } else {
        // Create new camera
        await axios.post(`${API_URL}/api/cameras`, formData)
        toast.success('Cámara creada exitosamente')
      }

      resetForm()
      loadCameras()
    } catch (error) {
      console.error('Error saving camera:', error)
      const errorMsg = error.response?.data?.error || error.message
      toast.error(`Error: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Edit camera
   */
  const handleEdit = (camera) => {
    setFormData({
      name: camera.name,
      ip: camera.ip,
      port: camera.port?.toString(),
      username: camera.username || '',
      password: camera.password || '',
      path: camera.path || '/stream'
    })
    setEditingId(camera.id)
    setShowForm(true)
  }

  /**
   * Delete camera
   */
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cámara?')) {
      return
    }

    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/cameras/${id}`)
      toast.success('Cámara eliminada exitosamente')
      loadCameras()
    } catch (error) {
      console.error('Error deleting camera:', error)
      toast.error('Error al eliminar cámara')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Test camera connection
   */
  const handleTestConnection = async (id) => {
    try {
      setTesting(id)
      const response = await axios.post(`${API_URL}/api/cameras/${id}/test`)
      
      if (response.data.success) {
        toast.success(`Conexión exitosa: ${response.data.rtsp_url}`)
      } else {
        toast.error('Error en la prueba de conexión')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      toast.error('Error al probar conexión')
    } finally {
      setTesting(null)
    }
  }

  /**
   * Toggle camera active status
   */
  const handleToggleActive = async (camera) => {
    try {
      setLoading(true)
      await axios.put(`${API_URL}/api/cameras/${camera.id}`, {
        active: !camera.active
      })
      toast.success(camera.active ? 'Cámara desactivada' : 'Cámara activada')
      loadCameras()
    } catch (error) {
      console.error('Error toggling camera:', error)
      toast.error('Error al cambiar estado de cámara')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Build RTSP URL for display
   */
  const buildRtspUrl = (camera) => {
    let url = `rtsp://${camera.ip}:${camera.port}${camera.path}`
    if (camera.username && camera.password) {
      url = `rtsp://${camera.username}:****@${camera.ip}:${camera.port}${camera.path}`
    }
    return url
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Cámaras IP
        </h2>
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? 'Cancelar' : 'Agregar Cámara'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingId ? 'Editar Cámara' : 'Agregar Nueva Cámara'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ej: Cámara Entrada"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* IP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección IP o Hostname *
                </label>
                <input
                  type="text"
                  name="ip"
                  value={formData.ip}
                  onChange={handleChange}
                  placeholder="ej: 192.168.1.100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Port */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Puerto RTSP
                </label>
                <input
                  type="number"
                  name="port"
                  value={formData.port}
                  onChange={handleChange}
                  placeholder="554"
                  min="1"
                  max="65535"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Path */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Path RTSP
                </label>
                <input
                  type="text"
                  name="path"
                  value={formData.path}
                  onChange={handleChange}
                  placeholder="/stream"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Usuario (opcional)
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="admin"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contraseña (opcional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                {loading ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cameras List */}
      {loading && !showForm ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Cargando cámaras...</p>
        </div>
      ) : cameras.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">No hay cámaras configuradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cameras.map(camera => (
                <div
                  key={camera.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                    selectedCameraForPreview?.id === camera.id
                      ? 'border-blue-500 dark:border-blue-400 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedCameraForPreview(camera)}
                >
                  {/* Card Header */}
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{camera.name}</h3>
                        <p className="text-blue-100 text-sm mt-1">{camera.ip}:{camera.port}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        camera.active 
                          ? 'bg-green-200 text-green-800' 
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {camera.active ? 'Activa' : 'Inactiva'}
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Connection Status */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ESTADO</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {camera.connection_status === 'connected' && (
                          <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
                            Conectada
                          </span>
                        )}
                        {camera.connection_status === 'disconnected' && (
                          <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"></span>
                            Desconectada
                          </span>
                        )}
                        {camera.connection_status === 'testing' && (
                          <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                            <span className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full animate-pulse"></span>
                            Probando...
                          </span>
                        )}
                      </p>
                    </div>

                    {/* RTSP URL */}
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">URL RTSP</p>
                      <p className="text-xs font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded text-gray-900 dark:text-gray-300 break-all">
                        {buildRtspUrl(camera)}
                      </p>
                    </div>

                    {/* Last Checked */}
                    {camera.last_checked && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">ÚLTIMA VERIFICACIÓN</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {new Date(camera.last_checked).toLocaleString('es-MX')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer - Actions */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTestConnection(camera.id)
                      }}
                      disabled={testing === camera.id}
                      className="flex-1 px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded transition-colors flex items-center justify-center gap-2"
                    >
                      {testing === camera.id ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Probando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2m0-14c0-1.105 1.343-2 3-2s3 .895 3 2m0 14c0 1.105 1.343 2 3 2s3-.895 3-2m0-14c0-1.105-1.343-2-3-2s-3 .895-3 2" />
                          </svg>
                          Test
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleActive(camera)
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      {camera.active ? 'Desactivar' : 'Activar'}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(camera)
                      }}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(camera.id)
                      }}
                      className="px-3 py-2 text-sm border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900 text-red-700 dark:text-red-400 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Preview Sidebar */}
          {selectedCameraForPreview && (
            <div className="lg:col-span-1">
              <CameraPreview
                cameraId={selectedCameraForPreview.id}
                cameraName={selectedCameraForPreview.name}
                showInfo={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
