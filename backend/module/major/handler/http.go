package handler

import (
	"context"
	"strconv"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/dto"
	service "github.com/HLLC-MFU/HLLC-2025/backend/module/major/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/gofiber/fiber/v2"
)

// HTTPHandler defines the HTTP handler methods for major functionality
type HTTPHandler interface {
	// Major management
	CreateMajor(c *fiber.Ctx) error
	GetMajor(c *fiber.Ctx) error
	ListMajors(c *fiber.Ctx) error
	ListMajorsBySchool(c *fiber.Ctx) error
	UpdateMajor(c *fiber.Ctx) error
	DeleteMajor(c *fiber.Ctx) error
	
	// Bulk operations
	// BulkCreateMajors(c *fiber.Ctx) error
	// BulkUpdateMajors(c *fiber.Ctx) error
	// BulkDeleteMajors(c *fiber.Ctx) error
}

// httpHandler implements HTTPHandler
type httpHandler struct {
	majorService service.MajorService
}

// NewHTTPHandler creates a new HTTP handler
func NewHTTPHandler(majorService service.MajorService) HTTPHandler {
	return &httpHandler{
		majorService: majorService,
	}
}

// Major management handlers
func (h *httpHandler) CreateMajor(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.CreateMajorRequest](func(c *fiber.Ctx, req *dto.CreateMajorRequest) error {
		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		major, err := h.majorService.CreateMajor(ctx, req)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusCreated, major)
	}))

	return handler(c)
}

func (h *httpHandler) GetMajor(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Major ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		major, err := h.majorService.GetMajorByID(ctx, id)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, major)
	})

	return handler(c)
}

func (h *httpHandler) ListMajors(c *fiber.Ctx) error {
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

		// Get all majors
		majors, total, err := h.majorService.ListMajors(ctx, page, limit)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"majors": majors,
			"pagination": fiber.Map{
				"page":  page,
				"limit": limit,
				"total": total,
			},
		})
	})

	return handler(c)
}

func (h *httpHandler) ListMajorsBySchool(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		schoolID := c.Params("schoolId")
		if schoolID == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("School ID parameter is required", nil))
		}

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

		// Get majors by school
		majors, total, err := h.majorService.ListMajorsBySchool(ctx, schoolID, page, limit)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"majors": majors,
			"pagination": fiber.Map{
				"page":  page,
				"limit": limit,
				"total": total,
			},
			"school_id": schoolID,
		})
	})

	return handler(c)
}

func (h *httpHandler) UpdateMajor(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(decorator.WithJSONValidation[dto.UpdateMajorRequest](func(c *fiber.Ctx, req *dto.UpdateMajorRequest) error {
		id := c.Params("id")
		if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Major ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
		defer cancel()

		major, err := h.majorService.UpdateMajor(ctx, id, req)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, major)
	}))

	return handler(c)
}

func (h *httpHandler) DeleteMajor(c *fiber.Ctx) error {
	handler := decorator.ComposeDecorators(
		decorator.WithLogging,
	)(func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id == "" {
			return exceptions.HandleError(c, exceptions.InvalidInput("Major ID parameter is required", nil))
		}

		ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
		defer cancel()

		err := h.majorService.DeleteMajor(ctx, id)
		if err != nil {
			return exceptions.HandleError(c, err)
		}

		return response.Success(c, fiber.StatusOK, fiber.Map{
			"message":  "Major deleted successfully",
			"major_id": id,
		})
	})

	return handler(c)
}