package migration

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

type (
	Migration interface {
		Up(ctx context.Context) error
		Down(ctx context.Context) error
		Name() string
	}

	MigrationService struct {
		db *mongo.Client
	}

	MigrationRecord struct {
		Name      string    `bson:"name"`
		CreatedAt time.Time `bson:"created_at"`
		Status    string    `bson:"status"`
	}
)

func NewMigrationService(db *mongo.Client) *MigrationService {
	return &MigrationService{
		db: db,
	}
}

func (s *MigrationService) Run(ctx context.Context, migrations []Migration) error {
	collection := s.db.Database("hllc-2025").Collection("migrations")

	for _, m := range migrations {
		// Check if migration has been run
		var record MigrationRecord
		err := collection.FindOne(ctx, map[string]string{"name": m.Name()}).Decode(&record)
		if err != nil && err != mongo.ErrNoDocuments {
			return err
		}

		// Skip if migration has already been run
		if err == nil {
			log.Printf("Migration %s has already been run", m.Name())
			continue
		}

		// Run migration
		log.Printf("Running migration: %s", m.Name())
		if err := m.Up(ctx); err != nil {
			return err
		}

		// Record successful migration
		_, err = collection.InsertOne(ctx, MigrationRecord{
			Name:      m.Name(),
			CreatedAt: time.Now(),
			Status:    "completed",
		})
		if err != nil {
			return err
		}

		log.Printf("Migration completed: %s", m.Name())
	}

	return nil
} 