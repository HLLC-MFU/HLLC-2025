package dto

import (
	"time"

	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// CreateMajorRequest defines the request structure for creating a major
type CreateMajorRequest struct {
	SchoolID string `json:"school_id" validate:"required"`
	Name struct {
		ThName string `json:"th_name" validate:"required"`
		EnName string `json:"en_name" validate:"required"`
	} `json:"name" validate:"required"`
	Acronym struct {
		ThAcronym string `json:"th_acronym" validate:"required"`
		EnAcronym string `json:"en_acronym" validate:"required"`
	} `json:"acronym" validate:"required"`
	Details struct {
		ThDetails string `json:"th_details"`
		EnDetails string `json:"en_details"`
	} `json:"details"`
	Photos struct {
		CoverPhoto     string `json:"cover_photo"`
		BannerPhoto    string `json:"banner_photo"`
		ThumbnailPhoto string `json:"thumbnail_photo"`
		LogoPhoto      string `json:"logo_photo"`
	} `json:"photos"`
}

// UpdateMajorRequest defines the request structure for updating a major
type UpdateMajorRequest struct {
	Name struct {
		ThName string `json:"th_name" validate:"required"`
		EnName string `json:"en_name" validate:"required"`
	} `json:"name" validate:"required"`
	Acronym struct {
		ThAcronym string `json:"th_acronym" validate:"required"`
		EnAcronym string `json:"en_acronym" validate:"required"`
	} `json:"acronym" validate:"required"`
	Details struct {
		ThDetails string `json:"th_details"`
		EnDetails string `json:"en_details"`
	} `json:"details"`
	Photos struct {
		CoverPhoto     string `json:"cover_photo"`
		BannerPhoto    string `json:"banner_photo"`
		ThumbnailPhoto string `json:"thumbnail_photo"`
		LogoPhoto      string `json:"logo_photo"`
	} `json:"photos"`
}

// MajorResponse defines the response structure for major data
type MajorResponse struct {
	ID        string          `json:"id"`
	SchoolID  string          `json:"school_id"`
	Name      Name            `json:"name"`
	Acronym   Acronym         `json:"acronym"`
	Details   Details         `json:"details"`
	Photos    Photos          `json:"photos"`
	School    *SchoolResponse `json:"school,omitempty"`
	CreatedAt string          `json:"created_at"`
	UpdatedAt string          `json:"updated_at"`
}

// SchoolResponse defines the embedded school response structure
type SchoolResponse struct {
	ID      string  `json:"id"`
	Name    Name    `json:"name"`
	Acronym Acronym `json:"acronym"`
}

// Name defines localized name structure
type Name struct {
	ThName string `json:"th_name"`
	EnName string `json:"en_name"`
}

// Acronym defines localized acronym structure
type Acronym struct {
	ThAcronym string `json:"th_acronym"`
	EnAcronym string `json:"en_acronym"`
}

// Details defines localized details structure
type Details struct {
	ThDetails string `json:"th_details"`
	EnDetails string `json:"en_details"`
}

// Photos defines photos structure
type Photos struct {
	CoverPhoto     string `json:"cover_photo"`
	BannerPhoto    string `json:"banner_photo"`
	ThumbnailPhoto string `json:"thumbnail_photo"`
	LogoPhoto      string `json:"logo_photo"`
}

// BulkCreateMajorsRequest defines the request structure for bulk creating majors
type BulkCreateMajorsRequest struct {
	Majors []CreateMajorRequest `json:"majors" validate:"required,min=1,dive"`
}

// BulkUpdateMajorsRequest defines the request structure for bulk updating majors
type BulkUpdateMajorsRequest struct {
	Majors []struct {
		ID string `json:"id" validate:"required"`
		UpdateMajorRequest
	} `json:"majors" validate:"required,min=1,dive"`
}

// BulkDeleteMajorsRequest defines the request structure for bulk deleting majors
type BulkDeleteMajorsRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

// BulkOperationResponse defines the response structure for bulk operations
type BulkOperationResponse struct {
	Success      bool     `json:"success"`
	Count        int      `json:"count"`
	FailedIDs    []string `json:"failed_ids,omitempty"`
	ErrorMessage string   `json:"error_message,omitempty"`
}

// ToProto converts a CreateMajorRequest to a majorPb.Major
func (req *CreateMajorRequest) ToProto() *majorPb.Major {
	return &majorPb.Major{
		Id:       "",
		SchoolId: req.SchoolID,
		Name: &generated.LocalizedName{
			Th: req.Name.ThName,
			En: req.Name.EnName,
		},
		Acronym: &generated.LocalizedAcronym{
			Th: req.Acronym.ThAcronym,
			En: req.Acronym.EnAcronym,
		},
		Details: &generated.LocalizedDetails{
			Th: req.Details.ThDetails,
			En: req.Details.EnDetails,
		},
		Photos: &generated.Photos{
			CoverPhoto:     req.Photos.CoverPhoto,
			BannerPhoto:    req.Photos.BannerPhoto,
			ThumbnailPhoto: req.Photos.ThumbnailPhoto,
			LogoPhoto:      req.Photos.LogoPhoto,
		},
		CreatedAt: timestamppb.Now(),
		UpdatedAt: timestamppb.Now(),
	}
}

// ToMajorResponse converts a majorPb.Major to a MajorResponse
func ToMajorResponse(major *majorPb.Major) *MajorResponse {
	if major == nil {
		return nil
	}
	
	response := &MajorResponse{
		ID:       major.Id,
		SchoolID: major.SchoolId,
		Name: Name{
			ThName: major.Name.Th,
			EnName: major.Name.En,
		},
		Acronym: Acronym{
			ThAcronym: major.Acronym.Th,
			EnAcronym: major.Acronym.En,
		},
		Details: Details{
			ThDetails: major.Details.Th,
			EnDetails: major.Details.En,
		},
		Photos: Photos{
			CoverPhoto:     major.Photos.CoverPhoto,
			BannerPhoto:    major.Photos.BannerPhoto,
			ThumbnailPhoto: major.Photos.ThumbnailPhoto,
			LogoPhoto:      major.Photos.LogoPhoto,
		},
		CreatedAt: major.CreatedAt.AsTime().Format(time.RFC3339),
		UpdatedAt: major.UpdatedAt.AsTime().Format(time.RFC3339),
	}
	
	// Add school data if available
	if major.School != nil {
		response.School = &SchoolResponse{
			ID: major.School.Id,
			Name: Name{
				ThName: major.School.Name.Th,
				EnName: major.School.Name.En,
			},
			Acronym: Acronym{
				ThAcronym: major.School.Acronym.Th,
				EnAcronym: major.School.Acronym.En,
			},
		}
	}
	
	return response
}

// ToMajorResponses converts a slice of majorPb.Major to a slice of MajorResponse
func ToMajorResponses(majors []*majorPb.Major) []*MajorResponse {
	responses := make([]*MajorResponse, 0, len(majors))
	for _, major := range majors {
		responses = append(responses, ToMajorResponse(major))
	}
	return responses
} 