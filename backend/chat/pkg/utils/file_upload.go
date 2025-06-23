package utils

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type FileUploadConfig struct {
	AllowedTypes []string
	MaxSize      int64
	UploadDir    string
	NamePrefix   string
	Module       string
}

// ModuleConfig holds standard configurations for different modules
var ModuleConfig = map[string]FileUploadConfig{
	"room": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024, // 256KB
		UploadDir:    "uploads/rooms",
		NamePrefix:   "room",
		Module:       "room",
	},
	"user": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024,
		UploadDir:    "uploads/users",
		NamePrefix:   "user",
		Module:       "user",
	},
	"chat": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png", "image/gif"},
		MaxSize:      1024 * 1024, // 1MB
		UploadDir:    "uploads/chat",
		NamePrefix:   "chat",
		Module:       "chat",
	},
	"sticker": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024,
		UploadDir:    "uploads/stickers",
		NamePrefix:   "sticker",
		Module:       "sticker",
	},
}

func DefaultImageConfig() FileUploadConfig {
	return FileUploadConfig{
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024, // 256KB
		UploadDir:    "uploads/images",
		NamePrefix:   "img",
	}
}

type FileUploadHandler struct {
	Config FileUploadConfig
}

func NewFileUploadHandler(config FileUploadConfig) *FileUploadHandler {
	return &FileUploadHandler{
		Config: config,
	}
}

func (h *FileUploadHandler) HandleFileUpload(ctx *fiber.Ctx, fieldName string) (string, error) {
	file, err := ctx.FormFile(fieldName)
	if err != nil {
		return "", fmt.Errorf("no file uploaded: %w", err)
	}

	// Validate file before reading it
	if err := h.validateFile(file); err != nil {
		return "", err
	}

	// Create directory if it doesn't exist
	if err := os.MkdirAll(h.Config.UploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Generate filename once
	filename := h.generateFilename(file.Filename)
	filepath := filepath.Join(h.Config.UploadDir, filename)

	// Use FastHTTP's built-in SaveFile for better performance
	if err := ctx.SaveFile(file, filepath); err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	return filepath, nil
}

func (h *FileUploadHandler) DeleteFile(filepath string) error {
	if filepath == "" {
		return nil
	}

	if err := os.Remove(filepath); err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

func (h *FileUploadHandler) validateFile(file *multipart.FileHeader) error {
	// Check file size first (faster than reading content type)
	if file.Size > h.Config.MaxSize {
		return fmt.Errorf("file size exceeds limit of %d bytes", h.Config.MaxSize)
	}

	// Use a map for O(1) lookup of allowed types
	contentType := file.Header.Get("Content-Type")
	allowedTypes := make(map[string]struct{}, len(h.Config.AllowedTypes))
	for _, t := range h.Config.AllowedTypes {
		allowedTypes[t] = struct{}{}
	}

	if _, allowed := allowedTypes[contentType]; !allowed {
		return fmt.Errorf("invalid file type: %s. Allowed types: %s", 
			contentType, strings.Join(h.Config.AllowedTypes, ", "))
	}

	return nil
}

func (h *FileUploadHandler) generateFilename(originalName string) string {
	// Pre-allocate string builder with estimated size
	var sb strings.Builder
	sb.Grow(len(h.Config.NamePrefix) + 37 + len(filepath.Ext(originalName))) // prefix + uuid (36) + underscore + extension

	sb.WriteString(h.Config.NamePrefix)
	sb.WriteString("_")
	sb.WriteString(uuid.New().String())
	sb.WriteString(filepath.Ext(originalName))

	return sb.String()
}

// GetFileURL converts file path to URL
func (h *FileUploadHandler) GetFileURL(filepath string) string {
	// Use a more efficient string builder for path manipulation
	var sb strings.Builder
	sb.WriteString("/api/uploads/")

	// Remove the leading "./uploads/" or "uploads/" if present
	cleanPath := filepath
	if strings.HasPrefix(cleanPath, "./uploads/") {
		cleanPath = cleanPath[len("./uploads/"):]
	} else if strings.HasPrefix(cleanPath, "uploads/") {
		cleanPath = cleanPath[len("uploads/"):]
	}
	
	sb.WriteString(cleanPath)
	return sb.String()
}

func IsImage(contentType string) bool {
	return contentType == "image/jpeg" || 
		   contentType == "image/jpg" || 
		   contentType == "image/png"
}

func GetModuleConfig(module string) FileUploadConfig {
	if config, exists := ModuleConfig[module]; exists {
		return config
	}
	return DefaultImageConfig()
}

// NewModuleFileHandler creates a new handler for a specific module
func NewModuleFileHandler(module string) *FileUploadHandler {
	return NewFileUploadHandler(GetModuleConfig(module))
} 