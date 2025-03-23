# Offline-Online-PasteBoard

Shared Text Rooms is a real-time collaborative messaging application that allows users to create rooms, share text messages, and communicate with others. It's initial purpose was to create an easier method to copy and paste text from one device to another. The application is designed to work in various connectivity scenarios:

- **Online Mode:** Full real-time synchronization across all connected devices
- **Local Network Mode:** Communication between devices on the same network
- **Offline Mode:** Functionality preserved even without an internet connection

The application features a modern, responsive interface with both light and dark themes, emoji support, and comprehensive room management capabilities.

## Installation

### Prerequisites
- **Node.js** (v12.0.0 or higher)
- **npm** (v6.0.0 or higher)

### Server Setup

Clone the repository or download the source code:

```sh
git clone https://github.com/Bena-Nyagah2/Offline-Online-PasteBoard
```

Install dependencies:

```sh
npm install
```

Start the server:

```sh
npm start
```

The server will start on port `3000` by default. You can change this by setting the `PORT` environment variable.

## Accessing the Application

- **Local access:** Open [http://localhost:3000](http://localhost:3000) in your web browser
- **Same network access:** Open `http://<server-ip-address>:3000` on other devices
- **Internet access:** Deploy to a hosting service and access via the provided URL

## Features

### Core Features
- **Room Management:** Create, rename, and delete text rooms
- **Real-time Messaging:** Share text messages with others in real-time
- **Offline Support:** Continue using the app even without an internet connection
- **Message History:** View and search through message logs
- **User Identification:** Set your username for message attribution

### User Interface
- **Responsive Design:** Works on desktop, tablet, and mobile devices
- **Dark Mode:** Toggle between light and dark themes
- **Emoji Support:** Insert emojis into your messages
- **Character Counter:** Track the length of your messages
- **Connection Status:** Visual indicator of your connection state

### Data Management
- **Local Storage:** Messages are saved locally for offline access
- **Export Functionality:** Export room data as JSON files
- **Automatic Synchronization:** Changes sync automatically when connection is restored
- **Message Logs:** Comprehensive logging with filtering and search capabilities

## User Guide

### Getting Started

#### Set Your Username:
- Enter your desired username in the input field at the top of the page
- This name will be associated with your messages

#### Connection Status:
- **Green indicator:** Online mode (full real-time sync)
- **Orange indicator:** Local network mode (sync with devices on the same network)
- **Red indicator:** Offline mode (changes saved locally)

#### Theme Selection:
- Click the **"Dark Mode"** or **"Light Mode"** toggle to switch themes
- Your preference will be remembered for future visits

### Room Management

#### Creating a Room:
1. Click the **"New Room"** button
2. Enter a name for the room
3. The new room will be created and selected automatically

#### Switching Rooms:
- Click on any room in the room list to switch to it
- The active room is highlighted

#### Renaming a Room:
- Hover over a room and click the edit icon (✏️)
- Enter the new name for the room
- **Note:** The default room cannot be renamed

#### Deleting a Room:
- Hover over a room and click the trash icon (🗑️)
- Confirm the deletion when prompted
- **Note:** The default room cannot be deleted

### Messaging

#### Composing a Message:
- Type your message in the text area
- The character counter will show the length of your message

#### Adding Emojis:
- Click the emoji button (😊) below the text area
- Select an emoji from the picker to insert it at the cursor position

#### Saving a Message:
- Click the **"Save"** button to add your message to the current room
- Your message will be visible to others in the same room

#### Copying Text:
- Click the **"Copy"** button to copy the entire text area content to clipboard

#### Refreshing Content:
- Click the **"Refresh"** button to fetch the latest messages from the server

### Message Logs

#### Viewing Logs:
- Click the **"Logs"** button to open the message logs modal
- All messages from all rooms are displayed, sorted by timestamp (newest first)

#### Filtering Logs:
- Use the room dropdown to filter messages by room
- Use the search box to find specific messages by content or username

#### Closing Logs:
- Click the **"×"** button or click outside the modal to close it

### Exporting Data

#### Exporting Room Data:
- Click the **"Export"** button to download the current room's data
- The data is saved as a JSON file

## Technical Details

### Architecture

The application follows a client-server architecture:

- **Frontend:** HTML, CSS, and JavaScript
- **Backend:** Node.js with Express
- **Communication:** WebSockets for real-time updates
- **Data Storage:** JSON file on the server, localStorage on the client

### Data Flow

- **Online Mode:** Real-time synchronization via WebSocket
- **Offline Mode:** Changes stored in localStorage, syncs when online
- **Local Network Mode:** Direct device communication

### Project Structure

```sh
shared-text-rooms/
├── server.js              # Main server file
├── rooms-data.json        # Server-side data storage
├── package.json           # Project dependencies
├── public/                # Client-side files
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── styles.css     # Stylesheet
│   └── js/
│       └── app.js         # Client-side JavaScript
```

### API Endpoints

- **GET /api/rooms:** Retrieve all rooms and their messages
- **WebSocket:** Real-time communication channel

## Troubleshooting

### Connection Issues
**Problem:** The application shows "Offline" status even when the internet is available.
**Solution:**
- Check if the server is running
- Verify firewall settings
- Refresh the page
- Check browser console for errors

### Data Not Syncing
**Problem:** Changes made on one device are not appearing on others.
**Solution:**
- Ensure all devices are online
- Click "Refresh" to force sync
- Restart the server if needed

### Messages Not Saving
**Problem:** Messages disappear after saving or don’t appear at all.
**Solution:**
- Ensure messages are saved properly
- Check browser localStorage settings
- Clear cache and reload

## Security Considerations

- Messages stored in plain text
- No built-in encryption
- No authentication system in the current version
- Consider using HTTPS for security

## Future Enhancements

- **User Authentication:** Login system, profiles, avatars
- **Enhanced Security:** End-to-end encryption, password-protected rooms
- **Rich Content:** File sharing, Markdown support
- **Notifications:** Push notifications, mentions

## Community Contributions

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Icons provided by Font Awesome
- Built with Express and WebSocket libraries

_Last updated: March 21, 2025_
