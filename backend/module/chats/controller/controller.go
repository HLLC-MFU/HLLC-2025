package controller

import (
	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/handler"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/kafka"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"

	"github.com/gofiber/fiber/v2"
)

type Controller struct {
	cfg       *config.Config
	service   service.Service
	publisher kafka.Publisher
}

func NewController(cfg *config.Config, service service.Service, publisher kafka.Publisher) *Controller {
	return &Controller{
		cfg:       cfg,
		service:   service,
		publisher: publisher,
	}
}

func (c *Controller) RegisterPublicRoutes(router fiber.Router) {
	handler := handler.NewHTTPHandler(c.service, c.publisher)

	rooms := router.Group("/rooms")
	rooms.Get("/", handler.ListRooms)
	rooms.Get("/:id", handler.GetRoom)
}

func (c *Controller) RegisterProtectedRoutes(router fiber.Router) {
	handler := handler.NewHTTPHandler(c.service, c.publisher)

	router.Post("/", handler.CreateRoom)
	router.Get("/:id", handler.GetRoom)
	router.Delete("/:id", handler.DeleteRoom)
}

func (c *Controller) RegisterAdminRoutes(router fiber.Router) {
	handler := handler.NewHTTPHandler(c.service, c.publisher)

	router.Get("/", handler.ListRooms)
	router.Get("/:id", handler.GetRoom)
	router.Post("/", handler.CreateRoom)
	router.Put("/:id", handler.UpdateRoom)
	router.Delete("/:id", handler.DeleteRoom)
}
