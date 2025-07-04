package dto

import "go.mongodb.org/mongo-driver/bson/primitive"

type (
	MentionMessageDto struct {
		Message  string   `json:"message" validate:"required"`
		Mentions []string `json:"mentions" validate:"required"` // Array of userIDs to mention
		RoomID   string   `json:"roomId" validate:"required,mongoId"`
	}

	NotifyMentionDto struct {
		MessageID      string `json:"messageId" validate:"required,mongoId"`
		MentionedUserID string `json:"mentionedUserId" validate:"required,mongoId"`
		SenderID       string `json:"senderId" validate:"required,mongoId"`
		RoomID         string `json:"roomId" validate:"required,mongoId"`
		Message        string `json:"message" validate:"required"`
	}
)

func (dto *MentionMessageDto) ToObjectIDs() (roomObjID primitive.ObjectID, mentionObjIDs []primitive.ObjectID, err error) {
	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return
	}

	mentionObjIDs = make([]primitive.ObjectID, len(dto.Mentions))
	for i, mentionID := range dto.Mentions {
		mentionObjIDs[i], err = primitive.ObjectIDFromHex(mentionID)
		if err != nil {
			return
		}
	}
	
	return
}

func (dto *NotifyMentionDto) ToObjectIDs() (messageObjID, mentionedUserObjID, senderObjID, roomObjID primitive.ObjectID, err error) {
	messageObjID, err = primitive.ObjectIDFromHex(dto.MessageID)
	if err != nil {
		return
	}
	
	mentionedUserObjID, err = primitive.ObjectIDFromHex(dto.MentionedUserID)
	if err != nil {
		return
	}
	
	senderObjID, err = primitive.ObjectIDFromHex(dto.SenderID)
	if err != nil {
		return
	}

	roomObjID, err = primitive.ObjectIDFromHex(dto.RoomID)
	if err != nil {
		return
	}
	
	return
} 