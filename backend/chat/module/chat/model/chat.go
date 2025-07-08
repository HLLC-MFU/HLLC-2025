package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ( 
	ChatMessage struct {
		ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
		RoomID    primitive.ObjectID  `bson:"room_id" json:"room_id"`
		UserID    primitive.ObjectID  `bson:"user_id" json:"user_id"` // Will be populated with user data
		Message   string              `bson:"message" json:"message"`
		Mentions  []string            `bson:"mentions,omitempty" json:"mentions,omitempty"` // Array of mentioned user IDs (for easy querying)
		MentionInfo []MentionInfo     `bson:"mention_info,omitempty" json:"mentionInfo,omitempty"` // Detailed mention information
		ReplyToID *primitive.ObjectID `bson:"reply_to_id,omitempty" json:"reply_to_id,omitempty"`
		FileName  string              `bson:"file_name,omitempty" json:"file_name,omitempty"`
		Timestamp time.Time           `bson:"timestamp" json:"timestamp"`
		StickerID *primitive.ObjectID `bson:"sticker_id,omitempty" json:"stickerId,omitempty"`
		Image     string              `bson:"image,omitempty" json:"image,omitempty"`
		
		// **NEW: Evoucher fields**
		EvoucherInfo *EvoucherInfo     `bson:"evoucher_info,omitempty" json:"evoucherInfo,omitempty"`
		
		// **NEW: Moderation fields**
		ModerationInfo *ModerationMessageInfo `bson:"moderation_info,omitempty" json:"moderationInfo,omitempty"`
		
		// **NEW: Soft delete fields for unsend functionality**
		IsDeleted *bool               `bson:"is_deleted,omitempty" json:"isDeleted,omitempty"`
		DeletedAt *time.Time          `bson:"deleted_at,omitempty" json:"deletedAt,omitempty"`
		DeletedBy *primitive.ObjectID `bson:"deleted_by,omitempty" json:"deletedBy,omitempty"`
		
		// **NEW: CreatedAt and UpdatedAt fields**
		CreatedAt time.Time `bson:"created_at" json:"created_at"`
		UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
	}

	ChatMessageEnriched struct {
		ChatMessage ChatMessage       `bson:"chat"`
		ReplyTo     *ChatMessage      `bson:"replyTo,omitempty"`
		Username    string            `bson:"username,omitempty"`
	}

	// **NEW: Evoucher information structure**
	EvoucherInfo struct {
		Message      struct {
			Th string `bson:"th" json:"th"`
			En string `bson:"en" json:"en"`
		} `bson:"message" json:"message"`
		ClaimURL     string                 `bson:"claim_url" json:"claimUrl"`
		SponsorImage string                 `bson:"sponsor_image" json:"sponsorImage"`
		// **NEW: Track claimed users**
		ClaimedBy    []primitive.ObjectID   `bson:"claimed_by,omitempty" json:"claimedBy,omitempty"`
	}

	// **NEW: Moderation message information**
	ModerationMessageInfo struct {
		ID           primitive.ObjectID `bson:"_id" json:"id"`
		Restriction  string             `bson:"restriction" json:"restriction"`
		RoomID       primitive.ObjectID `bson:"room_id" json:"room_id"`
		UserID       primitive.ObjectID `bson:"user_id" json:"user_id"`
		Timestamp    time.Time          `bson:"timestamp" json:"timestamp"`
	}


)
