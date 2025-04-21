package migration

import (
	"context"
	"log"
	"time"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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
	// Check if collections are already initialized with data
	userCollection := m.db.Database("hllc-2025").Collection("users")
	roleCollection := m.db.Database("hllc-2025").Collection("roles")
	permissionCollection := m.db.Database("hllc-2025").Collection("permissions")

	// Check if admin user exists
	var adminUserCount int64
	adminUserCount, err := userCollection.CountDocuments(ctx, bson.M{"username": "admin"})
	if err != nil {
		return err
	}

	// Check if admin role exists
	var adminRoleCount int64
	adminRoleCount, err = roleCollection.CountDocuments(ctx, bson.M{"code": "ADMIN"})
	if err != nil {
		return err
	}

	// Check if permissions exist
	var permissionCount int64
	permissionCount, err = permissionCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	// If all data exists, skip migration
	if adminUserCount > 0 && adminRoleCount > 0 && permissionCount > 0 {
		log.Printf("Initial data already exists, skipping initialization")
		return nil
	}

	// Create default permissions
	permissions := []*userPb.Permission{
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Create User",
			Code:        "CREATE_USER",
			Module:      "user",
			Description: "Permission to create new users",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Manage Roles",
			Code:        "MANAGE_ROLES",
			Module:      "user",
			Description: "Permission to manage roles",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Manage Permissions",
			Code:        "MANAGE_PERMISSIONS",
			Module:      "user",
			Description: "Permission to manage permissions",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
	}

	// Insert permissions
	var permissionIds []string
	for _, permission := range permissions {
		var existingPermission userPb.Permission
		err := permissionCollection.FindOne(ctx, bson.M{"code": permission.Code}).Decode(&existingPermission)
		if err == mongo.ErrNoDocuments {
			_, err = permissionCollection.InsertOne(ctx, permission)
			if err != nil {
				return err
			}
			permissionIds = append(permissionIds, permission.Id)
			log.Printf("Permission %s created\n", permission.Name)
		} else if err != nil {
			return err
		} else {
			permissionIds = append(permissionIds, existingPermission.Id)
			log.Printf("Permission %s already exists\n", permission.Name)
		}
	}

	// Create admin role if not exists
	adminRole := &userPb.Role{
		Id:            primitive.NewObjectID().Hex(),
		Name:          "Administrator",
		Code:          "ADMIN",
		Description:   "Full system access",
		PermissionIds: permissionIds,
		CreatedAt:     time.Now().Format(time.RFC3339),
		UpdatedAt:     time.Now().Format(time.RFC3339),
	}

	// Check if admin role exists
	var existingRole userPb.Role
	err = roleCollection.FindOne(ctx, bson.M{"code": "ADMIN"}).Decode(&existingRole)
	if err == mongo.ErrNoDocuments {
		_, err = roleCollection.InsertOne(ctx, adminRole)
		if err != nil {
			return err
		}
		log.Println("Admin role created")
	} else if err != nil {
		return err
	} else {
		adminRole.Id = existingRole.Id
		log.Println("Admin role already exists")
	}

	// Create admin user if not exists
	var existingUser userPb.User
	err = userCollection.FindOne(ctx, bson.M{"username": "admin"}).Decode(&existingUser)
	if err == mongo.ErrNoDocuments {
		// Create admin user
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		adminUser := &userPb.User{
			Id:       primitive.NewObjectID().Hex(),
			Username: "admin",
			Password: string(hashedPassword),
			Name: &userPb.Name{
				FirstName: "Admin",
				LastName:  "User",
			},
			RoleIds:   []string{adminRole.Id},
			CreatedAt: time.Now().Format(time.RFC3339),
			UpdatedAt: time.Now().Format(time.RFC3339),
		}

		_, err = userCollection.InsertOne(ctx, adminUser)
		if err != nil {
			return err
		}
		log.Println("Admin user created")
	} else if err != nil {
		return err
	} else {
		log.Println("Admin user already exists")
	}

	return nil
}

func (m *InitialSetupMigration) Down(ctx context.Context) error {
	// Remove admin user
	userCollection := m.db.Database("hllc-2025").Collection("users")
	_, err := userCollection.DeleteOne(ctx, bson.M{"username": "admin"})
	if err != nil {
		return err
	}

	// Remove admin role
	roleCollection := m.db.Database("hllc-2025").Collection("roles")
	_, err = roleCollection.DeleteOne(ctx, bson.M{"code": "ADMIN"})
	if err != nil {
		return err
	}

	// Remove default permissions
	permissionCollection := m.db.Database("hllc-2025").Collection("permissions")
	_, err = permissionCollection.DeleteMany(ctx, bson.M{
		"code": bson.M{
			"$in": []string{"CREATE_USER", "MANAGE_ROLES", "MANAGE_PERMISSIONS"},
		},
	})
	if err != nil {
		return err
	}

	return nil
} 