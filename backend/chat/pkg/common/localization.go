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
		CoverPhoto     string `json:"coverPhoto" bson:"coverPhoto"`
		BannerPhoto    string `json:"bannerPhoto" bson:"bannerPhoto"`
		ThumbnailPhoto string `json:"thumbnailPhoto" bson:"thumbnailPhoto"`
		LogoPhoto      string `json:"logoPhoto" bson:"logoPhoto"`
	} 

	Name struct {
		First string `bson:"first" json:"first"`
		Middle string `bson:"middle" json:"middle"`
		Last  string `bson:"last" json:"last"`
	}
)

func Collection(name string) interface{} {
	return struct {
		Collection string
	}{
		Collection: name,
	}
}

func Index(keys ...string) interface{} {
	return struct {
		Keys []string
	}{
		Keys: keys,
	}
}