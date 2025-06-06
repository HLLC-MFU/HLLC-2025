package handler

import (
	"strconv"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type SchoolHTTPHandler struct {
	service service.SchoolService
}

func NewHTTPHandler(service service.SchoolService) *SchoolHTTPHandler {
	return &SchoolHTTPHandler{
		service: service,
	}
}

type createSchoolRequest struct {
	Name struct {
		ThName string `json:"thName"`
		EnName string `json:"enName"`
	} `json:"name"`
	Acronym string `json:"acronym"`
	Detail  struct {
		ThDetail string `json:"thDetail"`
		EnDetail string `json:"enDetail"`
	} `json:"detail"`
	Photo string `json:"photo"`
}

func (h *SchoolHTTPHandler) CreateSchool(c *fiber.Ctx) error {
	thName := c.FormValue("name[th]")
	enName := c.FormValue("name[en]")
	acronym := c.FormValue("acronym")
	thDetail := c.FormValue("detail[th]")
	enDetail := c.FormValue("detail[en]")
	photo := c.FormValue("photo")

	school := &model.School{
		Name: coreModel.LocalizedName{
			Th: thName,
			En: enName,
		},
		Acronym: acronym,
		Detail: coreModel.LocalizedName{
			Th: thDetail,
			En: enDetail,
		},
		Photo: coreModel.Photo{
			CoverPhoto:     photo,
			BannerPhoto:    photo,
			ThumbnailPhoto: photo,
			LogoPhoto:      photo,
		},
	}

	if err := h.service.CreateSchool(c.Context(), school); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "School created successfully",
	})
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

func (h *SchoolHTTPHandler) UpdateSchool(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid school ID"})
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

	thName := c.FormValue("name[th]")
	enName := c.FormValue("name[en]")
	acronym := c.FormValue("acronym")
	thDetail := c.FormValue("detail[th]")
	enDetail := c.FormValue("detail[en]")
	photo := c.FormValue("photo")

	school.Name = coreModel.LocalizedName{
		Th: thName,
		En: enName,
	}

	school.Acronym = acronym
	school.Detail = coreModel.LocalizedName{
		Th: thDetail,
		En: enDetail,
	}

	school.Photo = coreModel.Photo{
		CoverPhoto:     photo,
		BannerPhoto:    photo,
		ThumbnailPhoto: photo,
		LogoPhoto:      photo,
	}

	if err := h.service.UpdateSchool(c.Context(), school); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "School updated successfully",
	})
}

func (h *SchoolHTTPHandler) DeleteSchool(c *fiber.Ctx) error {
	id, err := primitive.ObjectIDFromHex(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID",
		})
	}

	if err := h.service.DeleteSchool(c.Context(), id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "School deleted successfully",
	})
}
