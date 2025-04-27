package http

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/dto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/exceptions"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/logging"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type (
	PermissionService interface {
		//Default
		CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error)
		GetPermissionByID(ctx context.Context, id string) (*userPb.Permission, error)
		GetAllPermissions(ctx context.Context) ([]*userPb.Permission, error)
		UpdatePermission(ctx context.Context, id string, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error)
		DeletePermission(ctx context.Context, id string) error
		
		// Module-specific methods
		GetPermissionsByModule(ctx context.Context, module string) ([]*userPb.Permission, error)
		GetPermissionsByModuleAndAction(ctx context.Context, module, action string) ([]*userPb.Permission, error)
		GetPermissionsByAccessLevel(ctx context.Context, accessLevel string) ([]*userPb.Permission, error)
		
		// Template-based permission generation
		CreatePermissionFromTemplate(ctx context.Context, req *dto.CreatePermissionTemplateRequest) (*dto.PermissionTemplateResponse, error)
		
		// Module-based permission generation
		CreateModulePermissions(ctx context.Context, req *dto.ModulePermissionTemplateRequest) (*dto.ModulePermissionTemplateResponse, error)
	}

	permissionService struct {
		//Default
		permissionRepository repository.PermissionRepositoryService
	}
)

func NewPermissionService(
	permissionRepository repository.PermissionRepositoryService,
) PermissionService {
	return &permissionService{
		permissionRepository: permissionRepository,
	}
}

// Create New Permission
func (s *permissionService) CreatePermission(ctx context.Context, req *userPb.CreatePermissionRequest) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating new permission",
			logging.FieldOperation, "create_permission",
			logging.FieldEntity, "permission",
			"code", req.Code,
			"name", req.Name,
			"module", req.Module,
		)

		// Create a new permission
		permission := &userPb.Permission{
			Id:          primitive.NewObjectID().Hex(),
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			Module:      req.Module,
			Action:      req.Action,
			AccessLevel: req.AccessLevel,
			Resource:    req.Resource,
			CreatedAt:   time.Now().Format(time.RFC3339),
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		// Save permission
		if err := s.permissionRepository.CreatePermission(ctx, permission); err != nil {
			logger.Error("Failed to create permission", err,
				logging.FieldOperation, "create_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, permission.Id,
				"code", permission.Code,
			)
			return nil, err
		}

		logger.Info("Permission created successfully",
			logging.FieldOperation, "create_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)

		return permission, nil
	})(ctx)
}

// Get Permission By ID
func (s *permissionService) GetPermissionByID(ctx context.Context, id string) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting permission by ID",
			logging.FieldOperation, "get_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "get_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid permission ID format", err,
				exceptions.WithOperation("get_permission"),
				exceptions.WithEntity("permission", id))
		}

		permission, err := s.permissionRepository.FindPermissionByID(ctx, objectID)
		if err != nil {
			logger.Error("Failed to find permission", err,
				logging.FieldOperation, "get_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return nil, err
		}

		logger.Info("Permission retrieved successfully",
			logging.FieldOperation, "get_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, permission.Id,
			"code", permission.Code,
		)

		return permission, nil
	})(ctx)
}

// Get All Permissions
func (s *permissionService) GetAllPermissions(ctx context.Context) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10 * time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting all permissions",
			logging.FieldOperation, "get_all_permissions",
			logging.FieldEntity, "permission",
		)

		permissions, err := s.permissionRepository.FindAllPermissions(ctx)
		if err != nil {
			logger.Error("Failed to find permissions", err,
				logging.FieldOperation, "get_all_permissions",
				logging.FieldEntity, "permission",
			)
			return nil, err
		}

		logger.Info("Retrieved all permissions successfully",
			logging.FieldOperation, "get_all_permissions",
			logging.FieldEntity, "permission",
			"count", len(permissions),
		)

		return permissions, nil
	})(ctx)
}

// Update Permission
func (s *permissionService) UpdatePermission(ctx context.Context, id string, req *userPb.UpdatePermissionRequest) (*userPb.Permission, error) {
	return decorator.WithTimeout[*userPb.Permission](10 * time.Second)(func(ctx context.Context) (*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Updating permission",
			logging.FieldOperation, "update_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "update_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return nil, exceptions.InvalidInput("invalid permission ID format", err,
				exceptions.WithOperation("update_permission"),
				exceptions.WithEntity("permission", id))
		}

		// Update permission entity
		permission := &userPb.Permission{
			Id:          objectID.Hex(),
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			Module:      req.Module,
			Action:      req.Action,
			AccessLevel: req.AccessLevel,
			Resource:    req.Resource,
			UpdatedAt:   time.Now().Format(time.RFC3339),
		}

		// Save permission
		if err := s.permissionRepository.UpdatePermission(ctx, permission); err != nil {
			logger.Error("Failed to update permission", err,
				logging.FieldOperation, "update_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
				"code", req.Code,
			)
			return nil, err
		}

		logger.Info("Permission updated successfully",
			logging.FieldOperation, "update_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
			"code", req.Code,
		)

		return permission, nil
	})(ctx)
}

// Delete Permission
func (s *permissionService) DeletePermission(ctx context.Context, id string) error {
	_, err := decorator.WithTimeout[struct{}](5 * time.Second)(func(ctx context.Context) (struct{}, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Deleting permission",
			logging.FieldOperation, "delete_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		objectID, err := primitive.ObjectIDFromHex(id)
		if err != nil {
			logger.Error("Invalid permission ID format", err,
				logging.FieldOperation, "delete_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return struct{}{}, exceptions.InvalidInput("invalid permission ID format", err,
				exceptions.WithOperation("delete_permission"),
				exceptions.WithEntity("permission", id))
		}

		if err := s.permissionRepository.DeletePermission(ctx, objectID); err != nil {
			logger.Error("Failed to delete permission", err,
				logging.FieldOperation, "delete_permission",
				logging.FieldEntity, "permission",
				logging.FieldEntityID, id,
			)
			return struct{}{}, err
		}

		logger.Info("Permission deleted successfully",
			logging.FieldOperation, "delete_permission",
			logging.FieldEntity, "permission",
			logging.FieldEntityID, id,
		)

		return struct{}{}, nil
	})(ctx)

	return err
}

// New methods for module-based permissions

// GetPermissionsByModule gets permissions for a specific module
func (s *permissionService) GetPermissionsByModule(ctx context.Context, module string) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10 * time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting permissions by module",
			logging.FieldOperation, "get_permissions_by_module",
			logging.FieldEntity, "permission",
			"module", module,
		)

		permissions, err := s.permissionRepository.FindPermissionsByModule(ctx, module)
		if err != nil {
			logger.Error("Failed to find permissions by module", err,
				logging.FieldOperation, "get_permissions_by_module",
				logging.FieldEntity, "permission",
				"module", module,
			)
			return nil, err
		}

		logger.Info("Retrieved permissions by module successfully",
			logging.FieldOperation, "get_permissions_by_module",
			logging.FieldEntity, "permission",
			"module", module,
			"count", len(permissions),
		)

		return permissions, nil
	})(ctx)
}

// GetPermissionsByModuleAndAction gets permissions for a specific module and action
func (s *permissionService) GetPermissionsByModuleAndAction(ctx context.Context, module, action string) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10 * time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting permissions by module and action",
			logging.FieldOperation, "get_permissions_by_module_and_action",
			logging.FieldEntity, "permission",
			"module", module,
			"action", action,
		)

		permissions, err := s.permissionRepository.FindPermissionsByModuleAndAction(ctx, module, action)
		if err != nil {
			logger.Error("Failed to find permissions by module and action", err,
				logging.FieldOperation, "get_permissions_by_module_and_action",
				logging.FieldEntity, "permission",
				"module", module,
				"action", action,
			)
			return nil, err
		}

		logger.Info("Retrieved permissions by module and action successfully",
			logging.FieldOperation, "get_permissions_by_module_and_action",
			logging.FieldEntity, "permission",
			"module", module,
			"action", action,
			"count", len(permissions),
		)

		return permissions, nil
	})(ctx)
}

// GetPermissionsByAccessLevel gets permissions for a specific access level
func (s *permissionService) GetPermissionsByAccessLevel(ctx context.Context, accessLevel string) ([]*userPb.Permission, error) {
	return decorator.WithTimeout[[]*userPb.Permission](10 * time.Second)(func(ctx context.Context) ([]*userPb.Permission, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Getting permissions by access level",
			logging.FieldOperation, "get_permissions_by_access_level",
			logging.FieldEntity, "permission",
			"access_level", accessLevel,
		)

		permissions, err := s.permissionRepository.FindPermissionsByAccessLevel(ctx, accessLevel)
		if err != nil {
			logger.Error("Failed to find permissions by access level", err,
				logging.FieldOperation, "get_permissions_by_access_level",
				logging.FieldEntity, "permission",
				"access_level", accessLevel,
			)
			return nil, err
		}

		logger.Info("Retrieved permissions by access level successfully",
			logging.FieldOperation, "get_permissions_by_access_level",
			logging.FieldEntity, "permission",
			"access_level", accessLevel,
			"count", len(permissions),
		)

		return permissions, nil
	})(ctx)
}

// CreatePermissionFromTemplate generates a set of permissions from a template
func (s *permissionService) CreatePermissionFromTemplate(ctx context.Context, req *dto.CreatePermissionTemplateRequest) (*dto.PermissionTemplateResponse, error) {
	return decorator.WithTimeout[*dto.PermissionTemplateResponse](15 * time.Second)(func(ctx context.Context) (*dto.PermissionTemplateResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating permissions from template",
			logging.FieldOperation, "create_permissions_from_template",
			logging.FieldEntity, "permission_template",
			"module", req.Module,
			"resource", req.Resource,
		)

		// Initialize response
		response := &dto.PermissionTemplateResponse{
			Module:      req.Module,
			Resource:    req.Resource,
			Permissions: []*dto.PermissionResponse{},
		}

		// Generate each requested permission
		for _, action := range req.Actions {
			// Create consistent naming
			name := fmt.Sprintf("%s.%s.%s", req.Module, req.Resource, action)
			code := fmt.Sprintf("%s_%s_%s", req.Module, req.Resource, action)
			code = strings.ToUpper(code)
			
			// Prepare description based on provided or generate a default
			description := req.Description
			if description == "" {
				actionVerb := action
				switch action {
				case "create":
					actionVerb = "Create"
				case "read":
					actionVerb = "View"
				case "update":
					actionVerb = "Update"
				case "delete":
					actionVerb = "Delete"
				case "list":
					actionVerb = "List"
				}
				description = fmt.Sprintf("Permission to %s %s in %s module", strings.ToLower(actionVerb), req.Resource, req.Module)
			}

			// Create the permission in proto format
			permission := &userPb.CreatePermissionRequest{
				Name:        name,
				Code:        code,
				Description: description,
				Module:      req.Module,
				// Will be available after proto regeneration
				/*
				Action:      action,
				AccessLevel: req.AccessLevel,
				Resource:    req.Resource,
				*/
			}

			// Create the permission through the standard method
			createdPerm, err := s.CreatePermission(ctx, permission)
			if err != nil {
				// If the permission already exists, just log and continue
				if exceptions.IsAlreadyExists(err) {
					logger.Warn("Permission already exists, skipping",
						logging.FieldOperation, "create_permissions_from_template",
						logging.FieldEntity, "permission",
						"code", code,
					)
					continue
				}
				
				logger.Error("Failed to create permission from template", err,
					logging.FieldOperation, "create_permissions_from_template",
					logging.FieldEntity, "permission",
					"name", name,
					"code", code,
				)
				return nil, err
			}

			// Add to response
			permResponse := &dto.PermissionResponse{
				ID:          createdPerm.Id,
				Name:        createdPerm.Name,
				Code:        createdPerm.Code,
				Description: createdPerm.Description,
				Module:      createdPerm.Module,
				// Will be available after proto regeneration
				/*
				Action:      createdPerm.Action,
				AccessLevel: createdPerm.AccessLevel,
				Resource:    createdPerm.Resource,
				Tags:        req.Tags,
				*/
			}
			
			response.Permissions = append(response.Permissions, permResponse)
		}

		logger.Info("Created permissions from template successfully",
			logging.FieldOperation, "create_permissions_from_template",
			logging.FieldEntity, "permission_template",
			"module", req.Module,
			"resource", req.Resource,
			"count", len(response.Permissions),
		)

		return response, nil
	})(ctx)
}

// CreateModulePermissions generates module-based permissions for standard access levels
func (s *permissionService) CreateModulePermissions(ctx context.Context, req *dto.ModulePermissionTemplateRequest) (*dto.ModulePermissionTemplateResponse, error) {
	return decorator.WithTimeout[*dto.ModulePermissionTemplateResponse](15 * time.Second)(func(ctx context.Context) (*dto.ModulePermissionTemplateResponse, error) {
		logger := logging.DefaultLogger.WithContext(ctx)
		logger.Info("Creating standard module permissions",
			logging.FieldOperation, "create_module_permissions",
			logging.FieldEntity, "module_permission",
			"module", req.Module,
		)

		// Initialize response
		response := &dto.ModulePermissionTemplateResponse{
			Module:      req.Module,
			Permissions: []*dto.PermissionResponse{},
		}

		// Define standard access levels
		accessLevels := []string{"PUBLIC_ACCESS", "USER_ACCESS", "ADMIN_ACCESS"}
		
		moduleName := strings.ToUpper(req.Module)
		
		// Create module-specific standard permissions like MODULE_PUBLIC_ACCESS, etc.
		for _, accessLevel := range accessLevels {
			code := fmt.Sprintf("%s_MODULE_%s", moduleName, accessLevel)
			name := fmt.Sprintf("%s Module - %s", req.Module, strings.Title(strings.ToLower(strings.Replace(accessLevel, "_", " ", -1))))
			
			description := req.Description
			if description == "" {
				description = fmt.Sprintf("Permission to access %s level endpoints in %s module", 
					strings.ToLower(strings.Replace(accessLevel, "_", " ", -1)), 
					req.Module)
			}

			// Create the permission
			permission := &userPb.CreatePermissionRequest{
				Name:        name,
				Code:        code,
				Description: description,
				Module:      req.Module,
				AccessLevel: strings.ToLower(strings.Split(accessLevel, "_")[0]),
			}

			// Create the permission through the standard method
			createdPerm, err := s.CreatePermission(ctx, permission)
			if err != nil {
				// If the permission already exists, just log and continue
				if exceptions.IsAlreadyExists(err) {
					logger.Warn("Permission already exists, skipping",
						logging.FieldOperation, "create_module_permissions",
						logging.FieldEntity, "permission",
						"code", code,
					)
					
					// Get existing permission instead
					existingPerm, findErr := s.permissionRepository.FindPermissionByCode(ctx, code)
					if findErr == nil {
						permResponse := &dto.PermissionResponse{
							ID:          existingPerm.Id,
							Name:        existingPerm.Name,
							Code:        existingPerm.Code,
							Description: existingPerm.Description,
							Module:      existingPerm.Module,
							AccessLevel: existingPerm.AccessLevel,
						}
						response.Permissions = append(response.Permissions, permResponse)
					}
					
					continue
				}
				
				logger.Error("Failed to create permission", err,
					logging.FieldOperation, "create_module_permissions",
					logging.FieldEntity, "permission",
					"name", name,
					"code", code,
				)
				return nil, err
			}

			// Add to response
			permResponse := &dto.PermissionResponse{
				ID:          createdPerm.Id,
				Name:        createdPerm.Name,
				Code:        createdPerm.Code,
				Description: createdPerm.Description,
				Module:      createdPerm.Module,
				AccessLevel: createdPerm.AccessLevel,
			}
			
			response.Permissions = append(response.Permissions, permResponse)
		}

		logger.Info("Created module permissions successfully",
			logging.FieldOperation, "create_module_permissions",
			logging.FieldEntity, "module_permission",
			"module", req.Module,
			"count", len(response.Permissions),
		)

		return response, nil
	})(ctx)
}
