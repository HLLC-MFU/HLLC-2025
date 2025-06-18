package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"chat/pkg/core"
)

type CacheOptions struct {
	Prefix    string
	TTL       time.Duration
	BatchSize int
}

// CacheManager handles common Redis operations
type CacheManager struct {
	redis *core.RedisCache
	opts  CacheOptions
}

func NewCacheManager(redis *core.RedisCache, opts CacheOptions) *CacheManager {
	if opts.TTL == 0 {
		opts.TTL = 24 * time.Hour
	}
	if opts.BatchSize == 0 {
		opts.BatchSize = 100
	}
	return &CacheManager{redis: redis, opts: opts}
}

func (c *CacheManager) GetKey(id string) string {
	return fmt.Sprintf("%s:%s", c.opts.Prefix, id)
}

func (c *CacheManager) Set(ctx context.Context, id string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	key := c.GetKey(id)
	if err := c.redis.HSet(ctx, key, id, string(data)); err != nil {
		return err
	}
	return c.redis.Expire(ctx, key, c.opts.TTL)
}

func (c *CacheManager) SetBatch(ctx context.Context, items map[string]interface{}) error {
	if len(items) == 0 {
		return nil
	}

	pipe := c.redis.Pipeline()
	for id, value := range items {
		data, err := json.Marshal(value)
		if err != nil {
			log.Printf("[Cache] Failed to marshal item %s: %v", id, err)
			continue
		}
		key := c.GetKey(id)
		pipe.HSet(ctx, key, id, string(data))
		pipe.Expire(ctx, key, c.opts.TTL)
	}
	
	_, err := pipe.Exec(ctx)
	return err
}

func (c *CacheManager) Get(ctx context.Context, id string, result interface{}) error {
	data, err := c.redis.HGet(ctx, c.GetKey(id), id)
	if err != nil {
		return err
	}
	return json.Unmarshal([]byte(data), result)
}

func (c *CacheManager) GetAll(ctx context.Context, id string, result interface{}) error {
	items, err := c.redis.Client.HGetAll(ctx, c.GetKey(id)).Result()
	if err != nil {
		return err
	}

	var results []interface{}
	for _, data := range items {
		var item interface{}
		if err := json.Unmarshal([]byte(data), &item); err != nil {
			log.Printf("[Cache] Failed to unmarshal item: %v", err)
			continue
		}
		results = append(results, item)
	}

	resultBytes, err := json.Marshal(results)
	if err != nil {
		return err
	}

	return json.Unmarshal(resultBytes, result)
} 