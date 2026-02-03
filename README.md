# Terraria Module for Smarthome

A smarthome module that deploys and manages a Terraria multiplayer server.

## Structure

```
config/
├── mfe-manifest.json      # MFE configuration (tile, routing)
├── mfe-deployment.yaml    # Kubernetes deployment for MFE container
├── module-fields.json     # Configuration fields for the module
└── service-template.yaml  # Kubernetes template for Terraria server
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
- **Difficulty**: Classic, Expert, Master, or Journey mode
- **World Size**: Small, Medium, or Large
- **Password**: Optional server password for protection

## Connecting to the Server

Once deployed, players can connect using:
- **Address**: Your smarthome IP address
- **Port**: 7777 (or NodePort 30777)

## Requirements

- Smarthome system with the management API running
- Kubernetes cluster with sufficient resources (512Mi+ RAM recommended)
- Terraria game client (PC, mobile, or console)

## Resources

The Terraria server is configured with:
- Memory: 512Mi request, 1Gi limit
- CPU: 500m request, 1000m limit
- Storage: 1Gi persistent volume for world saves
