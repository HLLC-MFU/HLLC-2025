package dto

import (
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
	}

	ResponseRoomMemberDto struct {
		ID      primitive.ObjectID `bson:"_id,omitempty" json:"_id,omitempty"`
		Members []struct {
			User struct {
				ID       string `json:"_id"`
				Username string `json:"username"`
			} `json:"user"`
		} `json:"members"`
	}
)
