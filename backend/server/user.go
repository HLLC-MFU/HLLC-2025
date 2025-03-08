package server

import (
	"log"

	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/controller"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"

	userPb "github.com/HLLC-MFU/HLLC-2025/backend/proto/user"
)

func (s *server) userService() {
	
	userRepository := repository.NewUserRepository(s.db)
	userService := service.NewUserService(userRepository)
	userController := controller.NewUserController(userService)

	//Grpc
	grpcController := controller.NewGrpcController(s.cfg, userService)

	// gRPC Server
	go func() {
		grpcServer, lis := grpc.NewGrpcServer(&s.cfg.Jwt, s.cfg.Grpc.UserUrl)
		userPb.RegisterUserGrpcServiceServer(grpcServer, grpcController)
		log.Printf("User gRPC server listening on %s", s.cfg.Grpc.UserUrl)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("gRPC server error: %v", err)
		}
	}()

}