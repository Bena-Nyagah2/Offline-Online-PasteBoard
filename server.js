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

// Initialize or load rooms data
let rooms = [];
try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        rooms = JSON.parse(data);
    } else {
        rooms = [{ id: 'default', name: 'Default Room', messages: [] }];
        fs.writeFileSync(DATA_FILE, JSON.stringify(rooms));
    }
} catch (error) {
    console.error('Error loading rooms data:', error);
    rooms = [{ id: 'default', name: 'Default Room', messages: [] }];
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all rooms
app.get('/api/rooms', (req, res) => {
    res.json(rooms);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    // Send current state to new client
    ws.send(JSON.stringify({
        type: 'init',
        data: rooms
    }));

    // Handle messages from clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'update') {
                rooms = data.data;
                
                // Save to file
                fs.writeFileSync(DATA_FILE, JSON.stringify(rooms));
                
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

// Add these endpoints to your server.js file

// Get all rooms
app.get('/api/rooms', (req, res) => {
    try {
        const roomsData = loadRoomsData();
        res.json(roomsData);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ error: 'Failed to fetch rooms' });
    }
});

// Create a new room
app.post('/api/rooms', express.json(), (req, res) => {
    try {
        const roomsData = loadRoomsData();
        roomsData.push(req.body);
        saveRoomsData(roomsData);
        res.status(201).json(req.body);
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Update a room
app.put('/api/rooms/:id', express.json(), (req, res) => {
    try {
        const roomsData = loadRoomsData();
        const roomIndex = roomsData.findIndex(room => room.id === req.params.id);
        
        if (roomIndex !== -1) {
            roomsData[roomIndex] = req.body;
            saveRoomsData(roomsData);
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
        const roomsData = loadRoomsData();
        const roomIndex = roomsData.findIndex(room => room.id === req.params.id);
        
        if (roomIndex !== -1) {
            roomsData.splice(roomIndex, 1);
            saveRoomsData(roomsData);
            res.json({ message: 'Room deleted successfully' });
        } else {
            res.status(404).json({ error: 'Room not found' });
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});


// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access the app at http://localhost:${PORT}`);
    console.log(`For other devices on the network, use your computer's IP address`);
});
