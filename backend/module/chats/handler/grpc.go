package handler

import (
	"context"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/model"
	chatPb "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/chats/service"
	coreModel "github.com/HLLC-MFU/HLLC-2025/backend/pkg/core/model"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GrpcHandler struct {
	chatPb.UnimplementedRoomServiceServer
	service service.Service
}

func NewGrpcHandler(service service.Service) *GrpcHandler {
	return &GrpcHandler{
		service: service,
	}
}

func (h *GrpcHandler) CreateRoom(ctx context.Context, req *chatPb.CreateRoomRequest) (*chatPb.RoomResponse, error) {
	room := &model.Room{
		Name: coreModel.LocalizedName{
			ThName: req.Name.ThName,
			EnName: req.Name.EnName,
		},
		Capacity: int(req.Capacity),
	}

	if err := h.service.CreateRoom(ctx, room); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create room: %v", err)
	}

	return &chatPb.RoomResponse{
		Room: convertRoomToProto(room),
	}, nil
}

func (h *GrpcHandler) GetRoom(ctx context.Context, req *chatPb.GetRoomRequest) (*chatPb.RoomResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid room ID: %v", err)
	}

	room, err := h.service.GetRoom(ctx, id)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get room: %v", err)
	}
	if room == nil {
		return nil, status.Error(codes.NotFound, "room not found")
	}

	return &chatPb.RoomResponse{
		Room: convertRoomToProto(room),
	}, nil
}

func (h *GrpcHandler) ListRooms(ctx context.Context, req *chatPb.ListRoomRequest) (*chatPb.ListRoomResponse, error) {
	rooms, total, err := h.service.ListRooms(ctx, int64(req.Page), int64(req.Limit))
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list rooms: %v", err)
	}

	var protoRooms []*chatPb.Room
	for _, room := range rooms {
		protoRooms = append(protoRooms, convertRoomToProto(room))
	}

	return &chatPb.ListRoomResponse{
		Rooms: protoRooms,
		Total: int32(total),
		Page:  req.Page,
		Limit: req.Limit,
	}, nil
}

func (h *GrpcHandler) UpdateRoom(ctx context.Context, req *chatPb.UpdateRoomRequest) (*chatPb.RoomResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid room ID: %v", err)
	}

	room := &model.Room{
		ID: id,
		Name: coreModel.LocalizedName{
			ThName: req.Name.ThName,
			EnName: req.Name.EnName,
		},
		Capacity: int(req.Capacity),
	}

	if err := h.service.UpdateRoom(ctx, room); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update room: %v", err)
	}

	return &chatPb.RoomResponse{
		Room: convertRoomToProto(room),
	}, nil
}

func (h *GrpcHandler) DeleteRoom(ctx context.Context, req *chatPb.DeleteRoomRequest) (*chatPb.DeleteRoomResponse, error) {
	id, err := primitive.ObjectIDFromHex(req.Id)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid room ID: %v", err)
	}

	if err := h.service.DeleteRoom(ctx, id); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to delete room: %v", err)
	}

	return &chatPb.DeleteRoomResponse{
		Success: true,
	}, nil
}

// Helper function to convert model.Room to pb.Room
func convertRoomToProto(room *model.Room) *chatPb.Room {
	return &chatPb.Room{
		Id: room.ID.Hex(),
		Name: &chatPb.LocalizeName{
			ThName: room.Name.ThName,
			EnName: room.Name.EnName,
		},
		Capacity: int32(room.Capacity),
	}
}
