package model

import (
	"time"
)

// Base model with common fields
type (
	Base struct {
		CreatedAt time.Time `bson:"created_at" json:"created_at"`
		UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
	}

	LocalizedName struct {
		ThName string `bson:"th" json:"th" validate:"required"`
		EnName string `bson:"en" json:"en" validate:"required"`
	}

	LocalizedDetails struct {
		ThDetails string `bson:"th" json:"th" validate:"required"`
		EnDetails string `bson:"en" json:"en" validate:"required"`
	}

	LocalizedAcronym struct {
		ThAcronym string `bson:"th" json:"th" validate:"required"`
		EnAcronym string `bson:"en" json:"en" validate:"required"`
	}

	Photos struct {
		CoverPhoto     string `bson:"cover_photo" json:"cover_photo"`
		BannerPhoto    string `bson:"banner_photo" json:"banner_photo"`
		ThumbnailPhoto string `bson:"thumbnail_photo" json:"thumbnail_photo"`
		LogoPhoto      string `bson:"logo_photo" json:"logo_photo"`
	}

	
)

// // Photos represents a collection of photos for an entity
// type Photos struct {
// 	CoverPhoto     string `bson:"cover_photo" json:"cover_photo"`
// 	BannerPhoto    string `bson:"banner_photo" json:"banner_photo"`
// 	ThumbnailPhoto string `bson:"thumbnail_photo" json:"thumbnail_photo"`
// 	LogoPhoto      string `bson:"logo_photo" json:"logo_photo"`
// }

// // School represents a school entity
// type School struct {
// 	ID        primitive.ObjectID `bson:"_id" json:"id"`
// 	Name      LocalizedName      `bson:"name" json:"name"`
// 	Acronym   string             `bson:"acronym" json:"acronym"`
// 	Details   LocalizedDetails   `bson:"details" json:"details"`
// 	Photos    Photos             `bson:"photos" json:"photos"`
// 	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
// 	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
// }

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