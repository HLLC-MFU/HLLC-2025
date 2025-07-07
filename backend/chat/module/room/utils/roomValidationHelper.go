package utils

import (
	"chat/module/room/dto"
	"chat/pkg/validator"
	"fmt"
	"mime/multipart"

	"chat/module/room/model"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoomValidationHelper struct {
	imageValidator *validator.ImageUploadValidator
}

func NewRoomValidationHelper(maxSize int64, allowedTypes []string) *RoomValidationHelper {
	return &RoomValidationHelper{
		imageValidator: validator.NewImageUploadValidator(maxSize, allowedTypes),
	}
}

// ValidateRoomID ตรวจสอบ room ID format
func (h *RoomValidationHelper) ValidateRoomID(idStr string) (primitive.ObjectID, error) {
	if idStr == "" {
		return primitive.NilObjectID, fmt.Errorf("room ID is required")
	}

	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("invalid room ID format")
	}

	return objID, nil
}

// ValidateCreateRoomDto ตรวจสอบ CreateRoom DTO
func (h *RoomValidationHelper) ValidateCreateRoomDto(createDto *dto.CreateRoomDto) error {
	if err := validator.ValidateStruct(createDto); err != nil {
		return fmt.Errorf("validation error: %w", err)
	}

	// ตรวจสอบ room type
	if createDto.Type != "" {
		validTypes := []string{"normal", "readonly", "announcement", "private"}
		isValid := false
		for _, validType := range validTypes {
			if createDto.Type == validType {
				isValid = true
				break
			}
		}
		if !isValid {
			return fmt.Errorf("invalid room type: %s", createDto.Type)
		}
	}

	// ตรวจสอบ room status
	if createDto.Status != "" {
		if !model.ValidateRoomStatus(createDto.Status) {
			return fmt.Errorf("invalid room status: %s", createDto.Status)
		}
	}

	return nil
}

// ValidateImageUpload ตรวจสอบ image file
func (h *RoomValidationHelper) ValidateImageUpload(file *multipart.FileHeader) error {
	if file == nil {
		return nil // image is optional
	}

	return h.imageValidator.ValidateFile(file)
}

// ValidateRoomType ตรวจสอบ room type
func (h *RoomValidationHelper) ValidateRoomType(roomType string) error {
	validTypes := []string{"normal", "readonly", "announcement", "private"}
	
	for _, validType := range validTypes {
		if roomType == validType {
			return nil
		}
	}

	return fmt.Errorf("invalid room type: %s (allowed: %v)", roomType, validTypes)
}

// ValidateRoomStatus ตรวจสอบ room status
func (h *RoomValidationHelper) ValidateRoomStatus(roomStatus string) error {
	if !model.ValidateRoomStatus(roomStatus) {
		return fmt.Errorf("invalid room status: %s (allowed: active, inactive)", roomStatus)
	}
	return nil
}

// ValidateUserID ตรวจสอบ user ID format
func (h *RoomValidationHelper) ValidateUserID(idStr string) (primitive.ObjectID, error) {
	if idStr == "" {
		return primitive.NilObjectID, fmt.Errorf("user ID is required")
	}
	objID, err := primitive.ObjectIDFromHex(idStr)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("invalid user ID format")
	}
	return objID, nil
}

// ParseAndValidateRoomID แยกและตรวจสอบ room ID จาก URL parameter
func (h *RoomValidationHelper) ParseAndValidateRoomID(ctx *fiber.Ctx) (primitive.ObjectID, error) {
	idStr := ctx.Params("id")
	return h.ValidateRoomID(idStr)
}

// BuildValidationErrorResponse สร้าง error response สำหรับ validation error
func (h *RoomValidationHelper) BuildValidationErrorResponse(ctx *fiber.Ctx, err error) error {
	return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
		"success": false,
		"message": "Validation failed",
		"error":   err.Error(),
	})
}

// BuildNotFoundErrorResponse สร้าง error response สำหรับ not found error
func (h *RoomValidationHelper) BuildNotFoundErrorResponse(ctx *fiber.Ctx, resource string) error {
	return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
		"success": false,
		"message": fmt.Sprintf("%s not found", resource),
	})
}

// BuildInternalErrorResponse สร้าง error response สำหรับ internal error
func (h *RoomValidationHelper) BuildInternalErrorResponse(ctx *fiber.Ctx, err error) error {
	return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"success": false,
		"message": "Internal server error",
		"error":   err.Error(),
	})
}

// BuildSuccessResponse สร้าง success response
func (h *RoomValidationHelper) BuildSuccessResponse(ctx *fiber.Ctx, data interface{}, message string, statusCode ...int) error {
	code := fiber.StatusOK
	if len(statusCode) > 0 {
		code = statusCode[0]
	}

	return ctx.Status(code).JSON(fiber.Map{
		"success": true,
		"message": message,
		"data":    data,
	})
} 