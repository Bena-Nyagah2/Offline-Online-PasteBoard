const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Data storage path
const DATA_FILE = path.join(__dirname, 'rooms-data.json');

// Helper functions for loading and saving data
function loadRoomsData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        } else {
            return [{ id: 'default', name: 'Default Room', messages: [] }];
        }
    } catch (error) {
        console.error('Error loading rooms data:', error);
        return [{ id: 'default', name: 'Default Room', messages: [] }];
    }
}

function saveRoomsData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving rooms data:', error);
        return false;
    }
}

function processRoomUpdate(updatedRooms) {
    // Make a deep copy of the updated rooms
    const processedRooms = JSON.parse(JSON.stringify(updatedRooms));
    
    // Process each room
    processedRooms.forEach(room => {
        // Ensure we only keep the latest message for each room
        if (room.messages && room.messages.length > 1) {
            room.messages = [room.messages[room.messages.length - 1]];
        }
    });
    
    return processedRooms;
}

// Initialize or load rooms data
let rooms = loadRoomsData();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// WebSocket server logging
wss.on('listening', () => {
    console.log('WebSocket server is listening');
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('Client connected from:', req.socket.remoteAddress);
    
    // Send current state to new client
    ws.send(JSON.stringify({
        type: 'init',
        data: rooms
    }));

    // Handle messages from clients
    // modify the WebSocket message handler:
ws.on('message', (message) => {
    try {
        const data = JSON.parse(message);
        
        if (data.type === 'update') {
            // Process the rooms to ensure only the latest message is kept
            rooms = processRoomUpdate(data.data);
            
            // Save to file
            saveRoomsData(rooms);
            
            // Broadcast to all clients
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'update',
                        data: rooms
                    }));
                }
            });
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Add error handling for the WebSocket server
wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
});

// REST API endpoints
// Get all rooms
app.get('/api/rooms', (req, res) => {
    try {
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Create a new room
app.post('/api/rooms', (req, res) => {
    try {
        rooms.push(req.body);
        saveRoomsData(rooms);
        res.status(201).json(req.body);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Update a room
app.put('/api/rooms/:id', (req, res) => {
    try {
        const roomIndex = rooms.findIndex(room => room.id === req.params.id);
        
        if (roomIndex !== -1) {
            rooms[roomIndex] = req.body;
            saveRoomsData(rooms);
            res.json(req.body);
        } else {
            res.status(404).json({ error: 'Room not found' });
        }
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ error: 'Failed to update room' });
    }
});

// Delete a room
app.delete('/api/rooms/:id', (req, res) => {
    try {
        const roomIndex = rooms.findIndex(room => room.id === req.params.id);
        
        if (roomIndex !== -1) {
            rooms.splice(roomIndex, 1);
            saveRoomsData(rooms);
            res.json({ message: 'Room deleted successfully' });
        } else {
            res.status(404).json({ error: 'Room not found' });
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add a WebSocket test endpoint
app.get('/ws-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ws-test.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at http://localhost:${PORT}`);
    console.log(`For other devices on the network, use your computer's IP address`);
});
