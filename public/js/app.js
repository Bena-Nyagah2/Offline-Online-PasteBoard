document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const usernameInput = document.getElementById('username');
    const sharedTextArea = document.getElementById('shared-text');
    const saveBtn = document.getElementById('save-btn');
    const copyBtn = document.getElementById('copy-btn');
       const refreshBtn = document.getElementById('refresh-btn');
    const logsBtn = document.getElementById('logs-btn');
    const createRoomBtn = document.getElementById('create-room-btn');
    const roomList = document.getElementById('room-list');
    const currentRoomName = document.getElementById('current-room-name');
    const lastPost = document.getElementById('last-post');
    const logsModal = document.getElementById('logs-modal');
    const logsContent = document.getElementById('logs-content');
    const closeModalBtn = document.querySelector('.close');
    const alertModal = document.getElementById('alert-modal');
    const alertMessage = document.getElementById('alert-message');
    const alertCloseBtn = document.getElementById('alert-close');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const themeToggle = document.getElementById('theme-toggle');
    const exportBtn = document.getElementById('export-btn');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPicker = document.getElementById('emoji-picker');
    const characterCount = document.getElementById('character-count');
    const replaceBtn = document.getElementById('replace-btn');
    

    // App State
    let rooms = [];
    let currentRoom = null;
    let ws = null;
    let connectionMode = 'offline'; // 'online', 'local', or 'offline'
    let syncInterval = null;
    
    // Common emojis
    const commonEmojis = [
        '😊', '😂', '🤣', '❤️', '👍', '👎', '🙏', '👋', '🔥', '✨',
        '🎉', '🤔', '😍', '😎', '👀', '💪', '🤦‍♂️', '🤦‍♀️', '🤷‍♂️', '🤷‍♀️',
        '👏', '🙌', '👌', '✅', '❌', '💯', '⭐', '🌟', '💡', '📝',
        '🔍', '🗣️', '💬', '💭', '🕒', '📅', '🔔', '🔕', '📌', '📎'
    ];
    
    // Initialize the app
    function initializeApp() {
        // Load theme preference
        loadThemePreference();
        
        // Load username
        const savedUsername = localStorage.getItem('username') || '';
        usernameInput.value = savedUsername;
        
        // Try to connect to server
        initConnection();
        
        // Load rooms from localStorage as fallback
        loadFromLocalStorage();
        
        // Set up periodic sync for offline mode
        setupOfflineSync();
        
        // Initialize emoji picker
        initEmojiPicker();
        
        // Initialize character counter
        updateCharacterCount();
    }
    
    // Load theme preference
    function loadThemePreference() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeToggle(savedTheme);
    }
    
    // Update theme toggle button
    function updateThemeToggle(theme) {
        const themeIcon = themeToggle.querySelector('.theme-icon');
        const themeText = themeToggle.querySelector('span');
        
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun theme-icon';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.className = 'fas fa-moon theme-icon';
            themeText.textContent = 'Dark Mode';
        }
    }
    
    // Toggle theme
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeToggle(newTheme);
    }
    
    // Initialize emoji picker
    function initEmojiPicker() {
        // Clear existing emojis
        emojiPicker.innerHTML = '';
        
        // Add emojis to picker
        commonEmojis.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.classList.add('emoji');
            emojiElement.textContent = emoji;
            emojiElement.addEventListener('click', () => insertEmoji(emoji));
            emojiPicker.appendChild(emojiElement);
        });
    }
    
    // Insert emoji into textarea
    function insertEmoji(emoji) {
        const cursorPos = sharedTextArea.selectionStart;
        const textBefore = sharedTextArea.value.substring(0, cursorPos);
        const textAfter = sharedTextArea.value.substring(cursorPos);
        
        sharedTextArea.value = textBefore + emoji + textAfter;
        sharedTextArea.focus();
        sharedTextArea.selectionStart = cursorPos + emoji.length;
        sharedTextArea.selectionEnd = cursorPos + emoji.length;
        
        // Update character count
        updateCharacterCount();
        
        // Hide emoji picker
        emojiPicker.style.display = 'none';
    }
    
    // Toggle emoji picker
    function toggleEmojiPicker() {
        if (emojiPicker.style.display === 'grid') {
            emojiPicker.style.display = 'none';
        } else {
            emojiPicker.style.display = 'grid';
        }
    }
    
    // Update character count
    function updateCharacterCount() {
        const count = sharedTextArea.value.length;
        characterCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    }
    
    // Initialize connection to server
    // Initialize connection to server
function initConnection() {
    try {
        // Get the current protocol (http or https)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname || 'localhost';
        
        // Create WebSocket URL based on environment
        let wsUrl;
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.')) {
            // For local development, include the port
            const port = window.location.port || '3000';
            wsUrl = `${protocol}//${host}:${port}`;
        } else {
            // For Render.com deployment, don't specify port
            wsUrl = `${protocol}//${host}`;
        }
        
        console.log('Attempting to connect to WebSocket at:', wsUrl);
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
            console.log('Connected to server successfully');
            updateConnectionStatus('online');
            
            // Request initial data
            fetchRoomsFromServer();
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'init' || data.type === 'update') {
                    // Update rooms with server data
                    rooms = data.data;
                    
                    // Update localStorage for offline fallback
                    localStorage.setItem('rooms', JSON.stringify(rooms));
                    
                    // Update current room reference
                    if (currentRoom) {
                        currentRoom = rooms.find(room => room.id === currentRoom.id) || rooms[0];
                    } else {
                        currentRoom = rooms[0];
                    }
                    
                    // Update UI
                    renderRooms();
                    loadCurrentRoom();
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };
        
        ws.onclose = function() {
            console.log('Disconnected from server');
            updateConnectionStatus('offline');
            
            // Try to reconnect after a delay
            setTimeout(initConnection, 5000);
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
            updateConnectionStatus('offline');
        };
    } catch (error) {
        console.error('Connection error:', error);
        updateConnectionStatus('offline');
    }
}

    // Add this function to implement polling as a fallback
function setupPolling() {
    console.log('Setting up polling as fallback');
    
    // Clear any existing interval
    if (window.pollingInterval) {
        clearInterval(window.pollingInterval);
    }
    
    // Poll for updates every 5 seconds
    window.pollingInterval = setInterval(function() {
        if (connectionMode === 'offline') {
            console.log('Polling for updates...');
            
            fetch('/api/rooms')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    console.log('Received data from polling');
                    
                    // Update rooms with server data
                    rooms = data;
                    
                    // Update localStorage for offline fallback
                    localStorage.setItem('rooms', JSON.stringify(rooms));
                    
                    // Update current room reference
                    if (currentRoom) {
                        currentRoom = rooms.find(room => room.id === currentRoom.id) || rooms[0];
                    } else {
                        currentRoom = rooms[0];
                    }
                    
                    // Update UI
                    renderRooms();
                    loadCurrentRoom();
                    
                    // Try to reconnect WebSocket
                    if (ws === null || ws.readyState === WebSocket.CLOSED) {
                        initConnection();
                    }
                })
                .catch(error => {
                    console.error('Polling error:', error);
                });
        }
    }, 5000);
}

// Modify your tryLocalNetworkMode function to set up polling
function tryLocalNetworkMode() {
    updateConnectionStatus('offline');
    setupPolling();
}

    
    // Try to connect in local network mode
    function tryLocalNetworkMode() {
        // This would be a more complex implementation in a real app
        // For now, we'll just fall back to offline mode
        updateConnectionStatus('offline');
    }
    
    // Update connection status indicator
    function updateConnectionStatus(mode) {
        connectionMode = mode;
        statusIndicator.className = mode;
        
        switch(mode) {
            case 'online':
                statusText.textContent = 'Online';
                break;
            case 'local':
                statusText.textContent = 'Local Network';
                break;
            case 'offline':
                statusText.textContent = 'Offline';
                break;
        }
    }
    
    // Fetch rooms from server using REST API
    function fetchRoomsFromServer() {
        fetch('/api/rooms')
            .then(response => response.json())
            .then(data => {
                rooms = data;
                localStorage.setItem('rooms', JSON.stringify(rooms));
                
                // Load current room ID from localStorage
                const savedCurrentRoomId = localStorage.getItem('currentRoomId');
                currentRoom = rooms.find(room => savedCurrentRoomId && room.id === savedCurrentRoomId) || rooms[0];
                
                renderRooms();
                loadCurrentRoom();
            })
            .catch(error => {
                console.error('Error fetching rooms:', error);
                loadFromLocalStorage();
            });
    }
    
    // Load rooms from localStorage
    function loadFromLocalStorage() {
        const savedRooms = JSON.parse(localStorage.getItem('rooms')) || [];
        rooms = savedRooms.length > 0 ? savedRooms : [{ id: 'default', name: 'Default Room', messages: [] }];
        
        // Load current room
        const savedCurrentRoomId = localStorage.getItem('currentRoomId');
        currentRoom = rooms.find(room => savedCurrentRoomId && room.id === savedCurrentRoomId) || rooms[0];
        
        renderRooms();
        loadCurrentRoom();
    }
    
    // Set up periodic sync for offline mode
    function setupOfflineSync() {
        // Clear any existing interval
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        
        // Check for changes in localStorage every 5 seconds
        syncInterval = setInterval(function() {
            if (connectionMode === 'offline') {
                const savedRooms = JSON.parse(localStorage.getItem('rooms')) || [];
                
                // Check if there are any changes
                if (JSON.stringify(savedRooms) !== JSON.stringify(rooms)) {
                    rooms = savedRooms;
                    currentRoom = rooms.find(room => currentRoom && room.id === currentRoom.id) || rooms[0];
                    renderRooms();
                    loadCurrentRoom();
                }
            }
        }, 5000);
    }
    
    // Save app state
    function saveAppState() {
        // Save username
        localStorage.setItem('username', usernameInput.value);
        
        // Save current room ID
        if (currentRoom) {
            localStorage.setItem('currentRoomId', currentRoom.id);
        }
        
        // Save rooms data
        localStorage.setItem('rooms', JSON.stringify(rooms));
        
        // If online, send update to server
        if (connectionMode === 'online' && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'update',
                data: rooms
            }));
        }
    }
    
    // Render room list
    function renderRooms() {
        roomList.innerHTML = '';
        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.classList.add('room-item');
            if (currentRoom && room.id === currentRoom.id) {
                roomElement.classList.add('active');
            }
            
            // Create room name and actions container
            const roomNameSpan = document.createElement('span');
            roomNameSpan.textContent = room.name;
            roomElement.appendChild(roomNameSpan);
            
            // Add room actions (only if not default room)
            if (room.id !== 'default') {
                const roomActions = document.createElement('div');
                roomActions.classList.add('room-actions');
                
                // Rename button
                const renameBtn = document.createElement('button');
                renameBtn.innerHTML = '<i class="fas fa-edit"></i>';
                renameBtn.title = 'Rename Room';
                renameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    renameRoom(room.id);
                });
                roomActions.appendChild(renameBtn);
                
                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.title = 'Delete Room';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteRoom(room.id);
                });
                roomActions.appendChild(deleteBtn);
                
                roomElement.appendChild(roomActions);
            }
            
            roomElement.dataset.roomId = room.id;
            roomElement.addEventListener('click', () => switchRoom(room.id));
            roomList.appendChild(roomElement);
        });
    }
    
    // Rename room
    function renameRoom(roomId) {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return;
        
        const newName = prompt('Enter new room name:', room.name);
        if (newName && newName.trim()) {
            room.name = newName.trim();
            renderRooms();
            if (currentRoom && currentRoom.id === roomId) {
                currentRoomName.textContent = room.name;
            }
            saveAppState();
            showAlert(`Room renamed to "${newName.trim()}" successfully!`);
        }
    }
    
    // Delete room
    function deleteRoom(roomId) {
        if (!confirm('Are you sure you want to delete this room? All messages will be lost.')) {
            return;
        }
        
        const roomIndex = rooms.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return;
        
        // Remove the room
        rooms.splice(roomIndex, 1);
        
        // If we deleted the current room, switch to default
        if (currentRoom && currentRoom.id === roomId) {
            currentRoom = rooms.find(r => r.id === 'default') || rooms[0];
        }
        
        renderRooms();
        loadCurrentRoom();
        saveAppState();
        showAlert('Room deleted successfully!');
    }
    
   // Load current room content
function loadCurrentRoom() {
    if (!currentRoom) return;
    
    currentRoomName.textContent = currentRoom.name;
    
    // Display only the latest message text
    if (currentRoom.messages && currentRoom.messages.length > 0) {
        sharedTextArea.value = currentRoom.messages[currentRoom.messages.length - 1].text;
    } else {
        sharedTextArea.value = '';
    }
    
    updateLastPost();
    updateCharacterCount();
}

    
    // Update last post information
    function updateLastPost() {
        if (!currentRoom) return;
        
        if (currentRoom.messages.length > 0) {
            const lastMessage = currentRoom.messages[currentRoom.messages.length - 1];
            const date = new Date(lastMessage.timestamp);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            lastPost.textContent = `Last message by ${lastMessage.username} at ${formattedDate}`;
        } else {
            lastPost.textContent = 'No messages yet';
        }
    }
    
        // Switch to a different room
    function switchRoom(roomId) {
        currentRoom = rooms.find(room => room.id === roomId);
        loadCurrentRoom();
        renderRooms();
        saveAppState();
    }
    
    // Create a new room
    function createRoom() {
        const roomName = prompt('Enter room name:');
        if (roomName && roomName.trim()) {
            const roomId = 'room_' + Date.now();
            const newRoom = {
                id: roomId,
                name: roomName.trim(),
                messages: []
            };
            rooms.push(newRoom);
            currentRoom = newRoom;
            renderRooms();
            loadCurrentRoom();
            saveAppState();
            showAlert(`Room "${roomName.trim()}" created successfully!`);
        }
    }
    
// Save message to current room
function saveMessage() {
    if (!currentRoom) return;
    
    const username = usernameInput.value.trim() || 'Anonymous';
    const text = sharedTextArea.value.trim();
    
    if (!text) {
        showAlert('Please enter a message to save.');
        return;
    }
    
    // Save username
    localStorage.setItem('username', username);
    
    // Add message to current room
    const message = {
        username,
        text,
        timestamp: new Date().toISOString()
    };
    
    currentRoom.messages.push(message);
    
    updateLastPost();
    saveAppState();
    showAlert('Message saved successfully!');
}    
    
    // Refresh the current room content
    function refreshContent() {
        if (connectionMode === 'online') {
            fetchRoomsFromServer();
        } else {
            loadFromLocalStorage();
        }
        showAlert('Content refreshed!');
    }
// Replace room text function
    function replaceRoomText() {
    if (!currentRoom) return;
    
    const username = usernameInput.value.trim() || 'Anonymous';
    const text = sharedTextArea.value.trim();
    
    if (!text) {
        showAlert('Please enter a message to save.');
        return;
    }
    
    // Save username
    localStorage.setItem('username', username);
    
    // Replace all messages with a single new message
    currentRoom.messages = [{
        username,
        text,
        timestamp: new Date().toISOString()
    }];
    
    updateLastPost();
    saveAppState();
    showAlert('Text replaced successfully!');
}
    
    // Copy text to clipboard
    function copyToClipboard() {
        sharedTextArea.select();
        document.execCommand('copy');
        showAlert('Text copied to clipboard!');
    }
    
    // Export room data
    function exportData() {
        // Create export data
        const exportData = {
            room: currentRoom.name,
            messages: currentRoom.messages,
            exportDate: new Date().toISOString(),
            exportedBy: usernameInput.value.trim() || 'Anonymous'
        };
        
        // Convert to JSON string
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Create blob and download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentRoom.name.replace(/\s+/g, '_')}_export_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert('Room data exported successfully!');
    }
    
    // Show logs modal
    function showLogs() {
        logsContent.innerHTML = '';
        
        // Get all messages from all rooms
        const allLogs = [];
        rooms.forEach(room => {
            room.messages.forEach(message => {
                allLogs.push({
                    roomName: room.name,
                    username: message.username,
                    text: message.text,
                    timestamp: message.timestamp
                });
            });
        });
        
        // Sort logs by timestamp (newest first)
        allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Render logs
        if (allLogs.length === 0) {
            const emptyLog = document.createElement('div');
            emptyLog.classList.add('log-entry');
            emptyLog.textContent = 'No messages found.';
            logsContent.appendChild(emptyLog);
        } else {
            // Add filter controls
            const filterContainer = document.createElement('div');
            filterContainer.style.margin = '0 0 15px 0';
            filterContainer.style.display = 'flex';
            filterContainer.style.gap = '10px';
            
            const roomFilter = document.createElement('select');
            roomFilter.style.padding = '5px';
            roomFilter.style.borderRadius = '4px';
            roomFilter.style.backgroundColor = 'var(--card-bg)';
            roomFilter.style.color = 'var(--text-color)';
            roomFilter.style.border = '1px solid var(--border-color)';
            
            // Add "All Rooms" option
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'All Rooms';
            roomFilter.appendChild(allOption);
            
            // Add room options
            const uniqueRooms = [...new Set(allLogs.map(log => log.roomName))];
            uniqueRooms.forEach(roomName => {
                const option = document.createElement('option');
                option.value = roomName;
                option.textContent = roomName;
                roomFilter.appendChild(option);
            });
            
            // Add search input
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search messages...';
            searchInput.style.padding = '5px';
            searchInput.style.borderRadius = '4px';
            searchInput.style.backgroundColor = 'var(--card-bg)';
            searchInput.style.color = 'var(--text-color)';
            searchInput.style.border = '1px solid var(--border-color)';
            searchInput.style.flexGrow = '1';
            
            filterContainer.appendChild(roomFilter);
            filterContainer.appendChild(searchInput);
            logsContent.appendChild(filterContainer);
            
            // Create logs container
            const logsContainer = document.createElement('div');
            
            // Function to filter and render logs
            function filterAndRenderLogs() {
                const selectedRoom = roomFilter.value;
                const searchTerm = searchInput.value.toLowerCase();
                
                // Filter logs
                const filteredLogs = allLogs.filter(log => {
                    const roomMatch = !selectedRoom || log.roomName === selectedRoom;
                    const searchMatch = !searchTerm || 
                        log.text.toLowerCase().includes(searchTerm) || 
                        log.username.toLowerCase().includes(searchTerm);
                    return roomMatch && searchMatch;
                });
                
                // Clear and render logs
                logsContainer.innerHTML = '';
                
                if (filteredLogs.length === 0) {
                    const emptyLog = document.createElement('div');
                    emptyLog.classList.add('log-entry');
                    emptyLog.textContent = 'No matching messages found.';
                    logsContainer.appendChild(emptyLog);
                } else {
                    filteredLogs.forEach(log => {
                        const logEntry = document.createElement('div');
                        logEntry.classList.add('log-entry');
                        
                        const date = new Date(log.timestamp);
                        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                        
                        logEntry.innerHTML = `<strong>[${log.roomName}]</strong> ${log.username} at ${formattedDate}: ${log.text}`;
                        logsContainer.appendChild(logEntry);
                    });
                }
            }
            
            // Add event listeners for filtering
            roomFilter.addEventListener('change', filterAndRenderLogs);
            searchInput.addEventListener('input', filterAndRenderLogs);
            
            // Initial render
            filterAndRenderLogs();
            logsContent.appendChild(logsContainer);
        }
        
        logsModal.style.display = 'block';
    }
    
    // Close logs modal
    function closeLogs() {
        logsModal.style.display = 'none';
    }
    
    // Show custom alert
    function showAlert(message) {
        alertMessage.textContent = message;
        alertModal.style.display = 'block';
    }
    
    // Close custom alert
    function closeAlert() {
        alertModal.style.display = 'none';
    }
    
    // Event Listeners
    saveBtn.addEventListener('click', saveMessage);
    copyBtn.addEventListener('click', copyToClipboard);
    refreshBtn.addEventListener('click', refreshContent);
    logsBtn.addEventListener('click', showLogs);
    createRoomBtn.addEventListener('click', createRoom);
    closeModalBtn.addEventListener('click', closeLogs);
    alertCloseBtn.addEventListener('click', closeAlert);
    themeToggle.addEventListener('click', toggleTheme);
    exportBtn.addEventListener('click', exportData);
    emojiBtn.addEventListener('click', toggleEmojiPicker);
    replaceBtn.addEventListener('click', replaceRoomText);//new replace function
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', function(event) {
        if (event.target !== emojiBtn && !emojiPicker.contains(event.target)) {
            emojiPicker.style.display = 'none';
        }
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === logsModal) {
            closeLogs();
        }
        if (event.target === alertModal) {
            closeAlert();
        }
    });
    
    // Save username when it changes
    usernameInput.addEventListener('change', function() {
        localStorage.setItem('username', usernameInput.value);
    });
    
    // Update character count when text changes
    sharedTextArea.addEventListener('input', updateCharacterCount);
    
    // Handle mobile keyboard issues
    window.addEventListener('resize', function() {
        if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
            window.setTimeout(function() {
                document.activeElement.scrollIntoView();
            }, 0);
        }
    });
    
    // Initialize the app
    initializeApp();
});
