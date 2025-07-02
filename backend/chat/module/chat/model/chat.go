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
		FileURL   string              `bson:"file_url,omitempty" json:"file_url,omitempty"`
		FileType  string              `bson:"file_type,omitempty" json:"file_type,omitempty"`
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
		
		// Fields NOT stored in database, only for response aggregation
		Reactions   []MessageReaction `bson:"-" json:"reactions,omitempty"`
		
		// **NEW: CreatedAt and UpdatedAt fields**
		CreatedAt time.Time `bson:"created_at" json:"created_at"`
		UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
	}

	MessageReaction struct {
		MessageID primitive.ObjectID `bson:"message_id" json:"message_id"`
		UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
		Reaction  string             `bson:"reaction" json:"reaction"`
		Timestamp time.Time          `bson:"timestamp" json:"timestamp"`
		
		// User data - populated when needed, not stored in database
		User interface{} `bson:"-" json:"user,omitempty"`
	}

	ChatMessageEnriched struct {
		ChatMessage ChatMessage       `bson:"chat"`
		Reactions   []MessageReaction `bson:"reactions"`
		ReplyTo     *ChatMessage      `bson:"replyTo,omitempty"`
		Username    string            `bson:"username,omitempty"`
	}

	// **NEW: Evoucher information structure**
	EvoucherInfo struct {
		Title       string                 `bson:"title" json:"title"`
		Description string                 `bson:"description" json:"description"`
		ClaimURL    string                 `bson:"claim_url" json:"claimUrl"`
	}

	// **NEW: Moderation message information**
	ModerationMessageInfo struct {
		Action        string              `bson:"action" json:"action"`                // "ban", "mute", "kick", "unban", "unmute"
		TargetUserID  primitive.ObjectID  `bson:"target_user_id" json:"targetUserId"` // User ที่ถูกลงโทษ
		ModeratorID   primitive.ObjectID  `bson:"moderator_id" json:"moderatorId"`    // Admin ที่ทำการลงโทษ
		Reason        string              `bson:"reason" json:"reason"`               // เหตุผล
		Duration      string              `bson:"duration" json:"duration"`           // "temporary" หรือ "permanent"
		EndTime       *time.Time          `bson:"end_time,omitempty" json:"endTime,omitempty"` // เวลาสิ้นสุด
		Restriction   string              `bson:"restriction,omitempty" json:"restriction,omitempty"` // สำหรับ mute
	}
)
