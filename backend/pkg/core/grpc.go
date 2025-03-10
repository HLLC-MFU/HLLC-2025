package core

import (
	"context"
	"errors"
	"log"
	"net"
	"strings"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	"github.com/HLLC-MFU/HLLC-2025/backend/config"
	authPb "github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/auth"
	userPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/user"
	"github.com/golang-jwt/jwt/v5"
)

type (

	GrpcClientFactoryController interface {
		User() userPb.UserGrpcServiceClient
		Auth() authPb.AuthGrpcServiceClient
	}

	grpcClientFactory struct {
		client *grpc.ClientConn
	}

	grpcAuth struct {
		secretKey string
		conn *grpc.ClientConn
	}

	Claims struct {
		UserID string `json:"user_id"`
		Username string `json:"username"`
		Email string `json:"email"`
		Role string `json:"role"`
		jwt.RegisteredClaims
	}
)

/*
 * Grpc Module Add here ......
 */

func (g *grpcClientFactory) User() userPb.UserGrpcServiceClient {
	return userPb.NewUserGrpcServiceClient(g.client)
}

func (g *grpcClientFactory) Auth() authPb.AuthGrpcServiceClient {
	return authPb.NewAuthGrpcServiceClient(g.client)
}

func NewGrpcServer(cfg *config.Jwt, host string) (*grpc.Server, net.Listener) {
	opts := make([]grpc.ServerOption, 0)

	grpcAuth := &grpcAuth{
		secretKey: cfg.AccessSecretKey,
	}

	opts = append(opts, grpc.UnaryInterceptor(grpcAuth.UnaryServerInterceptor))

	lis, err := net.Listen("tcp", host)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	server := grpc.NewServer(opts...)
	return server, lis
}

func (g *grpcAuth) UnaryServerInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("missing metadata")
	}

	authHeader := md.Get("authorization")
	if len(authHeader) == 0 {
		return nil, errors.New("missing authorization header")
	}

	tokenString := strings.TrimPrefix(authHeader[0], "Bearer ")
	claims, err := ParseToken(g.secretKey, tokenString)
	if err != nil {
		return nil, err
	}

	if claims.ExpiresAt.Time.Before(time.Now()) {
		return nil, errors.New("token expired")
	}

	return handler(ctx, req)
}

func ParseToken(secretKey string, tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secretKey), nil
	})
	
	if err != nil {
		return nil, err
	}
	
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	
	return nil, errors.New("error: invalid token")
}