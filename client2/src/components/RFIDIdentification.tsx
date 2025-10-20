import React from 'react'
import { useRFID } from '../hooks/useRFID'

const RFIDIdentification: React.FC = () => {
  const { user, rfidStatus, simulateCardRead, clearUser } = useRFID()

  const handleSimulateCard = () => {
    // Simular lectura de una tarjeta con ID de ejemplo
    const testCardId = 'ABC123456789'
    simulateCardRead(testCardId)
  }

  const getStatusColor = () => {
    if (rfidStatus.error) return 'text-red-600 dark:text-red-400'
    if (user) return 'text-green-600 dark:text-green-400'
    if (rfidStatus.isReading) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getStatusIcon = () => {
    if (rfidStatus.error) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }
    if (user) {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    if (rfidStatus.isReading) {
      return (
        <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      )
    }
    return (
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>
    )
  }

  const getStatusText = () => {
    if (rfidStatus.error) return rfidStatus.error
    if (user) return 'Usuario identificado'
    if (rfidStatus.isReading) return 'Leyendo tarjeta...'
    if (rfidStatus.isConnected) return 'Esperando tarjeta...'
    return 'Conectando con lector...'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Identificación de Usuario
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Acerque su tarjeta RFID/NFC para identificarse
          </p>

          {/* Estado del lector */}
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <div className={`text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </div>
              {rfidStatus.lastCardId && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Última tarjeta: {rfidStatus.lastCardId}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Información del usuario */}
          <div className="border-l border-gray-200 dark:border-gray-600 pl-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Usuario:</span>
                <span className={`font-medium ${user ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {user ? user.name : '--'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Asignatura:</span>
                <span className={`font-medium ${user ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  {user ? user.subject : '--'}
                </span>
              </div>
              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">ID:</span>
                  <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                    {user.id}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSimulateCard}
              disabled={rfidStatus.isReading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
            >
              {rfidStatus.isReading ? 'Leyendo...' : 'Simular Tarjeta'}
            </button>

            {user && (
              <button
                onClick={clearUser}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Desconectar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RFIDIdentification