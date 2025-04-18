package handler

import (
	"strconv"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type HTTPHandler struct {
	service service.Service
}

func NewHTTPHandler(service service.Service) *HTTPHandler {
	return &HTTPHandler{
		service: service,
	}
}

// Request structs for mapping client requests
type createMajorRequest struct {
	SchoolID string `json:"school_id"`
	Name struct {
		Th string `json:"th"`
		En string `json:"en"`
	} `json:"name"`
	Acronym string `json:"acronym"`
	Details struct {
		Th string `json:"th"`
		En string `json:"en"`
	} `json:"details"`
	Photos coreModel.Photos `json:"photos"`
}

// RegisterRoutes registers HTTP routes for the major service
func (h *HTTPHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/", h.CreateMajor)
	router.Get("/:id", h.GetMajor)
	router.Get("/", h.ListMajors)
	router.Get("/school/:schoolId", h.ListMajorsBySchool)
	router.Put("/:id", h.UpdateMajor)
	router.Delete("/:id", h.DeleteMajor)
}

func (h *HTTPHandler) CreateMajor(c *fiber.Ctx) error {
	var req createMajorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	schoolID, err := primitive.ObjectIDFromHex(req.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID",
		})
	}

	major := &model.Major{
		SchoolID: schoolID,
		Name: coreModel.LocalizedName{
			ThName: req.Name.Th,
			EnName: req.Name.En,
		},
		Acronym: req.Acronym,
		Details: coreModel.LocalizedDetails{
			ThDetails: req.Details.Th,
			EnDetails: req.Details.En,
		},
		Photos: req.Photos,
	}

	if err := h.service.CreateMajor(c.Context(), major); err != nil {
		if err == service.ErrMajorAlreadyExists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(major)
}

func (h *HTTPHandler) GetMajor(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid major ID",
		})
	}

	major, err := h.service.GetMajorWithSchool(c.Context(), id)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	if major == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "major not found",
		})
	}

	return c.JSON(major)
}

func (h *HTTPHandler) ListMajors(c *fiber.Ctx) error {
	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	majors, total, err := h.service.ListMajorsWithSchool(c.Context(), page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"majors": majors,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

func (h *HTTPHandler) ListMajorsBySchool(c *fiber.Ctx) error {
	schoolID, err := primitive.ObjectIDFromHex(c.Params("schoolId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID",
		})
	}

	page, _ := strconv.ParseInt(c.Query("page", "1"), 10, 64)
	limit, _ := strconv.ParseInt(c.Query("limit", "10"), 10, 64)

	majors, total, err := h.service.ListMajorsBySchool(c.Context(), schoolID, page, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"majors": majors,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

func (h *HTTPHandler) UpdateMajor(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid major ID",
		})
	}

	var req createMajorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	schoolID, err := primitive.ObjectIDFromHex(req.SchoolID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID",
		})
	}

	major := &model.Major{
		ID:       id,
		SchoolID: schoolID,
		Name: coreModel.LocalizedName{
			ThName: req.Name.Th,
			EnName: req.Name.En,
		},
		Acronym: req.Acronym,
		Details: coreModel.LocalizedDetails{
			ThDetails: req.Details.Th,
			EnDetails: req.Details.En,
		},
		Photos: req.Photos,
	}

	if err := h.service.UpdateMajor(c.Context(), major); err != nil {
		if err == service.ErrMajorNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		if err == service.ErrMajorAlreadyExists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(major)
}

func (h *HTTPHandler) DeleteMajor(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid major ID",
		})
	}

	if err := h.service.DeleteMajor(c.Context(), id); err != nil {
		if err == service.ErrMajorNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}