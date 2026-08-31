# 💬 Chattr — Frontend Client

A modern, responsive real-time messaging, audio, and video calling web application built with **React**, **Tailwind CSS**, and **Socket.io**.

---

## ✨ Features

- ⚡ **Real-Time Direct & Group Messaging**: Instant message delivery and receipt statuses powered by WebSockets.
- 📞 **P2P Voice & Video Calls**: WebRTC-powered low-latency calling with ringing modals, camera/mic controls, and call timers.
- 📜 **Call Logs & History**: Persistent voice and video call logs synchronized directly with the database.
- 👥 **Group & Member Management**: Create group rooms, invite members, and manage participant roles.
- 📎 **File & Media Sharing**: Upload images and attachments with in-chat preview and download capabilities.
- 🔍 **In-Conversation Search & Filter**: Filter conversations and search messages in real time.
- 🟢 **Live Online Presence**: Dynamic online/offline indicators for contacts across sessions.
- 📱 **Fully Responsive Layout**: Adaptive mobile-first UI with toggleable chat areas and slide-out sidebars.

---

## 🛠️ Tech Stack

- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Real-Time Communication**: Socket.io Client
- **WebRTC**: Native `RTCPeerConnection` with STUN servers
- **HTTP Client**: Axios

---

## 📁 Project Structure

```text
src/
├── components/
│   ├── AuthModal.jsx        # User login and registration modal
│   ├── CallModal.jsx        # WebRTC audio/video call overlay and controls
│   ├── CallsView.jsx        # Full call history and dialer interface
│   ├── ChatArea.jsx         # Active conversation viewport & message input
│   ├── ChatList.jsx         # Sidebar listing direct messages & group chats
│   ├── ContactsView.jsx     # Registered users directory
│   ├── DetailsSidebar.jsx   # Shared media, docs, and conversation info
│   ├── GroupsView.jsx       # Group creation and discovery panel
│   ├── SavedMessagesView.jsx# Bookmarked message viewer
│   ├── SettingsView.jsx     # Profile configuration and customization
│   └── SidebarNav.jsx       # Primary tab navigation and profile card
├── socket.js                # Socket.io client instance and connection helpers
├── App.jsx                  # Root state orchestration & view management
├── main.jsx                 # Application entry point
└── index.css                # Global Tailwind CSS directives
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js** (v18.x or higher recommended)
- **npm** or **yarn**

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Destiny27052005/chat-app.git
cd chattr/client
npm install
```

### 3. Environment Configuration
Create a .env file in the root of the frontend folder:

```bash
# Local Development
VITE_API_URL=http://localhost:5000/api

# Production (e.g., Render / Production Server)
# VITE_API_URL=https://your-backend-service.onrender.com/api
```

### 4. Running Locally
Start the Vite development server:

```Bash
npm run dev
```

The application will be accessible at http://localhost:5173.

### 🌐 Production Deployment (Vercel / Netlify)
## 1. Connect your repository to Vercel or Netlify.

## 2. Configure your build settings:

   - **Framework Preset**: Vite

   - **Build Command**: npm run build

   - **Output Directory**: dist

## 3. Add your environment variable in the host dashboard:

    - VITE_API_URL: https://your-backend-api.onrender.com/api

## 4. Deploy the project.

### 🔒 Permissions & Browser Requirements
- Microphone & Camera: Audio and video calling requires explicit browser permissions. WebRTC APIs require the application to be served over localhost or a secure https:// domain.