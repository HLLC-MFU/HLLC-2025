package validator

import (
	"fmt"
	"mime/multipart"
	"reflect"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ValidationError struct {
	Field   string
	Message string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Field, e.Message)
}

// IsNotEmpty validates that a field is not empty
func IsNotEmpty(field interface{}, fieldName string) error {
	value := reflect.ValueOf(field)

	switch value.Kind() {
	case reflect.String:
		if value.String() == "" {
			return &ValidationError{Field: fieldName, Message: "must not be empty"}
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if value.Int() == 0 {
			return &ValidationError{Field: fieldName, Message: "must not be zero"}
		}
	case reflect.Struct:
		// Special handling for LocalizedName
		if value.Type().Name() == "LocalizedName" {
			thField := value.FieldByName("Th")
			enField := value.FieldByName("En")
			if thField.String() == "" || enField.String() == "" {
				return &ValidationError{Field: fieldName, Message: "both Thai and English names are required"}
			}
		}
	}

	return nil
}

// IsMongoID validates that a field is a valid MongoDB ObjectID
func IsMongoID(field interface{}, fieldName string) error {
	switch v := field.(type) {
	case string:
		if !primitive.IsValidObjectID(v) {
			return &ValidationError{Field: fieldName, Message: "must be a valid MongoDB ObjectID"}
		}
	case primitive.ObjectID:
		if v.IsZero() {
			return &ValidationError{Field: fieldName, Message: "must not be empty"}
		}
	case []string:
		for i, id := range v {
			if !primitive.IsValidObjectID(id) {
				return &ValidationError{Field: fieldName, Message: fmt.Sprintf("item at index %d must be a valid MongoDB ObjectID", i)}
			}
		}
	case []primitive.ObjectID:
		for i, id := range v {
			if id.IsZero() {
				return &ValidationError{Field: fieldName, Message: fmt.Sprintf("item at index %d must not be empty", i)}
			}
		}
	default:
		return &ValidationError{Field: fieldName, Message: "must be a string, ObjectID, or array of these types"}
	}

	return nil
}

// IsValidRoomType validates that a field is a valid room type
func IsValidRoomType(field interface{}, fieldName string) error {
	switch v := field.(type) {
	case string:
		if v != "normal" && v != "readonly" {
			return &ValidationError{Field: fieldName, Message: "must be either 'normal' or 'readonly'"}
		}
	default:
		return &ValidationError{Field: fieldName, Message: "must be a string"}
	}

	return nil
}

// IsValidRoomStatus validates that a field is a valid room status
func IsValidRoomStatus(field interface{}, fieldName string) error {
	switch v := field.(type) {
	case string:
		if v != "active" && v != "inactive" {
			return &ValidationError{Field: fieldName, Message: "must be either 'active' or 'inactive'"}
		}
	default:
		return &ValidationError{Field: fieldName, Message: "must be a string"}
	}

	return nil
}

// ValidateStruct validates a struct using field tags
func ValidateStruct(s interface{}) error {
	value := reflect.ValueOf(s)
	if value.Kind() == reflect.Ptr {
		value = value.Elem()
	}

	if value.Kind() != reflect.Struct {
		return fmt.Errorf("validation target must be a struct")
	}

	typ := value.Type()
	var errors []string

	for i := 0; i < value.NumField(); i++ {
		field := value.Field(i)
		fieldType := typ.Field(i)
		fieldName := fieldType.Name
		validate := fieldType.Tag.Get("validate")

		if validate == "" {
			continue
		}

		validators := strings.Split(validate, ",")
		for _, v := range validators {
			var err error
			switch v {
			case "notEmpty":
				err = IsNotEmpty(field.Interface(), fieldName)
			case "mongoId":
				err = IsMongoID(field.Interface(), fieldName)
			case "roomType":
				err = IsValidRoomType(field.Interface(), fieldName)
			case "roomStatus":
				err = IsValidRoomStatus(field.Interface(), fieldName)
			}

			if err != nil {
				if validErr, ok := err.(*ValidationError); ok {
					errors = append(errors, validErr.Error())
				}
			}
		}
	}

	if len(errors) > 0 {
		return fmt.Errorf("validation failed: %s", strings.Join(errors, "; "))
	}

	return nil
}

// ValidateFileUpload is a decorator for basic file upload validation
func ValidateFileUpload(file *multipart.FileHeader) error {
	if file == nil {
		return fmt.Errorf("no file provided")
	}

	if file.Size == 0 {
		return fmt.Errorf("file is empty")
	}

	return nil
}

// ValidateImageUpload is a decorator for image upload validation
func ValidateImageUpload(file *multipart.FileHeader, maxSize int64, allowedTypes []string) error {
	// First apply basic file validation
	if err := ValidateFileUpload(file); err != nil {
		return err
	}

	// Check file size
	if file.Size > maxSize {
		return fmt.Errorf("file size %d exceeds maximum allowed size of %d bytes", file.Size, maxSize)
	}

	// Check content type
	contentType := file.Header.Get("Content-Type")
	isAllowed := false
	for _, allowedType := range allowedTypes {
		if contentType == allowedType {
			isAllowed = true
			break
		}
	}

	if !isAllowed {
		return fmt.Errorf("invalid file type: %s. Allowed types: %s", 
			contentType, strings.Join(allowedTypes, ", "))
	}

	return nil
}

// ValidateMultipartForm is a decorator for validating multipart form data
func ValidateMultipartForm[T any](data *T) error {
	if data == nil {
		return fmt.Errorf("no form data provided")
	}

	return ValidateStruct(data)
}

// FileUploadValidator provides a reusable validation interface
type FileUploadValidator interface {
	ValidateFile(file *multipart.FileHeader) error
}

// ImageUploadValidator implements FileUploadValidator for images
type ImageUploadValidator struct {
	MaxSize      int64
	AllowedTypes []string
}

// NewImageUploadValidator creates a new image upload validator
func NewImageUploadValidator(maxSize int64, allowedTypes []string) *ImageUploadValidator {
	return &ImageUploadValidator{
		MaxSize:      maxSize,
		AllowedTypes: allowedTypes,
	}
}

// ValidateFile implements FileUploadValidator
func (v *ImageUploadValidator) ValidateFile(file *multipart.FileHeader) error {
	return ValidateImageUpload(file, v.MaxSize, v.AllowedTypes)
}

// Common validation errors
var (
	ErrNoFile = fmt.Errorf("no file provided")
	ErrEmptyFile = fmt.Errorf("file is empty")
	ErrInvalidFileType = fmt.Errorf("invalid file type")
	ErrFileTooLarge = fmt.Errorf("file too large")
)