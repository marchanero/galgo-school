# Galgo Config Client 2

Aplicación React + TypeScript + Vite para la configuración del sistema Galgo.

## Características

- **React 19** con TypeScript
- **Vite** para desarrollo rápido
- **Tailwind CSS** para estilos
- **Tema oscuro/claro** automático
- **Componentes modulares** con TypeScript
- **Integración MQTT** con estado en tiempo real
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
│   ├── components/     # Componentes React
│   ├── contexts/       # Contextos React
│   ├── types/          # Definiciones TypeScript
│   ├── App.tsx         # Componente principal
│   └── main.tsx        # Punto de entrada
├── public/             # Archivos estáticos
└── package.json
```