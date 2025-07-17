package dto

import (
	"chat/module/room/room/model"
	"chat/pkg/common"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	ResponseRoomDto struct {
		ID          primitive.ObjectID     `bson:"_id,omitempty" json:"_id,omitempty"`
		Name        common.LocalizedName   `bson:"name" json:"name"`
		Type        string                 `bson:"type" json:"type"`
		Status      string                 `bson:"status" json:"status"`
		Capacity    int                    `bson:"capacity" json:"capacity"`
		CreatedBy   primitive.ObjectID     `bson:"createdBy" json:"createdBy"`
		Image       string                 `bson:"image,omitempty" json:"image,omitempty"`
		CreatedAt   time.Time              `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time              `bson:"updatedAt" json:"updatedAt"`
		Metadata    map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
		MemberCount int                    `bson:"memberCount" json:"memberCount"`
		CanJoin     bool                   `json:"canJoin,omitempty"`
		Schedule    *model.RoomSchedule    `bson:"schedule,omitempty" json:"schedule,omitempty"` // เพิ่มฟิลด์ schedule
	}

	ResponseAllRoomForUserDto struct {
		ID          primitive.ObjectID     `bson:"_id,omitempty" json:"_id,omitempty"`
		Name        common.LocalizedName   `bson:"name" json:"name"`
		Type        string                 `bson:"type" json:"type"`
		Status      string                 `bson:"status" json:"status"`
		Capacity    int                    `bson:"capacity" json:"capacity"`
		CreatedBy   primitive.ObjectID     `bson:"createdBy" json:"createdBy"`
		Image       string                 `bson:"image,omitempty" json:"image,omitempty"`
		CreatedAt   time.Time              `bson:"createdAt" json:"createdAt"`
		UpdatedAt   time.Time              `bson:"updatedAt" json:"updatedAt"`
		Metadata    map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
		IsMember    bool                   `json:"isMember"`
		CanJoin     bool                   `json:"canJoin"`
		MemberCount int                    `json:"memberCount"`
		Schedule    *model.RoomSchedule    `bson:"schedule,omitempty" json:"schedule,omitempty"` // เพิ่มฟิลด์ schedule
	}

	ResponseRoomMemberDto struct {
		ID      primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
		Name    common.LocalizedName `bson:"name" json:"name"`
		Type    string               `bson:"type" json:"type"`
		Members []MemberResponse `json:"members"`
	}

	MemberResponse struct {
		User struct {
			ID       string `json:"_id"`
			Username string `json:"username"`
			Name common.Name `json:"name"`
			Role struct {
				ID   primitive.ObjectID `json:"_id"`
				Name string `json:"name"`
			}
		} `json:"user"`
	}

	ResponseRoomsByTypeDto struct {
		Data []ResponseRoomDto `json:"data"`
		Meta struct {
			Total      int64 `json:"total"`
			Page       int64 `json:"page"`
			Limit      int64 `json:"limit"`
			TotalPages int64 `json:"totalPages"`
		} `json:"meta"`
	}
)
