package validator

import (
	"fmt"
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