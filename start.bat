@echo off
echo Starting MedQueue...

echo Starting Backend Server...
start cmd /k "cd server && node server.js"

echo Starting Frontend Server...
start cmd /k "cd client && npm run dev"

echo Both servers are starting in new windows!
