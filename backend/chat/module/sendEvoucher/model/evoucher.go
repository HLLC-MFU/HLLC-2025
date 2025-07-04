package model

type (
	EvoucherInfo struct {
	Title       string                 `bson:"title" json:"title"`
	Description string                 `bson:"description" json:"description"`
	ClaimURL    string                 `bson:"claim_url" json:"claimUrl"`
    }
)