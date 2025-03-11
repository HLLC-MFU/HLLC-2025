package migration

import (
	"context"
	"log"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type InitialSetupMigration struct {
	db *mongo.Client
}

func NewInitialSetupMigration(db *mongo.Client) Migration {
	return &InitialSetupMigration{db: db}
}

func (m *InitialSetupMigration) Name() string {
	return "initial_setup_001"
}

func (m *InitialSetupMigration) Up(ctx context.Context) error {
	// Create default permissions
	permissions := []user.Permission{
		{
			Name:   "Create User",
			Code:   "CREATE_USER",
			Module: "user",
		},
		{
			Name:   "Manage Roles",
			Code:   "MANAGE_ROLES",
			Module: "user",
		},
		{
			Name:   "Manage Permissions",
			Code:   "MANAGE_PERMISSIONS",
			Module: "user",
		},
	}

	// Create admin role
	adminRole := &user.Role{
		Name:        "Administrator",
		Code:        "ADMIN",
		RoleCode:    1,
		Description: "Full system access",
		Permissions: permissions,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Check if admin role exists
	collection := m.db.Database("hllc-2025").Collection("roles")
	var existingRole user.Role
	err := collection.FindOne(ctx, bson.M{"code": "ADMIN"}).Decode(&existingRole)
	if err == mongo.ErrNoDocuments {
		_, err = collection.InsertOne(ctx, adminRole)
		if err != nil {
			return err
		}
		log.Println("Admin role created")
	}

	// Create admin user
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	adminUser := &user.User{
		Username: "admin",
		Password: string(hashedPassword),
		Name: user.Name{
			FirstName: "Admin",
			LastName:  "User",
		},
		Roles:     []user.Role{*adminRole},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Check if admin user exists
	collection = m.db.Database("hllc-2025").Collection("users")
	var existingUser user.User
	err = collection.FindOne(ctx, bson.M{"username": "admin"}).Decode(&existingUser)
	if err == mongo.ErrNoDocuments {
		_, err = collection.InsertOne(ctx, adminUser)
		if err != nil {
			return err
		}
		log.Println("Admin user created")
	}

	return nil
}

func (m *InitialSetupMigration) Down(ctx context.Context) error {
	// Remove admin user
	collection := m.db.Database("hllc-2025").Collection("users")
	_, err := collection.DeleteOne(ctx, bson.M{"username": "admin"})
	if err != nil {
		return err
	}

	// Remove admin role
	collection = m.db.Database("hllc-2025").Collection("roles")
	_, err = collection.DeleteOne(ctx, bson.M{"code": "ADMIN"})
	if err != nil {
		return err
	}

	return nil
} 