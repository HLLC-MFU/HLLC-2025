package types

// LocalizedName represents a name in multiple languages
type LocalizedName struct {
	Th string `json:"th" bson:"th"`
	En string `json:"en" bson:"en"`
}