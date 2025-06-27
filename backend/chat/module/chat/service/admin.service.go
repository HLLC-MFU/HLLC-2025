package service

import (
	"chat/module/chat/model"
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// GetNotificationLogs retrieves notification logs with pagination and filtering
func (s *ChatService) GetNotificationLogs(ctx context.Context, filter map[string]interface{}, skip, limit int) ([]model.NotificationLog, int64, error) {
	logCollection := s.mongo.Collection("notification_logs")
	
	// Get total count
	total, err := logCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}
	
	// Find with pagination and sorting (newest first)
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "timestamp", Value: -1}})
	
	cursor, err := logCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)
	
	var logs []model.NotificationLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, 0, err
	}
	
	return logs, total, nil
}

// GetNotificationStats retrieves notification statistics
func (s *ChatService) GetNotificationStats(ctx context.Context, startDate, endDate string) (*model.NotificationStats, error) {
	logCollection := s.mongo.Collection("notification_logs")
	
	// Build date filter
	dateFilter := bson.M{}
	if startDate != "" || endDate != "" {
		timestampFilter := bson.M{}
		if startDate != "" {
			if start, err := time.Parse("2006-01-02", startDate); err == nil {
				timestampFilter["$gte"] = start
			}
		}
		if endDate != "" {
			if end, err := time.Parse("2006-01-02", endDate); err == nil {
				timestampFilter["$lte"] = end.Add(24 * time.Hour) // End of day
			}
		}
		if len(timestampFilter) > 0 {
			dateFilter["timestamp"] = timestampFilter
		}
	}
	
	// Get total notifications
	total, err := logCollection.CountDocuments(ctx, dateFilter)
	if err != nil {
		return nil, err
	}
	
	// Get today's notifications
	today := time.Now().Truncate(24 * time.Hour)
	todayFilter := bson.M{
		"timestamp": bson.M{
			"$gte": today,
			"$lt":  today.Add(24 * time.Hour),
		},
	}
	todayCount, err := logCollection.CountDocuments(ctx, todayFilter)
	if err != nil {
		return nil, err
	}
	
	// Aggregate by type
	typeStats := make(map[string]int64)
	typeAgg := []bson.M{
		{"$match": dateFilter},
		{"$group": bson.M{
			"_id":   "$type",
			"count": bson.M{"$sum": 1},
		}},
	}
	typeCursor, err := logCollection.Aggregate(ctx, typeAgg)
	if err == nil {
		defer typeCursor.Close(ctx)
		for typeCursor.Next(ctx) {
			var result struct {
				ID    string `bson:"_id"`
				Count int64  `bson:"count"`
			}
			if err := typeCursor.Decode(&result); err == nil {
				typeStats[result.ID] = result.Count
			}
		}
	}
	
	// Aggregate by status
	statusStats := make(map[string]int64)
	statusAgg := []bson.M{
		{"$match": dateFilter},
		{"$group": bson.M{
			"_id":   "$status",
			"count": bson.M{"$sum": 1},
		}},
	}
	statusCursor, err := logCollection.Aggregate(ctx, statusAgg)
	if err == nil {
		defer statusCursor.Close(ctx)
		for statusCursor.Next(ctx) {
			var result struct {
				ID    string `bson:"_id"`
				Count int64  `bson:"count"`
			}
			if err := statusCursor.Decode(&result); err == nil {
				statusStats[result.ID] = result.Count
			}
		}
	}
	
	// Get top receivers
	topReceivers := []model.ReceiverStats{}
	receiverAgg := []bson.M{
		{"$match": dateFilter},
		{"$group": bson.M{
			"_id":   "$receiver",
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"count": -1}},
		{"$limit": 10},
	}
	receiverCursor, err := logCollection.Aggregate(ctx, receiverAgg)
	if err == nil {
		defer receiverCursor.Close(ctx)
		for receiverCursor.Next(ctx) {
			var result struct {
				ID    string `bson:"_id"`
				Count int64  `bson:"count"`
			}
			if err := receiverCursor.Decode(&result); err == nil {
				topReceivers = append(topReceivers, model.ReceiverStats{
					UserID: result.ID,
					Count:  result.Count,
				})
			}
		}
	}
	
	// Get recent activity (last 20 notifications)
	recentActivity := []model.NotificationLog{}
	recentOpts := options.Find().
		SetLimit(20).
		SetSort(bson.D{{Key: "timestamp", Value: -1}})
	recentCursor, err := logCollection.Find(ctx, dateFilter, recentOpts)
	if err == nil {
		defer recentCursor.Close(ctx)
		recentCursor.All(ctx, &recentActivity)
	}
	
	// Calculate success rate
	successRate := 0.0
	if total > 0 {
		successCount := statusStats["sent"]
		successRate = float64(successCount) / float64(total) * 100
	}
	
	stats := &model.NotificationStats{
		TotalNotifications: total,
		TodayNotifications: todayCount,
		ByType:             typeStats,
		ByStatus:           statusStats,
		TopReceivers:       topReceivers,
		RecentActivity:     recentActivity,
		SuccessRate:        successRate,
	}
	
	return stats, nil
}

// SendTestNotification sends a test notification for admin testing
func (s *ChatService) SendTestNotification(ctx context.Context, req model.TestNotificationRequest, adminUserID string) error {
	log.Printf("[ChatService] Admin %s sending test notification to %s", adminUserID, req.ReceiverID)
	
	// Use default room if not specified
	roomID := req.RoomID
	if roomID == "" {
		roomID = "test-room-id"
	}
	
	// Send notification using existing function
	s.NotifyOfflineUser(req.ReceiverID, roomID, adminUserID, req.Message, req.Type)
	
	log.Printf("[ChatService] Test notification sent successfully")
	return nil
} 