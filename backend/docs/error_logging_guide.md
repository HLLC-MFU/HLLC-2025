# Error Handling and Structured Logging Guide

This guide explains how to use the enhanced error handling and structured logging system in the HLLC-2025 backend codebase.

## Table of Contents

1. [Error Handling](#error-handling)
   - [Creating Errors](#creating-errors)
   - [Error Types](#error-types)
   - [Adding Context to Errors](#adding-context)
   - [Checking Error Types](#checking-error-types)
2. [Structured Logging](#structured-logging)
   - [Logger Initialization](#logger-initialization)
   - [Context-Aware Logging](#context-aware-logging)
   - [Log Levels](#log-levels)
   - [Adding Fields to Logs](#adding-fields)
3. [Best Practices](#best-practices)
   - [Repository Layer](#repository-layer)
   - [Service Layer](#service-layer)
   - [Handler Layer](#handler-layer)
   - [Error Propagation](#error-propagation)
4. [Decorator Usage](#decorator-usage)
   - [Timeout Handling](#timeout-handling)
   - [Combining with Logging](#combining-with-logging)

## Error Handling

The `exceptions` package provides a standardized way to create, handle, and check errors throughout the application.

### Creating Errors

Instead of using the standard `errors.New()` or `fmt.Errorf()`, use the specialized error creation functions:

```go
// Generic error creation
err := exceptions.NewAppError(
    exceptions.ErrNotFound,
    "user not found",
    originalError,
    exceptions.WithRequestID(requestID),
)

// Specialized error creation
err := exceptions.NotFound("user", userID, originalError)
err := exceptions.AlreadyExists("user", "username", username, originalError)
err := exceptions.Internal("database connection failed", originalError)
err := exceptions.InvalidInput("username is required", nil)
```

### Error Types

The system provides standard error types:

```go
exceptions.ErrBadRequest          // 400 Bad Request
exceptions.ErrNotFound            // 404 Not Found
exceptions.ErrInternalServerError // 500 Internal Server Error
exceptions.ErrUnauthorized        // 401 Unauthorized
exceptions.ErrForbidden           // 403 Forbidden
exceptions.ErrConflict            // 409 Conflict
// ...and more
```

### Adding Context to Errors

Use error options to add context:

```go
exceptions.NotFound(
    "user", 
    id, 
    originalError,
    exceptions.WithRequestID(requestID),
    exceptions.WithOperation("find"),
    exceptions.WithContext(map[string]interface{}{
        "source": "database",
        "query_time": 235,
    }),
)
```

### Checking Error Types

Use the helper functions to check for specific error types:

```go
if exceptions.IsNotFound(err) {
    // Handle not found case
} else if exceptions.IsAlreadyExists(err) {
    // Handle already exists case
}
```

## Structured Logging

The `logging` package provides structured logging capabilities.

### Logger Initialization

Initialize the logger in your application's main entry point:

```go
// Init with development configuration (pretty console output)
logging.Init(logging.InfoLevel, true)

// Init with production configuration (JSON output)
logging.Init(logging.InfoLevel, false)
```

### Context-Aware Logging

Create a logger with request context:

```go
logger := logging.DefaultLogger.WithContext(ctx)

// Log with the context-aware logger
logger.Info("Processing request",
    logging.FieldOperation, "process_payment",
    logging.FieldEntity, "payment",
    "amount", paymentAmount,
)
```

### Log Levels

The logger supports different levels:

```go
logger.Debug("Detailed information for debugging")
logger.Info("Standard operational information")
logger.Warn("Warning that doesn't affect operation")
logger.Error("Error that affects operation", err)
logger.Fatal("Critical error that stops operation", err)
```

### Adding Fields to Logs

Add structured fields to provide context:

```go
logger.Info("User created",
    logging.FieldOperation, "create_user",
    logging.FieldEntity, "user",
    logging.FieldEntityID, user.ID,
    "username", user.Username,
    "email", user.Email,
)
```

## Best Practices

### Repository Layer

In repository methods:

1. Use `decorator.WithTimeout` for all database operations
2. Always return `AppError` types, not raw errors
3. Include entity information in errors
4. Log the start and completion of operations

Example:

```go
func (r *repository) FindByID(ctx context.Context, id string) (*Entity, error) {
    return decorator.WithTimeout[*Entity](5 * time.Second)(func(ctx context.Context) (*Entity, error) {
        logger := logging.DefaultLogger.WithContext(ctx)
        logger.Info("Finding entity", 
            logging.FieldOperation, "find_entity",
            logging.FieldEntityID, id,
        )
        
        // Database operation...
        if notFound {
            return nil, exceptions.NotFound("entity", id, err)
        }
        
        return entity, nil
    })(ctx)
}
```

### Service Layer

In service methods:

1. Propagate context from handlers
2. Add business logic context to errors
3. Don't log the same error at multiple layers

Example:

```go
func (s *service) ProcessEntity(ctx context.Context, req *dto.Request) (*dto.Response, error) {
    entity, err := s.repository.FindByID(ctx, req.ID)
    if err != nil {
        // Add high-level context but don't duplicate logging
        if exceptions.IsNotFound(err) {
            return nil, exceptions.NotFound(
                "entity", req.ID, err,
                exceptions.WithContext(map[string]interface{}{
                    "request_source": req.Source,
                }),
            )
        }
        return nil, err
    }
    
    // Business logic...
    
    return response, nil
}
```

### Handler Layer

In handlers:

1. Use the `exceptions.HandleError` function to return standardized errors
2. Add request-specific information to the context
3. Don't duplicate error logging

Example:

```go
func (h *handler) GetEntity(c *fiber.Ctx) error {
    // Add request ID to context
    ctx := context.WithValue(c.Context(), logging.FieldRequestID, c.Get("X-Request-ID"))
    
    id := c.Params("id")
    entity, err := h.service.GetEntity(ctx, id)
    if err != nil {
        // Let the error handler format the response
        return exceptions.HandleError(c, err)
    }
    
    return c.JSON(entity)
}
```

### Error Propagation

1. Add context to errors at each layer but don't create new errors unnecessarily
2. Only log errors at the layer where they originate
3. Use the error checking functions instead of type assertions

## Decorator Usage

### Timeout Handling

Always use the timeout decorator for operations that might block:

```go
result, err := decorator.WithTimeout[ResultType](5 * time.Second)(func(ctx context.Context) (ResultType, error) {
    // Operation that might take time
    return result, err
})(ctx)
```

### Combining with Logging

For operations that need both timeout and logging:

```go
func (r *repository) ExampleOperation(ctx context.Context, params Params) (*Result, error) {
    logger := logging.DefaultLogger.WithContext(ctx)
    
    result, err := decorator.WithTimeout[*Result](5 * time.Second)(func(ctx context.Context) (*Result, error) {
        // Log operation start
        logger.Info("Starting operation",
            logging.FieldOperation, "example_operation",
            "params", params,
        )
        
        start := time.Now()
        
        // Execute operation...
        
        // Log completion
        logger.Info("Operation completed",
            logging.FieldOperation, "example_operation",
            logging.FieldDuration, time.Since(start).Milliseconds(),
        )
        
        return result, nil
    })(ctx)
    
    return result, err
}
``` 