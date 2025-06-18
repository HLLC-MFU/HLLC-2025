package handler

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"strconv"
)

type SchoolHTTPHandler struct {
	service service.SchoolService
}

func NewHTTPHandler(service service.SchoolService) *SchoolHTTPHandler {
	return &SchoolHTTPHandler{
		service: service,
	}
}

func (h *SchoolHTTPHandler) GetSchool(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID",
		})
	}

	school, err := h.service.GetSchool(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	if school == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "school not found",
		})
	}

	return c.JSON(school)
}

func (h *SchoolHTTPHandler) ListSchools(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	schools, total, err := h.service.ListSchools(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"schools": schools,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}
