package common

import (
	"time"
)

type (
	Base struct {
		CreatedAt time.Time `bson:"created_at" json:"created_at"`
		UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
	}

	LocalizedName struct {
		Th string `bson:"th" json:"th" validate:"required"`
		En string `bson:"en" json:"en" validate:"required"`
	}	

	Photo struct {
		CoverPhoto     string `bson:"coverPhoto" json:"coverPhoto"`
		BannerPhoto    string `bson:"bannerPhoto" json:"bannerPhoto"`
		ThumbnailPhoto string `bson:"thumbnailPhoto" json:"thumbnailPhoto"`
		LogoPhoto      string `bson:"logoPhoto" json:"logoPhoto"`
	}
)

// Decorator for MongoDB collection name
func Collection(name string) interface{} {
	return struct {
		Collection string
	}{
		Collection: name,
	}
}

// Decorator for MongoDB index
func Index(keys ...string) interface{} {
	return struct {
		Keys []string
	}{
		Keys: keys,
	}
}