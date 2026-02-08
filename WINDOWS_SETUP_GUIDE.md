# Windows Setup Guide - Cloud File Sharing Application

This guide provides step-by-step instructions for setting up the Cloud File Sharing application on a Windows machine locally.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installing Required Software](#installing-required-software)
3. [Setting Up PostgreSQL](#setting-up-postgresql)
4. [Setting Up Redis](#setting-up-redis)
5. [Cloning the Project](#cloning-the-project)
6. [Backend Setup](#backend-setup)
7. [Frontend Setup](#frontend-setup)
8. [Running the Application](#running-the-application)
9. [Alternative: Using Docker](#alternative-using-docker)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:
- Windows 10 or later
- Administrator access to install software
- At least 4GB of free disk space
- Stable internet connection

---

## Installing Required Software

### 1. Install Node.js

**Node.js** is required to run both the backend and frontend.

1. Visit the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version for Windows (recommended: v18.x or v20.x)
3. Run the installer (`.msi` file)
4. Follow the installation wizard:
   - Accept the license agreement
   - Keep the default installation path
   - **Important:** Make sure "Add to PATH" is checked
   - Install the recommended tools (including npm)
5. Verify installation by opening **Command Prompt** or **PowerShell** and running:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers for both commands.

### 2. Install Git

**Git** is needed to clone the repository.

1. Visit: [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download the latest version
3. Run the installer
4. During installation:
   - Choose your preferred text editor (default is Vim)
   - Select "Git from the command line and also from 3rd-party software"
   - Use the default settings for other options
5. Verify installation:
   ```bash
   git --version
   ```

### 3. Install PostgreSQL

**PostgreSQL** is the database used by the application.

1. Visit: [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Download the PostgreSQL installer (recommended: version 15.x)
3. Run the installer
4. During installation:
   - Set a **password** for the PostgreSQL superuser (postgres) - **Remember this password!**
   - Default port: `5432` (keep this unless you have a conflict)
   - Default locale: Use your system locale
5. **Important:** Uncheck "Launch Stack Builder at exit" (not needed)
6. Verify installation:
   - Open **Command Prompt** and run:
     ```bash
     psql --version
     ```
   - If the command is not recognized, add PostgreSQL to your PATH:
     - Search for "Environment Variables" in Windows
     - Edit "Path" under System Variables
     - Add: `C:\Program Files\PostgreSQL\15\bin` (adjust version number if different)

### 4. Install Redis

**Redis** is used for caching and session management.

#### Option A: Using WSL2 (Recommended)

1. **Enable WSL2:**
   - Open PowerShell as Administrator
   - Run:
     ```powershell
     wsl --install
     ```
   - Restart your computer
   - Set up a Linux distribution (Ubuntu recommended)

2. **Install Redis in WSL2:**
   - Open WSL2 terminal (Ubuntu)
   - Run:
     ```bash
     sudo apt update
     sudo apt install redis-server
     ```
   - Start Redis:
     ```bash
     sudo service redis-server start
     ```
   - Verify:
     ```bash
     redis-cli ping
     ```
     Should return `PONG`

#### Option B: Using Memurai (Windows Native)

1. Visit: [https://www.memurai.com/](https://www.memurai.com/)
2. Download Memurai (Redis-compatible for Windows)
3. Run the installer
4. Start Memurai from the Start menu
5. Verify by opening Command Prompt:
   ```bash
   redis-cli ping
   ```

---

## Setting Up PostgreSQL

### 1. Create the Database

1. Open **Command Prompt** or **PowerShell**
2. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```
3. Enter the password you set during installation
4. Create the database:
   ```sql
   CREATE DATABASE cloud_file_sharing;
   ```
5. Verify:
   ```sql
   \l
   ```
   You should see `cloud_file_sharing` in the list
6. Exit:
   ```sql
   \q
   ```

### 2. Initialize Database Schema

The schema will be automatically created when you run the backend for the first time. The migration script is located at `backend/src/database/schema.sql`.

---

## Setting Up Redis

### If Using WSL2:

1. Open WSL2 terminal
2. Start Redis:
   ```bash
   sudo service redis-server start
   ```
3. To make Redis start automatically on WSL2 boot, add to `~/.bashrc`:
   ```bash
   echo "sudo service redis-server start" >> ~/.bashrc
   ```

### If Using Memurai:

1. Open Memurai from the Start menu
2. Ensure it's running (check system tray)

---

## Cloning the Project

1. Open **Command Prompt** or **PowerShell**
2. Navigate to where you want to store the project:
   ```bash
   cd C:\Users\YourUsername\Documents
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/shreelakshmi24it/cloud-file-sharing.git
   ```
4. Navigate into the project:
   ```bash
   cd cloud-file-sharing
   ```

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

> **Note:** This may take several minutes. If you encounter errors, see the [Troubleshooting](#troubleshooting) section.

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```
2. Open `.env` in a text editor (Notepad, VS Code, etc.)
3. Update the following values:

   ```env
   # Environment
   NODE_ENV=development

   # Server
   PORT=5000
   API_URL=http://localhost:5000

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5173

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=cloud_file_sharing
   DB_USER=postgres
   DB_PASSWORD=your_actual_postgres_password

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=

   # JWT (Generate secure random strings)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=your-refresh-token-secret-change-this
   JWT_REFRESH_EXPIRES_IN=30d

   # AWS S3 (Required for file storage)
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   S3_BUCKET_NAME=cloud-file-sharing-bucket

   # Email (Optional - for notifications)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=SecureCloud <noreply@securecloud.com>

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # File Upload
   MAX_FILE_SIZE=104857600
   ALLOWED_FILE_TYPES=image/*,video/*,audio/*,application/pdf,application/zip

   # Encryption
   RSA_KEY_SIZE=2048
   AES_KEY_SIZE=256
   ```

4. **Important:** Replace the following placeholders:
   - `DB_PASSWORD`: Your PostgreSQL password
   - `JWT_SECRET` and `JWT_REFRESH_SECRET`: Generate random strings (use a password generator)
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`: Your AWS credentials
   - Email settings (if you want email functionality)

### 4. Set Up AWS S3 (Required)

The application requires AWS S3 for file storage.

1. **Create an AWS Account:**
   - Visit: [https://aws.amazon.com/](https://aws.amazon.com/)
   - Sign up for a free tier account

2. **Create an S3 Bucket:**
   - Go to AWS Console → S3
   - Click "Create bucket"
   - Choose a unique bucket name (e.g., `your-name-cloud-file-sharing`)
   - Select your region (e.g., `us-east-1`)
   - Keep default settings
   - Click "Create bucket"

3. **Create IAM User with S3 Access:**
   - Go to AWS Console → IAM
   - Click "Users" → "Add users"
   - Username: `cloud-file-sharing-app`
   - Select "Access key - Programmatic access"
   - Click "Next: Permissions"
   - Attach policy: `AmazonS3FullAccess`
   - Click through to create user
   - **Important:** Save the Access Key ID and Secret Access Key

4. **Update `.env` file** with your AWS credentials

### 5. Build the Backend

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist` folder.

---

## Frontend Setup

### 1. Navigate to Frontend Directory

Open a **new Command Prompt/PowerShell window** (keep the backend terminal open):

```bash
cd C:\Users\YourUsername\Documents\cloud-file-sharing\frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Frontend Environment (Optional)

The frontend uses Vite and automatically connects to `http://localhost:5000` for the API. If you need to change this:

1. Create a `.env` file in the `frontend` directory:
   ```bash
   echo VITE_API_URL=http://localhost:5000 > .env
   ```

---

## Running the Application

### 1. Start Redis

**If using WSL2:**
```bash
# In WSL2 terminal
sudo service redis-server start
```

**If using Memurai:**
- Ensure Memurai is running from the Start menu

### 2. Start the Backend

In the backend terminal:

```bash
npm run dev
```

You should see:
```
Server running on port 5000
Database connected successfully
Redis connected successfully
```

### 3. Start the Frontend

In the frontend terminal:

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 4. Access the Application

1. Open your web browser
2. Navigate to: [http://localhost:5173](http://localhost:5173)
3. You should see the Cloud File Sharing application login page

---

## Alternative: Using Docker

If you prefer to use Docker instead of installing PostgreSQL and Redis separately:

### 1. Install Docker Desktop

1. Visit: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Download Docker Desktop for Windows
3. Run the installer
4. Enable WSL2 integration during setup
5. Restart your computer

### 2. Configure Environment

1. In the project root, create a `.env` file with all the required variables (see backend `.env.example`)
2. Make sure to set:
   ```env
   DB_HOST=postgres
   REDIS_HOST=redis
   ```

### 3. Start All Services

In the project root directory:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis cache
- Backend API
- Frontend web app

### 4. Access the Application

- Frontend: [http://localhost:80](http://localhost:80)
- Backend API: [http://localhost:5000](http://localhost:5000)

### 5. Stop All Services

```bash
docker-compose down
```

---

## Troubleshooting

### Node.js Installation Issues

**Problem:** `node` or `npm` command not found

**Solution:**
1. Restart Command Prompt/PowerShell
2. If still not working, manually add Node.js to PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" under System Variables
   - Add: `C:\Program Files\nodejs\`

### PostgreSQL Connection Issues

**Problem:** `ECONNREFUSED` or database connection errors

**Solution:**
1. Verify PostgreSQL is running:
   - Open Services (search in Windows)
   - Find "postgresql-x64-15" (or your version)
   - Ensure it's "Running"
2. Check your `.env` file has the correct password
3. Try connecting manually:
   ```bash
   psql -U postgres -d cloud_file_sharing
   ```

### Redis Connection Issues

**Problem:** Redis connection refused

**Solution (WSL2):**
1. Check if Redis is running:
   ```bash
   sudo service redis-server status
   ```
2. Start if not running:
   ```bash
   sudo service redis-server start
   ```

**Solution (Memurai):**
1. Check if Memurai is running in system tray
2. Restart Memurai from Start menu

### npm install Errors

**Problem:** Errors during `npm install`

**Solution:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete `node_modules` and `package-lock.json`:
   ```bash
   rmdir /s node_modules
   del package-lock.json
   ```
3. Reinstall:
   ```bash
   npm install
   ```

### Port Already in Use

**Problem:** `EADDRINUSE` error

**Solution:**
1. Find what's using the port:
   ```bash
   netstat -ano | findstr :5000
   ```
2. Kill the process:
   ```bash
   taskkill /PID <PID_NUMBER> /F
   ```
3. Or change the port in `.env`:
   ```env
   PORT=5001
   ```

### AWS S3 Errors

**Problem:** S3 upload/download errors

**Solution:**
1. Verify AWS credentials in `.env`
2. Check bucket permissions in AWS Console
3. Ensure bucket region matches `AWS_REGION` in `.env`
4. Test AWS credentials:
   ```bash
   npm install -g aws-cli
   aws configure
   aws s3 ls
   ```

### TypeScript Build Errors

**Problem:** Build fails with TypeScript errors

**Solution:**
1. Ensure you're using the correct Node.js version (18.x or 20.x)
2. Delete `dist` folder and rebuild:
   ```bash
   rmdir /s dist
   npm run build
   ```

### Frontend Not Loading

**Problem:** Blank page or errors in browser console

**Solution:**
1. Check browser console (F12) for errors
2. Verify backend is running on port 5000
3. Check CORS settings in backend
4. Clear browser cache and reload

---

## Next Steps

Once the application is running:

1. **Create an account** on the registration page
2. **Upload files** to test the file sharing functionality
3. **Generate share links** to share files
4. **Explore the features** like file encryption, password protection, etc.

---

## Additional Resources

- **Backend README:** `backend/README.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **Quick Start Deploy:** `QUICK-START-DEPLOY.md`
- **Project README:** `README.md`

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the project's GitHub Issues
2. Review the backend logs for error messages
3. Check browser console for frontend errors
4. Ensure all environment variables are correctly set

---

**Happy coding! 🚀**
