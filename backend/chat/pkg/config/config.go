package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

type (
	Config struct {
		App   AppConfig
		Mongo MongoConfig
	}

	AppConfig struct {
		Port string
		Env  string
	}

	MongoConfig struct {
		URI      string
		Database string
	}
)

// LoadConfig loads configuration from environment variables
// It will try to load .env file if it exists
func LoadConfig() (*Config, error) {
	// Try to load .env file
	envFile := ".env"
	if err := loadEnvFile(envFile); err != nil {
		// Log the error but continue - we'll use default values
		fmt.Printf("Warning: %v\n", err)
	}

	// Debug: Print all environment variables
	fmt.Println("Environment variables:")
	for _, env := range os.Environ() {
		fmt.Println(env)
	}

	// Load configuration
	config := &Config{
		App: AppConfig{
			Port: getEnvWithValidation("APP_PORT", "1443", validatePort),
			Env:  getEnvWithValidation("APP_ENV", "development", validateEnv),
		},
		Mongo: MongoConfig{
			URI:      getRequiredEnv("MONGO_URI", "mongodb://localhost:27017"),
			Database: getRequiredEnv("MONGO_DATABASE", "hllc-2025"),
		},
	}

	return config, nil
}

// loadEnvFile attempts to load the .env file
func loadEnvFile(filename string) error {
	// Get current working directory
	pwd, err := os.Getwd()
	if err != nil {
		return fmt.Errorf("error getting working directory: %v", err)
	}

	// Try to find .env file in current and parent directories
	envPath := findEnvFile(pwd, filename)
	if envPath == "" {
		return fmt.Errorf(".env file not found in current or parent directories (searched from %s)", pwd)
	}

	fmt.Printf("Loading .env file from: %s\n", envPath)

	// Check if file exists and is readable
	if _, err := os.Stat(envPath); err != nil {
		return fmt.Errorf("error accessing .env file at %s: %v", envPath, err)
	}

	// Try to read the file content
	content, err := os.ReadFile(envPath)
	if err != nil {
		return fmt.Errorf("error reading .env file at %s: %v", envPath, err)
	}

	if len(content) == 0 {
		return fmt.Errorf(".env file at %s is empty", envPath)
	}

	// Load .env file
	if err := godotenv.Load(envPath); err != nil {
		return fmt.Errorf("error parsing .env file at %s: %v", envPath, err)
	}

	fmt.Printf("Successfully loaded .env file from: %s\n", envPath)
	return nil
}

// findEnvFile looks for .env file in current and parent directories
func findEnvFile(startDir, filename string) string {
	currentDir := startDir
	for {
		path := filepath.Join(currentDir, filename)
		if _, err := os.Stat(path); err == nil {
			return path
		}

		// Move to parent directory
		parentDir := filepath.Dir(currentDir)
		if parentDir == currentDir {
			// We've reached the root directory
			break
		}
		currentDir = parentDir
	}
	return ""
}

// getRequiredEnv gets a required environment variable
func getRequiredEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		if defaultValue != "" {
			fmt.Printf("Warning: %s not set, using default value: %s\n", key, defaultValue)
			return defaultValue
		}
		fmt.Printf("Error: Required environment variable %s not set\n", key)
		os.Exit(1)
	}
	return value
}

// getEnvWithValidation gets an environment variable with validation
func getEnvWithValidation(key, defaultValue string, validator func(string) error) string {
	value := os.Getenv(key)
	if value == "" {
		value = defaultValue
	}

	if err := validator(value); err != nil {
		fmt.Printf("Warning: Invalid value for %s: %v, using default: %s\n", key, err, defaultValue)
		return defaultValue
	}

	return value
}

// Validation functions
func validatePort(port string) error {
	if _, err := strconv.Atoi(port); err != nil {
		return fmt.Errorf("port must be a number")
	}
	return nil
}

func validateEnv(env string) error {
	validEnvs := map[string]bool{
		"development": true,
		"production":  true,
		"testing":     true,
	}
	if !validEnvs[env] {
		return fmt.Errorf("environment must be one of: development, production, testing")
	}
	return nil
}

 