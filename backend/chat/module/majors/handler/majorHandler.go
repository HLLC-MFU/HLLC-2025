package handler

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/service"
	schoolservice "github.com/HLLC-MFU/HLLC-2025/backend/module/schools/service"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"strconv"
)

type MajorHTTPHandler struct {
	service       service.MajorService
	schoolservice schoolservice.SchoolService
}

func NewHTTPHandler(service service.MajorService, schoolservice schoolservice.SchoolService) *MajorHTTPHandler {
	return &MajorHTTPHandler{
		service:       service,
		schoolservice: schoolservice,
	}
}

func (h *MajorHTTPHandler) GetMajor(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid major ID"})
	}

	major, err := h.service.GetMajor(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	school, err := h.schoolservice.GetSchool(c.Context(), major.School)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"id":      major.ID,
		"name":    major.Name,
		"acronym": major.Acronym,
		"detail":  major.Detail,
		"school":  school,
	})
}

func (h *MajorHTTPHandler) ListMajor(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	majors, total, err := h.service.ListMajors(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	var major []map[string]interface{}
	for _, m := range majors {
		school, err := h.schoolservice.GetSchool(c.Context(), m.School)
		if err != nil {
			continue
		}
		major = append(major, map[string]interface{}{
			"id":      m.ID,
			"name":    m.Name,
			"acronym": m.Acronym,
			"detail":  m.Detail,
			"school":  school,
		})
	}

	return c.JSON(fiber.Map{
		"major": major,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
