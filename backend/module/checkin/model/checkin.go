package entity

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CheckIn represents a user check-in to an activity
type CheckIn struct {
	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID     primitive.ObjectID `json:"userId" bson:"user_id"`
	ActivityID primitive.ObjectID `json:"activityId" bson:"activity_id"`
	StaffID    primitive.ObjectID `json:"staffId" bson:"staff_id"`
	Timestamp  time.Time          `json:"timestamp" bson:"timestamp"`
	CreatedAt  time.Time          `json:"createdAt" bson:"created_at"`
	UpdatedAt  time.Time          `json:"updatedAt" bson:"updated_at"`
}

// ActivityProgress represents the progress status of an activity
type ActivityProgress struct {
	Step    int    `json:"step" bson:"step"`
	Message string `json:"message" bson:"message"`
}

// Create a new CheckIn entity with the given user, activity, and staff IDs
func NewCheckIn(userID, activityID, staffID primitive.ObjectID) *CheckIn {
	now := time.Now()
	return &CheckIn{
		ID:         primitive.NewObjectID(),
		UserID:     userID,
		ActivityID: activityID,
		StaffID:    staffID,
		Timestamp:  now,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
} 