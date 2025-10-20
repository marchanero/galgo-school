import { useState, useCallback } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'

/**
 * Custom hook for managing cameras
 * Provides CRUD operations and connection testing
 */
export function useCameras() {
  const [cameras, setCameras] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load all cameras from API
   */
  const loadCameras = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/api/cameras`)
      setCameras(response.data.cameras || [])
      return response.data.cameras || []
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      console.error('Error loading cameras:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create a new camera
   */
  const createCamera = useCallback(async (cameraData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.post(`${API_URL}/api/cameras`, cameraData)
      
      // Reload cameras list
      await loadCameras()
      
      return {
        success: true,
        camera: response.data.camera,
        message: response.data.message
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      console.error('Error creating camera:', err)
      return {
        success: false,
        error: errorMsg
      }
    } finally {
      setLoading(false)
    }
  }, [loadCameras])

  /**
   * Update an existing camera
   */
  const updateCamera = useCallback(async (id, cameraData) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.put(`${API_URL}/api/cameras/${id}`, cameraData)
      
      // Reload cameras list
      await loadCameras()
      
      return {
        success: true,
        camera: response.data.camera,
        message: response.data.message
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      console.error('Error updating camera:', err)
      return {
        success: false,
        error: errorMsg
      }
    } finally {
      setLoading(false)
    }
  }, [loadCameras])

  /**
   * Delete a camera
   */
  const deleteCamera = useCallback(async (id) => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.delete(`${API_URL}/api/cameras/${id}`)
      
      // Reload cameras list
      await loadCameras()
      
      return {
        success: true,
        message: response.data.message
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      console.error('Error deleting camera:', err)
      return {
        success: false,
        error: errorMsg
      }
    } finally {
      setLoading(false)
    }
  }, [loadCameras])

  /**
   * Test camera connection
   */
  const testConnection = useCallback(async (id) => {
    try {
      setError(null)
      const response = await axios.post(`${API_URL}/api/cameras/${id}/test`)
      
      // Update camera connection status
      setCameras(prevCameras =>
        prevCameras.map(cam =>
          cam.id === id
            ? {
                ...cam,
                connection_status: response.data.connection_status,
                last_checked: new Date().toISOString()
              }
            : cam
        )
      )
      
      return {
        success: response.data.success,
        status: response.data.connection_status,
        rtspUrl: response.data.rtsp_url,
        message: response.data.message
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message
      setError(errorMsg)
      console.error('Error testing connection:', err)
      return {
        success: false,
        error: errorMsg
      }
    }
  }, [])

  /**
   * Get camera by ID
   */
  const getCameraById = useCallback((id) => {
    return cameras.find(cam => cam.id === parseInt(id))
  }, [cameras])

  /**
   * Build RTSP URL from camera data
   */
  const buildRtspUrl = useCallback((camera) => {
    if (!camera) return ''
    let url = `rtsp://${camera.ip}:${camera.port}${camera.path || '/stream'}`
    if (camera.username && camera.password) {
      url = `rtsp://${camera.username}:****@${camera.ip}:${camera.port}${camera.path || '/stream'}`
    }
    return url
  }, [])

  /**
   * Build full RTSP URL with credentials (for internal use only)
   */
  const buildFullRtspUrl = useCallback((camera) => {
    if (!camera) return ''
    let url = `rtsp://${camera.ip}:${camera.port}${camera.path || '/stream'}`
    if (camera.username && camera.password) {
      url = `rtsp://${camera.username}:${camera.password}@${camera.ip}:${camera.port}${camera.path || '/stream'}`
    }
    return url
  }, [])

  /**
   * Filter active cameras
   */
  const getActiveCameras = useCallback(() => {
    return cameras.filter(cam => cam.active)
  }, [cameras])

  /**
   * Filter connected cameras
   */
  const getConnectedCameras = useCallback(() => {
    return cameras.filter(cam => cam.connection_status === 'connected')
  }, [cameras])

  return {
    // State
    cameras,
    loading,
    error,

    // Actions
    loadCameras,
    createCamera,
    updateCamera,
    deleteCamera,
    testConnection,

    // Utilities
    getCameraById,
    buildRtspUrl,
    buildFullRtspUrl,
    getActiveCameras,
    getConnectedCameras
  }
}

export default useCameras
