package errors

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

// FiberStatus maps the ErrorCode to the corresponding Fiber status code
func FiberStatus(code ErrorType) int {
	switch code {

	// Common Errors
	case ErrorTypeBadRequest:
		return fiber.StatusBadRequest
	case ErrorTypeNotFound:
		return fiber.StatusNotFound
	case ErrorTypeInternal:
		return fiber.StatusInternalServerError
	case ErrorTypeUnauthorized:
		return fiber.StatusUnauthorized
	case ErrorTypeForbidden:
		return fiber.StatusForbidden
	case ErrorTypeConflict:
		return fiber.StatusConflict
	case ErrorTypeTooManyRequests:
		return fiber.StatusTooManyRequests
	case ErrorTypeInvalidArgument:
		return fiber.StatusBadRequest
	case ErrorTypeFailedPrecondition:
		return fiber.StatusFailedDependency
	case ErrorTypeOutOfRange:
		return fiber.StatusRequestedRangeNotSatisfiable
	case ErrorTypeUnimplemented:
		return fiber.StatusNotImplemented
	case ErrorTypeUnavailable:
		return fiber.StatusServiceUnavailable
	case ErrorTypeDataLoss:
		return fiber.StatusInternalServerError

		// Default error
	default:
		return fiber.StatusInternalServerError
	}
}

// HandleError converts an error to a Fiber response
func HandleError(c *fiber.Ctx, err error) error {
	if err == nil {
		return nil
	}

	// Convert to AppError if it's not already
	var appErr *AppError
	if e, ok := err.(*AppError); ok {
		appErr = e
	} else {
		appErr = NewInternalError("An unexpected error occurred", err)
	}

	// Get the HTTP status code
	status := FiberStatus(appErr.Type)

	// Add request ID from context if available
	// if requestID := c.Locals("request_id"); requestID != nil && appErr.RequestID == "" {
	// 	appErr.RequestID = requestID.(string)
	// }

	// Create response
	response := fiber.Map{
		"status":    false,
		"error":     appErr.Message,
		"code":      appErr.Code,
		"timestamp": time.Now(),
	}

	// Add request ID if available
	// if appErr.RequestID != "" {
	// 	response["request_id"] = appErr.RequestID
	// }

	// Add context if available
	// if appErr.Context != nil && len(appErr.Context) > 0 {
	// 	response["context"] = appErr.Context
	// }

	return c.Status(status).JSON(response)
}

// ToFiberError converts an AppError to a Fiber error response
func ToFiberError(err *AppError) fiber.Map {
	if err == nil {
		return fiber.Map{
			"status": true,
		}
	}

	response := fiber.Map{
		"status":    false,
		"error":     err.Message,
		"code":      err.Code,
		"timestamp": time.Now(),
	}

	// Add request ID if available
	// if err.RequestID != "" {
	// 	response["request_id"] = err.RequestID
	// }

	// Add context if available
	// if err.Context != nil && len(err.Context) > 0 {
	// 	response["context"] = err.Context
	// }

	return response
}

// ErrorResponse represents the structure of error responses
type ErrorResponse struct {
	Success bool        `json:"success"`
	Error   *AppError   `json:"error"`
	Data    interface{} `json:"data,omitempty"`
}

// MapError maps an error to an HTTP response
func MapError(c *fiber.Ctx, err error) error {
	if appErr, ok := IsAppError(err); ok {
		return c.Status(appErr.Code).JSON(ErrorResponse{
			Success: false,
			Error:   appErr,
		})
	}

	internalError := NewInternalError("An unexpected error occurred", err)
	return c.Status(internalError.Code).JSON(ErrorResponse{
		Success: false,
		Error:   internalError,
	})
}