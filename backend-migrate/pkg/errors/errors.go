package errors

import (
	"fmt"
	"net/http"
)

// ErrorType represents the type of error
type ErrorType string

const (
	// Error types
	ErrorTypeValidation   ErrorType = "VALIDATION_ERROR"
	ErrorTypeNotFound     ErrorType = "NOT_FOUND"
	ErrorTypeUnauthorized ErrorType = "UNAUTHORIZED"
	ErrorTypeForbidden    ErrorType = "FORBIDDEN"
	ErrorTypeInternal     ErrorType = "INTERNAL_ERROR"
	ErrorTypeTimeout      ErrorType = "TIMEOUT_ERROR"
	ErrorTypeBadRequest   ErrorType = "BAD_REQUEST"
	ErrorTypeConflict     ErrorType = "CONFLICT"
	ErrorTypeTooManyRequests ErrorType = "TOO_MANY_REQUESTS"
	ErrorTypeInvalidArgument ErrorType = "INVALID_ARGUMENT"
	ErrorTypeFailedPrecondition ErrorType = "FAILED_PRECONDITION"
	ErrorTypeOutOfRange    ErrorType = "OUT_OF_RANGE"
	ErrorTypeUnimplemented ErrorType = "UNIMPLEMENTED"
	ErrorTypeUnavailable   ErrorType = "UNAVAILABLE"
	ErrorTypeDataLoss      ErrorType = "DATA_LOSS"
)

// AppError represents an application error
type AppError struct {
	Type      ErrorType `json:"type"`
	Message   string    `json:"message"`
	Code      int       `json:"code"`
	Original  error     `json:"-"`
	Context   any       `json:"context,omitempty"`
}

func (e *AppError) Error() string {
	if e.Original != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Original)
	}
	return e.Message
}

// Error constructors
func NewValidationError(message string, err error) *AppError {
	return &AppError{
		Type:     ErrorTypeValidation,
		Message:  message,
		Code:     http.StatusBadRequest,
		Original: err,
	}
}

func NewNotFoundError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeNotFound,
		Message: message,
		Code:    http.StatusNotFound,
	}
}

func NewUnauthorizedError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeUnauthorized,
		Message: message,
		Code:    http.StatusUnauthorized,
	}
}

func NewForbiddenError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeForbidden,
		Message: message,
		Code:    http.StatusForbidden,
	}
}

func NewInternalError(message string, err error) *AppError {
	return &AppError{
		Type:     ErrorTypeInternal,
		Message:  message,
		Code:     http.StatusInternalServerError,
		Original: err,
	}
}

func NewTimeoutError(message string, err error) *AppError {
	return &AppError{
		Type:     ErrorTypeTimeout,
		Message:  message,
		Code:     http.StatusGatewayTimeout,
		Original: err,
	}
}

func NewBadRequestError(message string, err error) *AppError {
	return &AppError{
		Type:     ErrorTypeBadRequest,
		Message:  message,
		Code:     http.StatusBadRequest,
		Original: err,
	}
}

// IsAppError checks if an error is an AppError
func IsAppError(err error) (*AppError, bool) {
	appErr, ok := err.(*AppError)
	return appErr, ok
}

// WithContext adds context to an AppError
func (e *AppError) WithContext(ctx any) *AppError {
	e.Context = ctx
	return e
}