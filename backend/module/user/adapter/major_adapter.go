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
	majorAddr   string
}

// NewMajorServiceAdapter creates a new major service adapter
func NewMajorServiceAdapter(majorAddr string) service.MajorService {
	// Log the address being used for major service
	log.Printf("Initializing MajorServiceAdapter with address: %s", majorAddr)
	
	// Check if address is valid
	if majorAddr == "" || strings.TrimSpace(majorAddr) == "" {
		log.Printf("Error: Major service address is empty, using mock implementation")
		return &MajorServiceAdapter{
			majorClient: nil,
			connected:   false,
			majorAddr:   "",
		}
	}

	// Create a connection to the major service with retry
	var conn *grpc.ClientConn
	var err error
	maxRetries := 5
	for i := 0; i < maxRetries; i++ {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		opts := []grpc.DialOption{
			grpc.WithTransportCredentials(insecure.NewCredentials()),
			grpc.WithBlock(),
		}
		
		log.Printf("Attempting to connect to major service at %s (attempt %d/%d)", majorAddr, i+1, maxRetries)
		conn, err = grpc.DialContext(ctx, majorAddr, opts...)
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
			majorAddr:   majorAddr,
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
			majorAddr:   majorAddr,
		}
	}

	log.Printf("Successfully connected to major service at %s", majorAddr)
	return &MajorServiceAdapter{
		majorClient: client,
		connected:   true,
		majorAddr:   majorAddr,
	}
}

// tryReconnect attempts to reconnect to the major service if not connected
func (a *MajorServiceAdapter) tryReconnect(ctx context.Context) bool {
	if a.connected || a.majorClient != nil {
		return true
	}
	
	if a.majorAddr == "" {
		log.Printf("Cannot reconnect: major service address is empty")
		return false
	}
	
	log.Printf("Attempting to reconnect to major service at %s", a.majorAddr)
	
	// Create a new connection
	conn, err := grpc.DialContext(
		ctx,
		a.majorAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	
	if err != nil {
		log.Printf("Reconnection failed: %v", err)
		return false
	}
	
	// Create a new client
	a.majorClient = majorPb.NewMajorServiceClient(conn)
	
	// Test the connection
	_, err = a.majorClient.ListMajors(ctx, &majorPb.ListMajorsRequest{})
	if err != nil {
		log.Printf("Reconnection test failed: %v", err)
		a.majorClient = nil
		return false
	}
	
	log.Printf("Successfully reconnected to major service")
	a.connected = true
	return true
}

// GetMajorByID retrieves a major by ID
func (a *MajorServiceAdapter) GetMajorByID(ctx context.Context, id string) (*majorPb.Major, error) {
	// Log the request
	log.Printf("GetMajorByID called with ID: %s", id)
	
	// If not connected, try to reconnect
	if !a.connected || a.majorClient == nil {
		if !a.tryReconnect(ctx) {
			log.Printf("Warning: Major service not connected, cannot get major with ID: %s", id)
			return nil, errors.New("major service not connected")
		}
	}

	// Validate ID format
	if _, err := primitive.ObjectIDFromHex(id); err != nil {
		log.Printf("Error: Invalid major ID format: %s", id)
		return nil, errors.New("invalid major ID format")
	}

	// Call the major service with timeout
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	log.Printf("Calling major service GetMajor with ID: %s", id)
	resp, err := a.majorClient.GetMajor(ctx, &majorPb.GetMajorRequest{
		Id: id,
	})
	
	if err != nil {
		log.Printf("Error calling major service GetMajor: %v", err)
		
		// Check if this is a connection error and mark as disconnected
		if strings.Contains(err.Error(), "connection") || 
		   strings.Contains(err.Error(), "transport") ||
		   strings.Contains(err.Error(), "unavailable") {
			log.Printf("Connection error detected, marking as disconnected")
			a.connected = false
			a.majorClient = nil
		}
		
		return nil, err
	}

	if resp == nil {
		log.Printf("Warning: Major service returned nil response for ID: %s", id)
		return nil, nil
	}
	
	if resp.Major == nil {
		log.Printf("Warning: Major service returned response with nil Major field for ID: %s", id)
		return nil, nil
	}

	log.Printf("Successfully retrieved major: ID=%s, Name=%s", resp.Major.Id, resp.Major.Name)
	return resp.Major, nil
} 