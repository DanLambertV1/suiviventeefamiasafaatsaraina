# replit.md

## Overview

This is a modern full-stack web application built with React/TypeScript frontend and Express backend, designed for sales tracking and inventory management. The application uses Firebase as the primary database and provides a comprehensive business management system with features like sales tracking, stock management, analytics, and user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI for accessible, unstyled components
- **State Management**: React hooks (useState, useEffect) with custom hooks
- **Animations**: Framer Motion for smooth transitions and interactions
- **Data Fetching**: TanStack Query for server state management

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL (configured with Drizzle ORM)
- **ORM**: Drizzle ORM with Zod validation
- **Authentication**: Firebase Auth
- **Session Management**: Express sessions with PostgreSQL store
- **API Pattern**: RESTful API with `/api` prefix

### Database Design
- **Primary Database**: Firebase Firestore (for production data)
- **Secondary Database**: PostgreSQL (configured but not actively used)
- **Schema Management**: Drizzle with migrations in `./migrations`
- **Collections**: register_sales, products, users, alerts, settings

## Key Components

### Authentication System
- Firebase Authentication for user management
- Role-based access control (admin, manager, seller, viewer)
- Session tracking with duration monitoring
- Secure login/logout with remember me functionality

### Sales Management
- Register sales tracking with real-time updates
- Import/export functionality for Excel files
- Sales categorization and bulk operations
- Duplicate detection and validation

### Stock Management
- Product inventory with automatic stock calculations
- Low stock alerts and notifications
- Bulk product operations (add, update, delete)
- Stock import from Excel with validation

### Analytics & Dashboard
- Real-time dashboard with key metrics
- Sales statistics and trends
- Product performance analytics
- Historical data visualization

### Import/Export System
- Excel file import with validation
- Clipboard data parsing
- Bulk operations with preview
- Error handling and duplicate detection

## Data Flow

1. **User Authentication**: Firebase Auth handles user login/registration
2. **Data Storage**: Firestore stores all application data
3. **Real-time Updates**: Firebase listeners update UI automatically
4. **Local State**: React hooks manage component state
5. **API Communication**: RESTful endpoints for complex operations
6. **File Processing**: Client-side Excel processing with validation

## External Dependencies

### Core Technologies
- React 18 + TypeScript
- Express.js + Node.js
- Firebase (Auth, Firestore, Storage)
- Drizzle ORM + PostgreSQL
- Vite build system

### UI/UX Libraries
- Radix UI components
- Tailwind CSS
- Framer Motion
- Lucide React icons
- React Hook Form

### Data Processing
- XLSX for Excel file handling
- Date-fns for date manipulation
- Zod for schema validation
- TanStack Query for data fetching

### Development Tools
- TypeScript for type safety
- ESBuild for backend bundling
- PostCSS for CSS processing
- Replit integration plugins

## Deployment Strategy

### Development Environment
- Vite dev server for frontend hot reloading
- Express server with TypeScript compilation
- Firebase emulator for local development
- Environment variables for configuration

### Production Build
- Vite builds optimized frontend bundle
- ESBuild compiles backend to single file
- Static assets served from Express
- Firebase hosting for production deployment

### Environment Configuration
- Development: Local servers with hot reload
- Production: Optimized builds with Firebase backend
- Database: Firestore for production, PostgreSQL as backup option
- Authentication: Firebase Auth with custom user roles

### Key Features
- Real-time data synchronization
- Offline capability preparation
- Responsive design for mobile/desktop
- Multi-language support (French/English)
- Role-based access control
- Comprehensive error handling
- Excel import/export functionality
- Advanced analytics and reporting