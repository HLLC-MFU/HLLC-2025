package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type (
	EvoucherInfo struct {
		Title       string                 `bson:"title" json:"title"`
		Description string                 `bson:"description" json:"description"`
		ClaimURL    string                 `bson:"claim_url" json:"claimUrl"`
		// **NEW: Track claimed users**
		ClaimedBy   []primitive.ObjectID   `bson:"claimed_by,omitempty" json:"claimedBy,omitempty"`
	}
)