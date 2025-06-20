package router

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/schools/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterSchoolRoutes(router fiber.Router, h *handler.SchoolHTTPHandler) {
	router.Get("/:id", h.GetSchool)
	router.Get("/", h.ListSchools)
}
