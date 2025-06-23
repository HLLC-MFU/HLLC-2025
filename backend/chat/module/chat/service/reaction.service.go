package service

import (
	"chat/module/chat/model"
	"context"
	"log"
)

// HandleReaction handles message reactions
func (s *ChatService) HandleReaction(ctx context.Context, reaction *model.MessageReaction) error {
	// Get message first to get roomID
	msg, err := s.FindOneById(ctx, reaction.MessageID.Hex())
	if err != nil {
		return err
	}

	// Update message with reaction
	update := map[string]interface{}{
		"$push": map[string]interface{}{
			"reactions": reaction,
		},
	}
	
	if _, err := s.UpdateById(ctx, reaction.MessageID.Hex(), update); err != nil {
		return err
	}

	// Cache the reaction
	if err := s.cache.SaveReaction(ctx, msg.Data[0].RoomID.Hex(), reaction.MessageID.Hex(), reaction); err != nil {
		log.Printf("[ChatService] Failed to cache reaction: %v", err)
	}

	// Emit reaction event
	if err := s.emitter.EmitReaction(ctx, reaction, msg.Data[0].RoomID); err != nil {
		log.Printf("[ChatService] Failed to emit reaction: %v", err)
	}

	return nil
} 