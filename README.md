# Threads API

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture & Design](#architecture--design)
- [Technology Stack](#technology-stack)
- [Design Patterns](#design-patterns)
- [Security Implementation](#security-implementation)
- [Setup & Configuration](#setup--configuration)

---

## Project Overview

**Threads API** is a RESTful backend service built with NestJS that provides a social media platform for users to create threads and reply to them. The project exemplifies clean architecture principles and production-ready code organization.

### Key Capabilities

- User registration and JWT-based authentication
- Thread creation
- Threaded replies system
- User profiles with activity metrics
- User timeline aggregation

---

## Architecture & Design

### Clean Architecture

This project implements Clean Architecture to achieve:
- Separation of Concerns
- Technology Independence
- Testability
- Maintainability

### Why This Architecture?

#### **Domain Layer**

Contains the core business entities and rules that are technology-agnostic.

**Why**:
- Business rules are protected from external changes
- Entities encapsulate invariants (rules that must always be true)
- Domain exceptions represent business rule violations

#### **Application Layer**

Orchestrates business logic through use cases and defines interfaces (ports) for external dependencies.

**Why**:
- Use Cases represent application-specific business rules
- Ports (Interfaces) define what the application needs without caring about implementation

#### **Infrastructure Layer**

Provides concrete implementations of ports defined in the application layer.

**Why**:
- Easily swap implementations (e.g., PostgreSQL to MongoDB)

#### **Presentation Layer**

Handles HTTP communication, request/response transformation, and cross-cutting concerns.

**Why**:
- Delegate work to use cases
- Protect routes with authentication
- Centralized error handling

### Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Threads Table
CREATE TABLE threads (
  id VARCHAR(50) PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  author_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Replies Table
CREATE TABLE replies (
  id VARCHAR(50) PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  thread_id VARCHAR(50) NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  author_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Technology Stack

### Core Framework
- **NestJS**: TypeScript framework with built-in DI, modular architecture

### Database & Persistence
- **PostgreSQL**: Relational database
- **pg**: Native PostgreSQL client
- **node-pg-migrate**: Database migration tool

### Caching & Session Management
- **Redis**: In-memory data store

### Authentication & Security
- **Jose**: JWT implementation
- **Node.js Crypto (Scrypt)**: Password hashing
- **Zod**: Runtime type validation

### Development Tools
- **Jest**: Testing framework
- **ESLint + Prettier**: Code quality and formatting

---

## Design Patterns

### Repository Pattern

- Abstracts data access logic behind interfaces
- Decouples business logic from database implementation
- Makes testing easier (mock repositories)
- Allows database switching without changing business logic

### Query Service Pattern (Avoiding Fat Repositories)

- Separate interfaces for complex read operations
- Database-optimized JOINs and aggregations
- Writes enforce business rules, reads are projections

### Global Exception Filter

- Centralized error handling for all exceptions
- All errors follow same format
- Single place to log errors
- Hides internal errors from clients

---

## Security Implementation

### 1. Password Security

Scrypt algorithm with OWASP-recommended parameters

```typescript
const SCRYPT_CONFIG = {
  N: Math.pow(2, 17),  // CPU/memory cost: 131,072 (OWASP minimum: 2^15)
  r: 8,                // Block size: 8 (OWASP recommended)
  p: 1,                // Parallelization: 1 (OWASP recommended)
  keylen: 64,          // Output length: 64 bytes
  maxmem: 128 * N * r + 1024 * 1024  // Required memory calculation
};
```

**Why Scrypt**:
- No external dependencies
- Recommended by OWASP alongside Argon2id

**Reference**: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

### 2. JWT Token Management

- Access tokens with configurable expiration
- Token blacklisting on logout (Uses Redis for fast lookups with TTL

### 3. Zod Validation

- Catches invalid input before it reaches business logic
- Infers TypeScript types from schemas
- Detailed validation feedback

### 4. Request Logging & Auditing

- Request ID for tracing
- Start/end logging with duration
- Trace request flow
- Track slow requests

---

## Setup & Configuration

### Prerequisites
- Node.js
- PostgreSQL
- Redis

### Environment Variables

Create `.env` file:

```bash
# Application
APP_PORT=3000

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Security
PASSWORD_HASH_SALT=secret-salt-min-20-chars
JWT_ACCESS_TOKEN_SECRET=jwt-secret-min-20-chars
JWT_ACCESS_TOKEN_EXP_TIME=2h
```

### Installation

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm run migrate up

# Optional: Seed database
pnpm run seed
```

### Running the Application

```bash
# Development (watch mode)
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```
