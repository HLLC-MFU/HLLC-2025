package handler

import (
	"strconv"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/service"
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
type createSchoolRequest struct {
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

// RegisterRoutes registers HTTP routes for the school service
func (h *HTTPHandler) RegisterRoutes(router fiber.Router) {
	router.Post("/", h.CreateSchool)
	router.Get("/:id", h.GetSchool)
	router.Get("/", h.ListSchools)
	router.Put("/:id", h.UpdateSchool)
	router.Delete("/:id", h.DeleteSchool)
}

func (h *HTTPHandler) CreateSchool(c *fiber.Ctx) error {
	var req createSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	school := &model.School{
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

	if err := h.service.CreateSchool(c.Context(), school); err != nil {
		if err == service.ErrSchoolAlreadyExists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(school)
}

func (h *HTTPHandler) GetSchool(c *fiber.Ctx) error {
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

func (h *HTTPHandler) ListSchools(c *fiber.Ctx) error {
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

func (h *HTTPHandler) UpdateSchool(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID",
		})
	}

	var req createSchoolRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	school := &model.School{
		ID: id,
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

	if err := h.service.UpdateSchool(c.Context(), school); err != nil {
		if err == service.ErrSchoolNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		if err == service.ErrSchoolAlreadyExists {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(school)
}

func (h *HTTPHandler) DeleteSchool(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID",
		})
	}

	if err := h.service.DeleteSchool(c.Context(), id); err != nil {
		if err == service.ErrSchoolNotFound {
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