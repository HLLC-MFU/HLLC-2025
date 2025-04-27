package dto

type CreatePermissionRequest struct {
	Name   string `json:"name" validate:"required"`   // เช่น "user:create"
	Module string `json:"module" validate:"required"` // เช่น "user", "order"
	Action string `json:"action" validate:"required"` // เช่น "create", "read", "update", "delete"
}

type UpdatePermissionRequest struct {
	Name   string `json:"name"`   // Optional: อนุญาตให้อัปเดตชื่อ
	Module string `json:"module"` // Optional
	Action string `json:"action"` // Optional
}
