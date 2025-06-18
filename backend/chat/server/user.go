package server

import (
	"log"

	roleRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/roles/repository"
	roleService "github.com/HLLC-MFU/HLLC-2025/backend/module/roles/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/router"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/users/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func (s *server) userService() {
	userRepo := repository.NewUserRepository(s.db)
	roleRepo := roleRepo.NewRoleRepository(s.db)
	userService := service.NewUserService(userRepo)
	roleService := roleService.NewRoleService(roleRepo)
	userHandler := handler.NewUserHandler(userService, roleService)

	router.RegisterUserRoutes(s.app.Group("/users"), userHandler)

	// Middleware
	s.app.Use(cors.New(s.config.FiberCORSConfig()))

	// Route registration
	api := s.api
	public := api.Group("/users")
	router.RegisterUserRoutes(public, userHandler)

	s.app.Get("/ping", func(c *fiber.Ctx) error {
		return c.SendString("pong")
	})

	s.app.Get("/health", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})

	log.Println("User service initialized")
}
