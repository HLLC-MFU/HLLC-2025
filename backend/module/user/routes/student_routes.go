package routes

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	"github.com/gofiber/fiber/v2"
)

func RegisterStudentRoutes(router fiber.Router, h handler.StudentHTTPHandler) {
	studentGroup := router.Group("/students")

	studentGroup.Post("/", h.CreateStudent)
	studentGroup.Get("/", h.ListStudents)
	studentGroup.Get("/id/:id", h.GetStudentByID)
	studentGroup.Get("/username/:username", h.GetStudentByUsername)
	studentGroup.Put("/:id", h.UpdateStudent)
	studentGroup.Delete("/:id", h.DeleteStudent)
}
