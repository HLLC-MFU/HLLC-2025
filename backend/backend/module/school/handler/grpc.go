package handler

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/model"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/school/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type GrpcHandler struct {
	schoolPb.UnimplementedSchoolServiceServer
	service service.Service
}

func NewGrpcHandler(service service.Service) *GrpcHandler {
	return &GrpcHandler{
		service: service,
	}
}

func (h *GrpcHandler) CreateSchool(ctx context.Context, req *schoolPb.CreateSchoolRequest) (*schoolPb.SchoolResponse, error) {
	school := &model.School{
		Name: coreModel.LocalizedName{
			ThName: req.Name.ThName,
			EnName: req.Name.EnName,
		},
		Acronym: req.Acronym,
		Details: coreModel.LocalizedDetails{
			ThDetails: req.Details.ThDetails,
			EnDetails: req.Details.EnDetails,
		},
		Photos: coreModel.Photos{
			CoverPhoto:     req.Photos.CoverPhoto,
			BannerPhoto:    req.Photos.BannerPhoto,
			ThumbnailPhoto: req.Photos.ThumbnailPhoto,
			LogoPhoto:      req.Photos.LogoPhoto,
		},
	}

	if err := h.service.CreateSchool(ctx, school); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create school: %v", err)
	}

	return &schoolPb.SchoolResponse{
		School: convertSchoolToProto(school),
	}, nil
}

func (h *GrpcHandler) GetSchool(ctx context.Context, req *schoolPb.GetSchoolRequest) (*schoolPb.SchoolResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid school ID: %v", err)
	}

	school, err := h.service.GetSchool(ctx, id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get school: %v", err)
	}
	if school == nil {
		return nil, status.Error(codes.NotFound, "school not found")
	}

	return &schoolPb.SchoolResponse{
		School: convertSchoolToProto(school),
	}, nil
}

func (h *GrpcHandler) ListSchools(ctx context.Context, req *schoolPb.ListSchoolsRequest) (*schoolPb.ListSchoolsResponse, error) {
	schools, total, err := h.service.ListSchools(ctx, int64(req.Page), int64(req.Limit))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list schools: %v", err)
	}

	var protoSchools []*schoolPb.School
	for _, school := range schools {
		protoSchools = append(protoSchools, convertSchoolToProto(school))
	}

	return &schoolPb.ListSchoolsResponse{
		Schools: protoSchools,
		Total:   int32(total),
		Page:    req.Page,
		Limit:   req.Limit,
	}, nil
}

func (h *GrpcHandler) UpdateSchool(ctx context.Context, req *schoolPb.UpdateSchoolRequest) (*schoolPb.SchoolResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid school ID: %v", err)
	}

	school := &model.School{
		ID: id,
		Name: coreModel.LocalizedName{
			ThName: req.Name.ThName,
			EnName: req.Name.EnName,
		},
		Acronym: req.Acronym,
		Details: coreModel.LocalizedDetails{
			ThDetails: req.Details.ThDetails,
			EnDetails: req.Details.EnDetails,
		},
		Photos: coreModel.Photos{
			CoverPhoto:     req.Photos.CoverPhoto,
			BannerPhoto:    req.Photos.BannerPhoto,
			ThumbnailPhoto: req.Photos.ThumbnailPhoto,
			LogoPhoto:      req.Photos.LogoPhoto,
		},
	}

	if err := h.service.UpdateSchool(ctx, school); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update school: %v", err)
	}

	return &schoolPb.SchoolResponse{
		School: convertSchoolToProto(school),
	}, nil
}

func (h *GrpcHandler) DeleteSchool(ctx context.Context, req *schoolPb.DeleteSchoolRequest) (*schoolPb.DeleteSchoolResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid school ID: %v", err)
	}

	if err := h.service.DeleteSchool(ctx, id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete school: %v", err)
	}

	return &schoolPb.DeleteSchoolResponse{
		Success: true,
	}, nil
}

// Helper function to convert model.School to pb.School
func convertSchoolToProto(school *model.School) *schoolPb.School {
	return &schoolPb.School{
		Id: school.ID.Hex(),
		Name: &schoolPb.LocalizedName{
			ThName: school.Name.ThName,
			EnName: school.Name.EnName,
		},
		Acronym: school.Acronym,
		Details: &schoolPb.LocalizedDetails{
			ThDetails: school.Details.ThDetails,
			EnDetails: school.Details.EnDetails,
		},
		Photos: &schoolPb.SchoolPhotos{
			CoverPhoto:     school.Photos.CoverPhoto,
			BannerPhoto:    school.Photos.BannerPhoto,
			ThumbnailPhoto: school.Photos.ThumbnailPhoto,
			LogoPhoto:      school.Photos.LogoPhoto,
		},
		CreatedAt: timestamppb.New(school.CreatedAt),
		UpdatedAt: timestamppb.New(school.UpdatedAt),
	}
} 