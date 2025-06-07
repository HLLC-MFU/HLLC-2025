package handler

import (
	"strconv"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/majors/service"
	schoolservice "github.com/HLLC-MFU/HLLC-2025/backend/module/schools/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

type createMajorRequest struct {
	Name struct {
		Th string `json:"thName"`
		En string `json:"enName"`
	} `json:"name"`
	Acronym string `json:"acronym"`
	Detail  struct {
		Th string `json:"thDetail"`
		En string `json:"enDetail"`
	} `json:"detail"`
	SchoolID string `bson:"school" json:"school"` // string ก่อนแปลงเป็น ObjectID
}

func (h *MajorHTTPHandler) CreateMajor(c *fiber.Ctx) error {
	var req createMajorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	schoolObjID, err := primitive.ObjectIDFromHex(req.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid school ID"})
	}

	major := &model.Major{
		Name: coreModel.LocalizedName{
			Th: req.Name.Th,
			En: req.Name.En,
		},
		Acronym: req.Acronym,
		Detail: coreModel.LocalizedName{
			Th: req.Detail.Th,
			En: req.Detail.En,
		},
		School: schoolObjID,
	}

	if err := h.service.CreateMajor(c.Context(), major); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(major)
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

type updateMajorRequest struct {
	Name struct {
		Th string `json:"thName"`
		En string `json:"enName"`
	} `json:"name"`
	Acronym string `json:"acronym"`
	Detail  struct {
		Th string `json:"thDetail"`
		En string `json:"enDetail"`
	} `json:"detail"`
	SchoolID string `json:"school"`
}

func (h *MajorHTTPHandler) UpdateMajor(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid major ID"})
	}

	var req updateMajorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	schoolID, err := primitive.ObjectIDFromHex(req.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid school ID"})
	}

	major := &model.Major{
		ID: id,
		Name: coreModel.LocalizedName{
			Th: req.Name.Th,
			En: req.Name.En,
		},
		Acronym: req.Acronym,
		Detail: coreModel.LocalizedName{
			Th: req.Detail.Th,
			En: req.Detail.En,
		},
		School: schoolID,
	}

	if err := h.service.UpdateMajor(c.Context(), major); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "major updated successfully"})
}

func (h *MajorHTTPHandler) DeleteMajor(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid major ID"})
	}

	if err := h.service.DeleteMajor(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "major deleted successfully"})
}
