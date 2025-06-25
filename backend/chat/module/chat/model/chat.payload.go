package model

type(
	ChatEvent struct {
		EventType string      `json:"eventType"`
		Payload   interface{} `json:"payload"`
	}
)
