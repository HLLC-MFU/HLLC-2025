package server

import (
	"log"

	majorRepo "github.com/HLLC-MFU/HLLC-2025/backend/module/majors/repository"
	majorService "github.com/HLLC-MFU/HLLC-2025/backend/module/majors/service"
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
	majorRepo := majorRepo.NewRepository(s.db)
	majorService := majorService.NewService(majorRepo)
	userService := service.NewUserService(userRepo, majorService)
	roleService := roleService.NewRoleService(roleRepo)
	userHandler := handler.NewUserHandler(userService, roleService, majorService)

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
