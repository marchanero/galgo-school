import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001'

/**
 * CameraPreview Component
 * Displays snapshot and stream information for a camera
 */
export default function CameraPreview({ cameraId, cameraName, showInfo = true }) {
  const [snapshot, setSnapshot] = useState(null)
  const [streamInfo, setStreamInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load snapshot and info on component mount or when cameraId changes
  useEffect(() => {
    if (cameraId) {
      loadSnapshot()
      if (showInfo) {
        loadStreamInfo()
      }
    }
  }, [cameraId, showInfo])

  /**
   * Load snapshot from camera
   */
  const loadSnapshot = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get(`${API_URL}/api/cameras/${cameraId}/snapshot`, {
        responseType: 'arraybuffer'
      })
      
      const blob = new Blob([response.data], { type: 'image/jpeg' })
      const url = URL.createObjectURL(blob)
      setSnapshot(url)
    } catch (err) {
      console.error('Error loading snapshot:', err)
      setError('No se pudo cargar el snapshot')
      setSnapshot(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load stream information
   */
  const loadStreamInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cameras/${cameraId}/info`)
      
      if (response.data.success) {
        setStreamInfo(response.data)
      } else {
        setStreamInfo(null)
      }
    } catch (err) {
      console.error('Error loading stream info:', err)
      setStreamInfo(null)
    }
  }

  /**
   * Refresh snapshot
   */
  const handleRefresh = () => {
    loadSnapshot()
  }

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{cameraName || 'Vista Previa'}</h3>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
            title="Actualizar snapshot"
          >
            <svg
              className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Snapshot */}
        <div className="mb-4">
          {loading ? (
            <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Cargando...</p>
              </div>
            </div>
          ) : error ? (
            <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
              </div>
            </div>
          ) : snapshot ? (
            <img
              src={snapshot}
              alt={cameraName}
              className="w-full rounded bg-gray-100 dark:bg-gray-900 object-contain max-h-96"
            />
          ) : (
            <div className="w-full aspect-video bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">Sin snapshot disponible</p>
            </div>
          )}
        </div>

        {/* Stream Info */}
        {showInfo && streamInfo && streamInfo.success && (
          <div className="grid grid-cols-3 gap-2">
            {streamInfo.resolution && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Resolución</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {streamInfo.resolution}
                </p>
              </div>
            )}
            
            {streamInfo.codec && (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">Codec</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {streamInfo.codec.toUpperCase()}
                </p>
              </div>
            )}
            
            {streamInfo.fps && (
              <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                <p className="text-xs text-gray-600 dark:text-gray-400">FPS</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {streamInfo.fps}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
