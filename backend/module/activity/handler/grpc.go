package handler

// import (
// 	"context"
// 	"time"

// 	"github.com/HLLC-MFU/HLLC-2025/backend/config"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/controller"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/dto"
// 	activityPb "github.com/HLLC-MFU/HLLC-2025/backend/module/activity/proto/generated"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/module/activity/service"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
// 	corePb "github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated"
// 	"google.golang.org/grpc/codes"
// 	"google.golang.org/grpc/status"
// 	"google.golang.org/protobuf/types/known/timestamppb"
// )

// // GRPCHandler implements the ActivityService gRPC service
// type GRPCHandler struct {
// 	activityPb.UnimplementedActivityServiceServer
// 	cfg                *config.Config
// 	activityController controller.ActivityController
// }

// // NewGRPCHandler creates a new gRPC handler for activity module
// func NewGRPCHandler(cfg *config.Config, activityController controller.ActivityController) *GRPCHandler {
// 	return &GRPCHandler{
// 		cfg:                cfg,
// 		activityController: activityController,
// 	}
// }

// // CreateActivity handles creating a new activity
// func (h *GRPCHandler) CreateActivity(ctx context.Context, req *activityPb.CreateActivityRequest) (*activityPb.ActivityResponse, error) {
// 	// Convert proto request to DTO
// 	dtoReq := &dto.CreateActivityRequest{
// 		Name: dto.LocalizedNameRequest{
// 			ThName: req.Name.ThName,
// 			EnName: req.Name.EnName,
// 		},
// 		ShortName: dto.LocalizedNameRequest{
// 			ThName: req.ShortName.ThName,
// 			EnName: req.ShortName.EnName,
// 		},
// 		Code: req.Code,
// 		Type: int(req.Type),
// 		Description: dto.LocalizedDetailsRequest{
// 			ThDetails: req.Description.ThDetails,
// 			EnDetails: req.Description.EnDetails,
// 		},
// 		ShortDesc: dto.LocalizedDetailsRequest{
// 			ThDetails: req.ShortDesc.ThDetails,
// 			EnDetails: req.ShortDesc.EnDetails,
// 		},
// 		Open:     req.Open,
// 		Progress: req.Progress,
// 		Show:     req.Show,
// 		Icon:     req.Icon,
// 		Banner:   req.Banner,
// 	}

// 	// Call controller with timeout
// 	result, err := decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
// 		return h.activityController.CreateActivity(ctx, dtoReq)
// 	})(ctx)

// 	if err != nil {
// 		if err == service.ErrActivityExists {
// 			return nil, status.Error(codes.AlreadyExists, "Activity with this code already exists")
// 		}
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	// Convert DTO response to proto response
// 	return &activityPb.ActivityResponse{
// 		Activity: convertDTOToProto(result),
// 	}, nil
// }

// // GetActivity handles retrieving an activity by ID
// func (h *GRPCHandler) GetActivity(ctx context.Context, req *activityPb.GetActivityRequest) (*activityPb.ActivityResponse, error) {
// 	// Call controller with timeout
// 	result, err := decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
// 		return h.activityController.GetActivityByID(ctx, req.Id)
// 	})(ctx)

// 	if err != nil {
// 		if err == service.ErrNotFound {
// 			return nil, status.Error(codes.NotFound, "Activity not found")
// 		}
// 		if err == service.ErrInvalidID {
// 			return nil, status.Error(codes.InvalidArgument, "Invalid activity ID")
// 		}
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	// Convert DTO response to proto response
// 	return &activityPb.ActivityResponse{
// 		Activity: convertDTOToProto(result),
// 	}, nil
// }

// // GetActivityByCode handles retrieving an activity by code
// func (h *GRPCHandler) GetActivityByCode(ctx context.Context, req *activityPb.GetActivityByCodeRequest) (*activityPb.ActivityResponse, error) {
// 	// Call controller with timeout
// 	result, err := decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
// 		return h.activityController.GetActivityByCode(ctx, req.Code)
// 	})(ctx)

// 	if err != nil {
// 		if err == service.ErrNotFound {
// 			return nil, status.Error(codes.NotFound, "Activity not found")
// 		}
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	// Convert DTO response to proto response
// 	return &activityPb.ActivityResponse{
// 		Activity: convertDTOToProto(result),
// 	}, nil
// }

// // ListActivities handles retrieving all activities
// func (h *GRPCHandler) ListActivities(ctx context.Context, req *activityPb.ListActivitiesRequest) (*activityPb.ListActivitiesResponse, error) {
// 	// Call controller with timeout
// 	results, err := decorator.WithTimeout[[]*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) ([]*dto.ActivityResponse, error) {
// 		return h.activityController.GetAllActivities(ctx)
// 	})(ctx)

// 	if err != nil {
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	// Convert DTO responses to proto responses
// 	protoActivities := make([]*activityPb.Activity, len(results))
// 	for i, activity := range results {
// 		protoActivities[i] = convertDTOToProto(activity)
// 	}

// 	return &activityPb.ListActivitiesResponse{
// 		Activities: protoActivities,
// 		Pagination: &corePb.PaginationResponse{
// 			Total: int32(len(results)),
// 			Page:  1,
// 			Limit: int32(len(results)),
// 		},
// 	}, nil
// }

// // UpdateActivity handles updating an activity
// func (h *GRPCHandler) UpdateActivity(ctx context.Context, req *activityPb.UpdateActivityRequest) (*activityPb.ActivityResponse, error) {
// 	// Convert proto request to DTO
// 	name := &dto.LocalizedNameRequest{
// 		ThName: req.Name.ThName,
// 		EnName: req.Name.EnName,
// 	}
// 	shortName := &dto.LocalizedNameRequest{
// 		ThName: req.ShortName.ThName,
// 		EnName: req.ShortName.EnName,
// 	}
// 	description := &dto.LocalizedDetailsRequest{
// 		ThDetails: req.Description.ThDetails,
// 		EnDetails: req.Description.EnDetails,
// 	}
// 	shortDesc := &dto.LocalizedDetailsRequest{
// 		ThDetails: req.ShortDesc.ThDetails,
// 		EnDetails: req.ShortDesc.EnDetails,
// 	}
// 	activityType := int(req.Type)

// 	dtoReq := &dto.UpdateActivityRequest{
// 		Name:        name,
// 		ShortName:   shortName,
// 		Code:        &req.Code,
// 		Type:        &activityType,
// 		Description: description,
// 		ShortDesc:   shortDesc,
// 		Open:        &req.Open,
// 		Progress:    &req.Progress,
// 		Show:        &req.Show,
// 		Icon:        &req.Icon,
// 		Banner:      &req.Banner,
// 	}

// 	// Call controller with timeout
// 	result, err := decorator.WithTimeout[*dto.ActivityResponse](10*time.Second)(func(ctx context.Context) (*dto.ActivityResponse, error) {
// 		return h.activityController.UpdateActivity(ctx, req.Id, dtoReq)
// 	})(ctx)

// 	if err != nil {
// 		if err == service.ErrNotFound {
// 			return nil, status.Error(codes.NotFound, "Activity not found")
// 		}
// 		if err == service.ErrInvalidID {
// 			return nil, status.Error(codes.InvalidArgument, "Invalid activity ID")
// 		}
// 		if err == service.ErrActivityExists {
// 			return nil, status.Error(codes.AlreadyExists, "Activity with this code already exists")
// 		}
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	// Convert DTO response to proto response
// 	return &activityPb.ActivityResponse{
// 		Activity: convertDTOToProto(result),
// 	}, nil
// }

// // DeleteActivity handles deleting an activity
// func (h *GRPCHandler) DeleteActivity(ctx context.Context, req *activityPb.DeleteActivityRequest) (*activityPb.DeleteActivityResponse, error) {
// 	// Call controller with timeout
// 	_, err := decorator.WithTimeout[struct{}](10*time.Second)(func(ctx context.Context) (struct{}, error) {
// 		err := h.activityController.DeleteActivity(ctx, req.Id)
// 		return struct{}{}, err
// 	})(ctx)

// 	if err != nil {
// 		if err == service.ErrNotFound {
// 			return nil, status.Error(codes.NotFound, "Activity not found")
// 		}
// 		if err == service.ErrInvalidID {
// 			return nil, status.Error(codes.InvalidArgument, "Invalid activity ID")
// 		}
// 		return nil, status.Error(codes.Internal, err.Error())
// 	}

// 	return &activityPb.DeleteActivityResponse{
// 		Success: true,
// 	}, nil
// }

// // Helper function to convert DTO response to proto response
// func convertDTOToProto(activity *dto.ActivityResponse) *activityPb.Activity {
// 	return &activityPb.Activity{
// 		Id: activity.ID,
// 		Name: &corePb.LocalizedName{
// 			ThName: activity.Name.ThName,
// 			EnName: activity.Name.EnName,
// 		},
// 		ShortName: &corePb.LocalizedName{
// 			ThName: activity.ShortName.ThName,
// 			EnName: activity.ShortName.EnName,
// 		},
// 		Code: activity.Code,
// 		Type: activityPb.ActivityType(activity.Type),
// 		Description: &corePb.LocalizedDetails{
// 			ThDetails: activity.Description.ThDetails,
// 			EnDetails: activity.Description.EnDetails,
// 		},
// 		ShortDesc: &corePb.LocalizedDetails{
// 			ThDetails: activity.ShortDesc.ThDetails,
// 			EnDetails: activity.ShortDesc.EnDetails,
// 		},
// 		Open:     activity.Open,
// 		Progress: activity.Progress,
// 		Show:     activity.Show,
// 		Icon:     activity.Icon,
// 		Banner:   activity.Banner,
// 		CreatedAt: &timestamppb.Timestamp{
// 			Seconds: activity.CreatedAt.Unix(),
// 			Nanos:   int32(activity.CreatedAt.Nanosecond()),
// 		},
// 		UpdatedAt: &timestamppb.Timestamp{
// 			Seconds: activity.UpdatedAt.Unix(),
// 			Nanos:   int32(activity.UpdatedAt.Nanosecond()),
// 		},
// 	}
// }