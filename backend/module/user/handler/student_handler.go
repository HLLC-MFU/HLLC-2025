package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	serviceHttp "github.com/HLLC-MFU/HLLC-2025/backend/module/user/service/http"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
)

type StudentHTTPHandler interface {
	CreateStudent(c *fiber.Ctx) error
	GetStudentByID(c *fiber.Ctx) error
	GetStudentByUsername(c *fiber.Ctx) error
	ListStudents(c *fiber.Ctx) error
	UpdateStudent(c *fiber.Ctx) error
	DeleteStudent(c *fiber.Ctx) error
}

type studentHTTPHandler struct {
	studentService serviceHttp.StudentService
}

func NewStudentHTTPHandler(studentService serviceHttp.StudentService) StudentHTTPHandler {
	return &studentHTTPHandler{studentService: studentService}
}

func (h *studentHTTPHandler) CreateStudent(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	var req dto.CreateStudentRequest
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid body", err))
	}

	student := &userPb.Student{
		User: &userPb.User{
			Name: &userPb.Name{
				First:  req.Name.First,
				Middle: req.Name.Middle,
				Last:   req.Name.Last,
			},
			Username: req.Username,
			Password: req.Password,
			RoleIds:  req.RoleIDs,
		},
		MajorId: req.Profile.MajorID,
		Type:    userPb.UserType(userPb.UserType_value[req.Profile.Type]),
		Round:   userPb.UserRound(userPb.UserRound_value[req.Profile.Round]),
	}

	if err := h.studentService.CreateStudent(ctx, student); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusCreated)
}

func (h *studentHTTPHandler) GetStudentByID(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("id is required", nil))
	}

	student, err := h.studentService.GetStudentByID(ctx, id)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.JSON(student)
}

func (h *studentHTTPHandler) GetStudentByUsername(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	username := c.Params("username")
	if username == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("username is required", nil))
	}

	student, err := h.studentService.GetStudentByUsername(ctx, username)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.JSON(student)
}

func (h *studentHTTPHandler) ListStudents(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	students, err := h.studentService.ListStudents(ctx)
	if err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.JSON(students)
}

func (h *studentHTTPHandler) UpdateStudent(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 10*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("id is required", nil))
	}

	var req dto.UpdateStudentRequest
	if err := c.BodyParser(&req); err != nil {
		return exceptions.HandleError(c, exceptions.InvalidInput("invalid body", err))
	}

	student := &userPb.Student{}
	if req.Name != nil {
		student.User = &userPb.User{
			Name: &userPb.Name{
				First:  req.Name.First,
				Middle: req.Name.Middle,
				Last:   req.Name.Last,
			},
		}
	}
	if req.Username != nil {
		if student.User == nil {
			student.User = &userPb.User{}
		}
		student.User.Username = *req.Username
	}
	if req.Password != nil {
		if student.User == nil {
			student.User = &userPb.User{}
		}
		student.User.Password = *req.Password
	}
	if req.RoleIDs != nil {
		if student.User == nil {
			student.User = &userPb.User{}
		}
		student.User.RoleIds = req.RoleIDs
	}
	if req.Profile.MajorID != nil {
		student.MajorId = *req.Profile.MajorID
	}
	if req.Profile.Type != nil {
		student.Type = userPb.UserType(userPb.UserType_value[*req.Profile.Type])
	}
	if req.Profile.Round != nil {
		student.Round = userPb.UserRound(userPb.UserRound_value[*req.Profile.Round])
	}

	if err := h.studentService.UpdateStudent(ctx, id, student); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}

func (h *studentHTTPHandler) DeleteStudent(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	id := c.Params("id")
	if id == "" {
		return exceptions.HandleError(c, exceptions.InvalidInput("id is required", nil))
	}

	if err := h.studentService.DeleteStudent(ctx, id); err != nil {
		return exceptions.HandleError(c, err)
	}

	return c.SendStatus(fiber.StatusOK)
}
