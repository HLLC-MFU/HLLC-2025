package utils

import (
	"chat/module/room/dto"
	"chat/module/room/model"
	"chat/pkg/common"
	"chat/pkg/middleware"
	"chat/pkg/utils"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RoomControllerHelper provides helper functions for room controller operations
type RoomControllerHelper struct{}

// NewRoomControllerHelper creates a new instance of RoomControllerHelper
func NewRoomControllerHelper() *RoomControllerHelper {
	return &RoomControllerHelper{}
}

// AuthorizationResult represents the result of an authorization check
type AuthorizationResult struct {
	IsAuthorized bool
	IsCreator    bool
	IsAdmin      bool
	UserID       string
	UserRole     string
	RoomCreator  string
	Error        error
}

// CheckRoomAuthorization checks if a user is authorized to modify a room
func (h *RoomControllerHelper) CheckRoomAuthorization(
	ctx *fiber.Ctx,
	room *model.Room,
	rbac middleware.IRBACMiddleware,
) *AuthorizationResult {
	userID, err := rbac.ExtractUserIDFromContext(ctx)
	if err != nil {
		return &AuthorizationResult{
			IsAuthorized: false,
			Error:        err,
		}
	}

	userRole, err := rbac.GetUserRole(userID)
	if err != nil {
		return &AuthorizationResult{
			IsAuthorized: false,
			Error:        err,
		}
	}

	userObjID, _ := primitive.ObjectIDFromHex(userID)
	isCreator := room.CreatedBy == userObjID
	isAdmin := userRole == middleware.RoleAdministrator || userRole == middleware.RoleStaff
	isAuthorized := isCreator || isAdmin

	return &AuthorizationResult{
		IsAuthorized: isAuthorized,
		IsCreator:    isCreator,
		IsAdmin:      isAdmin,
		UserID:       userID,
		UserRole:     userRole,
		RoomCreator:  room.CreatedBy.Hex(),
		Error:        nil,
	}
}

// BuildUnauthorizedResponse creates a standardized unauthorized response
func (h *RoomControllerHelper) BuildUnauthorizedResponse(
	ctx *fiber.Ctx,
	operation string,
	authResult *AuthorizationResult,
) error {
	return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
		"success":     false,
		"message":     h.getUnauthorizedMessage(operation),
		"error":       h.getUnauthorizedErrorCode(operation),
		"roomCreator": authResult.RoomCreator,
		"currentUser": authResult.UserID,
	})
}

// ValidateStudentRoomType checks if a student is trying to create a room with restricted type
func (h *RoomControllerHelper) ValidateStudentRoomType(
	userRole string,
	requestedType string,
) (bool, string, error) {
	if userRole == middleware.RoleStudent {
		if requestedType != "" && requestedType != model.RoomTypeNormal {
			return false, model.RoomTypeNormal, nil
		}
	}
	return true, requestedType, nil
}

// BuildStudentRoomTypeError creates a standardized error response for student room type restrictions
func (h *RoomControllerHelper) BuildStudentRoomTypeError(
	ctx *fiber.Ctx,
	requestedType string,
	allowedType string,
) error {
	return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
		"success":       false,
		"message":       "Students can only create rooms with type 'normal'",
		"error":         "ROLE_RESTRICTION",
		"allowedType":   allowedType,
		"requestedType": requestedType,
	})
}

// ConvertMembersToStrings converts room members from ObjectIDs to strings
func (h *RoomControllerHelper) ConvertMembersToStrings(members []primitive.ObjectID) []string {
	memberStrs := make([]string, len(members))
	for i, m := range members {
		memberStrs[i] = m.Hex()
	}
	return memberStrs
}

// CheckUserMembership checks if a user is a member of a room
func (h *RoomControllerHelper) CheckUserMembership(
	room *model.Room,
	userID string,
) (bool, []string) {
	userObjID, _ := primitive.ObjectIDFromHex(userID)
	isMember := false
	memberStrs := h.ConvertMembersToStrings(room.Members)

	for _, m := range room.Members {
		if m == userObjID {
			isMember = true
			break
		}
	}

	return isMember, memberStrs
}

// HandleImageUpload handles image upload for room creation/update
func (h *RoomControllerHelper) HandleImageUpload(
	ctx *fiber.Ctx,
	validationHelper *RoomValidationHelper,
	uploadHandler *utils.FileUploadHandler,
) (string, error) {
	file, err := ctx.FormFile("image")
	if err != nil {
		return "", nil // Image is optional
	}

	if err := validationHelper.ValidateImageUpload(file); err != nil {
		return "", err
	}

	return uploadHandler.HandleFileUpload(ctx, "image")
}

// ParseAndUpdateRoom parses form data and creates UpdateRoomDto
func (h *RoomControllerHelper) ParseAndUpdateRoom(
	ctx *fiber.Ctx,
	room *model.Room,
	validationHelper *RoomValidationHelper,
	uploadHandler *utils.FileUploadHandler,
) (*dto.UpdateRoomDto, error) {
	form, _ := ctx.MultipartForm()

	// Update fields
	nameTh := ctx.FormValue("name.th", room.Name.Th)
	nameEn := ctx.FormValue("name.en", room.Name.En)
	roomType := ctx.FormValue("type", room.Type)
	capacityStr := ctx.FormValue("capacity", "")
	capacity := room.Capacity
	if capacityStr != "" {
		if v, err := strconv.Atoi(capacityStr); err == nil {
			capacity = v
		}
	}

	// Handle members (array)
	members := room.Members
	if form != nil && form.Value["members"] != nil && len(form.Value["members"]) > 0 {
		var objIDs []primitive.ObjectID
		for _, idStr := range form.Value["members"] {
			if objID, err := primitive.ObjectIDFromHex(idStr); err == nil {
				objIDs = append(objIDs, objID)
			}
		}
		members = objIDs
	}

	// Handle image
	imagePath := room.Image
	file, err := ctx.FormFile("image")
	if err == nil && file != nil {
		if err := validationHelper.ValidateImageUpload(file); err != nil {
			return nil, err
		}
		imagePath, err = uploadHandler.HandleFileUpload(ctx, "image")
		if err != nil {
			return nil, err
		}
	}

	createdBy := ctx.FormValue("createdBy", room.CreatedBy.Hex())

	stringMembers := h.ConvertMembersToStrings(members)
	updateDto := &dto.UpdateRoomDto{
		Name: common.LocalizedName{
			Th: nameTh,
			En: nameEn,
		},
		Type:      roomType,
		Capacity:  capacity,
		Members:   stringMembers,
		Image:     imagePath,
		CreatedBy: createdBy,
	}

	return updateDto, nil
}

// HandleJoinRoomError handles different types of join room errors
func (h *RoomControllerHelper) HandleJoinRoomError(
	ctx *fiber.Ctx,
	err error,
	validationHelper *RoomValidationHelper,
) error {
	if strings.Contains(err.Error(), "not allowed to join group rooms") {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "Access denied: Users with role 'user' cannot join group rooms",
			"error":   "ROLE_RESTRICTION",
		})
	}
	if strings.Contains(err.Error(), "full capacity") {
		return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"message": "Room is at full capacity",
			"error":   "ROOM_FULL",
		})
	}
	if strings.Contains(err.Error(), "room not found") {
		return validationHelper.BuildNotFoundErrorResponse(ctx, "Room")
	}
	return validationHelper.BuildInternalErrorResponse(ctx, err)
}

// CreateRoomWithImage handles room creation with optional image upload
func (h *RoomControllerHelper) CreateRoomWithImage(
	ctx *fiber.Ctx,
	createDto *dto.CreateRoomDto,
	validationHelper *RoomValidationHelper,
	uploadHandler *utils.FileUploadHandler,
) error {
	// Handle image if provided
	if file, err := ctx.FormFile("image"); err == nil {
		if err := validationHelper.ValidateImageUpload(file); err != nil {
			return err
		}
		filename, err := uploadHandler.HandleFileUpload(ctx, "image")
		if err != nil {
			return err
		}
		createDto.Image = filename
	}
	return nil
}

// UpdateRoomWithImage handles room update with optional image upload
func (h *RoomControllerHelper) UpdateRoomWithImage(
	ctx *fiber.Ctx,
	room *model.Room,
	validationHelper *RoomValidationHelper,
	uploadHandler *utils.FileUploadHandler,
) (string, error) {
	imagePath := room.Image
	file, err := ctx.FormFile("image")
	if err == nil && file != nil {
		if err := validationHelper.ValidateImageUpload(file); err != nil {
			return "", err
		}
		imagePath, err = uploadHandler.HandleFileUpload(ctx, "image")
		if err != nil {
			return "", err
		}
	}
	return imagePath, nil
}

// BuildRoomResponse builds a standardized room response
func (h *RoomControllerHelper) BuildRoomResponse(
	room *model.Room,
	userID string,
) fiber.Map {
	isMember, memberStrs := h.CheckUserMembership(room, userID)

	return fiber.Map{
		"success": true,
		"data": fiber.Map{
			"_id":      room.ID,
			"members":  memberStrs,
			"isMember": isMember,
		},
	}
}

// BuildRoomUpdateDto creates UpdateRoomDto from room data
func (h *RoomControllerHelper) BuildRoomUpdateDto(
	room *model.Room,
	roomType string,
) *dto.UpdateRoomDto {
	stringMembers := h.ConvertMembersToStrings(room.Members)
	return &dto.UpdateRoomDto{
		Name:     room.Name,
		Type:     roomType,
		Capacity: room.Capacity,
		Members:  stringMembers,
		Image:    room.Image,
	}
}

// CleanupUploadedFile safely deletes uploaded files
func (h *RoomControllerHelper) CleanupUploadedFile(
	filePath string,
	uploadHandler *utils.FileUploadHandler,
) {
	if filePath != "" {
		_ = uploadHandler.DeleteFile(filePath)
	}
}

// ValidateRoomIDParam validates room ID from URL parameter
func (h *RoomControllerHelper) ValidateRoomIDParam(
	ctx *fiber.Ctx,
	validationHelper *RoomValidationHelper,
) (primitive.ObjectID, error) {
	roomID := ctx.Params("roomId")
	if roomID == "" {
		roomID = ctx.Params("id") // Fallback to "id" parameter
	}

	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return primitive.NilObjectID, err
	}

	return roomObjID, nil
}

// BuildReadOnlyResponse builds response for read-only status update
func (h *RoomControllerHelper) BuildReadOnlyResponse(
	roomID string,
	isReadOnly bool,
	updatedRoom *model.Room,
) fiber.Map {
	return fiber.Map{
		"success": true,
		"message": "Room read-only status updated successfully",
		"data": fiber.Map{
			"roomId":   roomID,
			"readOnly": isReadOnly,
			"room":     updatedRoom,
		},
	}
}

// Helper methods for error messages and codes
func (h *RoomControllerHelper) getUnauthorizedMessage(operation string) string {
	messages := map[string]string{
		"update":       "You can only update rooms that you created",
		"delete":       "You can only delete rooms that you created",
		"update_type":  "You can only update room type for rooms that you created",
		"update_image": "You can only update room image for rooms that you created",
		"set_readonly": "You can only set read-only status for rooms that you created",
	}

	if message, exists := messages[operation]; exists {
		return message
	}
	return "You are not authorized to perform this operation"
}

func (h *RoomControllerHelper) getUnauthorizedErrorCode(operation string) string {
	codes := map[string]string{
		"update":       "UNAUTHORIZED_UPDATE",
		"delete":       "UNAUTHORIZED_DELETE",
		"update_type":  "UNAUTHORIZED_UPDATE_TYPE",
		"update_image": "UNAUTHORIZED_UPDATE_IMAGE",
		"set_readonly": "UNAUTHORIZED_SET_READONLY",
	}

	if code, exists := codes[operation]; exists {
		return code
	}
	return "UNAUTHORIZED_OPERATION"
}
