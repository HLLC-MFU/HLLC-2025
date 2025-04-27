package dto

// -------- Create --------
type CreateStudentRequest struct {
	Name     Name     `json:"name" validate:"required"`
	Username string   `json:"username" validate:"required"`
	Password string   `json:"password" validate:"required"`
	RoleIDs  []string `json:"role_ids" validate:"required,dive,required"`

	Profile Profile `json:"profile" validate:"required"`
}

type Profile struct {
	MajorID string `json:"major_id" validate:"required"`
	Type    string `json:"type" validate:"required"`  // ต้อง match enum เช่น USER_TYPE_NORMAL
	Round   string `json:"round" validate:"required"` // ต้อง match enum เช่น USER_ROUND_NORMAL
}

// -------- Update --------
type UpdateStudentRequest struct {
	Name     *Name    `json:"name,omitempty"`
	Username *string  `json:"username,omitempty"`
	Password *string  `json:"password,omitempty"`
	RoleIDs  []string `json:"role_ids,omitempty"`

	Profile *UpdateProfile `json:"profile,omitempty"`
}

type UpdateProfile struct {
	MajorID *string `json:"major_id,omitempty"`
	Type    *string `json:"type,omitempty"`  // Enum
	Round   *string `json:"round,omitempty"` // Enum
}
