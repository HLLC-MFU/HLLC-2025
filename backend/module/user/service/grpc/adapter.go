package grpc

// import (
// 	"context"
// 	"log"

// 	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
// 	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/core"
// )

// type (
// 	grpcMajorService struct {
// 		//Default
// 	}
// )

// func NewMajorServiceGRPC() *grpcMajorService {
// 	return &grpcMajorService{}
// }

// func (g *grpcMajorService) GetMajor(ctx context.Context, majorID string) (*majorPb.Major, error) {
// 	if majorID == "" {
// 		return nil, nil
// 	}

// 	client, err := core.GetMajorServiceClient(ctx)
// 	if err != nil {
// 		log.Printf("grpcMajorService: Failed to get major client: %v", err)
// 		return nil, err
// 	}

// 	res, err := client.GetMajor(ctx, &majorPb.GetMajorRequest{Id: majorID})
// 	if err != nil {
// 		log.Printf("grpcMajorService: Error calling GetMajor: %v", err)
// 		return nil, err
// 	}

// 	return res.Major, nil
// }
