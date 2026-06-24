# MedQueue

MedQueue is a real-time medical clinic queue management system. It provides an efficient way to manage patient queues, track appointments, view real-time status updates, and analyze clinic operations. The application uses a React frontend and a Node.js/Express backend with Socket.IO for real-time communication.

## Features

- **Patient Queue Management**: Add patients, mark them as called or with the doctor, and handle emergency cases.
- **Real-time Updates**: Powered by Socket.IO, all connected clients receive immediate updates when the queue state changes.
- **Remote Status Tracking**: Patients can track their status and queue position remotely using their unique token.
- **Analytics & History**: Track clinic performance, daily patient counts, and average wait times.
- **Duplicate Prevention**: Warns staff when trying to add a patient who is already registered for the day.

## Tech Stack

### Frontend
- **React 19**
- **Vite**
- **Tailwind CSS** (for styling)
- **Socket.IO Client** (for real-time updates)
- **Recharts** (for analytics visualization)
- **Lucide React** (for icons)

### Backend
- **Node.js**
- **Express.js**
- **Socket.IO** (for handling WebSockets)

## Getting Started

### Prerequisites
- Node.js installed on your machine.

### Installation

1. Install dependencies for the frontend (client):
   ```bash
   cd client
   npm install
   ```

2. Install dependencies for the backend (server):
   ```bash
   cd server
   npm install
   ```

### Running the Application

You can start both the backend and frontend servers simultaneously using the provided batch script (on Windows):

```bash
start.bat
```

Alternatively, you can run them manually:

1. **Start Backend Server:**
   ```bash
   cd server
   npm start # Or node server.js
   ```

2. **Start Frontend Server:**
   ```bash
   cd client
   npm run dev
   ```

## Project Structure

- `/client` - Contains the React frontend application.
- `/server` - Contains the Node.js backend application and mock data for testing.
- `start.bat` - A utility script to start both client and server on Windows.
- `render.yaml` - Configuration for deployment on Render.
