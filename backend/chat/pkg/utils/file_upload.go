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
	NamePrefix   string
}

// ModuleConfig holds standard configurations for different modules
var ModuleConfig = map[string]FileUploadConfig{
	"room": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024, // 256KB
		NamePrefix:   "room",
	},
	"user": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024,
		NamePrefix:   "user",
	},
	"chat": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png", "image/gif"},
		MaxSize:      1024 * 1024, // 1MB
		NamePrefix:   "chat",
	},
	"sticker": {
			AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
			MaxSize:      256 * 1024,
			NamePrefix:   "sticker",
	},
	"upload": {
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024,
		NamePrefix:   "upload",
	},
}

func DefaultImageConfig() FileUploadConfig {
	return FileUploadConfig{
		AllowedTypes: []string{"image/jpeg", "image/jpg", "image/png"},
		MaxSize:      256 * 1024, // 256KB
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
		return "", err
	}

	if err := h.validateFile(file); err != nil {
		return "", err
	}

	dir := "uploads"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.MkdirAll(dir, os.ModePerm)
	}

	filename := h.generateFilename(file.Filename)
	filePath := filepath.Join(dir, filename)

	if err := ctx.SaveFile(file, filePath); err != nil {
		return "", err
	}

	return filename, nil
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
func (h *FileUploadHandler) GetFileURL(filename string) string {
	return filename
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