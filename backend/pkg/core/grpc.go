package core

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
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
func NewGrpcServer(cfg *config.Jwt, host string) (*grpc.Server, net.Listener) {
	opts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(
			newAuthInterceptor(cfg.AccessSecretKey).unaryInterceptor,
		),
	}

	lis, err := net.Listen("tcp", host)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	server := grpc.NewServer(opts...)
	return server, lis
}

type authInterceptor struct {
	secretKey string
}

func newAuthInterceptor(secretKey string) *authInterceptor {
	return &authInterceptor{secretKey: secretKey}
}

// unaryInterceptor is a middleware that checks if the request is authenticated
func (a *authInterceptor) unaryInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	// Skip authentication for internal methods
	if isInternalMethod(info.FullMethod) {
		return handler(ctx, req)
	}

	// Get metadata from context
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "missing metadata")
	}

	// Get authorization header
	authHeader := md.Get("authorization")
	if len(authHeader) == 0 {
		return nil, status.Error(codes.Unauthenticated, "missing authorization header")
	}

	// Extract token
	tokenString := strings.TrimPrefix(authHeader[0], "Bearer ")
	claims, err := security.ParseToken(a.secretKey, tokenString)
	if err != nil {
		if errors.Is(err, security.ErrTokenExpired) {
			return nil, status.Error(codes.PermissionDenied, "token expired")
		}
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}

	// Check token type
	if claims.TokenType != security.TokenTypeAccess {
		return nil, status.Error(codes.PermissionDenied, "invalid token type")
	}

	// Add claims to context
	ctx = context.WithValue(ctx, "claims", claims)
	return handler(ctx, req)
}

// isInternalMethod checks if the method is internal
func isInternalMethod(method string) bool {
	return strings.HasPrefix(method, "/auth.AuthService/Internal") ||
		strings.HasPrefix(method, "/user.UserService/Internal")
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