# Galgo-School Sensor Management System

A full-stack application for managing various sensors in the Galgo-School project, including environmental sensors, EmotiBit sensors, and RTSP IP cameras.

## Technologies Used
- Frontend: React with Vite
- Backend: Node.js with Express
- Database: SQLite

## Project Structure
- `client/`: React frontend application
- `server/`: Express backend API

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend:
```bash
cd client
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3001`.

## API Endpoints

- `GET /api/sensors`: Retrieve all sensors
- `POST /api/sensors`: Add a new sensor

## Features
- Sensor Configuration Panel: Add and monitor environmental sensors, EmotiBit sensors, and RTSP IP cameras.
- Real-time sensor data display.
- Backend API for sensor management using SQLite database.