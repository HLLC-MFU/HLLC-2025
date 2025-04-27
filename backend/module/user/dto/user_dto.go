package dto

type Name struct {
	First  string `json:"first" validate:"required"`
	Middle string `json:"middle,omitempty"`
	Last   string `json:"last" validate:"required"`
}

type CreateUserRequest struct {
	Name     Name     `json:"name" validate:"required"`
	Username string   `json:"username" validate:"required"`
	Password string   `json:"password" validate:"required"`
	RoleIDs  []string `json:"role_ids" validate:"required,dive,required"` // ต้องมี role อย่างน้อย 1 ตัว
}

type UpdateUserRequest struct {
	Name     *Name    `json:"name,omitempty"`
	Username *string  `json:"username,omitempty"`
	Password *string  `json:"password,omitempty"`
	RoleIDs  []string `json:"role_ids,omitempty"`
}
