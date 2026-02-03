# Terraria Module for Smarthome

A smarthome module that deploys and manages a Terraria multiplayer server.

## Structure

```
smarthome-terraria-module/
├── config/
│   ├── mfe-manifest.json      # MFE configuration (tile, routing)
│   ├── mfe-deployment.yaml    # Kubernetes deployment for MFE container
│   ├── module-fields.json     # Configuration fields for the module
│   └── service-template.yaml  # Kubernetes template for Terraria server
├── terraria-ui/               # Angular micro-frontend application
│   ├── src/
│   ├── package.json
│   ├── angular.json
│   ├── federation.config.js
│   └── Dockerfile
└── README.md
```

## Installation

1. Open your Smarthome UI
2. Click the "+" button in the header
3. Enter this repository URL: `https://github.com/YOUR_USERNAME/smarthome-terraria-module`
4. Click "Validate" then "Install Module"

## Configuration

After installation, the module will prompt you to configure:

- **World Name**: The name of your Terraria world (will be created if it doesn't exist)
- **Max Players**: Maximum concurrent players (4, 8, or 16)
- **Difficulty**: Classic (0), Expert (1), Master (2), or Journey (3)
- **World Size**: Small (1), Medium (2), or Large (3)
- **Password**: Optional server password for protection

## Connecting to the Server

Once deployed, players can connect using:
- **Address**: Your smarthome IP address (192.168.4.37)
- **Port**: 7777 (or NodePort 30777)

## Development

### UI Development
```bash
cd terraria-ui
npm install
npm start  # Runs on http://localhost:4202
```

### Building Docker Image
```bash
cd terraria-ui
docker build -t terraria-mfe:latest .
```

## Requirements

- Smarthome system with the management API running
- Kubernetes cluster with sufficient resources (512Mi+ RAM recommended)
- Terraria game client (PC, mobile, or console)

## Resources

The Terraria server is configured with:
- Memory: 512Mi request, 1Gi limit
- CPU: 500m request, 1000m limit
- Storage: 1Gi persistent volume for world saves
