package dto

import "go.mongodb.org/mongo-driver/bson/primitive"

type AddRoomMembersDto struct {
	UserIDs []string `json:"userIds" validate:"mongoId"`
} 

func (dto *AddRoomMembersDto) ToObjectIDs() []primitive.ObjectID {
	objectIDs := make([]primitive.ObjectID, len(dto.UserIDs))
	for i, userID := range dto.UserIDs {
		objectID, _ := primitive.ObjectIDFromHex(userID)
		objectIDs[i] = objectID
	}
	return objectIDs
}