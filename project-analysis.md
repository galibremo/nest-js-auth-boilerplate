# Backend Project Analysis (NestJS)

Based on the review of the `nest-boilerplate` codebase, here are the details of the project, the patterns followed, its structure, and features. 

**Overall Health Check**: Everything looks excellent. The project follows standard, robust practices for enterprise Node.js applications. It's built with modern tools, enforces strict validation, and is highly modular, making it very scalable.

## 1. Project Overview & Technologies
The backend is a robust API server built with **NestJS**. It is well-configured for a scalable, production-ready environment.

* **Core Framework:** NestJS (v11)
* **Database & ORM:** PostgreSQL with Drizzle ORM
* **Authentication:** `better-auth` (with Drizzle adapter) via `@thallesp/nestjs-better-auth`
* **Validation:** Zod (for environment variables and DTOs)
* **Logging:** Pino (with `pino-http` and `pino-pretty`)
* **Storage/Media:** Cloudinary & sharp
* **Other Tools:** Email SDK (`@opencoredev/email-sdk`), Throttler for rate limiting.

## 2. Architectural Patterns Followed
* **Modular Architecture:** The codebase is split into independent modules. This separation of concerns means you can plug/unplug features easily.
* **Domain-Driven Directory Structure:** The `src` directory is divided into `core` (infrastructure/cross-cutting concerns) and `modules` (business domain features).
* **DTO & Strict Validation Pattern:** Inputs/Outputs are strongly typed and validated at runtime using Zod via custom pipes (`ZodValidationPipe`), ensuring only valid data reaches the controllers.
* **Factory & Repository Patterns:** Abstracting database interactions (`AuthRepository`) and external library instantiations (`createAuth` factory) for better testability and cleaner code.

## 3. Directory Structure
```
nest-boilerplate/
├── src/
│   ├── core/              # Global infrastructure and cross-cutting concerns
│   │   ├── crypto/        # Cryptography utilities
│   │   ├── database/      # Database connection & Drizzle schemas
│   │   ├── errors/        # Domain error definitions and custom error classes
│   │   ├── logging/       # Pino logger configuration
│   │   ├── storage/       # Cloudinary/S3 storage services
│   │   └── validators/    # Environment and common validations
│   ├── modules/           # Domain-specific business logic
│   │   ├── auth/          # Authentication, registration, password management
│   │   ├── email-logs/    # Tracking email delivery logs
│   │   ├── email-provider/# Email sending infrastructure
│   │   ├── email-template/# Email templates logic
│   │   ├── media/         # File and image upload management
│   │   ├── sessions/      # User session management
│   │   └── users/         # User profile and data management
│   ├── shared/            # Shared utilities (filters, pipes, helpers)
│   ├── app.module.ts      # Root application module
│   └── main.ts            # Application entry point
```

## 4. Features Breakdown
* **Authentication & Authorization:** 
  * Comprehensive auth controller supporting: Registration, Login, Google OAuth, Magic Links, Logout.
  * Session retrieval, password setting/changing.
  * Profile updates and avatar image uploads (handled via `multer` and Cloudinary).
* **Security:** 
  * Rate limiting (`ThrottlerGuard`) configured with short and long TTLs.
  * Configured CORS with allowed origins strictly checked against environment variables.
* **Database Management:** 
  * Drizzle ORM setup with scripts for migrations, pushing, generating, and seeding the database.
* **Error Handling & Logging:** 
  * Global exception filters (`GlobalExceptionFilter`) ensure consistent API error responses.
  * Structured logging using Pino for both application events and HTTP requests.
* **Email System:** 
  * Custom modules for providing, templating, and logging emails using `@opencoredev/email-sdk`.
