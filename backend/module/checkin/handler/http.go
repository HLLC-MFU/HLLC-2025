package handler

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/service"
	reqBinding "github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	respHelper "github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/gofiber/fiber/v2"
)

// HTTPHandler is the HTTP handler for the checkin service
type HTTPHandler interface {
	RegisterPublicRoutes(router fiber.Router)
	RegisterProtectedRoutes(router fiber.Router)
	RegisterAdminRoutes(router fiber.Router)
}

// httpHandler implements HTTPHandler
type httpHandler struct {
	cfg        *config.Config
	checkInSvc service.CheckInService
}

// NewHTTPHandler creates a new httpHandler
func NewHTTPHandler(
	cfg *config.Config,
	checkInSvc service.CheckInService,
) HTTPHandler {
	return &httpHandler{
		cfg:        cfg,
		checkInSvc: checkInSvc,
	}
}

// RegisterPublicRoutes registers routes accessible by all users
func (h *httpHandler) RegisterPublicRoutes(router fiber.Router) {
	// No public routes for now
}

// RegisterProtectedRoutes registers routes accessible by authenticated users
func (h *httpHandler) RegisterProtectedRoutes(router fiber.Router) {
	router.Get("/checkins/by-activity/:activityID", h.GetCheckInsByActivityID)
	router.Get("/checkins/by-user/:userID", h.GetCheckInsByUser)
	router.Get("/checkins/:id", h.GetCheckInByID)
	router.Get("/activity/:activityID/user/:userID/status", h.GetUserActivityStatus)
}

// RegisterAdminRoutes registers routes accessible only by admins
func (h *httpHandler) RegisterAdminRoutes(router fiber.Router) {
	router.Post("/checkins", h.CreateCheckIn)
	router.Post("/checkins/bulk", h.BulkCheckIn)
	router.Delete("/checkins/:id", h.DeleteCheckIn)
	router.Get("/checkins", h.GetAllCheckIns)
	router.Get("/activity/:activityID/stats", h.GetActivityStats)
}

// CreateCheckIn handles the creation of a new check-in
func (h *httpHandler) CreateCheckIn(c *fiber.Ctx) error {
	wrapper := reqBinding.NewContextWrapper(c)
	var req dto.CreateCheckInRequest
	
	if err := wrapper.Bind(&req); err != nil {
		log.Printf("Error binding request: %v", err)
		return respHelper.Error(c, fiber.StatusBadRequest, "Invalid request data: " + err.Error())
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Create check-in
	checkIn, err := h.checkInSvc.CreateCheckIn(ctx, &req)
	if err != nil {
		log.Printf("Error creating check-in: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrUserNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "User not found")
		case service.ErrActivityNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		case service.ErrDuplicateCheckIn:
			return respHelper.Error(c, fiber.StatusConflict, "User already checked in to this activity")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to create check-in: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusCreated, checkIn)
}

// GetCheckInByID handles retrieving a check-in by ID
func (h *httpHandler) GetCheckInByID(c *fiber.Ctx) error {
	// Get ID from URL parameters
	id := c.Params("id")
	if id == "" {
		return respHelper.Error(c, fiber.StatusBadRequest, "Missing check-in ID")
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Get check-in
	checkIn, err := h.checkInSvc.GetCheckInByID(ctx, id)
	if err != nil {
		log.Printf("Error retrieving check-in: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "Check-in not found")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to get check-in: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusOK, checkIn)
}

// GetCheckInsByUser handles retrieving all check-ins for a user
func (h *httpHandler) GetCheckInsByUser(c *fiber.Ctx) error {
	// Get user ID from URL parameters
	userID := c.Params("userID")
	if userID == "" {
		return respHelper.Error(c, fiber.StatusBadRequest, "Missing user ID")
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Get check-ins
	checkIns, err := h.checkInSvc.GetCheckInsByUserID(ctx, userID)
	if err != nil {
		log.Printf("Error retrieving check-ins for user: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrUserNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "User not found")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to get check-ins: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusOK, checkIns)
}

// GetCheckInsByActivityID handles retrieving all check-ins for an activity
func (h *httpHandler) GetCheckInsByActivityID(c *fiber.Ctx) error {
	// Get activity ID from URL parameters
	activityID := c.Params("activityID")
	if activityID == "" {
		return respHelper.Error(c, fiber.StatusBadRequest, "Missing activity ID")
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Get check-ins
	checkIns, err := h.checkInSvc.GetCheckInsByActivityID(ctx, activityID)
	if err != nil {
		log.Printf("Error retrieving check-ins for activity: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrActivityNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to get check-ins: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusOK, checkIns)
}

// GetActivityStats handles retrieving statistics for an activity
func (h *httpHandler) GetActivityStats(c *fiber.Ctx) error {
	// Get activity ID from URL parameters
	activityID := c.Params("activityID")
	if activityID == "" {
		return respHelper.Error(c, fiber.StatusBadRequest, "Missing activity ID")
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Get activity stats
	stats, err := h.checkInSvc.GetActivityStats(ctx, activityID)
	if err != nil {
		log.Printf("Error retrieving activity stats: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrActivityNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to get activity stats: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusOK, stats)
}

// GetAllCheckIns handles retrieving all check-ins
func (h *httpHandler) GetAllCheckIns(c *fiber.Ctx) error {
	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 15*time.Second)
	defer cancel()

	// Get all check-ins
	checkIns, err := h.checkInSvc.GetAllCheckIns(ctx)
	if err != nil {
		log.Printf("Error retrieving all check-ins: %v", err)
		return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to get check-ins: " + err.Error())
	}

	return respHelper.Success(c, fiber.StatusOK, checkIns)
}

// DeleteCheckIn handles deleting a check-in
func (h *httpHandler) DeleteCheckIn(c *fiber.Ctx) error {
	// Get ID from URL parameters
	id := c.Params("id")
	if id == "" {
		return respHelper.Error(c, fiber.StatusBadRequest, "Missing check-in ID")
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Delete check-in
	err := h.checkInSvc.DeleteCheckIn(ctx, id)
	if err != nil {
		log.Printf("Error deleting check-in: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "Check-in not found")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to delete check-in: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusOK, map[string]string{"message": "Check-in deleted successfully"})
}

// BulkCheckIn handles bulk check-in for multiple users
func (h *httpHandler) BulkCheckIn(c *fiber.Ctx) error {
	wrapper := reqBinding.NewContextWrapper(c)
	var req dto.BulkCheckInRequest
	
	if err := wrapper.Bind(&req); err != nil {
		log.Printf("Error binding request: %v", err)
		return respHelper.Error(c, fiber.StatusBadRequest, "Invalid request data: " + err.Error())
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 20*time.Second)
	defer cancel()

	// Perform bulk check-in
	result, err := h.checkInSvc.BulkCheckIn(ctx, &req)
	if err != nil {
		log.Printf("Error performing bulk check-in: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrActivityNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to perform bulk check-in: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusOK, result)
}

// GetUserActivityStatus handles retrieving the status of a user for an activity
func (h *httpHandler) GetUserActivityStatus(c *fiber.Ctx) error {
	// Get user ID and activity ID from URL parameters
	userID := c.Params("userID")
	if userID == "" {
		return respHelper.Error(c, fiber.StatusBadRequest, "Missing user ID")
	}

	activityID := c.Params("activityID")
	if activityID == "" {
		return respHelper.Error(c, fiber.StatusBadRequest, "Missing activity ID")
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	// Get user activity status
	status, err := h.checkInSvc.GetUserActivityStatus(ctx, userID, activityID)
	if err != nil {
		log.Printf("Error retrieving user activity status: %v", err)
		
		switch err {
		case service.ErrInvalidID:
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid ID format")
		case service.ErrUserNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "User not found")
		case service.ErrActivityNotFound:
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		default:
			return respHelper.Error(c, fiber.StatusInternalServerError, "Failed to get user activity status: " + err.Error())
		}
	}

	return respHelper.Success(c, fiber.StatusOK, status)
} 