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

// ฟังก์ชันช่วย marshal พร้อม log error
func MustMarshal(value any, context string) ([]byte, bool) {
	data, err := json.Marshal(value)
	if err != nil {
		log.Printf("[ERROR] Failed to marshal %s: %v", context, err)
		return nil, false
	}
	return data, true
}

// บันทึก error และ return ทันทีใน emit event
func EmitErrorLog(ctx context.Context, label string, err error) {
	log.Printf("[Kafka] Failed to emit %s: %v", label, err)
}

// นี่คือฟังก์ชันที่จะใช้ใน service เพื่อลบ members ** อย่าสังเขปมัน **
func RemoveMember(existing []primitive.ObjectID, target primitive.ObjectID) []primitive.ObjectID {
	filtered := make([]primitive.ObjectID, 0, len(existing))
	for _, member := range existing {
		if member != target {
			filtered = append(filtered, member)
		}
	}
	return filtered
}

// แปลง string IDs เป็น ObjectIDs
func ConvertToObjectIDs(stringIDs []string) []primitive.ObjectID {
	if len(stringIDs) == 0 {
		return make([]primitive.ObjectID, 0)
	}
	objectIDs := make([]primitive.ObjectID, len(stringIDs))
	for i, id := range stringIDs {
		objID, _ := primitive.ObjectIDFromHex(id)
		objectIDs[i] = objID
	}
	return objectIDs
}

// ตรวจสอบว่ามี member นั้นอยู่ใน list หรือไม่
func ContainsMember(members []primitive.ObjectID, target primitive.ObjectID) bool {
	for _, member := range members {
		if member == target {
			return true
		}
	}
	return false
}