# Linnk Global Solutions - Onboarding Portal

A secure, high-performance web application designed for enterprise HR teams and candidates to streamline the onboarding lifecycle. Built with a modern monolithic architecture, it offers passwordless magic-link access for candidates and a robust, fully-audited dashboard for HR administrators.

## Features

*   **Candidate Portal:** Secure, passwordless entry via email magic links with OTP verification.
*   **HR & Manager Dashboard:** Centralized workspace for tracking applicant pipelines, reviewing documents, and issuing offers.
*   **Document Management:** Secure upload, cryptographic tracking, and AWS S3-backed storage for sensitive identity and compliance artifacts.
*   **Offer Lifecycle:** Dynamic, schema-less metadata extraction from PDF templates with simulated digital signature generation.
*   **Real-time Notifications:** Event-driven architecture powering automated transactional emails and system audit logs.

## Tech Stack

**Frontend**
*   **Framework:** Next.js 15 (App Router)
*   **Styling:** Tailwind CSS, Framer Motion
*   **Icons:** Lucide React

**Backend**
*   **Framework:** NestJS
*   **Database:** PostgreSQL (with TypeORM)
*   **Storage:** AWS S3
*   **Email:** Resend
*   **Event Engine:** `@nestjs/event-emitter`

## Architecture overview

The application uses an event-driven monolithic architecture to handle the complexities of the onboarding process while remaining easy to deploy and maintain. The backend utilizes a modular NestJS structure separating `Auth`, `HR`, `Uploads`, `Expiry`, and `Notifications` domains. The frontend is built with React Server Components in Next.js, featuring a highly-polished, brand-aligned visual design system.

## Setup & Local Development

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- AWS S3 Bucket (or compatible object storage)
- Resend API Key

### 2. Backend Configuration
Navigate to the `backend` directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following structure:
```env
# Application Core
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=linnk_db
DB_SYNC=true

# Security (JWT & Magic Links)
JWT_SECRET=super_secret_key_change_in_production
MAGIC_LINK_SECRET=another_super_secret_key

# AWS S3 Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# Email Notifications (Resend)
RESEND_API_KEY=re_your_resend_key
```

Start the backend development server:
```bash
npm run start:dev
```

### 3. Frontend Configuration
Navigate to the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start the frontend development server:
```bash
npm run dev
```

## Production Deployment

### Building the Project
Both the frontend and backend require a build step before deployment.

**Backend Build:**
```bash
cd backend
npm run build
# Start production server
npm run start:prod
```
*Note: Ensure `DB_SYNC` is set to `false` in production to prevent unintended database schema modifications.*

**Frontend Build:**
```bash
cd frontend
npm run build
# Start Next.js production server
npm run start
```

### Important Production Considerations
- **Logging:** The backend utilizes the standard non-blocking NestJS logger. In production environments, consider piping standard output to a log aggregation service (e.g., Datadog, CloudWatch).
- **Environment Variables:** Never commit `.env` or `.env.local` files to source control. They are explicitly ignored in `.gitignore`.
- **CORS:** Ensure `ALLOWED_ORIGINS` in the backend `.env` is updated to reflect your actual frontend production domains.
