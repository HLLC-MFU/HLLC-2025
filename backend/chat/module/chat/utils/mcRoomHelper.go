package utils

import (
	"context"
	"log"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// MC Room constants
const (
	RoomTypeMC = "mc"
)

// MCRoomHelper provides utilities for MC (Master of Ceremonies) room functionality
type MCRoomHelper struct {
	db *mongo.Database
}

// NewMCRoomHelper creates a new MC room helper
func NewMCRoomHelper(db *mongo.Database) *MCRoomHelper {
	return &MCRoomHelper{
		db: db,
	}
}

// IsMCRoom checks if a room is of type "mc"
func (h *MCRoomHelper) IsMCRoom(ctx context.Context, roomID primitive.ObjectID) bool {
	roomCollection := h.db.Collection("rooms")
	var room struct {
		Type string `bson:"type"`
	}

	err := roomCollection.FindOne(ctx, bson.M{"_id": roomID}).Decode(&room)
	if err != nil {
		log.Printf("[MCRoomHelper] Failed to get room type for %s: %v", roomID.Hex(), err)
		return false
	}

	isMC := room.Type == RoomTypeMC
	log.Printf("[MCRoomHelper] Room %s type: %s, isMC: %v", roomID.Hex(), room.Type, isMC)

	return isMC
}

// IsMasterOfCeremonies checks if a user has MC privileges (Administrator, Mentee, Mentor roles)
func (h *MCRoomHelper) IsMasterOfCeremonies(ctx context.Context, userID primitive.ObjectID) (bool, error) {
	userCollection := h.db.Collection("users")
	var user struct {
		Role primitive.ObjectID `bson:"role"`
	}

	err := userCollection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		log.Printf("[MCRoomHelper] Failed to get user %s: %v", userID.Hex(), err)
		return false, err
	}

	// Get role name
	roleCollection := h.db.Collection("roles")
	var role struct {
		Name string `bson:"name"`
	}

	err = roleCollection.FindOne(ctx, bson.M{"_id": user.Role}).Decode(&role)
	if err != nil {
		log.Printf("[MCRoomHelper] Failed to get role for user %s: %v", userID.Hex(), err)
		return false, err
	}

	// Normalize role name for case-insensitive check
	roleName := strings.ToLower(role.Name)
	isMC := roleName == "administrator" || roleName == "mentee" || roleName == "mentor"
	log.Printf("[MCRoomHelper] User %s role: %s, isMC: %v", userID.Hex(), role.Name, isMC)

	return isMC, nil
}

// ShouldShowMessage determines if a message should be visible to a specific user in an MC room
func (h *MCRoomHelper) ShouldShowMessage(ctx context.Context, messageUserID, viewerUserID, roomID primitive.ObjectID) (bool, error) {
	// If not an MC room, show all messages
	if !h.IsMCRoom(ctx, roomID) {
		return true, nil
	}

	// If viewer is the message sender, always show
	if messageUserID == viewerUserID {
		log.Printf("[MCRoomHelper] Message from %s visible to self", messageUserID.Hex())
		return true, nil
	}

	// If viewer is Master of Ceremonies, show all messages
	isMC, err := h.IsMasterOfCeremonies(ctx, viewerUserID)
	if err != nil {
		log.Printf("[MCRoomHelper] Error checking MC status for %s: %v", viewerUserID.Hex(), err)
		return false, err
	}

	if isMC {
		log.Printf("[MCRoomHelper] Message from %s visible to MC %s", messageUserID.Hex(), viewerUserID.Hex())
		return true, nil
	}

	// Regular users in MC rooms can't see others' messages
	log.Printf("[MCRoomHelper] Message from %s hidden from regular user %s in MC room", messageUserID.Hex(), viewerUserID.Hex())
	return false, nil
}
