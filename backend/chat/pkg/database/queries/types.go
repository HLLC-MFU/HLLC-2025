// pkg/database/queries/types.go
package queries

import (
	"time"
)

type (
	QueryOptions struct {
		Page     int                    `json:"page" query:"page"`
		Limit    int                    `json:"limit" query:"limit"`
		Sort     string                 `json:"sort" query:"sort"`
		Excluded string                 `json:"excluded" query:"excluded"`
		Filter   map[string]interface{} `json:"filter" query:"filter"`
	}

	Meta struct {
		Total         int64     `json:"total"`
		Page          int       `json:"page"`
		Limit         int       `json:"limit"`
		TotalPages    int       `json:"totalPages"`
		LastUpdatedAt time.Time `json:"lastUpdatedAt"`
	}

	Response[T any] struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
		Data    []T    `json:"data"`
		Meta    *Meta  `json:"meta,omitempty"`
	}
)