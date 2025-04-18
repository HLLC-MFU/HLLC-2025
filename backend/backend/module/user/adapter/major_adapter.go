package adapter

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	majorPb "github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/service"
)

// MajorServiceAdapter adapts the major service to the user service
type MajorServiceAdapter struct {
	majorClient majorPb.MajorServiceClient
	connected   bool
}

// NewMajorServiceAdapter creates a new major service adapter
func NewMajorServiceAdapter(majorAddr string) service.MajorService {
	// Check if address is valid
	if majorAddr == "" || strings.TrimSpace(majorAddr) == "" {
		log.Printf("Warning: Major service address is empty, using mock implementation")
		return &MajorServiceAdapter{
			majorClient: nil,
			connected:   false,
		}
	}

	// Create a connection to the major service with retry
	var conn *grpc.ClientConn
	var err error
	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		conn, err = grpc.DialContext(ctx, majorAddr,
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithBlock(),
		)
		cancel()
		
		if err == nil {
			break
		}
		
		log.Printf("Warning: Failed to connect to major service (attempt %d/%d): %v", i+1, maxRetries, err)
		if i < maxRetries-1 {
			time.Sleep(2 * time.Second)
		}
	}

	if err != nil {
		log.Printf("Error: Failed to connect to major service after %d attempts: %v", maxRetries, err)
		return &MajorServiceAdapter{
			majorClient: nil,
			connected:   false,
		}
	}

	// Create a major service client
	client := majorPb.NewMajorServiceClient(conn)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	_, err = client.ListMajors(ctx, &majorPb.ListMajorsRequest{})
	if err != nil {
		log.Printf("Error: Failed to test major service connection: %v", err)
		return &MajorServiceAdapter{
			majorClient: nil,
			connected:   false,
		}
	}

	log.Printf("Successfully connected to major service at %s", majorAddr)
	return &MajorServiceAdapter{
		majorClient: client,
		connected:   true,
	}
}

// GetMajorByID retrieves a major by ID
func (a *MajorServiceAdapter) GetMajorByID(ctx context.Context, id string) (*majorPb.Major, error) {
	// If not connected, return a mock response
	if !a.connected || a.majorClient == nil {
		log.Printf("Warning: Major service not connected, cannot get major with ID: %s", id)
		return nil, errors.New("major service not connected")
	}

	// Validate ID format
	if _, err := primitive.ObjectIDFromHex(id); err != nil {
		return nil, errors.New("invalid major ID format")
	}

	// Call the major service with timeout
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	resp, err := a.majorClient.GetMajor(ctx, &majorPb.GetMajorRequest{
		Id: id,
	})
	if err != nil {
		log.Printf("Error calling major service GetMajor: %v", err)
		return nil, err
	}

	if resp == nil || resp.Major == nil {
		log.Printf("Warning: Major service returned nil response for ID: %s", id)
		return nil, nil
	}

	return resp.Major, nil
} 