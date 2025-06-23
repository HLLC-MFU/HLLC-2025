package utils

import (
	"context"
	"encoding/json"
	"log"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ตรวจสอบว่า roomID valid ไหม
func ValidateRoomID(roomID primitive.ObjectID, context string) bool {
	if roomID.IsZero() {
		log.Printf("[ERROR] Attempted to %s with zero roomID", context)
		return false
	}
	return true
}

// ตรวจสอบว่า userID valid ไหม
func ValidateUserID(userID primitive.ObjectID, context string) bool {
	if userID.IsZero() {
		log.Printf("[ERROR] Attempted to %s with zero userID", context)
		return false
	}
	return true
}

// helper สำหรับ marshal พร้อม log error
func MustMarshal(value any, context string) ([]byte, bool) {
	data, err := json.Marshal(value)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal %s: %v", context, err)
		return nil, false
	}
	return data, true
}

// log error และ return ทันทีใน emit event
func EmitErrorLog(ctx context.Context, label string, err error) {
	log.Printf("[Kafka] Failed to emit %s: %v", label, err)
}

// This's one will be used in service to merge members ** Do not touch it**
func mergeMembers(existing []primitive.ObjectID, new []primitive.ObjectID) []primitive.ObjectID {
	set := make(map[primitive.ObjectID]struct{})
	for _, m := range existing {
		set[m] = struct{}{}
	}
	for _, n := range new {
		set[n] = struct{}{}
	}
	merged := make([]primitive.ObjectID, 0, len(set))
	for id := range set {
		merged = append(merged, id)
	}
	return merged
}
