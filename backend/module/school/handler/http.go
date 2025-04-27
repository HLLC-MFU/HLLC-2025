package handler

import (
	"context"
	"strconv"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/dto"
	service "github.com/HLLC-MFU/HLLC-2025/backend/module/school/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/gofiber/fiber/v2"
)

// HTTPHandler defines the HTTP handler methods for school functionality
type HTTPHandler interface {
	// School management
	CreateSchool(c *fiber.Ctx) error
	GetSchool(c *fiber.Ctx) error
	ListSchools(c *fiber.Ctx) error
	UpdateSchool(c *fiber.Ctx) error
	DeleteSchool(c *fiber.Ctx) error

	// Bulk operations
	// BulkCreateSchools(c *fiber.Ctx) error
	// BulkUpdateSchools(c *fiber.Ctx) error
	// BulkDeleteSchools(c *fiber.Ctx) error
}

// httpHandler implements HTTPHandler
type httpHandler struct {
	schoolService service.SchoolService
}

// NewHTTPHandler creates a new HTTP handler
func NewHTTPHandler(schoolService service.SchoolService) HTTPHandler {
	return &httpHandler{
		schoolService: schoolService,
	}
}

// School management handlers
func (h *httpHandler) CreateSchool(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CreateSchoolRequest](func(c *fiber.Ctx, req *dto.CreateSchoolRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		school, err := h.schoolService.CreateSchool(ctx, req)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusCreated, school)
	}))

	return handler(c)
}

func (h *httpHandler) GetSchool(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("School ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		school, err := h.schoolService.GetSchoolByID(ctx, id)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, school)
	})

	return handler(c)
}

func (h *httpHandler) ListSchools(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		// Parse pagination parameters from query string
		page, err := strconv.ParseInt(c.Query("page", "1"), 10, 64)
		if err != nil || page < 1 {
			page = 1
		}

		limit, err := strconv.ParseInt(c.Query("limit", "10"), 10, 64)
		if err != nil || limit < 1 || limit > 100 {
			limit = 10 // Default and max limit
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		// Get all schools
		schools, total, err := h.schoolService.ListSchools(ctx, page, limit)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"schools": schools,
			"pagination": fiber.Map{
				"page":  page,
				"limit": limit,
				"total": total,
			},
		})
	})

	return handler(c)
}

func (h *httpHandler) UpdateSchool(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.UpdateSchoolRequest](func(c *fiber.Ctx, req *dto.UpdateSchoolRequest) error {
		id := c.Params("id")
		if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("School ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		school, err := h.schoolService.UpdateSchool(ctx, id, req)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, school)
	}))

	return handler(c)
}

func (h *httpHandler) DeleteSchool(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("School ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		err := h.schoolService.DeleteSchool(ctx, id)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"message":   "School deleted successfully",
			"school_id": id,
		})
	})

	return handler(c)
}

// Bulk operations
// func (h *httpHandler) BulkCreateSchools(c *fiber.Ctx) error {
// 	handler := decorator.ComposeDecorators(
// 		decorator.WithLogging,
// 	)(decorator.WithJSONValidation[dto.BulkCreateSchoolsRequest](func(c *fiber.Ctx, req *dto.BulkCreateSchoolsRequest) error {
// 		if len(req.Schools) == 0 {
// 			return exceptions.HandleError(c, exceptions.InvalidInput("At least one school is required", nil))
// 		}

// 		ctx, cancel := context.WithTimeout(c.Context(), 30*time.Second)
// 		defer cancel()

// 		result, err := h.schoolService.BulkCreateSchools(ctx, req)
// 		if err != nil {
// 			return exceptions.HandleError(c, err)
// 		}

// 		return response.Success(c, fiber.StatusOK, result)
// 	}))

// 	return handler(c)
// }

// func (h *httpHandler) BulkUpdateSchools(c *fiber.Ctx) error {
// 	handler := decorator.ComposeDecorators(
// 		decorator.WithLogging,
// 	)(decorator.WithJSONValidation[dto.BulkUpdateSchoolsRequest](func(c *fiber.Ctx, req *dto.BulkUpdateSchoolsRequest) error {
// 		if len(req.Schools) == 0 {
// 			return exceptions.HandleError(c, exceptions.InvalidInput("At least one school is required", nil))
// 		}

// 		ctx, cancel := context.WithTimeout(c.Context(), 30*time.Second)
// 		defer cancel()

// 		result, err := h.schoolService.BulkUpdateSchools(ctx, req)
// 		if err != nil {
// 			return exceptions.HandleError(c, err)
// 		}

// 		return response.Success(c, fiber.StatusOK, result)
// 	}))

// 	return handler(c)
// }

// func (h *httpHandler) BulkDeleteSchools(c *fiber.Ctx) error {
// 	handler := decorator.ComposeDecorators(
// 		decorator.WithLogging,
// 	)(decorator.WithJSONValidation[dto.BulkDeleteSchoolsRequest](func(c *fiber.Ctx, req *dto.BulkDeleteSchoolsRequest) error {
// 		if len(req.IDs) == 0 {
// 			return exceptions.HandleError(c, exceptions.InvalidInput("At least one school ID is required", nil))
// 		}

// 		ctx, cancel := context.WithTimeout(c.Context(), 30*time.Second)
// 		defer cancel()

// 		result, err := h.schoolService.BulkDeleteSchools(ctx, req)
// 		if err != nil {
// 			return exceptions.HandleError(c, err)
// 		}

// 		return response.Success(c, fiber.StatusOK, result)
// 	}))

// 	return handler(c)
// } 