package controller

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	majModel "github.com/HLLC-MFU/HLLC-2025/backend/module/major/model"
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	corePb "github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Controller struct {
	cfg         *config.Config
	service     service.Service
	majorClient majorPb.MajorServiceClient
}

func NewController(cfg *config.Config, service service.Service, majorClient majorPb.MajorServiceClient) *Controller {
	return &Controller{
		cfg:         cfg,
		service:     service,
		majorClient: majorClient,
	}
}

// RegisterPublicRoutes registers routes that don't require authentication
func (c *Controller) RegisterPublicRoutes(router fiber.Router) {
	majors := router.Group("/majors")
	majors.Get("/", c.ListMajors)
	majors.Get("/:id", c.GetMajor)
	majors.Get("/school/:schoolId", c.ListMajorsBySchool)
}

// RegisterProtectedRoutes registers routes that require authentication
func (c *Controller) RegisterProtectedRoutes(router fiber.Router) {
	majors := router.Group("/majors")
	majors.Post("/", c.CreateMajor)
	majors.Put("/:id", c.UpdateMajor)
	majors.Delete("/:id", c.DeleteMajor)
}

// RegisterAdminRoutes registers routes that require admin role
func (c *Controller) RegisterAdminRoutes(router fiber.Router) {
	// Add admin-specific routes here if needed
}

// HTTP handlers using gRPC client with context timeout

// CreateMajor creates a new major
func (c *Controller) CreateMajor(ctx *fiber.Ctx) error {
	var req struct {
		SchoolID string `json:"school_id"`
		Name     struct {
			Th string `json:"th"`
			En string `json:"en"`
		} `json:"name"`
		Acronym string `json:"acronym"`
		Details struct {
			Th string `json:"th"`
			En string `json:"en"`
		} `json:"details"`
		Photos struct {
			CoverPhoto     string `json:"cover_photo"`
			BannerPhoto    string `json:"banner_photo"`
			ThumbnailPhoto string `json:"thumbnail_photo"`
			LogoPhoto      string `json:"logo_photo"`
		} `json:"photos"`
	}

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Check if we can use gRPC client
	if c.majorClient != nil {
		// Use WithTimeout decorator for proper context handling
		response, err := decorator.WithTimeout[*majorPb.MajorResponse](5*time.Second)(func(ctxTimeout context.Context) (*majorPb.MajorResponse, error) {
			return c.majorClient.CreateMajor(ctxTimeout, &majorPb.CreateMajorRequest{
				SchoolId: req.SchoolID,
				Name: &corePb.LocalizedName{
					ThName: req.Name.Th,
					EnName: req.Name.En,
				},
				Acronym: req.Acronym,
				Details: &corePb.LocalizedDetails{
					ThDetails: req.Details.Th,
					EnDetails: req.Details.En,
				},
				Photos: &majorPb.MajorPhotos{
					CoverPhoto:     req.Photos.CoverPhoto,
					BannerPhoto:    req.Photos.BannerPhoto,
					ThumbnailPhoto: req.Photos.ThumbnailPhoto,
					LogoPhoto:      req.Photos.LogoPhoto,
				},
			})
		})(ctx.Context())

		if err != nil {
			log.Printf("gRPC client failed, falling back to direct service call: %v", err)
		} else {
			return ctx.Status(fiber.StatusCreated).JSON(response.Major)
		}
	}

	// Fall back to direct service call if gRPC client is nil or failed
	// Convert schoolID to ObjectID
	schoolID, err := primitive.ObjectIDFromHex(req.SchoolID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid school ID format",
		})
	}

	major := &majModel.Major{
		ID:      primitive.NewObjectID(),
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
		Photos: coreModel.Photos{
			CoverPhoto:     req.Photos.CoverPhoto,
			BannerPhoto:    req.Photos.BannerPhoto,
			ThumbnailPhoto: req.Photos.ThumbnailPhoto,
			LogoPhoto:      req.Photos.LogoPhoto,
		},
	}

	_, err = decorator.WithTimeout[any](5*time.Second)(func(ctxTimeout context.Context) (any, error) {
		return nil, c.service.CreateMajor(ctxTimeout, major)
	})(ctx.Context())

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(major)
}

// GetMajor gets a major by ID
func (c *Controller) GetMajor(ctx *fiber.Ctx) error {
	id := ctx.Params("id")

	// Check if we can use gRPC client
	if c.majorClient != nil {
		// Use WithTimeout decorator for proper context handling
		response, err := decorator.WithTimeout[*majorPb.MajorResponse](3*time.Second)(func(ctxTimeout context.Context) (*majorPb.MajorResponse, error) {
			return c.majorClient.GetMajor(ctxTimeout, &majorPb.GetMajorRequest{
				Id: id,
			})
		})(ctx.Context())

		if err != nil {
			log.Printf("gRPC client failed, falling back to direct service call: %v", err)
		} else {
			return ctx.JSON(response.Major)
		}
	}

	// Fall back to direct service call if gRPC client is nil or failed
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid ID format",
		})
	}

	major, err := decorator.WithTimeout[*majModel.Major](3*time.Second)(func(ctxTimeout context.Context) (*majModel.Major, error) {
		return c.service.GetMajorWithSchool(ctxTimeout, objectID)
	})(ctx.Context())

	if err != nil {
		if err == service.ErrMajorNotFound {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "major not found",
			})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.JSON(major)
}

// ListMajors lists all majors with pagination
func (c *Controller) ListMajors(ctx *fiber.Ctx) error {
	page := ctx.QueryInt("page", 1)
	limit := ctx.QueryInt("limit", 10)

	// Use WithTimeout decorator for proper context handling
	response, err := decorator.WithTimeout[*majorPb.ListMajorsResponse](5*time.Second)(func(ctxTimeout context.Context) (*majorPb.ListMajorsResponse, error) {
		return c.majorClient.ListMajors(ctxTimeout, &majorPb.ListMajorsRequest{
			Pagination: &corePb.PaginationRequest{
				Page:  int32(page),
				Limit: int32(limit),
			},
		})
	})(ctx.Context())

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"majors": response.Majors,
		"total":  response.Pagination.Total,
		"page":   response.Pagination.Page,
		"limit":  response.Pagination.Limit,
	})
}

// ListMajorsBySchool lists majors by school ID with pagination
func (c *Controller) ListMajorsBySchool(ctx *fiber.Ctx) error {
	schoolId := ctx.Params("schoolId")
	page := ctx.QueryInt("page", 1)
	limit := ctx.QueryInt("limit", 10)

	// Use WithTimeout decorator for proper context handling
	response, err := decorator.WithTimeout[*majorPb.ListMajorsResponse](5*time.Second)(func(ctxTimeout context.Context) (*majorPb.ListMajorsResponse, error) {
		return c.majorClient.ListMajorsBySchool(ctxTimeout, &majorPb.ListMajorsBySchoolRequest{
			SchoolId: schoolId,
			Pagination: &corePb.PaginationRequest{
				Page:  int32(page),
				Limit: int32(limit),
			},
		})
	})(ctx.Context())

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.JSON(fiber.Map{
		"majors": response.Majors,
		"total":  response.Pagination.Total,
		"page":   response.Pagination.Page,
		"limit":  response.Pagination.Limit,
	})
}

// UpdateMajor updates a major by ID
func (c *Controller) UpdateMajor(ctx *fiber.Ctx) error {
	id := ctx.Params("id")

	var req struct {
		SchoolID string `json:"school_id"`
		Name     struct {
			Th string `json:"th"`
			En string `json:"en"`
		} `json:"name"`
		Acronym string `json:"acronym"`
		Details struct {
			Th string `json:"th"`
			En string `json:"en"`
		} `json:"details"`
		Photos struct {
			CoverPhoto     string `json:"cover_photo"`
			BannerPhoto    string `json:"banner_photo"`
			ThumbnailPhoto string `json:"thumbnail_photo"`
			LogoPhoto      string `json:"logo_photo"`
		} `json:"photos"`
	}

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// Use WithTimeout decorator for proper context handling
	response, err := decorator.WithTimeout[*majorPb.MajorResponse](5*time.Second)(func(ctxTimeout context.Context) (*majorPb.MajorResponse, error) {
		return c.majorClient.UpdateMajor(ctxTimeout, &majorPb.UpdateMajorRequest{
			Id:       id,
			Name: &corePb.LocalizedName{
				ThName: req.Name.Th,
				EnName: req.Name.En,
			},
			Acronym: req.Acronym,
			Details: &corePb.LocalizedDetails{
				ThDetails: req.Details.Th,
				EnDetails: req.Details.En,
			},
			Photos: &majorPb.MajorPhotos{
				CoverPhoto:     req.Photos.CoverPhoto,
				BannerPhoto:    req.Photos.BannerPhoto,
				ThumbnailPhoto: req.Photos.ThumbnailPhoto,
				LogoPhoto:      req.Photos.LogoPhoto,
			},
		})
	})(ctx.Context())

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.JSON(response.Major)
}

// DeleteMajor deletes a major by ID
func (c *Controller) DeleteMajor(ctx *fiber.Ctx) error {
	id := ctx.Params("id")

	// Use WithTimeout decorator for proper context handling
	response, err := decorator.WithTimeout[*majorPb.DeleteMajorResponse](3*time.Second)(func(ctxTimeout context.Context) (*majorPb.DeleteMajorResponse, error) {
		return c.majorClient.DeleteMajor(ctxTimeout, &majorPb.DeleteMajorRequest{
			Id: id,
		})
	})(ctx.Context())

	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if response.Success {
		return ctx.SendStatus(fiber.StatusNoContent)
	}

	return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"error": "failed to delete major",
	})
}