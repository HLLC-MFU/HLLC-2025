package handler

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/model"
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/major/service"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	corePb "github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type GrpcHandler struct {
	majorPb.UnimplementedMajorServiceServer
	service service.Service
}

func NewGrpcHandler(service service.Service) *GrpcHandler {
	return &GrpcHandler{
		service: service,
	}
}

func (h *GrpcHandler) CreateMajor(ctx context.Context, req *majorPb.CreateMajorRequest) (*majorPb.MajorResponse, error) {
	schoolID, err := primitive.ObjectIDFromHex(req.SchoolId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid school ID: %v", err)
	}

	major := &model.Major{
		SchoolID: schoolID,
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

	if err := h.service.CreateMajor(ctx, major); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create major: %v", err)
	}

	return &majorPb.MajorResponse{
		Major: convertMajorToProto(major),
	}, nil
}

func (h *GrpcHandler) GetMajor(ctx context.Context, req *majorPb.GetMajorRequest) (*majorPb.MajorResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid major ID: %v", err)
	}

	major, err := h.service.GetMajor(ctx, id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get major: %v", err)
	}
	if major == nil {
		return nil, status.Error(codes.NotFound, "major not found")
	}

	return &majorPb.MajorResponse{
		Major: convertMajorToProto(major),
	}, nil
}

func (h *GrpcHandler) ListMajors(ctx context.Context, req *majorPb.ListMajorsRequest) (*majorPb.ListMajorsResponse, error) {
	page := int64(1)
	limit := int64(10)
	
	if req.Pagination != nil {
		page = int64(req.Pagination.Page)
		limit = int64(req.Pagination.Limit)
	}
	
	majors, total, err := h.service.ListMajors(ctx, page, limit)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list majors: %v", err)
	}

	var protoMajors []*majorPb.Major
	for _, major := range majors {
		protoMajors = append(protoMajors, convertMajorToProto(major))
	}

	return &majorPb.ListMajorsResponse{
		Majors: protoMajors,
		Pagination: &corePb.PaginationResponse{
			Total: int32(total),
			Page:  int32(page),
			Limit: int32(limit),
		},
	}, nil
}

func (h *GrpcHandler) ListMajorsBySchool(ctx context.Context, req *majorPb.ListMajorsBySchoolRequest) (*majorPb.ListMajorsResponse, error) {
	schoolID, err := primitive.ObjectIDFromHex(req.SchoolId)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid school ID: %v", err)
	}

	page := int64(1)
	limit := int64(10)
	
	if req.Pagination != nil {
		page = int64(req.Pagination.Page)
		limit = int64(req.Pagination.Limit)
	}

	majors, total, err := h.service.ListMajorsBySchool(ctx, schoolID, page, limit)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list majors by school: %v", err)
	}

	var protoMajors []*majorPb.Major
	for _, major := range majors {
		protoMajors = append(protoMajors, convertMajorToProto(major))
	}

	return &majorPb.ListMajorsResponse{
		Majors: protoMajors,
		Pagination: &corePb.PaginationResponse{
			Total: int32(total),
			Page:  int32(page),
			Limit: int32(limit),
		},
	}, nil
}

func (h *GrpcHandler) UpdateMajor(ctx context.Context, req *majorPb.UpdateMajorRequest) (*majorPb.MajorResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid major ID: %v", err)
	}

	major := &model.Major{
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

	if err := h.service.UpdateMajor(ctx, major); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update major: %v", err)
	}

	return &majorPb.MajorResponse{
		Major: convertMajorToProto(major),
	}, nil
}

func (h *GrpcHandler) DeleteMajor(ctx context.Context, req *majorPb.DeleteMajorRequest) (*majorPb.DeleteMajorResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid major ID: %v", err)
	}

	if err := h.service.DeleteMajor(ctx, id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete major: %v", err)
	}

	return &majorPb.DeleteMajorResponse{
		Success: true,
	}, nil
}

// Helper function to convert model.Major to pb.Major
func convertMajorToProto(major *model.Major) *majorPb.Major {
	protoMajor := &majorPb.Major{
		Id:       major.ID.Hex(),
		SchoolId: major.SchoolID.Hex(),
		Name: &corePb.LocalizedName{
			ThName: major.Name.ThName,
			EnName: major.Name.EnName,
		},
		Acronym: major.Acronym,
		Details: &corePb.LocalizedDetails{
			ThDetails: major.Details.ThDetails,
			EnDetails: major.Details.EnDetails,
		},
		Photos: &majorPb.MajorPhotos{
			CoverPhoto:     major.Photos.CoverPhoto,
			BannerPhoto:    major.Photos.BannerPhoto,
			ThumbnailPhoto: major.Photos.ThumbnailPhoto,
			LogoPhoto:      major.Photos.LogoPhoto,
		},
		CreatedAt: timestamppb.New(major.CreatedAt),
		UpdatedAt: timestamppb.New(major.UpdatedAt),
	}

	// Add school information if available
	if major.School != nil {
		protoMajor.School = &schoolPb.School{
			Id: major.School.ID.Hex(),
			Name: &schoolPb.LocalizedName{
				ThName: major.School.Name.ThName,
				EnName: major.School.Name.EnName,
			},
			Acronym: major.School.Acronym,
			Details: &schoolPb.LocalizedDetails{
				ThDetails: major.School.Details.ThDetails,
				EnDetails: major.School.Details.EnDetails,
			},
			Photos: &schoolPb.SchoolPhotos{
				CoverPhoto:     major.School.Photos.CoverPhoto,
				BannerPhoto:    major.School.Photos.BannerPhoto,
				ThumbnailPhoto: major.School.Photos.ThumbnailPhoto,
				LogoPhoto:      major.School.Photos.LogoPhoto,
			},
			CreatedAt: timestamppb.New(major.School.CreatedAt),
			UpdatedAt: timestamppb.New(major.School.UpdatedAt),
		}
	}

	return protoMajor
} 