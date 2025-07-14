package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type (
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
)