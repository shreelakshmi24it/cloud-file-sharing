# SecureCloud Backend API

Backend server for the SecureCloud file sharing application with end-to-end encryption.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: AWS S3
- **Authentication**: JWT + bcrypt

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- AWS Account (for S3)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:
- Database credentials
- Redis connection
- AWS S3 credentials
- JWT secrets
- Email settings

### 3. Database Setup

Create the PostgreSQL database:

```bash
createdb cloud_file_sharing
```

Run migrations (once implemented):

```bash
npm run migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests
- `npm run lint` - Lint TypeScript files

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/storage` - Get storage usage
- `GET /api/users/activity` - Get activity logs

### Files
- `GET /api/files` - List user's files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Get file metadata
- `GET /api/files/:id/download` - Download file
- `PUT /api/files/:id` - Update file metadata
- `DELETE /api/files/:id` - Delete file

### Folders
- `GET /api/folders` - List folders
- `POST /api/folders` - Create folder
- `GET /api/folders/:id` - Get folder contents
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

### Sharing
- `POST /api/share/user` - Share with specific user
- `POST /api/share/link` - Generate public link
- `GET /api/share/:token` - Validate share token
- `POST /api/share/:token/verify` - Verify password
- `GET /api/share/:token/download` - Download shared file
- `DELETE /api/share/:id` - Revoke share

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── database/        # Database migrations & seeds
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── dist/                # Compiled JavaScript
├── .env                 # Environment variables
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── nodemon.json
```

## Development

The backend uses:
- **TypeScript** for type safety
- **Nodemon** for auto-reload during development
- **ESLint** for code linting
- **Helmet** for security headers
- **Morgan** for request logging
- **Compression** for response compression
- **CORS** for cross-origin requests

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Rate limiting
- Helmet security headers
- Input validation with Joi
- SQL injection prevention
- XSS protection
- CORS configuration

## License

MIT
