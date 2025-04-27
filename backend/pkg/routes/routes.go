package routes

import (
	authHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/handler"
	authRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/repository"
	authRoutes "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/routes"
	authService "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/service/http"

	userHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/user/handler"
	userRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	userRoutes "github.com/HLLC-MFU/HLLC-2025/backend/module/user/routes"
	userService "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"

	roleHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/role/handler"
	roleRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/role/repository"
	roleRoutes "github.com/HLLC-MFU/HLLC-2025/backend/module/role/routes"
	roleService "github.com/HLLC-MFU/HLLC-2025/backend/module/role/service/http"

	permissionHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/handler"
	permissionRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/repository"
	permissionRoutes "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/routes"
	permissionService "github.com/HLLC-MFU/HLLC-2025/backend/module/permission/service/http"

	user_roleHandler "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/handler"
	user_roleRepository "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/repository"
	user_roleRoutes "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/routes"
	user_roleService "github.com/HLLC-MFU/HLLC-2025/backend/module/user_role/service/http"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/mongo"
)

// RegisterRoutes ลงทุก Route ใน App
func RegisterRoutes(app *fiber.App, db *mongo.Database) {
	api := app.Group("/api")

	// ===== Setup Auth Routes =====
	authRepo := authRepository.NewAuthRepository(db)
	refreshTokenRepo := authRepository.NewRefreshTokenRepository(db)
	authService := authService.NewAuthService(authRepo, refreshTokenRepo)
	authHandler := authHandler.NewAuthHTTPHandler(authService)
	authRoutes.RegisterAuthRoutes(api, authHandler)

	// ===== Future: Setup User Routes =====
	userRepo := userRepository.NewUserRepository(db)
	userService := userService.NewUserService(userRepo)
	userHandler := userHandler.NewUserHTTPHandler(userService)
	userRoutes.RegisterUserRoutes(api, userHandler)

	// ===== Future: Setup Student Routes =====
	roleRepo := roleRepository.NewRoleRepository(db)
	roleService := roleService.NewRoleService(roleRepo)
	roleHandler := roleHandler.NewRoleHTTPHandler(roleService)
	roleRoutes.RegisterRoleRoutes(api, roleHandler)

	permissionRepo := permissionRepository.NewPermissionRepository(db)
	permissionService := permissionService.NewPermissionService(permissionRepo)
	permissionHandler := permissionHandler.NewPermissionHTTPHandler(permissionService)
	permissionRoutes.RegisterPermissionRoutes(api, permissionHandler)

	user_roleRepo := user_roleRepository.NewUserRoleRepository(db)
	user_roleService := user_roleService.NewUserRoleService(user_roleRepo)
	user_roleHandler := user_roleHandler.NewHTTPHandler(user_roleService)
	user_roleRoutes.RegisterUserRoleRoutes(api, user_roleHandler)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, World! 👋🌎")
	})
}
