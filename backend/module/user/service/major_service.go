package service

import (
	"context"

	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
)

// MajorService defines the interface for major-related operations
// used by the user service through the major adapter
type MajorService interface {
	// GetMajorByID retrieves a major by its ID
	GetMajorByID(ctx context.Context, id string) (*majorPb.Major, error)
}

// Implementation is now directly in the user service using gRPC client 