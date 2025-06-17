# СтройМастер - Inventory Management System

## Overview

This is a full-stack inventory management system built for construction material retail businesses. The application provides comprehensive inventory tracking, user management, and business analytics with role-based access control.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: Connect-pg-simple for PostgreSQL sessions
- **Development**: tsx for TypeScript execution

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Type-safe database schema with Zod validation
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### Database Schema
- **Users**: Role-based authentication (admin, manager, storekeeper, cashier)
- **Products**: SKU-based product catalog with categories and suppliers
- **Inventory**: Location-based stock tracking (warehouses and stores)
- **Suppliers**: Vendor management with ratings and contact information
- **Transactions**: Stock movement tracking between locations
- **Categories**: Product categorization system
- **Locations**: Warehouses and stores with capacity management

### Authentication & Authorization
- **Role-based Access Control**: Four user roles with different permissions
- **Location-based Access**: Users can be assigned to specific warehouses or stores
- **Protected Routes**: Client-side route protection based on authentication state

### User Interface
- **Responsive Design**: Mobile-first approach with grid layouts
- **Component Library**: Comprehensive UI components using Shadcn/ui
- **Theme System**: CSS custom properties for consistent styling
- **Interactive Elements**: Modals, forms, and data tables

## Data Flow

1. **Client Requests**: React components make API calls using React Query
2. **Server Processing**: Express routes handle requests and validate data
3. **Database Operations**: Drizzle ORM executes type-safe database queries
4. **Response Handling**: JSON responses with proper error handling
5. **State Updates**: React Query automatically updates client state

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form handling with validation
- **zod**: Schema validation

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Production bundling

## Deployment Strategy

### Development
- **Environment**: Replit with Node.js 20 and PostgreSQL 16
- **Hot Reload**: Vite development server with HMR
- **Database**: Auto-provisioned PostgreSQL instance

### Production
- **Build Process**: Vite for client bundle, ESBuild for server bundle
- **Deployment Target**: Autoscale deployment on Replit
- **Port Configuration**: Internal port 5000, external port 80
- **Static Assets**: Served from dist/public directory

### Build Configuration
- Client bundle output: `dist/public`
- Server bundle output: `dist/index.js`
- Static file serving in production mode

## Changelog

```
Changelog:
- June 15, 2025. Initial setup and PostgreSQL migration completed
- June 15, 2025. Product management functionality implemented with add/edit/delete capabilities
- June 15, 2025. React Query integration with proper QueryClientProvider setup
- June 15, 2025. Fixed edit button errors and category field validation in product forms
- June 15, 2025. Product add/edit forms now working with proper category and supplier integration
- June 15, 2025. Resolved product editing form reset issues - forms now properly populate with existing data
- June 15, 2025. Implemented warehouse management system with inventory tracking and transfer functionality
- June 16, 2025. Enhanced sales history system with proper revenue tracking and transaction item pricing
- June 16, 2025. Implemented autocomplete product filtering for better UX with large product catalogs
- June 16, 2025. Added transaction detail view functionality to show individual receipt contents
- June 16, 2025. Fixed sales amount calculation by adding price field to transaction items schema
- June 16, 2025. Completed comprehensive supplier management system with enhanced database schema
- June 16, 2025. Added category dropdown with checklist functionality using categories table
- June 16, 2025. Implemented supplier-product relationship management with full CRUD operations
- June 16, 2025. Enhanced UI layout with bigger detailed information section and moved edit/delete buttons
- June 16, 2025. Removed rating field completely and fixed form data loading for supplier editing
- June 16, 2025. Implemented product modifications: removed supplier assignment, added volume field, disabled deletion, enhanced warehouse distribution display with filtering and total stock calculation
- June 17, 2025. Created comprehensive Home dashboard with real-time analytics: inventory status tracking (total products, low stock alerts, out-of-stock items), dynamic sales charts with 6-month revenue and quantity data, interactive stock status visualization with color-coded segments
- June 17, 2025. Implemented realistic transaction status system: transfers and deliveries now start as "in_transit" status, sales remain "delivered" immediately, added confirmation system for goods arrival, created dedicated "In Transit" page for tracking pending deliveries
- June 17, 2025. Enhanced transaction confirmation system: all incoming goods movements (supplier deliveries, warehouse transfers, store deliveries) now require manual confirmation, added confirmation UI to warehouse and store detail pages, only sales remain instant
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```