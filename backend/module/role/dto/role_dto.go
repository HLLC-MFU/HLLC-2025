package dto

type CreateRoleRequest struct {
	Name          string   `json:"name" validate:"required"`
	Description   string   `json:"description"`
	PermissionIds []string `json:"permission_ids"`
	IsSystemRole  bool     `json:"is_system_role"`
}

type UpdateRoleRequest struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	PermissionIds []string `json:"permission_ids"`
}
