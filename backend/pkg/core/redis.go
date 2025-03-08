// backend/pkg/core/redis.go
package core

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	"github.com/redis/go-redis/v9"
)

type (
	RedisConfig struct {
		Host     string
		Port     string
		Password string
		DB       int
	}

	RedisCache struct {
		Client *redis.Client
	}
)

// NewRedisCache creates a new Redis cache instance
func NewRedisCache(config *RedisConfig) (*RedisCache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%d", config.Host, config.Port),
		Password:     config.Password,
		DB:           config.DB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
		PoolTimeout:  4 * time.Second,
	})

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisCache{
		Client: client,
	}, nil
}

func RedisConnect(ctx context.Context, cfg *config.Config) *RedisCache {
	redisConfig := &RedisConfig{
		Host:     cfg.Redis.Host,
		Port:     cfg.Redis.Port,
		Password: cfg.Redis.Password,
		DB:       0,
	}

	cache, err := NewRedisCache(redisConfig)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	return cache
}

func RedisDisconnect(ctx context.Context, cache *RedisCache) {
	if err := cache.Close(); err != nil {
		log.Printf("Error closing Redis connection: %v", err)
	}
}

// Set stores a key-value pair in Redis with expiration
func (c *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	return c.Client.Set(ctx, key, value, expiration).Err()
}

// Get retrieves a value from Redis by key
func (c *RedisCache) Get(ctx context.Context, key string) (string, error) {
	val, err := c.Client.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("key %s not found", key)
	}
	return val, err
}

// Delete removes a key from Redis
func (c *RedisCache) Delete(ctx context.Context, key string) error {
	return c.Client.Del(ctx, key).Err()
}

// Exists checks if a key exists in Redis
func (c *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	n, err := c.Client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

// SetNX sets a key-value pair if the key doesn't exist (useful for locks)
func (c *RedisCache) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) (bool, error) {
	return c.Client.SetNX(ctx, key, value, expiration).Result()
}

// HSet stores a hash field
func (c *RedisCache) HSet(ctx context.Context, key string, field string, value interface{}) error {
	return c.Client.HSet(ctx, key, field, value).Err()
}

// HGet retrieves a hash field
func (c *RedisCache) HGet(ctx context.Context, key string, field string) (string, error) {
	val, err := c.Client.HGet(ctx, key, field).Result()
	if err == redis.Nil {
		return "", fmt.Errorf("field %s in key %s not found", field, key)
	}
	return val, err
}

// Close closes the Redis connection
func (c *RedisCache) Close() error {
	return c.Client.Close()
}

// FlushDB removes all keys from the current database
func (c *RedisCache) FlushDB(ctx context.Context) error {
	return c.Client.FlushDB(ctx).Err()
}

// TTL gets the remaining time to live of a key
func (c *RedisCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	return c.Client.TTL(ctx, key).Result()
}

// Expire sets a timeout on key
func (c *RedisCache) Expire(ctx context.Context, key string, expiration time.Duration) error {
	return c.Client.Expire(ctx, key, expiration).Err()
}

// Pipeline returns a new pipeline
func (c *RedisCache) Pipeline() redis.Pipeliner {
	return c.Client.Pipeline()
}

// Health checks if Redis is healthy
func (c *RedisCache) Health(ctx context.Context) error {
	return c.Client.Ping(ctx).Err()
}