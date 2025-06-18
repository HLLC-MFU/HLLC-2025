package types

import "time"

const (
	// Notification settings
	DeduplicationTTL = time.Minute
	NotificationTTL  = 24 * time.Hour

	// Cache settings
	CacheTTL      = 24 * time.Hour
	CacheBatchSize = 100

	// WebSocket settings
	PingInterval = 30 * time.Second
	WriteTimeout = 10 * time.Second
	ReadTimeout  = 60 * time.Second
	BufferSize   = 1024
) 