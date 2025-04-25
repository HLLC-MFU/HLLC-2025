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

	// Check if normal user role exists
	var normalUserRoleCount int64
	normalUserRoleCount, err = roleCollection.CountDocuments(ctx, bson.M{"code": "USER"})
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
		log.Printf("Initial data already exists, ensure admin user is activated and password is properly set...")
		
		// Make sure the admin user has a working password
		var adminUser userPb.User
		err := userCollection.FindOne(ctx, bson.M{"username": "admin"}).Decode(&adminUser)
		if err != nil {
			return err
		}
		
		// Always reset admin password during migration to ensure it works
		log.Printf("Resetting admin password to default...")
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		
		_, err = userCollection.UpdateOne(
			ctx,
			bson.M{"username": "admin"},
			bson.M{
				"$set": bson.M{
					"password": string(hashedPassword),
					"is_activated": true,
					"updated_at": time.Now().Format(time.RFC3339),
				},
			},
		)
		if err != nil {
			return err
		}
		
		log.Printf("Admin user password has been reset and account is activated")
		
		// Create normal user if it doesn't exist
		if normalUserRoleCount == 0 {
			log.Printf("Creating normal user role and user account...")
			if err := m.createNormalUserRoleAndAccount(ctx); err != nil {
				return err
			}
		} else {
			// Update normal user permissions if they're incorrect
			if err := m.updateNormalUserPermissions(ctx); err != nil {
				return err
			}
		}
		
		return nil
	}

	// Create default permissions with more granular approach
	permissions := []*userPb.Permission{
		// User management permissions
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
			Name:        "View Users",
			Code:        "VIEW_USERS",
			Module:      "user",
			Description: "Permission to view users list",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Edit User",
			Code:        "EDIT_USER",
			Module:      "user",
			Description: "Permission to edit other users",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Delete User",
			Code:        "DELETE_USER",
			Module:      "user",
			Description: "Permission to delete users",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		
		// Role permissions
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Create Role",
			Code:        "CREATE_ROLE",
			Module:      "role",
			Description: "Permission to create roles",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "View Roles",
			Code:        "VIEW_ROLES",
			Module:      "role",
			Description: "Permission to view roles list",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Edit Role",
			Code:        "EDIT_ROLE",
			Module:      "role",
			Description: "Permission to edit roles",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Delete Role",
			Code:        "DELETE_ROLE",
			Module:      "role",
			Description: "Permission to delete roles",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		
		// Permission management
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Create Permission",
			Code:        "CREATE_PERMISSION",
			Module:      "permission",
			Description: "Permission to create permissions",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "View Permissions",
			Code:        "VIEW_PERMISSIONS",
			Module:      "permission",
			Description: "Permission to view permissions list",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Edit Permission",
			Code:        "EDIT_PERMISSION",
			Module:      "permission",
			Description: "Permission to edit permissions",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Delete Permission",
			Code:        "DELETE_PERMISSION",
			Module:      "permission",
			Description: "Permission to delete permissions",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		
		// API access permissions
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Access Public APIs",
			Code:        "ACCESS_PUBLIC",
			Module:      "general",
			Description: "Permission to access public endpoints",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Access Protected APIs",
			Code:        "ACCESS_PROTECTED",
			Module:      "general",
			Description: "Permission to access protected endpoints (requires login)",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Access Admin APIs",
			Code:        "ACCESS_ADMIN",
			Module:      "general",
			Description: "Permission to access admin endpoints",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
		
		// Profile management
		{
			Id:          primitive.NewObjectID().Hex(),
			Name:        "Edit Own Profile",
			Code:        "EDIT_OWN_PROFILE",
			Module:      "user",
			Description: "Permission to edit one's own profile",
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		},
	}

	// Insert permissions
	var allPermissionIds []string 
	var normalUserPermissionIds []string
	
	// Store permission IDs by code for later use
	permissionIdsByCode := make(map[string]string)
	
	for _, permission := range permissions {
		var existingPermission userPb.Permission
		err := permissionCollection.FindOne(ctx, bson.M{"code": permission.Code}).Decode(&existingPermission)
		if err == mongo.ErrNoDocuments {
			_, err = permissionCollection.InsertOne(ctx, permission)
			if err != nil {
				return err
			}
			allPermissionIds = append(allPermissionIds, permission.Id)
			permissionIdsByCode[permission.Code] = permission.Id
			
			log.Printf("Permission %s created\n", permission.Name)
		} else if err != nil {
			return err
		} else {
			allPermissionIds = append(allPermissionIds, existingPermission.Id)
			permissionIdsByCode[existingPermission.Code] = existingPermission.Id
			
			log.Printf("Permission %s already exists\n", permission.Name)
		}
	}
	
	// Determine which permissions normal users should have
	normalUserPermissionCodes := []string{
		"ACCESS_PUBLIC", 
		"ACCESS_PROTECTED", 
		"EDIT_OWN_PROFILE",
	}
	
	for _, code := range normalUserPermissionCodes {
		if permId, ok := permissionIdsByCode[code]; ok {
			normalUserPermissionIds = append(normalUserPermissionIds, permId)
		}
	}

	// Create admin role if not exists
	adminRole := &userPb.Role{
		Id:            primitive.NewObjectID().Hex(),
		Name:          "Administrator",
		Code:          "ADMIN",
		Description:   "Full system access",
		PermissionIds: allPermissionIds, // Admin gets all permissions
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
		
		// Update admin permissions to ensure they have all permissions
		_, err = roleCollection.UpdateOne(
			ctx,
			bson.M{"code": "ADMIN"},
			bson.M{"$set": bson.M{
				"permission_ids": allPermissionIds,
				"updated_at": time.Now().Format(time.RFC3339),
			}},
		)
		if err != nil {
			return err
		}
		log.Println("Admin role permissions updated")
	}

	// Create normal user role with limited permissions
	normalUserRole := &userPb.Role{
		Id:            primitive.NewObjectID().Hex(),
		Name:          "Regular User",
		Code:          "USER",
		Description:   "Regular user with limited access",
		PermissionIds: normalUserPermissionIds,
		CreatedAt:     time.Now().Format(time.RFC3339),
		UpdatedAt:     time.Now().Format(time.RFC3339),
	}
	
	// Check if normal user role exists
	var existingUserRole userPb.Role
	err = roleCollection.FindOne(ctx, bson.M{"code": "USER"}).Decode(&existingUserRole)
	if err == mongo.ErrNoDocuments {
		_, err = roleCollection.InsertOne(ctx, normalUserRole)
		if err != nil {
			return err
		}
		log.Println("Normal user role created")
	} else if err != nil {
		return err
	} else {
		normalUserRole.Id = existingUserRole.Id
		log.Println("Normal user role already exists")
		
		// Update normal user permissions
		_, err = roleCollection.UpdateOne(
			ctx,
			bson.M{"code": "USER"},
			bson.M{"$set": bson.M{
				"permission_ids": normalUserPermissionIds,
				"updated_at": time.Now().Format(time.RFC3339),
			}},
		)
		if err != nil {
			return err
		}
		log.Println("Normal user role permissions updated")
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
			RoleIds:     []string{adminRole.Id},
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
			IsActivated: true,
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
		
		// Always reset admin password during migration to ensure it works
		log.Printf("Resetting admin password to default...")
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		
		_, err = userCollection.UpdateOne(
			ctx, 
			bson.M{"username": "admin"}, 
			bson.M{
				"$set": bson.M{
					"password": string(hashedPassword),
					"is_activated": true,
					"updated_at": time.Now().Format(time.RFC3339),
				},
			},
		)
		if err != nil {
			return err
		}
		
		log.Printf("Admin user password has been reset and account is activated")
	}
	
	// Create a normal user
	err = userCollection.FindOne(ctx, bson.M{"username": "user"}).Decode(&existingUser)
	if err == mongo.ErrNoDocuments {
		// Create normal user
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		normalUser := &userPb.User{
			Id:       primitive.NewObjectID().Hex(),
			Username: "user",
			Password: string(hashedPassword),
			Name: &userPb.Name{
				FirstName: "Normal",
				LastName:  "User",
			},
			RoleIds:     []string{normalUserRole.Id},
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
			IsActivated: true,
		}

		_, err = userCollection.InsertOne(ctx, normalUser)
		if err != nil {
			return err
		}
		log.Println("Normal user created")
	} else if err != nil {
		return err
	} else {
		log.Println("Normal user already exists")
		
		// Update normal user role to ensure they have the correct role
		_, err = userCollection.UpdateOne(
			ctx,
			bson.M{"username": "user"},
			bson.M{"$set": bson.M{
				"role_ids": []string{normalUserRole.Id},
				"updated_at": time.Now().Format(time.RFC3339),
			}},
		)
		if err != nil {
			return err
		}
		log.Println("Normal user roles updated")
	}

	return nil
}

func (m *InitialSetupMigration) createNormalUserRoleAndAccount(ctx context.Context) error {
	userCollection := m.db.Database("hllc-2025").Collection("users")
	roleCollection := m.db.Database("hllc-2025").Collection("roles")
	permissionCollection := m.db.Database("hllc-2025").Collection("permissions")
	
	// Define permission codes for normal users
	normalUserPermissionCodes := []string{
		"ACCESS_PUBLIC", 
		"ACCESS_PROTECTED", 
		"EDIT_OWN_PROFILE",
	}
	
	// Find or create permissions
	normalUserPermissionIds := []string{}
	
	for _, code := range normalUserPermissionCodes {
		var permission userPb.Permission
		err := permissionCollection.FindOne(ctx, bson.M{"code": code}).Decode(&permission)
		
		// If permission doesn't exist, create it
		if err == mongo.ErrNoDocuments {
			permName := ""
			permDesc := ""
			permModule := "general"
			
			switch code {
			case "ACCESS_PUBLIC":
				permName = "Access Public APIs"
				permDesc = "Permission to access public endpoints"
			case "ACCESS_PROTECTED":
				permName = "Access Protected APIs"
				permDesc = "Permission to access protected endpoints (requires login)"
			case "EDIT_OWN_PROFILE":
				permName = "Edit Own Profile"
				permDesc = "Permission to edit one's own profile"
				permModule = "user"
			}
			
			newPermission := userPb.Permission{
				Id:          primitive.NewObjectID().Hex(),
				Name:        permName,
				Code:        code,
				Module:      permModule,
				Description: permDesc,
				CreatedAt:   time.Now().Format(time.RFC3339),
				UpdatedAt:   time.Now().Format(time.RFC3339),
			}
			
			_, err := permissionCollection.InsertOne(ctx, newPermission)
			if err != nil {
				return err
			}
			log.Printf("Created permission: %s", code)
			
			normalUserPermissionIds = append(normalUserPermissionIds, newPermission.Id)
		} else if err != nil {
			return err
		} else {
			normalUserPermissionIds = append(normalUserPermissionIds, permission.Id)
		}
	}
	
	// Create user role
	normalUserRole := &userPb.Role{
		Id:            primitive.NewObjectID().Hex(),
		Name:          "Regular User",
		Code:          "USER",
		Description:   "Regular user with limited access",
		PermissionIds: normalUserPermissionIds,
		CreatedAt:     time.Now().Format(time.RFC3339),
		UpdatedAt:     time.Now().Format(time.RFC3339),
	}
	
	_, err := roleCollection.InsertOne(ctx, normalUserRole)
	if err != nil {
		return err
	}
	log.Println("Normal user role created")
	
	// Create normal user account
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	normalUser := &userPb.User{
		Id:       primitive.NewObjectID().Hex(),
		Username: "user",
		Password: string(hashedPassword),
		Name: &userPb.Name{
			FirstName: "Normal",
			LastName:  "User",
		},
		RoleIds:     []string{normalUserRole.Id},
		CreatedAt:   time.Now().Format(time.RFC3339),
		UpdatedAt:   time.Now().Format(time.RFC3339),
		IsActivated: true,
	}

	_, err = userCollection.InsertOne(ctx, normalUser)
	if err != nil {
		return err
	}
	log.Println("Normal user created")
	
	return nil
}

func (m *InitialSetupMigration) updateNormalUserPermissions(ctx context.Context) error {
	roleCollection := m.db.Database("hllc-2025").Collection("roles")
	permissionCollection := m.db.Database("hllc-2025").Collection("permissions")
	
	// Define permission codes for normal users
	normalUserPermissionCodes := []string{
		"ACCESS_PUBLIC", 
		"ACCESS_PROTECTED", 
		"EDIT_OWN_PROFILE",
	}
	
	// Get normal user role
	var userRole userPb.Role
	err := roleCollection.FindOne(ctx, bson.M{"code": "USER"}).Decode(&userRole)
	if err != nil {
		return err
	}
	
	// Find permissions
	normalUserPermissionIds := []string{}
	
	for _, code := range normalUserPermissionCodes {
		var permission userPb.Permission
		err := permissionCollection.FindOne(ctx, bson.M{"code": code}).Decode(&permission)
		
		// If permission doesn't exist, create it
		if err == mongo.ErrNoDocuments {
			permName := ""
			permDesc := ""
			permModule := "general"
			
			switch code {
			case "ACCESS_PUBLIC":
				permName = "Access Public APIs"
				permDesc = "Permission to access public endpoints"
			case "ACCESS_PROTECTED":
				permName = "Access Protected APIs"
				permDesc = "Permission to access protected endpoints (requires login)"
			case "EDIT_OWN_PROFILE":
				permName = "Edit Own Profile"
				permDesc = "Permission to edit one's own profile"
				permModule = "user"
			}
			
			newPermission := userPb.Permission{
				Id:          primitive.NewObjectID().Hex(),
				Name:        permName,
				Code:        code,
				Module:      permModule,
				Description: permDesc,
				CreatedAt:   time.Now().Format(time.RFC3339),
				UpdatedAt:   time.Now().Format(time.RFC3339),
			}
			
			_, err := permissionCollection.InsertOne(ctx, newPermission)
			if err != nil {
				return err
			}
			log.Printf("Created permission: %s", code)
			
			normalUserPermissionIds = append(normalUserPermissionIds, newPermission.Id)
		} else if err != nil {
			return err
		} else {
			normalUserPermissionIds = append(normalUserPermissionIds, permission.Id)
		}
	}
	
	// Update normal user role permissions
	_, err = roleCollection.UpdateOne(
		ctx,
		bson.M{"code": "USER"},
		bson.M{"$set": bson.M{
			"permission_ids": normalUserPermissionIds,
			"updated_at": time.Now().Format(time.RFC3339),
		}},
	)
	if err != nil {
		return err
	}
	
	log.Println("Normal user role permissions updated")
	return nil
}

func (m *InitialSetupMigration) Down(ctx context.Context) error {
	// Remove admin user
	userCollection := m.db.Database("hllc-2025").Collection("users")
	_, err := userCollection.DeleteOne(ctx, bson.M{"username": "admin"})
	if err != nil {
		return err
	}
	
	// Remove normal user
	_, err = userCollection.DeleteOne(ctx, bson.M{"username": "user"})
	if err != nil {
		return err
	}

	// Remove admin and user roles
	roleCollection := m.db.Database("hllc-2025").Collection("roles")
	_, err = roleCollection.DeleteMany(ctx, bson.M{"code": bson.M{"$in": []string{"ADMIN", "USER"}}})
	if err != nil {
		return err
	}

	// Remove all permissions
	permissionCollection := m.db.Database("hllc-2025").Collection("permissions")
	_, err = permissionCollection.DeleteMany(ctx, bson.M{})
	if err != nil {
		return err
	}

	return nil
} 