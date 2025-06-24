package service

import (
	"chat/module/chat/model"
	"context"
	"log"
)

func (s *ChatService) HandleReaction(ctx context.Context, reaction *model.MessageReaction) error {
	msg, err := s.FindOneById(ctx, reaction.MessageID.Hex())
	if err != nil {
		return err
	}

	update := map[string]interface{}{
		"$push": map[string]interface{}{
			"reactions": reaction,
		},
	}
	
	if _, err := s.UpdateById(ctx, reaction.MessageID.Hex(), update); err != nil {
		return err
	}

	if err := s.cache.SaveReaction(ctx, msg.Data[0].RoomID.Hex(), reaction.MessageID.Hex(), reaction); err != nil {
		log.Printf("[ChatService] Failed to cache reaction: %v", err)
	}

	if err := s.emitter.EmitReaction(ctx, reaction, msg.Data[0].RoomID); err != nil {
		log.Printf("[ChatService] Failed to emit reaction: %v", err)
	}

	return nil
} 