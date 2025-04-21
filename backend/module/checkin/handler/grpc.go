package handler

import (
	"context"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/dto"
	checkinPb "github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/service"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	corePb "github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// GRPCHandler implements the CheckInService gRPC service
type GRPCHandler struct {
	checkinPb.UnimplementedCheckInServiceServer
	cfg              *config.Config
	checkInController controller.CheckInController
}

// NewGRPCHandler creates a new gRPC handler for checkin module
func NewGRPCHandler(cfg *config.Config, checkInController controller.CheckInController) *GRPCHandler {
	return &GRPCHandler{
		cfg:              cfg,
		checkInController: checkInController,
	}
}

// CreateCheckIn handles creating a new check-in
func (h *GRPCHandler) CreateCheckIn(ctx context.Context, req *checkinPb.CreateCheckInRequest) (*checkinPb.CheckInResponse, error) {
	// Convert proto request to DTO
	dtoReq := &dto.CreateCheckInRequest{
		UserID:     req.UserId,
		ActivityID: req.ActivityId,
		StaffID:    req.StaffId,
	}

	// Call controller with timeout
	result, err := decorator.WithTimeout[*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) (*dto.CheckInResponse, error) {
		return h.checkInController.CreateCheckIn(ctx, dtoReq)
	})(ctx)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert DTO response to proto response
	return &checkinPb.CheckInResponse{
		CheckIn: convertDTOToProto(result),
	}, nil
}

// GetCheckIn handles retrieving a check-in by ID
func (h *GRPCHandler) GetCheckIn(ctx context.Context, req *checkinPb.GetCheckInRequest) (*checkinPb.CheckInResponse, error) {
	// Call controller with timeout
	result, err := decorator.WithTimeout[*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) (*dto.CheckInResponse, error) {
		return h.checkInController.GetCheckInByID(ctx, req.Id)
	})(ctx)

	if err != nil {
		if err == service.ErrNotFound {
			return nil, status.Error(codes.NotFound, "Check-in not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert DTO response to proto response
	return &checkinPb.CheckInResponse{
		CheckIn: convertDTOToProto(result),
	}, nil
}

// GetCheckInsByUser handles retrieving check-ins by user ID
func (h *GRPCHandler) GetCheckInsByUser(ctx context.Context, req *checkinPb.GetCheckInsByUserRequest) (*checkinPb.CheckInsListResponse, error) {
	// Call controller with timeout
	results, err := decorator.WithTimeout[[]*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) ([]*dto.CheckInResponse, error) {
		// Assume controller just returns the check-ins without pagination for simplicity
		return h.checkInController.GetCheckInsByUserID(ctx, req.UserId)
	})(ctx)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert DTO responses to proto responses
	protoCheckIns := make([]*checkinPb.CheckIn, len(results))
	for i, checkIn := range results {
		protoCheckIns[i] = convertDTOToProto(checkIn)
	}

	return &checkinPb.CheckInsListResponse{
		CheckIns: protoCheckIns,
		Pagination: &corePb.PaginationResponse{
			Total: int32(len(results)),
			Page:  1,
			Limit: int32(len(results)),
		},
	}, nil
}

// GetCheckInsByActivity handles retrieving check-ins by activity ID
func (h *GRPCHandler) GetCheckInsByActivity(ctx context.Context, req *checkinPb.GetCheckInsByActivityRequest) (*checkinPb.CheckInsListResponse, error) {
	// Call controller with timeout
	results, err := decorator.WithTimeout[[]*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) ([]*dto.CheckInResponse, error) {
		// Assume controller just returns the check-ins without pagination for simplicity
		return h.checkInController.GetCheckInsByActivityID(ctx, req.ActivityId)
	})(ctx)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert DTO responses to proto responses
	protoCheckIns := make([]*checkinPb.CheckIn, len(results))
	for i, checkIn := range results {
		protoCheckIns[i] = convertDTOToProto(checkIn)
	}

	return &checkinPb.CheckInsListResponse{
		CheckIns: protoCheckIns,
		Pagination: &corePb.PaginationResponse{
			Total: int32(len(results)),
			Page:  1,
			Limit: int32(len(results)),
		},
	}, nil
}

// GetActivityStats handles retrieving stats for an activity
func (h *GRPCHandler) GetActivityStats(ctx context.Context, req *checkinPb.GetActivityStatsRequest) (*checkinPb.ActivityStatsResponse, error) {
	// Call controller with timeout
	stats, err := decorator.WithTimeout[*dto.CheckInStatsResponse](10*time.Second)(func(ctx context.Context) (*dto.CheckInStatsResponse, error) {
		return h.checkInController.GetActivityStats(ctx, req.ActivityId)
	})(ctx)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert to proto response
	return &checkinPb.ActivityStatsResponse{
		ActivityId:  req.ActivityId,
		TotalUsers:  int32(stats.TotalUsers),
		CheckedIn:   int32(stats.CheckedIn),
		Percentage:  stats.Percentage,
	}, nil
}

// GetAllCheckIns handles retrieving all check-ins
func (h *GRPCHandler) GetAllCheckIns(ctx context.Context, req *checkinPb.GetAllCheckInsRequest) (*checkinPb.CheckInsListResponse, error) {
	// Call controller with timeout
	results, err := decorator.WithTimeout[[]*dto.CheckInResponse](10*time.Second)(func(ctx context.Context) ([]*dto.CheckInResponse, error) {
		return h.checkInController.GetAllCheckIns(ctx)
	})(ctx)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert DTO responses to proto responses
	protoCheckIns := make([]*checkinPb.CheckIn, len(results))
	for i, checkIn := range results {
		protoCheckIns[i] = convertDTOToProto(checkIn)
	}

	return &checkinPb.CheckInsListResponse{
		CheckIns: protoCheckIns,
		Pagination: &corePb.PaginationResponse{
			Total: int32(len(results)),
			Page:  1,
			Limit: int32(len(results)),
		},
	}, nil
}

// DeleteCheckIn handles deleting a check-in
func (h *GRPCHandler) DeleteCheckIn(ctx context.Context, req *checkinPb.DeleteCheckInRequest) (*checkinPb.DeleteCheckInResponse, error) {
	// Call controller with timeout
	_, err := decorator.WithTimeout[any](10*time.Second)(func(ctx context.Context) (any, error) {
		return nil, h.checkInController.DeleteCheckIn(ctx, req.Id)
	})(ctx)

	if err != nil {
		if err == service.ErrNotFound {
			return nil, status.Error(codes.NotFound, "Check-in not found")
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &checkinPb.DeleteCheckInResponse{
		Success: true,
	}, nil
}

// BulkCheckIn handles creating multiple check-ins at once
func (h *GRPCHandler) BulkCheckIn(ctx context.Context, req *checkinPb.BulkCheckInRequest) (*checkinPb.BulkCheckInResponse, error) {
	// Convert proto request to DTO
	dtoReq := &dto.BulkCheckInRequest{
		UserIDs:    req.UserIds,
		ActivityID: req.ActivityId,
		StaffID:    req.StaffId,
	}

	// Call controller with timeout
	result, err := decorator.WithTimeout[*dto.BulkCheckInResponse](20*time.Second)(func(ctx context.Context) (*dto.BulkCheckInResponse, error) {
		return h.checkInController.BulkCheckIn(ctx, dtoReq)
	})(ctx)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert failed check-ins
	protoFailed := make([]*checkinPb.FailedCheckIn, len(result.Failed))
	for i, failed := range result.Failed {
		protoFailed[i] = &checkinPb.FailedCheckIn{
			UserId: failed.UserID,
			Reason: failed.Reason,
		}
	}

	// Convert DTO response to proto response
	return &checkinPb.BulkCheckInResponse{
		Successful: result.Successful,
		Failed:     protoFailed,
	}, nil
}

// GetUserActivityStatus handles checking a user's status for an activity
func (h *GRPCHandler) GetUserActivityStatus(ctx context.Context, req *checkinPb.GetUserActivityStatusRequest) (*checkinPb.UserActivityStatusResponse, error) {
	// Call controller with timeout
	userStatus, err := decorator.WithTimeout[*dto.UserActivityStatusResponse](10*time.Second)(func(ctx context.Context) (*dto.UserActivityStatusResponse, error) {
		return h.checkInController.GetUserActivityStatus(ctx, req.UserId, req.ActivityId)
	})(ctx)

	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	// Convert to proto timestamp if not zero
	var protoTimestamp *timestamppb.Timestamp
	if !userStatus.Timestamp.IsZero() {
		protoTimestamp = &timestamppb.Timestamp{
			Seconds: userStatus.Timestamp.Unix(),
			Nanos:   int32(userStatus.Timestamp.Nanosecond()),
		}
	}

	return &checkinPb.UserActivityStatusResponse{
		UserId:     req.UserId,
		ActivityId: req.ActivityId,
		CheckInId:  userStatus.CheckInID,
		Status: &checkinPb.ActivityProgress{
			Step:    int32(userStatus.Status.Step),
			Message: userStatus.Status.Message,
		},
		CheckedIn: userStatus.CheckedIn,
		Timestamp: protoTimestamp,
	}, nil
}

// Helper function to convert DTO response to proto response
func convertDTOToProto(checkIn *dto.CheckInResponse) *checkinPb.CheckIn {
	var timestamp, createdAt, updatedAt *timestamppb.Timestamp
	
	if !checkIn.Timestamp.IsZero() {
		timestamp = &timestamppb.Timestamp{
			Seconds: checkIn.Timestamp.Unix(),
			Nanos:   int32(checkIn.Timestamp.Nanosecond()),
		}
	}
	
	if !checkIn.CreatedAt.IsZero() {
		createdAt = &timestamppb.Timestamp{
			Seconds: checkIn.CreatedAt.Unix(),
			Nanos:   int32(checkIn.CreatedAt.Nanosecond()),
		}
	}
	
	if !checkIn.UpdatedAt.IsZero() {
		updatedAt = &timestamppb.Timestamp{
			Seconds: checkIn.UpdatedAt.Unix(),
			Nanos:   int32(checkIn.UpdatedAt.Nanosecond()),
		}
	}

	return &checkinPb.CheckIn{
		Id:         checkIn.ID,
		UserId:     checkIn.UserID,
		ActivityId: checkIn.ActivityID,
		StaffId:    checkIn.StaffID,
		Timestamp:  timestamp,
		CreatedAt:  createdAt,
		UpdatedAt:  updatedAt,
	}
} 