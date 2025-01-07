# My App Status

A modern status page application built with Next.js 14 and deployed on Cloudflare Pages. This application allows you to monitor and display the status of various projects in real-time.

## Features

- 🔒 Secure GitHub Authentication
- 📊 Real-time Project Status Display
- ⚡ Edge Runtime Performance
- 🔄 Public API for Status Updates
- 📅 Last Update Time Tracking

## Tech Stack

- **Framework**: Next.js 14
- **Authentication**: Auth.js v5 with GitHub provider
- **Database**: Cloudflare D1 (SQLite at edge)
- **Deployment**: Cloudflare Pages
- **Testing**: Integration tests with local SQLite

## API Endpoints

- `GET /api/projects` - List all projects
- `GET /api/projects/[id]` - Get specific project details
- `POST /api/projects/[id]/status` - Update project status
