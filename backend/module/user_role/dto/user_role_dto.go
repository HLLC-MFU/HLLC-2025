package dto

type CreateUserRoleRequest struct {
	UserID  string   `json:"user_id" validate:"required"`
	RoleIDs []string `json:"role_ids" validate:"required"`
}

type UpdateUserRoleRequest struct {
	RoleIDs []string `json:"role_ids" validate:"required"`
}
