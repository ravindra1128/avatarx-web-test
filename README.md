# AvatarX Webapp

A React application built with Vite, featuring real-time health monitoring and glucose prediction capabilities.

## Prerequisites

- **Node.js**: Version >= 20.17.0 (check with `node --version`)
- **npm**: Usually comes with Node.js (check with `npm --version`)

## Getting Started

### 1. Install Dependencies

First, install all the required dependencies:

```sh
npm install
```

### 2. Run the Development Server

Start the development server with hot module replacement (HMR):

```sh
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### 3. Build for Production

To create a production build:

```sh
npm run build
```

The built files will be in the `dist` directory.

### 4. Preview Production Build

To preview the production build locally:

```sh
npm run preview
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the app for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Nginx Configuration for WebSocket (Socket.IO) Support

To enable WebSocket support for Socket.IO, update your Nginx config as follows:

1. **Edit the Nginx config file:**

   ```sh
   sudo vim /etc/nginx/sites-available/avatarx-api
   ```

2. **Test the Nginx configuration:**

   ```sh
   sudo nginx -t
   ```

3. **Reload Nginx to apply changes:**

   ```sh
   sudo systemctl reload nginx
   ```

If you encounter any errors, check the output of the test command and correct your configuration before reloading.