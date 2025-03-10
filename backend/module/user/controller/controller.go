package controller

import (
	"context"
	"net/http"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	userDto "github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/user"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/request"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/common/response"
	"github.com/gofiber/fiber/v2"
)

type (
    UserController interface {
        CreateUser(c *fiber.Ctx) error
        GetUser(c *fiber.Ctx) error
        ValidateCredentials(c *fiber.Ctx) error
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
    username := ctx.Params("username")
    if username == "" {
        return response.Error(ctx, http.StatusBadRequest, "username is required")
    }

    result, err := c.userService.GetUserByUsername(ctx.Context(), username)
    if err != nil {
        return response.Error(ctx, http.StatusInternalServerError, err.Error())
    }

    return response.Success(ctx, http.StatusOK, result)
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

// gRPC Handlers
func (c *grpcController) CreateUser(ctx context.Context, req *userPb.CreateUserRequest) (*userPb.User, error) {
    result, err := c.userService.CreateUser(ctx, &userDto.CreateUserRequest{
        Username: req.Username,
        Password: req.Password,
        Name: userDto.Name{
            FirstName: req.FirstName,
            MiddleName: req.MiddleName,
            LastName: req.LastName,
        },
        RoleIDs: req.RoleIds,
    })
    if err != nil {
        return nil, err
    }

    return &userPb.User{
        Id: result.ID,
        Username: result.Username,
        FirstName: result.Name.FirstName,
        MiddleName: result.Name.MiddleName,
        LastName: result.Name.LastName,
        Roles: result.Roles,
    }, nil
}

func (c *grpcController) GetUser(ctx context.Context, req *userPb.GetUserRequest) (*userPb.User, error) {
    result, err := c.userService.GetUserByUsername(ctx, req.Username)
    if err != nil {
        return nil, err
    }

    return &userPb.User{
        Id: result.ID,
        Username: result.Username,
        FirstName: result.Name.FirstName,
        MiddleName: result.Name.MiddleName,
        LastName: result.Name.LastName,
        Roles: result.Roles,
    }, nil
}

func (c *grpcController) ValidateCredentials(ctx context.Context, req *userPb.ValidateCredentialsRequest) (*userPb.ValidateCredentialsResponse, error) {
    isValid, err := c.userService.ValidatePassword(ctx, req.Username, req.Password)
    if err != nil {
        return nil, err
    }

    if !isValid {
        return &userPb.ValidateCredentialsResponse{
            Valid: false,
        }, nil
    }

    user, err := c.userService.GetUserByUsername(ctx, req.Username)
    if err != nil {
        return nil, err
    }

    return &userPb.ValidateCredentialsResponse{
        Valid: true,
        User: &userPb.User{
            Id: user.ID,
            Username: user.Username,
            FirstName: user.Name.FirstName,
            MiddleName: user.Name.MiddleName,
            LastName: user.Name.LastName,
            Roles: user.Roles,
        },
    }, nil
}

