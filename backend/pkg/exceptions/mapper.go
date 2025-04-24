package exceptions

import "github.com/gofiber/fiber/v2"

// FiberStatus maps the ErrorCode to the corresponding Fiber status code
func FiberStatus(code ErrorCode) int {
	switch code {

	// Common Errors
	case ErrBadRequest:
		return fiber.StatusBadRequest
	case ErrNotFound:
		return fiber.StatusNotFound
	case ErrInternalServerError:
		return fiber.StatusInternalServerError
	case ErrUnauthorized:
		return fiber.StatusUnauthorized
	case ErrForbidden:
		return fiber.StatusForbidden
	case ErrConflict:
		return fiber.StatusConflict
	case ErrTooManyRequests:
		return fiber.StatusTooManyRequests
	case ErrInvalidArgument:
		return fiber.StatusBadRequest
	case ErrFailedPrecondition:
		return fiber.StatusFailedDependency
	case ErrOutOfRange:
		return fiber.StatusRequestedRangeNotSatisfiable
	case ErrUnimplemented:
		return fiber.StatusNotImplemented
	case ErrUnavailable:
		return fiber.StatusServiceUnavailable
	case ErrDataLoss:
		return fiber.StatusInternalServerError

		// User-related errors
	case ErrDuplicateKey:
		return fiber.StatusConflict
	case ErrInvalidID:
		return fiber.StatusBadRequest
	case ErrUserExists:
		return fiber.StatusConflict
	case ErrInvalidPassword:
		return fiber.StatusUnauthorized
	case ErrRoleExists:
		return fiber.StatusConflict
	case ErrPermissionExists:
		return fiber.StatusConflict
	case ErrAlreadyExists:
		return fiber.StatusConflict

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
		appErr = FromError(err)
	}

	// Get the HTTP status code
	status := FiberStatus(appErr.Code)

	// Add request ID from context if available
	if requestID := c.Locals("request_id"); requestID != nil && appErr.RequestID == "" {
		appErr.RequestID = requestID.(string)
	}

	// Create response
	response := fiber.Map{
		"status":    false,
		"error":     appErr.Message,
		"code":      appErr.Code,
		"timestamp": appErr.Timestamp,
	}

	// Add request ID if available
	if appErr.RequestID != "" {
		response["request_id"] = appErr.RequestID
	}

	// Add context if available
	if appErr.Context != nil && len(appErr.Context) > 0 {
		response["context"] = appErr.Context
	}

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
		"timestamp": err.Timestamp,
	}

	// Add request ID if available
	if err.RequestID != "" {
		response["request_id"] = err.RequestID
	}

	// Add context if available
	if err.Context != nil && len(err.Context) > 0 {
		response["context"] = err.Context
	}

	return response
}
