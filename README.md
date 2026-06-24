# 🏥 MedQueue

MedQueue is a modern, real-time clinic queue management system. It allows receptionists to manage patient flow, provides a TV display for the waiting room, and enables patients to track their live status and estimated wait time (ETA) from their mobile devices.

## ✨ Features

- **Receptionist Dashboard**: Manage walk-ins, appointments, and move patients through the queue (Waiting -> Called -> With Doctor -> Completed).
- **TV Display**: A dedicated real-time screen for the waiting room showing the current token and upcoming patients.
- **Patient Portal**: Patients can scan a QR code or visit a link to see their live position in the queue and estimated wait time.
- **Appointments Module**: Schedule future appointments that seamlessly integrate with the daily live queue.
- **Analytics & Summary**: Visual charts tracking patient flow, average consultation times, and end-of-day summaries.
- **Real-Time Sync**: Powered by Socket.IO, ensuring all screens update instantly without page reloads.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Recharts, React Router, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO, Custom File-Based JSON Storage.

## 🚀 Deployment Guide

Because the backend relies on long-running WebSockets and a local JSON database, the project is best deployed using a split architecture:

### 1. Deploy the Backend (Render)
1. Push this repository to GitHub.
2. Go to [Render](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Render will automatically detect the `render.yaml` file in this repository and deploy the backend.
5. Copy your newly deployed Render URL (e.g., `https://medqueue-backend.onrender.com`).

### 2. Deploy the Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and create a **New Project**.
2. Connect your GitHub repository.
3. Configure the following settings before deploying:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Environment Variables**: Add `VITE_SERVER_URL` and set the value to your Render URL from Step 1.
4. Click **Deploy**.

## 💻 Local Development

To run the application locally on your machine:

1. **Install Dependencies**
   Navigate to both the `client` and `server` folders and install the required packages.
   ```bash
   cd server
   npm install
   cd ../client
   npm install
   ```

2. **Start the Servers**
   You can run the provided batch script to start both servers simultaneously:
   ```bash
   # On Windows
   start.bat
   ```
   
   *Alternatively, run them in separate terminals:*
   - Backend: `cd server && node server.js` (Runs on port 4000)
   - Frontend: `cd client && npm run dev` (Runs on port 5173)
