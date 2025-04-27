package dto

import (
	"time"

	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// CreateSchoolRequest defines the request structure for creating a school
type CreateSchoolRequest struct {
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

// UpdateSchoolRequest defines the request structure for updating a school
type UpdateSchoolRequest struct {
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

// SchoolResponse defines the response structure for school data
type SchoolResponse struct {
	ID        string        `json:"id"`
	Name      Name          `json:"name"`
	Acronym   Acronym       `json:"acronym"`
	Details   Details       `json:"details"`
	Photos    Photos        `json:"photos"`
	CreatedAt string        `json:"created_at"`
	UpdatedAt string        `json:"updated_at"`
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

// BulkCreateSchoolsRequest defines the request structure for bulk creating schools
type BulkCreateSchoolsRequest struct {
	Schools []CreateSchoolRequest `json:"schools" validate:"required,min=1,dive"`
}

// BulkUpdateSchoolsRequest defines the request structure for bulk updating schools
type BulkUpdateSchoolsRequest struct {
	Schools []struct {
		ID string `json:"id" validate:"required"`
		UpdateSchoolRequest
	} `json:"schools" validate:"required,min=1,dive"`
}

// BulkDeleteSchoolsRequest defines the request structure for bulk deleting schools
type BulkDeleteSchoolsRequest struct {
	IDs []string `json:"ids" validate:"required,min=1"`
}

// BulkOperationResponse defines the response structure for bulk operations
type BulkOperationResponse struct {
	Success      bool     `json:"success"`
	Count        int      `json:"count"`
	FailedIDs    []string `json:"failed_ids,omitempty"`
	ErrorMessage string   `json:"error_message,omitempty"`
}

// ToProto converts a CreateSchoolRequest to a schoolPb.School
func (req *CreateSchoolRequest) ToProto() *schoolPb.School {
	return &schoolPb.School{
		Id: "",
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

// ToSchoolResponse converts a schoolPb.School to a SchoolResponse
func ToSchoolResponse(school *schoolPb.School) *SchoolResponse {
	if school == nil {
		return nil
	}
	
	response := &SchoolResponse{
		ID: school.Id,
		Name: Name{
			ThName: school.Name.Th,
			EnName: school.Name.En,
		},
		Acronym: Acronym{
			ThAcronym: school.Acronym.Th,
			EnAcronym: school.Acronym.En,
		},
		Details: Details{
			ThDetails: school.Details.Th,
			EnDetails: school.Details.En,
		},
		Photos: Photos{
			CoverPhoto:     school.Photos.CoverPhoto,
			BannerPhoto:    school.Photos.BannerPhoto,
			ThumbnailPhoto: school.Photos.ThumbnailPhoto,
			LogoPhoto:      school.Photos.LogoPhoto,
		},
		CreatedAt: school.CreatedAt.AsTime().Format(time.RFC3339),
		UpdatedAt: school.UpdatedAt.AsTime().Format(time.RFC3339),
	}
	
	return response
}

// ToSchoolResponses converts a slice of schoolPb.School to a slice of SchoolResponse
func ToSchoolResponses(schools []*schoolPb.School) []*SchoolResponse {
	responses := make([]*SchoolResponse, 0, len(schools))
	for _, school := range schools {
		responses = append(responses, ToSchoolResponse(school))
	}
	return responses
} 