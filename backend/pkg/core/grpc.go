package core

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto"
	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/security"
)

type (
	GrpcClientFactoryController interface {
		User(ctx context.Context) (userPb.UserServiceClient, error)
		Auth(ctx context.Context) (authPb.AuthServiceClient, error)
	}

	grpcClientFactory struct {
		target string
		opts   []grpc.DialOption
	}

	// JwtConfig represents the JWT configuration
	JwtConfig struct {
		AccessSecretKey  string
		RefreshSecretKey string
		ApiSecretKey    string
		AccessDuration   int64
		RefreshDuration  int64
		ApiDuration     int64
	}
)

// NewGrpcClientFactory creates a new gRPC client factory
func NewGrpcClientFactory(target string) GrpcClientFactoryController {
	return &grpcClientFactory{
		target: target,
		opts: []grpc.DialOption{
			grpc.WithTransportCredentials(insecure.NewCredentials()),
		},
	}
}

// User returns a new user service client
func (g *grpcClientFactory) User(ctx context.Context) (userPb.UserServiceClient, error) {
	conn, err := grpc.DialContext(ctx, g.target, g.opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create user client: %w", err)
	}
	return userPb.NewUserServiceClient(conn), nil
}

// Auth returns a new auth service client
func (g *grpcClientFactory) Auth(ctx context.Context) (authPb.AuthServiceClient, error) {
	conn, err := grpc.DialContext(ctx, g.target, g.opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth client: %w", err)
	}
	return authPb.NewAuthServiceClient(conn), nil
}

// NewGrpcServer creates a new gRPC server with authentication middleware
func NewGrpcServer(jwtConfig *JwtConfig, url string) (*grpc.Server, net.Listener) {
	lis, err := net.Listen("tcp", url)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Create gRPC server with auth interceptor
	server := grpc.NewServer(
		grpc.UnaryInterceptor(func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
			// Skip auth for public methods
			if isPublicMethod(info.FullMethod) {
				return handler(ctx, req)
			}

			// Get token from metadata
			token, err := extractTokenFromContext(ctx)
			if err != nil {
				return nil, err
			}

			// Validate token
			claims, err := validateToken(token, jwtConfig.AccessSecretKey)
			if err != nil {
				return nil, err
			}

			// Add claims to context
			newCtx := context.WithValue(ctx, "claims", claims)
			return handler(newCtx, req)
		}),
	)

	return server, lis
}

// NewGrpcClient creates a new gRPC client connection
func NewGrpcClient(ctx context.Context, url string) (*grpc.ClientConn, error) {
	conn, err := grpc.DialContext(
		ctx,
		url,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to gRPC server: %v", err)
	}
	return conn, nil
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

func extractTokenFromContext(ctx context.Context) (string, error) {
	// Implementation of token extraction from gRPC metadata
	// This would typically use grpc/metadata package
	return "", nil // TODO: Implement token extraction
}

func validateToken(token string, secretKey string) (map[string]interface{}, error) {
	// Implementation of JWT validation
	// This would typically use jwt-go or similar package
	return nil, nil // TODO: Implement token validation
}

// GetClaimsFromContext extracts claims from context
func GetClaimsFromContext(ctx context.Context) (*security.Claims, error) {
	claims, ok := ctx.Value("claims").(*security.Claims)
	if !ok {
		return nil, errors.New("no claims in context")
	}
	return claims, nil
}

// NewGrpcConnection creates a new gRPC connection with retry
func NewGrpcConnection(ctx context.Context, target string, maxRetries int) (*grpc.ClientConn, error) {
	var conn *grpc.ClientConn
	var err error

	for i := 0; i < maxRetries; i++ {
		connCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		conn, err = grpc.DialContext(connCtx, target,
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithBlock(),
		)
		cancel()
		
		if err == nil {
			return conn, nil
		}

		log.Printf("Failed to connect to gRPC server: %v, retrying in 5 seconds...", err)
		time.Sleep(5 * time.Second)
	}

	return nil, fmt.Errorf("failed to connect after %d retries: %v", maxRetries, err)
}