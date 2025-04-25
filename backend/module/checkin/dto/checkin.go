package dto

import (
	"time"

	entity "github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/model"
)

// CreateCheckInRequest represents the request to create a new check-in
type CreateCheckInRequest struct {
	UserID     string `json:"userId" validate:"required"`
	ActivityID string `json:"activityId" validate:"required"`
	StaffID    string `json:"staffId" validate:"required"`
}

// CheckInResponse represents the response for a check-in
type CheckInResponse struct {
	ID         string    `json:"id"`
	UserID     string    `json:"userId"`
	ActivityID string    `json:"activityId"`
	StaffID    string    `json:"staffId"`
	Timestamp  time.Time `json:"timestamp"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// UserActivityStatusResponse represents the user's activity status/progress
type UserActivityStatusResponse struct {
	UserID     string                   `json:"userId"`
	ActivityID string                   `json:"activityId"`
	CheckInID  string                   `json:"checkInId,omitempty"`
	Status     *entity.ActivityProgress `json:"status"`
	CheckedIn  bool                     `json:"checkedIn"`
	Timestamp  *time.Time               `json:"timestamp,omitempty"`
}

// BulkCheckInRequest represents a request to check in multiple users at once
type BulkCheckInRequest struct {
	UserIDs    []string `json:"userIds" validate:"required,min=1"`
	ActivityID string   `json:"activityId" validate:"required"`
	StaffID    string   `json:"staffId" validate:"required"`
}

// BulkCheckInResponse represents the response for a bulk check-in operation
type BulkCheckInResponse struct {
	Successful []string `json:"successful"`
	Failed     []FailedCheckIn `json:"failed"`
}

// FailedCheckIn represents a failed check-in during bulk operation
type FailedCheckIn struct {
	UserID string `json:"userId"`
	Reason string `json:"reason"`
}

// CheckInStatsResponse represents statistics about check-ins
type CheckInStatsResponse struct {
	ActivityID string  `json:"activityId"`
	TotalUsers int     `json:"totalUsers"`
	CheckedIn  int     `json:"checkedIn"`
	Percentage float64 `json:"percentage"`
} 