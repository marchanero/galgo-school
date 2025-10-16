# Galgo Config Client 2 - Monitor de Sistema

Aplicación React + TypeScript + Vite simplificada para **usuarios finales** que necesitan monitorizar el sistema Galgo sin opciones de configuración avanzada.

## Propósito

Esta aplicación está diseñada específicamente para **usuarios finales** que solo necesitan:

- ✅ **Control del sistema de grabación** (iniciar/detener grabaciones)
- ✅ **Ver el estado del broker MQTT** al que está conectado el sistema
- ✅ **Lista de dispositivos conectados** al sistema

**No incluye** opciones de configuración avanzada como:
- ❌ Configuración de MQTT
- ❌ Gestión de cámaras
- ❌ Configuración de sensores
- ❌ Ajustes del sistema

Para configuración avanzada del sistema, use la aplicación principal en `/client`.

## Características

- **React 19** con TypeScript
- **Vite** para desarrollo rápido
- **Tailwind CSS** para estilos
- **Tema oscuro/claro** automático
- **Interfaz simplificada** enfocada en monitorización
- **Control de grabación** con temporizador visual
- **Estado del broker MQTT** en tiempo real
- **Lista de dispositivos conectados**
- **Responsive design** para móviles y desktop

## Instalación y ejecución

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Construir para producción:**
   ```bash
   npm run build
   ```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:3001
```

## Tecnologías utilizadas

- **React 19** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## Estructura del proyecto

```
client2/
├── src/
│   ├── components/     # Componentes React (SensorCard)
│   ├── contexts/       # Contextos React (ThemeContext)
│   ├── types/          # Definiciones TypeScript
│   ├── App.tsx         # Componente principal simplificado
│   └── main.tsx        # Punto de entrada
├── public/             # Archivos estáticos
└── package.json
```

## Funcionalidades principales

### Sistema de Grabación
- Botón para iniciar/detener grabaciones
- Indicador visual de estado (rojo = grabando, gris = detenido)
- Temporizador que muestra la duración de la grabación actual
- Solo funciona cuando el broker MQTT está conectado

### Broker MQTT
- Estado de conexión (Conectado/Desconectado)
- Información del broker al que está conectado
- Client ID del sistema
- Última verificación del estado

### Dispositivos Conectados
- Lista visual de todos los sensores conectados
- Estado de cada dispositivo (online/offline)
- Información detallada de cada sensor
- Actualización automática cada pocos segundos