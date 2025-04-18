package controller

import (
	"context"
	"net/http"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/gofiber/fiber/v2"
)

type (
    UserController interface {
        // User management
        CreateUser(c *fiber.Ctx) error
        GetUser(c *fiber.Ctx) error
        GetAllUsers(c *fiber.Ctx) error
        UpdateUser(c *fiber.Ctx) error
        DeleteUser(c *fiber.Ctx) error
        ValidateCredentials(c *fiber.Ctx) error

        // Role management
        CreateRole(c *fiber.Ctx) error
        GetRole(c *fiber.Ctx) error
        GetAllRoles(c *fiber.Ctx) error
        UpdateRole(c *fiber.Ctx) error
        DeleteRole(c *fiber.Ctx) error

        // Permission management
        CreatePermission(c *fiber.Ctx) error
        GetPermission(c *fiber.Ctx) error
        GetAllPermissions(c *fiber.Ctx) error
        UpdatePermission(c *fiber.Ctx) error
        DeletePermission(c *fiber.Ctx) error
    }

    userController struct {
        cfg *config.Config
        userService service.UserService
    }

    GrpcController interface {
        userPb.UserServiceServer
    }

    grpcController struct {
        cfg *config.Config
        userService service.UserService
        userPb.UnimplementedUserServiceServer
    }
)

func NewUserController(cfg *config.Config, userService service.UserService) UserController {
    return &userController{
        cfg: cfg,
        userService: userService,
    }
}

func NewGrpcController(cfg *config.Config, userService service.UserService) GrpcController {
    return &grpcController{
        cfg: cfg,
        userService: userService,
    }
}

// HTTP Handlers
// User management
func (c *userController) CreateUser(ctx *fiber.Ctx) error {
    wrapper := request.NewContextWrapper(ctx)
    
    var req userDto.CreateUserRequest
    if err := wrapper.Bind(&req); err != nil {
        return response.Error(ctx, http.StatusBadRequest, err.Error())
    }

    result, err := c.userService.CreateUser(ctx.Context(), &req)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusCreated, result)
}

func (c *userController) GetUser(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    result, err := c.userService.GetUserByID(ctx.Context(), id)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) GetAllUsers(ctx *fiber.Ctx) error {
    result, err := c.userService.GetAllUsers(ctx.Context())
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) UpdateUser(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    wrapper := request.NewContextWrapper(ctx)
    
    var req userDto.UpdateUserRequest
    if err := wrapper.Bind(&req); err != nil {
        return response.Error(ctx, http.StatusBadRequest, err.Error())
    }

    result, err := c.userService.UpdateUser(ctx.Context(), id, &req)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) DeleteUser(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    err := c.userService.DeleteUser(ctx.Context(), id)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusNoContent, nil)
}

func (c *userController) ValidateCredentials(ctx *fiber.Ctx) error {
    wrapper := request.NewContextWrapper(ctx)
    
    var req struct {
        Username string `json:"username" validate:"required"`
        Password string `json:"password" validate:"required"`
    }
    if err := wrapper.Bind(&req); err != nil {
        return response.Error(ctx, http.StatusBadRequest, err.Error())
    }

    isValid, err := c.userService.ValidatePassword(ctx.Context(), req.Username, req.Password)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    if !isValid {
        return response.Error(ctx, http.StatusUnauthorized, "invalid credentials")
    }

    return response.Success(ctx, http.StatusOK, map[string]bool{"valid": true})
}

// Role management
func (c *userController) CreateRole(ctx *fiber.Ctx) error {
    wrapper := request.NewContextWrapper(ctx)
    
    var req userDto.CreateRoleRequest
    if err := wrapper.Bind(&req); err != nil {
        return response.Error(ctx, http.StatusBadRequest, err.Error())
    }

    result, err := c.userService.CreateRole(ctx.Context(), &req)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusCreated, result)
}

func (c *userController) GetRole(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    result, err := c.userService.GetRoleByID(ctx.Context(), id)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) GetAllRoles(ctx *fiber.Ctx) error {
    result, err := c.userService.GetAllRoles(ctx.Context())
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) UpdateRole(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    wrapper := request.NewContextWrapper(ctx)
    
    var req userDto.UpdateRoleRequest
    if err := wrapper.Bind(&req); err != nil {
        return response.Error(ctx, http.StatusBadRequest, err.Error())
    }

    result, err := c.userService.UpdateRole(ctx.Context(), id, &req)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) DeleteRole(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    err := c.userService.DeleteRole(ctx.Context(), id)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusNoContent, nil)
}

// Permission management
func (c *userController) CreatePermission(ctx *fiber.Ctx) error {
    wrapper := request.NewContextWrapper(ctx)
    
    var req userDto.CreatePermissionRequest
    if err := wrapper.Bind(&req); err != nil {
        return response.Error(ctx, http.StatusBadRequest, err.Error())
    }

    result, err := c.userService.CreatePermission(ctx.Context(), &req)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusCreated, result)
}

func (c *userController) GetPermission(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    result, err := c.userService.GetPermissionByID(ctx.Context(), id)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) GetAllPermissions(ctx *fiber.Ctx) error {
    result, err := c.userService.GetAllPermissions(ctx.Context())
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) UpdatePermission(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    wrapper := request.NewContextWrapper(ctx)
    
    var req userDto.UpdatePermissionRequest
    if err := wrapper.Bind(&req); err != nil {
        return response.Error(ctx, http.StatusBadRequest, err.Error())
    }

    result, err := c.userService.UpdatePermission(ctx.Context(), id, &req)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
}

func (c *userController) DeletePermission(ctx *fiber.Ctx) error {
    id := ctx.Params("id")
    if id == "" {
        return response.Error(ctx, http.StatusBadRequest, "id is required")
    }

    err := c.userService.DeletePermission(ctx.Context(), id)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusNoContent, nil)
}

// gRPC Handlers
func (c *grpcController) CreateUser(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
    result, err := c.userService.CreateUserGRPC(ctx, req)
    if err != nil {
        return nil, err
    }
    return result, nil
}

func (c *grpcController) GetUser(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
    result, err := c.userService.GetUserGRPC(ctx, req)
    if err != nil {
        return nil, err
    }
    return result, nil
}

func (c *grpcController) ValidateCredentials(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
    result, err := c.userService.ValidateCredentialsGRPC(ctx, req)
    if err != nil {
        return nil, err
    }
    return result, nil
}

func (c *grpcController) mustEmbedUnimplementedUserServiceServer() {}

