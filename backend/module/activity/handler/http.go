package handler

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/dto"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/service"
	reqBinding "github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	respHelper "github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/gofiber/fiber/v2"
)

// HTTPHandler handles HTTP requests for activity service
type HTTPHandler interface {
	RegisterPublicRoutes(router fiber.Router)
	RegisterProtectedRoutes(router fiber.Router)
	RegisterAdminRoutes(router fiber.Router)
}

type httpHandler struct {
	cfg                *config.Config
	activityController controller.ActivityController
}

// NewHTTPHandler creates a new HTTP handler
func NewHTTPHandler(cfg *config.Config, activityController controller.ActivityController) HTTPHandler {
	return &httpHandler{
		cfg:                cfg,
		activityController: activityController,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (h *httpHandler) RegisterPublicRoutes(router fiber.Router) {
	router.Get("/", h.GetAllActivities)
	router.Get("/:id", h.GetActivityByID)
	router.Get("/code/:code", h.GetActivityByCode)
}

// RegisterProtectedRoutes registers routes that require authentication
func (h *httpHandler) RegisterProtectedRoutes(router fiber.Router) {
	// No specific protected routes for activities
}

// RegisterAdminRoutes registers routes that require admin role
func (h *httpHandler) RegisterAdminRoutes(router fiber.Router) {
	router.Post("/", h.CreateActivity)
	router.Put("/:id", h.UpdateActivity)
	router.Delete("/:id", h.DeleteActivity)
}

// CreateActivity creates a new activity
func (h *httpHandler) CreateActivity(c *fiber.Ctx) error {
	wrapper := reqBinding.NewContextWrapper(c)
	var req dto.CreateActivityRequest
	
	if err := wrapper.Bind(&req); err != nil {
		log.Printf("Error binding request: %v", err)
		return respHelper.Error(c, fiber.StatusBadRequest, "Invalid request data: " + err.Error())
	}
	
	// Check if Type field needs validation (after custom unmarshal)
	if req.Type < 0 || req.Type > 1 {
		log.Printf("Invalid activity type: %d", req.Type)
		return respHelper.Error(c, fiber.StatusBadRequest, "Invalid activity type. Must be 0 (How To Live) or 1 (How To Learn)")
	}
	
	// Create context with timeout
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()
	
	activity, err := h.activityController.CreateActivity(ctx, &req)
	if err != nil {
		log.Printf("Error creating activity: %v", err)
		
		if err == service.ErrActivityExists {
			return respHelper.Error(c, fiber.StatusConflict, "Activity with this code already exists")
		}
		
		return respHelper.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	
	return respHelper.Success(c, fiber.StatusCreated, activity)
}

// GetActivityByID gets an activity by ID
func (h *httpHandler) GetActivityByID(c *fiber.Ctx) error {
	id := c.Params("id")
	
	// Create context with timeout
	result, err := decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
		return h.activityController.GetActivityByID(ctx, id)
	})(c.Context())
	
	if err != nil {
		log.Printf("Error retrieving activity: %v", err)
		
		if err == service.ErrNotFound {
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		}
		
		if err == service.ErrInvalidID {
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid activity ID")
		}
		
		return respHelper.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	
	return respHelper.Success(c, fiber.StatusOK, result)
}

// GetActivityByCode gets an activity by code
func (h *httpHandler) GetActivityByCode(c *fiber.Ctx) error {
	code := c.Params("code")
	
	// Create context with timeout
	result, err := decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
		return h.activityController.GetActivityByCode(ctx, code)
	})(c.Context())
	
	if err != nil {
		log.Printf("Error retrieving activity: %v", err)
		
		if err == service.ErrNotFound {
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		}
		
		return respHelper.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	
	return respHelper.Success(c, fiber.StatusOK, result)
}

// GetAllActivities gets all activities
func (h *httpHandler) GetAllActivities(c *fiber.Ctx) error {
	// Create context with timeout
	results, err := decorator.WithTimeout[[]*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) ([]*dto.ActivityResponse, error) {
		return h.activityController.GetAllActivities(ctx)
	})(c.Context())
	
	if err != nil {
		log.Printf("Error retrieving activities: %v", err)
		return respHelper.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	
	return respHelper.Success(c, fiber.StatusOK, results)
}

// UpdateActivity updates an activity
func (h *httpHandler) UpdateActivity(c *fiber.Ctx) error {
	id := c.Params("id")
	
	wrapper := reqBinding.NewContextWrapper(c)
	var req dto.UpdateActivityRequest
	
	if err := wrapper.Bind(&req); err != nil {
		log.Printf("Error binding request: %v", err)
		return respHelper.Error(c, fiber.StatusBadRequest, "Invalid request data: " + err.Error())
	}
	
	// Create context with timeout
	result, err := decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
		return h.activityController.UpdateActivity(ctx, id, &req)
	})(c.Context())
	
	if err != nil {
		log.Printf("Error updating activity: %v", err)
		
		if err == service.ErrNotFound {
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		}
		
		if err == service.ErrInvalidID {
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid activity ID")
		}
		
		if err == service.ErrActivityExists {
			return respHelper.Error(c, fiber.StatusConflict, "Activity with this code already exists")
		}
		
		return respHelper.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	
	return respHelper.Success(c, fiber.StatusOK, result)
}

// DeleteActivity deletes an activity
func (h *httpHandler) DeleteActivity(c *fiber.Ctx) error {
	id := c.Params("id")
	
	// Create context with timeout
	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
		err := h.activityController.DeleteActivity(ctx, id)
		return struct{}{}, err
	})(c.Context())
	
	if err != nil {
		log.Printf("Error deleting activity: %v", err)
		
		if err == service.ErrNotFound {
			return respHelper.Error(c, fiber.StatusNotFound, "Activity not found")
		}
		
		if err == service.ErrInvalidID {
			return respHelper.Error(c, fiber.StatusBadRequest, "Invalid activity ID")
		}
		
		return respHelper.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	
	return respHelper.Success(c, fiber.StatusNoContent, nil)
} 