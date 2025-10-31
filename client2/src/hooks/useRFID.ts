import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useUser } from '../contexts/UserContext'

interface RFIDStatus {
  isConnected: boolean
  isReading: boolean
  lastCardId: string | null
  error: string | null
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const useRFID = () => {
  const { user, setUser, clearUser: contextClearUser } = useUser()
  const [rfidStatus, setRfidStatus] = useState<RFIDStatus>({
    isConnected: false,
    isReading: false,
    lastCardId: null,
    error: null
  })

  // Simular conexión con lector RFID (esto se reemplazará con WebUSB/WebSerial)
  const connectRFID = useCallback(async () => {
    try {
      setRfidStatus(prev => ({ ...prev, isReading: true, error: null }))

      // Simulación de conexión - en producción esto sería WebUSB/WebSerial
      console.log('🔌 Conectando con lector RFID/NFC...')

      // Simular delay de conexión
      await new Promise(resolve => setTimeout(resolve, 1000))

      setRfidStatus(prev => ({
        ...prev,
        isConnected: true,
        isReading: false
      }))

      console.log('✅ Lector RFID/NFC conectado')
    } catch (error) {
      console.error('❌ Error conectando con lector RFID:', error)
      setRfidStatus(prev => ({
        ...prev,
        isConnected: false,
        isReading: false,
        error: 'Error conectando con lector RFID'
      }))
    }
  }, [])

  // Simular lectura de tarjeta (esto se reemplazará con eventos del lector real)
  const simulateCardRead = useCallback(async (cardId: string) => {
    try {
      setRfidStatus(prev => ({
        ...prev,
        isReading: true,
        lastCardId: cardId,
        error: null
      }))

      console.log('📡 Leyendo tarjeta RFID/NFC:', cardId)

      // Consultar API para obtener información del usuario
      const response = await axios.get(`${API_URL}/api/users/card/${cardId}`)

      if (response.data) {
        const userData = {
          id: response.data.id,
          name: response.data.name,
          subject: response.data.subject,
          cardId: cardId
        }

        setUser(userData)
        setRfidStatus(prev => ({
          ...prev,
          isReading: false,
          error: null
        }))

        // Record NFC access event
        try {
          await axios.post(`${API_URL}/api/nfc-events`, {
            cardId: cardId,
            eventType: 'access',
            location: 'web-interface',
            metadata: {
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString()
            }
          });
          console.log('✅ NFC access event recorded');
        } catch (eventError) {
          console.error('❌ Error recording NFC event:', eventError);
        }

        console.log('✅ Usuario identificado:', userData)
        return userData
      } else {
        throw new Error('Usuario no encontrado')
      }
    } catch (error) {
      console.error('❌ Error leyendo tarjeta:', error)
      setRfidStatus(prev => ({
        ...prev,
        isReading: false,
        error: 'Usuario no encontrado o error en la lectura'
      }))
      setUser(null)
      return null
    }
  }, [setUser])

  // Limpiar usuario actual
  const clearUser = useCallback(async () => {
    if (user) {
      // Record NFC exit event
      try {
        await axios.post(`${API_URL}/api/nfc-events`, {
          cardId: user.cardId,
          eventType: 'exit',
          location: 'web-interface',
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          }
        });
        console.log('✅ NFC exit event recorded');
      } catch (eventError) {
        console.error('❌ Error recording NFC exit event:', eventError);
      }
    }

    contextClearUser()
    setRfidStatus(prev => ({
      ...prev,
      lastCardId: null,
      error: null
    }))
    console.log('🧹 Usuario desconectado')
  }, [contextClearUser, user])

  // Inicializar conexión al montar el componente
  useEffect(() => {
    connectRFID()
  }, [connectRFID])

  return {
    user,
    rfidStatus,
    connectRFID,
    simulateCardRead,
    clearUser
  }
}