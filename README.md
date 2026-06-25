# Expenses Backend API

A comprehensive expense tracking and management backend API built with Express.js and MongoDB. This project provides a complete system for tracking expenses, managing users, roles, categories, and generating financial reports and dashboards.

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

4. **Configure environment variables**

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

### Run locally

```bash
npm run dev
```

The server will run on `http://localhost:3001`.

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

drios9107

---

For more information or issues, please refer to the project documentation or contact the development team.
