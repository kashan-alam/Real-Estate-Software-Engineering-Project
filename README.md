# Real Estate Marketplace Platform

## Overview
A comprehensive web application for real estate transactions that connects property buyers and sellers. Users can list properties for sale or rent, search available properties based on various criteria and manage their profiles.

## Features

### User Management
- User registration and authentication
- Personalized user profiles
- Unified user access (all users can both buy and sell properties)

### Property Management
- Property listing creation with detailed information
- Multiple property images upload
- Property status tracking (available, sold, rented)
- Comprehensive property details (size, price, location, description)

### Search Functionality
- Advanced property search by multiple criteria
- Location-based property filtering
- Price range filtering
- Property type filtering

### Transaction System
- Commission calculation
- Transaction history tracking

## Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript
- Responsive design for all devices

### Backend
- SQL Database

## Database Schema

The application is built on a relational database with the following structure:

### Users and Roles
- **User**: Basic user information (UserID, Name, Email, ContactNumber)
- **Seller**: Seller-specific information linked to user accounts
- **Buyer**: Buyer-specific information linked to user accounts

### Property Information
- **Property**: Core property details (type, price, size, status, description)
- **Location**: Hierarchical location information (city, town)
- **Image**: Property images storage and management

### Transactions
- **Transaction**: Records of property exchanges between buyers and sellers
- **Payment**: Payment details for completed transactions
