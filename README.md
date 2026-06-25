# Expenses Backend API

A comprehensive expense tracking and management backend API built with Express.js and MongoDB. This project provides a complete system for tracking expenses, managing users, roles, categories, and generating financial reports and dashboards.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Database](#database)
- [Logging](#logging)
- [Deployment](#deployment)

## Features

- **User Management**: User registration, login, and profile management with role-based access control
- **Authentication**: JWT-based authentication with OAuth token verification
- **Expense Tracking**: Record and categorize transactions with support for recurring expenses
- **Budget Management**: Set default transaction values and track spending against budgets
- **Debt Tracking**: Manage debts and payments between users
- **Categories & Subcategories**: Organize expenses with hierarchical categorization
- **Dashboard Analytics**: Comprehensive dashboard with expense statistics and insights
- **Balance Reports**: Generate balance reports and financial summaries
- **Roles & Permissions**: Admin and user role management with authorization checks
- **Email Notifications**: Send emails via configured email templates
- **Logging**: Comprehensive request/response logging with Pino logger
- **Database Backups**: Automated database backup functionality

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 4.21.0
- **Database**: MongoDB with Mongoose 8.7.1
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcryptjs for password hashing
- **Email**: Nodemailer
- **Logging**: Pino
- **Utilities**:
    - moment/moment-range for date handling
    - archiver for backup compression
    - googleapis for external integrations
    - cookie-parser for cookie handling
    - CORS enabled for cross-origin requests
- **Development**: Nodemon for hot reloading
- **Deployment**: Vercel

## Installation

### Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB instance (local or cloud-based like MongoDB Atlas)
- npm or yarn package manager

### Steps

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd expenses_backend
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Create environment file**
    ```bash
    cp .env.example .env
    ```
    (See [Environment Variables](#environment-variables) section)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/expensesDB

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# OAuth Configuration (if using Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Node Environment
NODE_ENV=development

# Server Port
PORT=3001
```

## Running the Application

### Development

```bash
npm run dev
```

This starts the server with Nodemon for automatic restart on file changes. The server will run on `http://localhost:3001`.

### Production

```bash
node index.js
```

## Project Structure

```
expenses_backend/
├── index.js                      # Application entry point
├── package.json                  # Project dependencies
├── vercel.json                   # Vercel deployment config
├── controllers/                  # Business logic handlers
│   ├── auth.js
│   ├── user.js
│   ├── role.js
│   ├── person.js
│   ├── debt.js
│   ├── category.js
│   ├── subCategory.js
│   ├── transaction.js
│   ├── defaultTransactionValue.js
│   ├── recurrentTransaction.js
│   ├── dashboard.js
│   ├── functions.js
│   └── email.js
├── models/                       # Mongoose schemas
│   ├── user.js
│   ├── role.js
│   ├── person.js
│   ├── debt.js
│   ├── category.js
│   ├── subCategory.js
│   ├── transaction.js
│   ├── defaultTransactionValue.js
│   ├── recurrentTransaction.js
│   └── balance.js
├── routes/                       # API route definitions
│   ├── auth.js
│   ├── user.js
│   ├── role.js
│   ├── person.js
│   ├── debt.js
│   ├── category.js
│   ├── subCategory.js
│   ├── transaction.js
│   ├── defaultTransactionValue.js
│   ├── recurrentTransaction.js
│   ├── dashboard.js
│   ├── balance.js
│   └── functions.js
├── utils/                        # Utility functions and middleware
│   ├── middlewares.js           # Authentication & logging middleware
│   ├── mongooseConnection.js    # Database connection
│   ├── mongooseDbFunctions.js   # Database operations
│   ├── common.js                # Common helper functions
│   ├── pino.conf.js             # Logger configuration
│   ├── categoryHandlers.js      # Category-related utilities
│   ├── default/                 # Default data files
│   │   ├── users.json
│   │   ├── roles.json
│   │   ├── categories.json
│   │   ├── subCategories.json
│   │   └── transactionDefaultValues.json
│   └── emailTemplates/          # Email template definitions
│       └── contactEmail.js
├── logs/                         # Application logs (organized by route)
│   ├── auth/
│   ├── balance/
│   ├── dashboard/
│   ├── functions/
│   ├── transactions/
│   └── ...
└── backup/                       # Database backups
    └── expensesDB_YYYY-MM-DD_HH-mm-ss/
```

## API Endpoints

### Authentication

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/verifyOauthAccessToken` - Verify OAuth token

### Users

- `GET /users` - Get all users
- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Roles

- `GET /roles` - Get all roles
- `POST /roles` - Create role
- `PUT /roles/:id` - Update role
- `DELETE /roles/:id` - Delete role

### Persons

- `GET /persons` - Get all persons
- `POST /persons` - Create person
- `PUT /persons/:id` - Update person
- `DELETE /persons/:id` - Delete person

### Categories

- `GET /categories` - Get all categories
- `POST /categories` - Create category
- `PUT /categories/:id` - Update category
- `DELETE /categories/:id` - Delete category

### Subcategories

- `GET /subCategories` - Get all subcategories
- `POST /subCategories` - Create subcategory
- `PUT /subCategories/:id` - Update subcategory
- `DELETE /subCategories/:id` - Delete subcategory

### Transactions

- `GET /transactions` - Get all transactions
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Debts

- `GET /debts` - Get all debts
- `POST /debts` - Create debt
- `PUT /debts/:id` - Update debt
- `DELETE /debts/:id` - Delete debt

### Recurring Transactions

- `GET /recurrent-transactions` - Get all recurring transactions
- `POST /recurrent-transactions` - Create recurring transaction
- `PUT /recurrent-transactions/:id` - Update recurring transaction
- `DELETE /recurrent-transactions/:id` - Delete recurring transaction

### Dashboard

- `GET /dashboard` - Get dashboard data and statistics

### Balance

- `GET /balance` - Get balance information

### Default Transaction Values

- `GET /default-transaction-values` - Get default values
- `POST /default-transaction-values` - Create default value

### Utility Functions

- `POST /functions/create-default` - Initialize default data

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After user login, a token is returned and must be included in subsequent requests:

```
Authorization: Bearer <your_jwt_token>
```

Protected endpoints automatically verify the token via the `verifyToken` middleware. Some endpoints like `/auth/login` and `/auth/register` are exempt from token verification.

### Admin Authorization

Certain endpoints require admin privileges. The `isAdmin` middleware checks if the user has an 'Admin' role and returns a 401 status if unauthorized.

## Database

### MongoDB Collections

The application uses the following MongoDB collections:

- **users** - User accounts and credentials
- **roles** - User roles and permissions
- **persons** - People in the system
- **categories** - Main expense categories
- **subcategories** - Subcategories under main categories
- **transactions** - Expense/income transactions
- **debts** - Debt records
- **recurrenttransactions** - Recurring transaction schedules
- **defaulttransactionvalues** - Default budget/transaction values
- **balance** - Balance calculations and snapshots

### Database Connection

Database connection is handled by `utils/mongooseConnection.js`. The connection is reused across requests via the `dbMiddleware`.

## Logging

The application uses **Pino** for structured logging. Logs are organized by route in the `/logs` directory:

- Authentication requests are logged to `/logs/auth/`
- Transaction requests are logged to `/logs/transactions/`
- Dashboard requests are logged to `/logs/dashboard/`
- And so on...

Log entries include:

- Request method and path
- User ID
- HTTP status code
- Error details (if applicable)
- Request payload

## Deployment

### Vercel Deployment

The project is configured for deployment on Vercel using the `vercel.json` configuration file. The setup includes:

1. **Build Configuration**: Node.js runtime with specified files to include
2. **Route Handling**: All routes are directed to `index.js`

### Deployment Steps

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel automatically deploys on push to main branch

**Allowed Origins** (CORS):

- Production: `https://expenses91-opal.vercel.app`
- Development: `http://localhost:3000`

## CORS Configuration

The API is configured to accept requests from specified origins only:

```javascript
const allowedOrigins = ['https://expenses91-opal.vercel.app', 'http://localhost:3000']
```

## Error Handling

The API returns standardized error responses:

```json
{
	"code": "error_code",
	"message": "Human readable error message",
	"index": "optional_index_for_batch_operations"
}
```

Common error codes:

- `missing-token` - No authorization token provided
- `invalid-token` - Token verification failed
- `forbidden` - User lacks required permissions

## Development Notes

- Database connections are managed per request using the `dbMiddleware`
- CORS credentials are enabled for cookie-based authentication
- The API blocks direct root URL access (returns 404)
- Backup directory is ignored by Nodemon to prevent unnecessary restarts
- Default data can be initialized via the `/functions/create-default` endpoint

## License

ISC

## Author

sirius91

---

For more information or issues, please refer to the project documentation or contact the development team.
