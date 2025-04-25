# HLLC-2025 Backend

This is the backend component of the HLLC-2025 project, built with Go and following clean architecture principles.

## Services Overview

The backend is composed of several microservices:

1. **User Service**: Manages user accounts, roles, and permissions
2. **Auth Service**: Handles authentication, sessions, and tokens
3. **Major Service**: Manages majors/departments

## Technology Stack

- **Language**: Go 1.24.1
- **Web Framework**: Fiber
- **Internal Communication**: gRPC
- **Database**: MongoDB
- **Caching**: Redis

## Getting Started

### Prerequisites

- Go 1.24.1 or newer
- MongoDB
- Redis

### Setup and Running

1. Clone the repository
2. Navigate to the backend directory: `cd backend`
3. Set up environment variables:
   - Copy the example environment file: `cp env/example/.env env/dev/.env`
   - Edit `env/dev/.env` to match your configuration
4. Run the application:
   - Monolithic mode: `go run main.go api`
   - Run a specific service: `go run main.go <service-name>`

### Environment Configuration

The application relies on environment variables configured in `.env` files. See `config/config.go` for details on the required variables.

## Code Structure

The codebase follows clean architecture principles:

```
backend/
├── config/             # Configuration structures and loaders
├── env/                # Environment variable files
├── module/             # Service modules
│   ├── auth/           # Authentication service 
│   ├── user/           # User management service
│   └── major/          # Major/department service
├── pkg/                # Shared packages
│   ├── core/           # Core functionality
│   ├── decorator/      # Function decorators
│   ├── exceptions/     # Error handling
│   ├── logging/        # Structured logging
│   ├── middleware/     # HTTP middleware
│   ├── migration/      # Database migrations
│   └── proto/          # Shared protocol buffers
├── scripts/            # Utility scripts
└── server/             # Server initialization
```

## Common Issues and Troubleshooting

### Login Issues

If you're experiencing login problems (500 errors when trying to login), it's likely due to issues with the refresh token storage. This can happen due to MongoDB _id field immutability constraints.

To fix this:

1. Stop the application if it's running
2. Run the auth token cleanup script:
   ```
   go run scripts/cleanup_auth_tokens.go
   ```
3. Start the application again:
   ```
   go run main.go api
   ```

The script removes all stored refresh tokens, allowing new ones to be properly created when users log in.

### Migration Issues

If you need to reset the database or fix user activation issues:

```
go run main.go migrate
```

This will run database migrations, including creating admin users and resetting their passwords.

## Developer Guidelines

### Code Conventions

1. **HTTP Handler Pattern**: All HTTP handlers should follow the decorator pattern:
   ```go
   func (h *httpHandler) HandleRequest(c *fiber.Ctx) error {
     handler := decorator.ComposeDecorators(
       decorator.WithRecovery(),
       decorator.WithLogging,
     )(decorator.WithJSONValidation[dto.Request](
       func(c *fiber.Ctx, req *dto.Request) error {
         // Handler implementation
       }))
     return handler(c)
   }
   ```

2. **Error Handling**: Always use the `exceptions` package for errors:
   ```go
   return exceptions.NotFound("entity", id, err)
   ```

3. **Logging**: Use structured logging with context:
   ```go
   logger := logging.DefaultLogger.WithContext(ctx)
   logger.Info("Operation completed", 
     logging.FieldOperation, "operation_name",
     logging.FieldEntity, "entity_type",
   )
   ```

4. **Context**: Always pass context through all layers for proper cancellation and timeout.

## API Documentation

API documentation can be accessed at `/api/docs` when the application is running. 