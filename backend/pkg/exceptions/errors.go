package exceptions

import (
	"fmt"
	"time"
)

type ErrorCode string

const (
	// Common Errors
	ErrBadRequest          ErrorCode = "BAD_REQUEST"
	ErrNotFound            ErrorCode = "NOT_FOUND"
	ErrInternalServerError ErrorCode = "INTERNAL_SERVER_ERROR"
	ErrUnauthorized        ErrorCode = "UNAUTHORIZED"
	ErrForbidden           ErrorCode = "FORBIDDEN"
	ErrConflict            ErrorCode = "CONFLICT"
	ErrTooManyRequests     ErrorCode = "TOO_MANY_REQUESTS"

	// Generic Errors
	ErrInvalidArgument    ErrorCode = "INVALID_ARGUMENT"
	ErrFailedPrecondition ErrorCode = "FAILED_PRECONDITION"

	// System Errors
	ErrOutOfRange    ErrorCode = "OUT_OF_RANGE"
	ErrUnimplemented ErrorCode = "UNIMPLEMENTED"
	ErrUnavailable   ErrorCode = "UNAVAILABLE"
	ErrDataLoss      ErrorCode = "DATA_LOSS"

	// User-related errors
	ErrAlreadyExists    ErrorCode = "ALREADY_EXISTS"
	ErrDuplicateKey     ErrorCode = "DUPLICATE_KEY"
	ErrInvalidID        ErrorCode = "INVALID_ID"
	ErrUserExists       ErrorCode = "USER_EXISTS"
	ErrInvalidPassword  ErrorCode = "INVALID_PASSWORD"
	ErrRoleExists       ErrorCode = "ROLE_EXISTS"
	ErrPermissionExists ErrorCode = "PERMISSION_EXISTS"
)

type (
	// AppError is the basic error type
	AppError struct {
		Code      ErrorCode            `json:"code"`
		Message   string               `json:"message"`
		Timestamp string               `json:"timestamp"`
		RequestID string               `json:"request_id,omitempty"`
		Err       error                `json:"-"`
		Context   map[string]interface{} `json:"context,omitempty"`
	}
	
	// ErrorOption is a function that configures an AppError
	ErrorOption func(*AppError)
)

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err == nil {
		return fmt.Sprintf("%s: %s", e.Code, e.Message)
	}
	return fmt.Sprintf("%s: %s - %s", e.Code, e.Message, e.Err.Error())
}

// WithRequestID adds a request ID to the error
func WithRequestID(requestID string) ErrorOption {
	return func(e *AppError) {
		e.RequestID = requestID
	}
}

// WithContext adds contextual information to the error
func WithContext(ctx map[string]interface{}) ErrorOption {
	return func(e *AppError) {
		if e.Context == nil {
			e.Context = make(map[string]interface{})
		}
		for k, v := range ctx {
			e.Context[k] = v
		}
	}
}

// WithOperation adds an operation name to the error context
func WithOperation(operation string) ErrorOption {
	return func(e *AppError) {
		if e.Context == nil {
			e.Context = make(map[string]interface{})
		}
		e.Context["operation"] = operation
	}
}

// WithEntity adds entity information to the error context
func WithEntity(entityType, entityID string) ErrorOption {
	return func(e *AppError) {
		if e.Context == nil {
			e.Context = make(map[string]interface{})
		}
		e.Context["entity_type"] = entityType
		e.Context["entity_id"] = entityID
	}
}

// NewAppError creates a new AppError with options
func NewAppError(code ErrorCode, message string, err error, opts ...ErrorOption) *AppError {
	appErr := &AppError{
		Code:      code,
		Message:   message,
		Err:       err,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Context:   make(map[string]interface{}),
	}
	
	for _, opt := range opts {
		opt(appErr)
	}
	
	return appErr
}

// NotFound creates a standardized "not found" error
func NotFound(entity string, id interface{}, err error, opts ...ErrorOption) *AppError {
	message := fmt.Sprintf("%s with ID %v not found", entity, id)
	defaultOpts := []ErrorOption{
		WithEntity(entity, fmt.Sprintf("%v", id)),
		WithOperation("find"),
	}
	
	// Combine default options with provided options
	options := append(defaultOpts, opts...)
	
	return NewAppError(ErrNotFound, message, err, options...)
}

// AlreadyExists creates a standardized "already exists" error
func AlreadyExists(entity string, identifier string, value interface{}, err error, opts ...ErrorOption) *AppError {
	message := fmt.Sprintf("%s with %s '%v' already exists", entity, identifier, value)
	defaultOpts := []ErrorOption{
		WithEntity(entity, fmt.Sprintf("%v", value)),
		WithOperation("create"),
		WithContext(map[string]interface{}{
			"identifier": identifier,
			"value":     value,
		}),
	}
	
	// Combine default options with provided options
	options := append(defaultOpts, opts...)
	
	return NewAppError(ErrConflict, message, err, options...)
}

// InvalidInput creates a standardized "invalid input" error
func InvalidInput(message string, err error, opts ...ErrorOption) *AppError {
	defaultOpts := []ErrorOption{
		WithOperation("validate"),
	}
	
	// Combine default options with provided options
	options := append(defaultOpts, opts...)
	
	return NewAppError(ErrBadRequest, message, err, options...)
}

// Internal creates a standardized "internal server error"
func Internal(message string, err error, opts ...ErrorOption) *AppError {
	defaultOpts := []ErrorOption{
		WithOperation("internal"),
	}
	
	// Combine default options with provided options
	options := append(defaultOpts, opts...)
	
	return NewAppError(ErrInternalServerError, message, err, options...)
}

// Unauthorized creates a standardized "unauthorized" error
func Unauthorized(message string, err error, opts ...ErrorOption) *AppError {
	defaultOpts := []ErrorOption{
		WithOperation("authorize"),
	}
	
	// Combine default options with provided options
	options := append(defaultOpts, opts...)
	
	return NewAppError(ErrUnauthorized, message, err, options...)
}

// Forbidden creates a standardized "forbidden" error
func Forbidden(message string, err error, opts ...ErrorOption) *AppError {
	defaultOpts := []ErrorOption{
		WithOperation("authorize"),
	}
	
	// Combine default options with provided options
	options := append(defaultOpts, opts...)
	
	return NewAppError(ErrForbidden, message, err, options...)
}

// IsNotFound checks if an error is a "not found" error
func IsNotFound(err error) bool {
	appErr, ok := err.(*AppError)
	return ok && appErr.Code == ErrNotFound
}

// IsAlreadyExists checks if an error is an "already exists" error
func IsAlreadyExists(err error) bool {
	appErr, ok := err.(*AppError)
	return ok && (appErr.Code == ErrAlreadyExists || appErr.Code == ErrConflict)
}

// IsInvalidInput checks if an error is an "invalid input" error
func IsInvalidInput(err error) bool {
	appErr, ok := err.(*AppError)
	return ok && appErr.Code == ErrBadRequest
}

// IsUnauthorized checks if an error is an "unauthorized" error
func IsUnauthorized(err error) bool {
	appErr, ok := err.(*AppError)
	return ok && appErr.Code == ErrUnauthorized
}

// IsForbidden checks if an error is a "forbidden" error
func IsForbidden(err error) bool {
	appErr, ok := err.(*AppError)
	return ok && appErr.Code == ErrForbidden
}

// FromError converts any error to an AppError
func FromError(err error) *AppError {
	if err == nil {
		return nil
	}
	
	// If it's already an AppError, return it
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}
	
	// Otherwise, wrap it in an AppError
	return Internal("An unexpected error occurred", err)
}
