package model

import "time"

// Base model with common fields
type Base struct {
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

// LocalizedName represents a name in multiple languages
type LocalizedName struct {
	ThName string `bson:"th_name" json:"th_name" validate:"required"`
	EnName string `bson:"en_name" json:"en_name" validate:"required"`
}

// LocalizedDetails represents details in multiple languages
type LocalizedDetails struct {
	ThDetails string `bson:"th_details" json:"th_details" validate:"required"`
	EnDetails string `bson:"en_details" json:"en_details" validate:"required"`
}

// Photos represents a collection of photos for an entity
type Photos struct {
	CoverPhoto     string `bson:"cover_photo" json:"cover_photo"`
	BannerPhoto    string `bson:"banner_photo" json:"banner_photo"`
	ThumbnailPhoto string `bson:"thumbnail_photo" json:"thumbnail_photo"`
	LogoPhoto      string `bson:"logo_photo" json:"logo_photo"`
}

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