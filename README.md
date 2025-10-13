# Galgo-School Sensor Management System

A full-stack application for managing various sensors in the Galgo-School project, including environmental sensors, EmotiBit sensors, and RTSP IP cameras with real-time MQTT communication.

## Technologies Used
- **Frontend**: React 19.1.1 with Vite
- **Backend**: Node.js with Express 5.1.0
- **Database**: SQLite 5.1.7
- **Real-time Communication**: MQTT 5.14.1 with EMQX broker
- **Containerization**: Docker & Docker Compose
- **API Documentation**: Swagger/OpenAPI
- **Deployment**: GitHub Actions with self-hosted runner

## Project Structure
```
galgo-config/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── hooks/          # Custom React hooks
│   └── Dockerfile
├── server/                 # Express backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── middlewares/    # Express middlewares
│   │   └── models/         # Data models
│   ├── Dockerfile
│   └── test-mqtt.js        # MQTT connection test script
├── docker-compose.yml      # Docker orchestration
└── README.md
```

## Features

### Sensor Management
- Add and configure environmental sensors, EmotiBit sensors, and RTSP IP cameras
- Real-time sensor data display and monitoring
- SQLite database for persistent sensor configuration

### MQTT Integration
- Real-time communication with EMQX broker
- Topic subscription and message publishing
- Message history and topic management
- Automatic reconnection and error handling

### API Architecture
- RESTful API with proper separation of concerns
- Swagger/OpenAPI documentation at `/api-docs`
- Health check endpoint with service status monitoring
- CORS enabled for frontend communication

### Containerization & Deployment
- Docker containers for both frontend and backend
- Docker Compose for local development
- GitHub Actions CI/CD with self-hosted runner
- Health checks and automatic restarts

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm or yarn
- Docker & Docker Compose
- EMQX MQTT broker (running locally or remotely)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd galgo-config
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd server
   npm install

   # Frontend dependencies
   cd ../client
   npm install
   ```

3. **Configure MQTT Broker**
   
   Update the MQTT configuration in `server/src/config/app.config.js`:
   ```javascript
   mqtt: {
     broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
     clientId: process.env.MQTT_CLIENT_ID || 'galgo-school-server',
     username: process.env.MQTT_USERNAME || 'your-username',
     password: process.env.MQTT_PASSWORD || 'your-password',
     // ...
   }
   ```

4. **Start the application**
   ```bash
   # From project root
   docker-compose up --build
   ```

   The application will be available at:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001
   - **API Documentation**: http://localhost:3001/api-docs

### Testing MQTT Connection

Test the MQTT connection using the provided script:

```bash
cd server
node test-mqtt.js
```

Expected output:
```
Testing MQTT connection...
Broker: mqtt://localhost:1883
Client ID: galgo-school-server
Username: your-username
✅ Successfully connected to MQTT broker!
✅ Test message published successfully
```

### Health Check

Check system health including MQTT and database status:

```bash
curl http://localhost:3001/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "connected"
    },
    "mqtt": {
      "status": "connected",
      "broker": "mqtt://localhost:1883",
      "clientId": "galgo-school-server"
    }
  }
}
```

## API Endpoints

### Sensors
- `GET /api/sensors` - Retrieve all sensors
- `POST /api/sensors` - Add a new sensor
- `PUT /api/sensors/:id` - Update a sensor
- `DELETE /api/sensors/:id` - Delete a sensor

### MQTT Management
- `GET /api/mqtt/status` - Get MQTT connection status
- `POST /api/mqtt/connect` - Connect to MQTT broker
- `POST /api/mqtt/disconnect` - Disconnect from MQTT broker
- `GET /api/mqtt/topics` - Get all MQTT topics
- `POST /api/mqtt/topics` - Create a new MQTT topic
- `PUT /api/mqtt/topics/:id` - Update an MQTT topic
- `DELETE /api/mqtt/topics/:id` - Delete an MQTT topic
- `POST /api/mqtt/publish` - Publish an MQTT message
- `GET /api/mqtt/messages` - Get MQTT message history

### System
- `GET /api/health` - System health check
- `GET /api-docs` - Swagger API documentation

## Deployment

### Using Docker Compose

```bash
# Build and start services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### GitHub Actions Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:
1. Builds Docker images
2. Pushes to GitHub Container Registry (optional)
3. Deploys to self-hosted runner
4. Runs health checks

### Environment Variables

Create `.env` files in both `client/` and `server/` directories:

**server/.env:**
```
MQTT_BROKER=mqtt://your-broker:1883
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
NODE_ENV=production
PORT=3001
```

**client/.env.production:**
```
VITE_API_URL=http://your-server:3001
```

## Development

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Code Quality
```bash
# Lint backend
cd server
npm run lint

# Lint frontend
cd client
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.