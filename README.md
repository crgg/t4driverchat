# Chat Microservice - Vue 3

A modern, real-time chat application built with Vue 3, featuring clean architecture and modern design patterns.

## Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Pinia** - Official state management for Vue 3
- **Vue Router** - Official routing solution
- **Tailwind CSS** - Utility-first CSS framework
- **GSAP** - Professional-grade animation library
- **Socket.io Client** - Real-time bidirectional communication
- **Axios** - Promise-based HTTP client
- **Heroicons** - Beautiful hand-crafted SVG icons

## Features

- ✨ Modern and responsive UI
- 🔐 Secure authentication with JWT tokens
- 💬 Real-time messaging
- 👥 Contact management (Drivers & Carriers)
- 🔔 Notification system
- 📁 File sharing (Images, PDFs)
- 🎨 Smooth GSAP animations
- 🔍 Advanced search and filtering
- 📱 Mobile-friendly design

## Project Structure

```
src/
├── assets/          # Static assets (images, fonts, etc.)
├── components/      # Reusable Vue components
│   ├── chat/        # Chat-related components
│   ├── common/      # Common UI components
│   └── notifications/
├── composables/     # Composition API reusable logic
├── config/          # Configuration files
├── layouts/         # Layout components
├── router/          # Vue Router configuration
├── services/        # API and business logic
│   ├── api/         # API endpoints
│   └── socket/      # Socket.io configuration
├── stores/          # Pinia stores
├── utils/           # Utility functions
└── views/           # Page components
```

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env` and configure your environment variables:

```bash
cp .env.example .env
```

4. Start the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_CHAT_SERVER_URL` - Socket.io server URL
- `VITE_APP_NAME` - Application name

## Development

The project follows clean architecture principles:

- **Separation of Concerns**: Each layer has a specific responsibility
- **Dependency Injection**: Services are injected where needed
- **Composables**: Reusable logic extracted into composables
- **Type Safety**: Consistent data structures
- **Error Handling**: Centralized error handling

## License

MIT
