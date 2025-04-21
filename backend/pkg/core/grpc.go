package core

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"sync"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"

	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated"
	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	schoolPb "github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
)

const (
	baseGRPCPort = 50051 // Base port for gRPC services
)

var (
	// Global service registry
	serviceRegistry = &ServiceRegistry{
		services: make(map[string]*ServiceInfo),
		mu:       sync.RWMutex{},
		nextPort: baseGRPCPort,
	}
)

// ServiceInfo holds information about a registered gRPC service
type ServiceInfo struct {
	Name     string
	Port     int
	Server   *grpc.Server
	Listener net.Listener
}

// ServiceRegistry manages gRPC service registration and discovery
type ServiceRegistry struct {
	services map[string]*ServiceInfo
	mu       sync.RWMutex
	nextPort int
}

// RegisterService registers a new gRPC service
func (r *ServiceRegistry) RegisterService(name string) (*ServiceInfo, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	log.Printf("Attempting to register gRPC service: %s", name)

	// Check if service already exists
	if info, exists := r.services[name]; exists {
		log.Printf("Service %s already registered on port %d", name, info.Port)
		return info, nil
	}

	// Create service info
	info := &ServiceInfo{
		Name: name,
		Port: r.nextPort,
	}

	// Create listener
	addr := fmt.Sprintf(":%d", info.Port)
	log.Printf("Creating listener for %s on %s", name, addr)
	listener, err := net.Listen("tcp", addr)
	if err != nil {
		log.Printf("Failed to create listener for %s: %v", name, err)
		return nil, fmt.Errorf("failed to listen on port %d: %v", info.Port, err)
	}

	// Create gRPC server with interceptors
	server := grpc.NewServer(
		grpc.UnaryInterceptor(SecurityInterceptor),
	)

	info.Server = server
	info.Listener = listener

	// Store service info
	r.services[name] = info
	r.nextPort++

	log.Printf("Successfully registered gRPC service %s on port %d", name, info.Port)
	return info, nil
}

// GetServiceInfo gets information about a registered service
func (r *ServiceRegistry) GetServiceInfo(name string) (*ServiceInfo, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	info, exists := r.services[name]
	return info, exists
}

// SecurityInterceptor handles authentication and authorization
func SecurityInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// Skip auth for public methods
	if isPublicMethod(info.FullMethod) {
		return handler(ctx, req)
	}

	// Get token from metadata
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("no metadata in context")
	}

	tokens := md.Get("authorization")
	if len(tokens) == 0 {
		return nil, errors.New("no authorization token")
	}

	// Parse and validate token
	claims, err := security.ParseToken(tokens[0], "your-secret-key") // Use your actual secret key
	if err != nil {
		return nil, err
	}

	// Add claims to context
	newCtx := context.WithValue(ctx, "claims", claims)
	return handler(newCtx, req)
}

// RegisterGRPCService registers and starts a gRPC service
func RegisterGRPCService(name string, registerFn func(*grpc.Server)) error {
	log.Printf("Starting registration of gRPC service: %s", name)

	info, err := serviceRegistry.RegisterService(name)
	if err != nil {
		log.Printf("Failed to register gRPC service %s: %v", name, err)
		return err
	}

	// Register service-specific handlers
	log.Printf("Registering handlers for gRPC service: %s", name)
	registerFn(info.Server)

	// Start gRPC server
	go func() {
		log.Printf("Starting gRPC service %s on port %d", name, info.Port)
		if err := info.Server.Serve(info.Listener); err != nil {
			log.Printf("Failed to serve gRPC service %s: %v", name, err)
		}
	}()

	log.Printf("Successfully started gRPC service %s", name)
	return nil
}

// GetGRPCConnection gets a connection to a registered service
func GetGRPCConnection(ctx context.Context, serviceName string) (*grpc.ClientConn, error) {
	info, exists := serviceRegistry.GetServiceInfo(serviceName)
	if !exists {
		return nil, fmt.Errorf("service %s not registered", serviceName)
	}

	addr := fmt.Sprintf("localhost:%d", info.Port)
	log.Printf("Attempting to connect to gRPC service %s at %s", serviceName, addr)

	conn, err := grpc.DialContext(
		ctx,
		addr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	if err != nil {
		log.Printf("Failed to connect to gRPC service %s: %v", serviceName, err)
		return nil, err
	}

	log.Printf("Successfully connected to gRPC service %s", serviceName)
	return conn, nil
}

// Service client getters
func GetUserServiceClient(ctx context.Context) (userPb.UserServiceClient, error) {
	conn, err := GetGRPCConnection(ctx, "user")
	if err != nil {
		return nil, err
	}
	return userPb.NewUserServiceClient(conn), nil
}

func GetAuthServiceClient(ctx context.Context) (authPb.AuthServiceClient, error) {
	conn, err := GetGRPCConnection(ctx, "auth")
	if err != nil {
		return nil, err
	}
	return authPb.NewAuthServiceClient(conn), nil
}

func GetSchoolServiceClient(ctx context.Context) (schoolPb.SchoolServiceClient, error) {
	conn, err := GetGRPCConnection(ctx, "school")
	if err != nil {
		return nil, err
	}
	return schoolPb.NewSchoolServiceClient(conn), nil
}

func GetMajorServiceClient(ctx context.Context) (majorPb.MajorServiceClient, error) {
	conn, err := GetGRPCConnection(ctx, "major")
	if err != nil {
		return nil, err
	}
	return majorPb.NewMajorServiceClient(conn), nil
}

// Helper functions
func isPublicMethod(method string) bool {
	publicMethods := map[string]bool{
		"/auth.AuthService/Login":            true,
		"/auth.AuthService/Register":         true,
		"/auth.AuthService/RefreshToken":     true,
		"/user.UserService/ValidateCredentials": true,
	}
	return publicMethods[method]
}

// GetGRPCPorts returns a map of service names to their gRPC ports
func GetGRPCPorts() map[string]int {
	serviceRegistry.mu.RLock()
	defer serviceRegistry.mu.RUnlock()

	ports := make(map[string]int)
	for name, info := range serviceRegistry.services {
		ports[name] = info.Port
	}
	return ports
}