package utils

import (
	"chat/module/chat/model"
	"chat/pkg/config"
	"context"
	"log"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// **AsyncHelper Configuration**
type RetryConfig struct {
	MaxRetries    int
	InitialDelay  time.Duration
	MaxDelay      time.Duration
	BackoffFactor float64
}

type MessageStatus struct {
	ID               primitive.ObjectID `bson:"_id" json:"id"`
	MessageID        primitive.ObjectID `bson:"message_id" json:"message_id"`
	RoomID           primitive.ObjectID `bson:"room_id" json:"room_id"`
	BroadcastAt      time.Time          `bson:"broadcast_at" json:"broadcast_at"`
	SavedToDB        bool               `bson:"saved_to_db" json:"saved_to_db"`
	SavedToCache     bool               `bson:"saved_to_cache" json:"saved_to_cache"`
	NotificationSent bool               `bson:"notification_sent" json:"notification_sent"`
	RetryCount       int                `bson:"retry_count" json:"retry_count"`
	LastError        string             `bson:"last_error,omitempty" json:"last_error,omitempty"`
	Status           string             `bson:"status" json:"status"` // "pending", "completed", "failed"
	CreatedAt        time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt        time.Time          `bson:"updated_at" json:"updated_at"`
}

// **Worker Pool Definitions**
type DatabaseWorkerPool struct {
	jobs        chan DatabaseJob
	workerCount int
	quit        chan bool
	retryQueue  chan DatabaseJob
	config      RetryConfig
}

type DatabaseJob struct {
	Type          string // "save_message", "cache_message", "notification", "retry"
	Message       *model.ChatMessage
	Context       context.Context
	Service       DatabaseJobHandler // interface to handle the actual work
	RetryCount    int
	OriginalTime  time.Time
	MessageStatus *MessageStatus
}

type NotificationWorkerPool struct {
	jobs        chan NotificationJob
	workerCount int
	quit        chan bool
	retryQueue  chan NotificationJob
	config      RetryConfig
}

type NotificationJob struct {
	Message      *model.ChatMessage
	OnlineUsers  []string
	Context      context.Context
	Service      NotificationJobHandler
	RetryCount   int
	OriginalTime time.Time
}

type PhantomMessageDetector struct {
	statusCollection *mongo.Collection
	checkInterval    time.Duration
	maxAge           time.Duration
	quit             chan bool
	service          PhantomDetectorHandler
}

// **Job Handler Interfaces**
type DatabaseJobHandler interface {
	SaveMessageToDB(ctx context.Context, msg *model.ChatMessage) error
	SaveMessageToCache(ctx context.Context, msg *model.ChatMessage) error
	SaveMessageBatch(ctx context.Context, msgs []*model.ChatMessage) error
	SaveMessageBatchToCache(ctx context.Context, roomID string, msgs []*model.ChatMessage) error
	CreateMessageStatus(messageID primitive.ObjectID, roomID primitive.ObjectID) error
	UpdateMessageStatus(messageID primitive.ObjectID, field string, value interface{})
	UpdateMessageStatusWithError(messageID primitive.ObjectID, errorMsg string, retryCount int)
	RetrieveMessage(messageID primitive.ObjectID) (*model.ChatMessage, error)
}

type NotificationJobHandler interface {
	SendNotifications(ctx context.Context, msg *model.ChatMessage, onlineUsers []string) error
	UpdateMessageStatus(messageID primitive.ObjectID, field string, value interface{})
	UpdateMessageStatusWithError(messageID primitive.ObjectID, errorMsg string, retryCount int)
}

type PhantomDetectorHandler interface {
	GetMongo() *mongo.Database
	RetrieveMessage(messageID primitive.ObjectID) (*model.ChatMessage, error)
	SaveMessageToDB(ctx context.Context, msg *model.ChatMessage) error
	SaveMessageToCache(ctx context.Context, msg *model.ChatMessage) error
	SendNotifications(ctx context.Context, msg *model.ChatMessage, onlineUsers []string) error
	UpdateMessageStatus(messageID primitive.ObjectID, field string, value interface{})
}

// **AsyncHelper Main Struct**
type AsyncHelper struct {
	// Worker pools
	dbWorkerPool     *DatabaseWorkerPool
	notifyWorkerPool *NotificationWorkerPool

	// Reliability components
	phantomDetector  *PhantomMessageDetector
	statusCollection *mongo.Collection
	retryConfig      RetryConfig
	config           *config.Config
	mu               sync.RWMutex
}

const (
	DefaultWorkerCount   = 10   // Increase from default
	DefaultQueueSize     = 1000 // Increase queue buffer
	DefaultMaxRetries    = 3
	DefaultInitialDelay  = 100 * time.Millisecond
	DefaultMaxDelay      = 5 * time.Second
	DefaultBackoffFactor = 2.0
)

// **Constructor**
func NewAsyncHelper(mongo *mongo.Database, cfg *config.Config) *AsyncHelper {
	helper := &AsyncHelper{
		statusCollection: mongo.Collection("message-status"),
		config:           cfg,
		retryConfig: RetryConfig{
			MaxRetries:    DefaultMaxRetries,
			InitialDelay:  DefaultInitialDelay,
			MaxDelay:      DefaultMaxDelay,
			BackoffFactor: DefaultBackoffFactor,
		},
	}

	// Initialize worker pools with larger capacity
	helper.dbWorkerPool = &DatabaseWorkerPool{
		jobs:        make(chan DatabaseJob, DefaultQueueSize),
		workerCount: DefaultWorkerCount,
		quit:        make(chan bool),
		retryQueue:  make(chan DatabaseJob, DefaultQueueSize/2),
		config:      helper.retryConfig,
	}

	helper.notifyWorkerPool = &NotificationWorkerPool{
		jobs:        make(chan NotificationJob, DefaultQueueSize),
		workerCount: DefaultWorkerCount,
		quit:        make(chan bool),
		retryQueue:  make(chan NotificationJob, DefaultQueueSize/2),
		config:      helper.retryConfig,
	}

	helper.initializeWorkerPools()
	helper.initializePhantomDetector()

	return helper
}

// **Worker Pool Initialization**
func (h *AsyncHelper) initializeWorkerPools() {
	// Start workers
	for i := 0; i < h.dbWorkerPool.workerCount; i++ {
		go h.startDatabaseWorker(i)
	}

	for i := 0; i < h.notifyWorkerPool.workerCount; i++ {
		go h.startNotificationWorker(i)
	}

	// Start retry workers
	go h.startDatabaseRetryWorker()
	go h.startNotificationRetryWorker()

	log.Printf("[AsyncHelper] Initialized %d database workers and %d notification workers",
		h.dbWorkerPool.workerCount, h.notifyWorkerPool.workerCount)
}

func (h *AsyncHelper) initializePhantomDetector() {
	if !h.config.AsyncFlow.PhantomDetection.Enabled {
		log.Printf("[AsyncHelper] Phantom detection disabled")
		return
	}

	h.phantomDetector = &PhantomMessageDetector{
		statusCollection: h.statusCollection,
		checkInterval:    h.config.AsyncFlow.PhantomDetection.CheckInterval,
		maxAge:           h.config.AsyncFlow.PhantomDetection.MaxAge,
		quit:             make(chan bool),
	}

	go h.startPhantomDetectionWorker()
	log.Printf("[AsyncHelper] Phantom detection enabled with %s interval", h.phantomDetector.checkInterval)
}

// **Database Worker Implementation**
func (h *AsyncHelper) startDatabaseWorker(workerID int) {
	log.Printf("[AsyncHelper] Database worker %d started", workerID)

	for {
		select {
		case job := <-h.dbWorkerPool.jobs:
			h.processDatabaseJob(job, workerID)
		case <-h.dbWorkerPool.quit:
			log.Printf("[AsyncHelper] Database worker %d stopped", workerID)
			return
		}
	}
}

func (h *AsyncHelper) startNotificationWorker(workerID int) {
	log.Printf("[AsyncHelper] Notification worker %d started", workerID)

	for {
		select {
		case job := <-h.notifyWorkerPool.jobs:
			h.processNotificationJob(job, workerID)
		case <-h.notifyWorkerPool.quit:
			log.Printf("[AsyncHelper] Notification worker %d stopped", workerID)
			return
		}
	}
}

// **Retry Workers**
func (h *AsyncHelper) startDatabaseRetryWorker() {
	log.Printf("[AsyncHelper] Database retry worker started")

	for {
		select {
		case job := <-h.dbWorkerPool.retryQueue:
			delay := h.calculateRetryDelay(job.RetryCount)
			log.Printf("[AsyncHelper] Retrying database job %s for message %s after %v (attempt %d/%d)",
				job.Type, job.Message.ID.Hex(), delay, job.RetryCount+1, h.retryConfig.MaxRetries)

			time.Sleep(delay)
			job.RetryCount++
			h.processDatabaseJob(job, -1) // -1 indicates retry worker
		case <-h.dbWorkerPool.quit:
			log.Printf("[AsyncHelper] Database retry worker stopped")
			return
		}
	}
}

func (h *AsyncHelper) startNotificationRetryWorker() {
	log.Printf("[AsyncHelper] Notification retry worker started")

	for {
		select {
		case job := <-h.notifyWorkerPool.retryQueue:
			delay := h.calculateRetryDelay(job.RetryCount)
			log.Printf("[AsyncHelper] Retrying notification job for message %s after %v (attempt %d/%d)",
				job.Message.ID.Hex(), delay, job.RetryCount+1, h.retryConfig.MaxRetries)

			time.Sleep(delay)
			job.RetryCount++
			h.processNotificationJob(job, -1) // -1 indicates retry worker
		case <-h.notifyWorkerPool.quit:
			log.Printf("[AsyncHelper] Notification retry worker stopped")
			return
		}
	}
}

// **Phantom Detection Worker**
func (h *AsyncHelper) startPhantomDetectionWorker() {
	log.Printf("[AsyncHelper] Phantom detection worker started")

	ticker := time.NewTicker(h.phantomDetector.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			h.detectAndFixPhantomMessages()
		case <-h.phantomDetector.quit:
			log.Printf("[AsyncHelper] Phantom detection worker stopped")
			return
		}
	}
}

// **Retry Logic**
func (h *AsyncHelper) calculateRetryDelay(retryCount int) time.Duration {
	if retryCount <= 0 {
		return h.retryConfig.InitialDelay
	}

	delay := float64(h.retryConfig.InitialDelay) * (h.retryConfig.BackoffFactor * float64(retryCount))
	if delay > float64(h.retryConfig.MaxDelay) {
		return h.retryConfig.MaxDelay
	}

	return time.Duration(delay)
}

// **Job Processing**
func (h *AsyncHelper) processDatabaseJob(job DatabaseJob, workerID int) {
	var err error

	// Ping & pong avoidable
	if job.Message == nil || job.Message.Message == "" || job.Message.RoomID.IsZero() {
		log.Printf("[AsyncHelper] Skipping empty message %s in job %s", job.Message.ID.Hex(), job.Type)
		job.Service.UpdateMessageStatus(job.Message.ID, "status", "skipped")
		h.checkMessageCompletion(job.Message.ID)
		return
	}

	// Start batch processing if available
	if job.Type == "save_message" || job.Type == "cache_message" {
		batchSize := h.config.AsyncFlow.DatabaseWorkers.BatchSize
		flushTimeout := h.config.AsyncFlow.DatabaseWorkers.FlushTimeout

		// Try to collect a batch of messages
		batch := []DatabaseJob{job}
		batchTimer := time.NewTimer(flushTimeout)
		defer batchTimer.Stop()

		// Collect more jobs if available
	batchLoop:
		for len(batch) < batchSize {
			select {
			case nextJob := <-h.dbWorkerPool.jobs:
				if nextJob.Type == job.Type {
					batch = append(batch, nextJob)
				} else {
					// Different job type, process it separately
					go h.processDatabaseJob(nextJob, workerID)
				}
			case <-batchTimer.C:
				break batchLoop
			default:
				// No more jobs immediately available
				break batchLoop
			}
		}

		// Process batch
		if len(batch) > 1 {
			log.Printf("[AsyncHelper] Worker %d processing batch of %d %s jobs",
				workerID, len(batch), job.Type)

			switch job.Type {
			case "save_message":
				err = h.processSaveMessageBatch(batch)
			case "cache_message":
				err = h.processCacheMessageBatch(batch)
			}

			if err != nil {
				// On batch failure, retry individual messages
				for _, j := range batch {
					h.handleJobFailure(j, err.Error(), workerID)
				}
				return
			}

			// Update status for all messages in batch
			for _, j := range batch {
				if job.Type == "save_message" {
					j.Service.UpdateMessageStatus(j.Message.ID, "saved_to_db", true)
				} else {
					j.Service.UpdateMessageStatus(j.Message.ID, "saved_to_cache", true)
				}
				h.checkMessageCompletion(j.Message.ID)
			}

			if workerID >= 0 {
				log.Printf("[AsyncHelper] Worker %d completed batch of %d %s jobs",
					workerID, len(batch), job.Type)
			}
			return
		}
	}

	// Single job processing (for non-batchable jobs or single items)
	switch job.Type {
	case "save_message":
		err = job.Service.SaveMessageToDB(job.Context, job.Message)
		if err == nil {
			job.Service.UpdateMessageStatus(job.Message.ID, "saved_to_db", true)
		}
	case "cache_message":
		err = job.Service.SaveMessageToCache(job.Context, job.Message)
		if err == nil {
			job.Service.UpdateMessageStatus(job.Message.ID, "saved_to_cache", true)
		}
	}

	if err != nil {
		h.handleJobFailure(job, err.Error(), workerID)
		return
	}

	// Check if message is fully processed
	h.checkMessageCompletion(job.Message.ID)

	if workerID >= 0 {
		log.Printf("[AsyncHelper] Worker %d completed %s for message %s",
			workerID, job.Type, job.Message.ID.Hex())
	}
}

// Batch processing helpers
func (h *AsyncHelper) processSaveMessageBatch(batch []DatabaseJob) error {
	if len(batch) == 0 {
		return nil
	}

	// Extract messages from batch
	messages := make([]*model.ChatMessage, len(batch))
	for i, job := range batch {
		if job.Message == nil || job.Message.Message == "" || job.Message.RoomID.IsZero() {
			log.Printf("[AsyncHelper] Skipping empty message in batch")
			continue
		}
		messages[i] = job.Message
	}

	// Perform bulk insert using interface method
	return batch[0].Service.SaveMessageBatch(context.Background(), messages)
}

func (h *AsyncHelper) processCacheMessageBatch(batch []DatabaseJob) error {
	if len(batch) == 0 {
		return nil
	}

	// Group messages by room for efficient caching
	messagesByRoom := make(map[string][]*model.ChatMessage)
	for _, job := range batch {

		// Empty message avoidable.
		if job.Message == nil || job.Message.Message == "" || job.Message.RoomID.IsZero() {
			log.Printf("[AsyncHelper] Skipping cache for message %s with empty room ID", job.Message.ID.Hex())
			continue
		}
		if job.Message.Message == "" {
			log.Printf("[AsyncHelper] Skipping cache for empty message %s", job.Message.ID.Hex())
			continue
		}
		roomID := job.Message.RoomID.Hex()
		messagesByRoom[roomID] = append(messagesByRoom[roomID], job.Message)
	}

	// Cache messages by room using interface method
	for roomID, messages := range messagesByRoom {
		if err := batch[0].Service.SaveMessageBatchToCache(
			context.Background(),
			roomID,
			messages,
		); err != nil {
			return err
		}
	}

	return nil
}

func (h *AsyncHelper) processNotificationJob(job NotificationJob, workerID int) {

	// Empty message avoidable
	if job.Message == nil || job.Message.Message == "" || job.Message.RoomID.IsZero() {
		log.Printf("[AsyncHelper] Skipping notification for empty message %s", job.Message.ID.Hex())
		job.Service.UpdateMessageStatus(job.Message.ID, "notification_sent", false)
		h.checkMessageCompletion(job.Message.ID)
		return
	}
	err := job.Service.SendNotifications(job.Context, job.Message, job.OnlineUsers)

	if err != nil {
		h.handleNotificationJobFailure(job, err.Error(), workerID)
		return
	}

	job.Service.UpdateMessageStatus(job.Message.ID, "notification_sent", true)
	h.checkMessageCompletion(job.Message.ID)

	if workerID >= 0 {
		log.Printf("[AsyncHelper] Worker %d completed notification for message %s", workerID, job.Message.ID.Hex())
	}
}

// **Error Handling**
func (h *AsyncHelper) handleJobFailure(job DatabaseJob, errorMsg string, workerID int) {
	if job.RetryCount < h.retryConfig.MaxRetries {
		job.RetryCount++
		delay := h.calculateRetryDelay(job.RetryCount)
		time.Sleep(delay)

		// Try to requeue the job
		select {
		case h.dbWorkerPool.retryQueue <- job:
			log.Printf("[RETRY] Job requeued for retry %d/%d after %v delay",
				job.RetryCount, h.retryConfig.MaxRetries, delay)
		default:
			log.Printf("[ERROR] Failed to requeue job after %d retries: %s",
				job.RetryCount, errorMsg)
		}
	} else {
		log.Printf("[ERROR] Job failed permanently after %d retries: %s",
			h.retryConfig.MaxRetries, errorMsg)
	}
}

func (h *AsyncHelper) handleNotificationJobFailure(job NotificationJob, errorMsg string, workerID int) {
	log.Printf("[AsyncHelper] Worker %d failed notification for message %s: %v (attempt %d/%d)",
		workerID, job.Message.ID.Hex(), errorMsg, job.RetryCount+1, h.retryConfig.MaxRetries)

	job.Service.UpdateMessageStatusWithError(job.Message.ID, errorMsg, job.RetryCount+1)

	if job.RetryCount < h.retryConfig.MaxRetries {
		select {
		case h.notifyWorkerPool.retryQueue <- job:
			// Successfully queued for retry
		default:
			log.Printf("[ERROR] Notification retry queue full, dropping job for message %s", job.Message.ID.Hex())
		}
	} else {
		log.Printf("[ERROR] Max retries exceeded for notification job, message %s", job.Message.ID.Hex())
		job.Service.UpdateMessageStatus(job.Message.ID, "status", "failed")
	}
}

// **Message Status Management**
func (h *AsyncHelper) checkMessageCompletion(messageID primitive.ObjectID) {
	// This would check if all parts (DB, cache, notification) are complete
	// and update status to "completed" if all are done
	// Implementation depends on the specific requirements
}

// **Phantom Message Detection**
func (h *AsyncHelper) detectAndFixPhantomMessages() {
	ctx := context.Background()
	cutoffTime := time.Now().Add(-h.phantomDetector.maxAge)

	filter := bson.M{
		"broadcast_at": bson.M{"$lte": cutoffTime},
		"status":       bson.M{"$ne": "completed"},
		"$or": []bson.M{
			{"saved_to_db": false},
			{"saved_to_cache": false},
			{"notification_sent": false},
		},
	}

	cursor, err := h.statusCollection.Find(ctx, filter)
	if err != nil {
		log.Printf("[ERROR] Failed to query phantom messages: %v", err)
		return
	}
	defer cursor.Close(ctx)

	var phantomCount int
	for cursor.Next(ctx) {
		var status MessageStatus
		if err := cursor.Decode(&status); err != nil {
			log.Printf("[ERROR] Failed to decode phantom message status: %v", err)
			continue
		}

		phantomCount++
		if h.config.AsyncFlow.PhantomDetection.FixAutomatically {
			go h.fixPhantomMessage(status)
		}
	}

	if phantomCount > 0 {
		log.Printf("[PhantomDetector] Found %d phantom messages", phantomCount)
	}
}

func (h *AsyncHelper) fixPhantomMessage(status MessageStatus) {
	log.Printf("[PhantomDetector] Fixing phantom message %s", status.MessageID.Hex())
	// Implementation would depend on PhantomDetectorHandler interface
}

// **Public Interface Methods**
func (h *AsyncHelper) SubmitDatabaseJob(jobType string, msg *model.ChatMessage, ctx context.Context, handler DatabaseJobHandler) bool {
	job := DatabaseJob{
		Type:         jobType,
		Message:      msg,
		Context:      ctx,
		Service:      handler,
		RetryCount:   0,
		OriginalTime: time.Now(),
	}

	select {
	case h.dbWorkerPool.jobs <- job:
		return true
	default:
		log.Printf("[ERROR] Database worker queue full, dropping %s job for message %s", jobType, msg.ID.Hex())
		return false
	}
}

func (h *AsyncHelper) SubmitNotificationJob(msg *model.ChatMessage, onlineUsers []string, ctx context.Context, handler NotificationJobHandler) bool {
	job := NotificationJob{
		Message:      msg,
		OnlineUsers:  onlineUsers,
		Context:      ctx,
		Service:      handler,
		RetryCount:   0,
		OriginalTime: time.Now(),
	}

	select {
	case h.notifyWorkerPool.jobs <- job:
		return true
	default:
		log.Printf("[ERROR] Notification worker queue full, dropping job for message %s", msg.ID.Hex())
		return false
	}
}

func (h *AsyncHelper) SetPhantomDetectorHandler(handler PhantomDetectorHandler) {
	if h.phantomDetector != nil {
		h.phantomDetector.service = handler
	}
}

// **Shutdown**
func (h *AsyncHelper) Shutdown() {
	log.Printf("[AsyncHelper] Shutting down...")

	// Stop workers
	close(h.dbWorkerPool.quit)
	close(h.notifyWorkerPool.quit)

	if h.phantomDetector != nil {
		close(h.phantomDetector.quit)
	}

	log.Printf("[AsyncHelper] Shutdown complete")
}

// **Metrics and Status**
func (h *AsyncHelper) GetWorkerPoolStatus() map[string]interface{} {
	return map[string]interface{}{
		"database_workers": map[string]interface{}{
			"worker_count": h.dbWorkerPool.workerCount,
			"jobs_queued":  len(h.dbWorkerPool.jobs),
			"retry_queued": len(h.dbWorkerPool.retryQueue),
		},
		"notification_workers": map[string]interface{}{
			"worker_count": h.notifyWorkerPool.workerCount,
			"jobs_queued":  len(h.notifyWorkerPool.jobs),
			"retry_queued": len(h.notifyWorkerPool.retryQueue),
		},
		"phantom_detector": map[string]interface{}{
			"enabled":        h.config.AsyncFlow.PhantomDetection.Enabled,
			"check_interval": h.phantomDetector.checkInterval.String(),
			"max_age":        h.phantomDetector.maxAge.String(),
		},
	}
}

// **Public method to trigger phantom message detection**
func (h *AsyncHelper) TriggerPhantomMessageDetection() {
	log.Printf("[AsyncHelper] Manual phantom message detection triggered")
	go h.detectAndFixPhantomMessages()
}

// Add public methods to access worker pool metrics
func (h *AsyncHelper) GetDatabaseWorkerQueueMetrics() (size int, capacity int) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.dbWorkerPool.jobs), cap(h.dbWorkerPool.jobs)
}

func (h *AsyncHelper) GetNotificationWorkerQueueMetrics() (size int, capacity int) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.notifyWorkerPool.jobs), cap(h.notifyWorkerPool.jobs)
}
