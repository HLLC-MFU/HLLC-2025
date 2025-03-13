package config

type Grpc struct {
	AuthUrl   string `mapstructure:"AUTH_URL"`
	UserUrl   string `mapstructure:"USER_URL"`
	SchoolUrl string `mapstructure:"SCHOOL_URL"`
	MajorUrl  string `mapstructure:"MAJOR_URL"`
}

type Jwt struct {
	AccessSecretKey  string `mapstructure:"ACCESS_SECRET_KEY"`
	RefreshSecretKey string `mapstructure:"REFRESH_SECRET_KEY"`
}

type Config struct {
	Grpc Grpc `mapstructure:"GRPC"`
	Jwt  Jwt  `mapstructure:"JWT"`
} 