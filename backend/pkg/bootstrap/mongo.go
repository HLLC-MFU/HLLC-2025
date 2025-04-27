package bootstrap

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// InitializeMongoDB creates all necessary collections and indexes
func InitializeMongoDB(ctx context.Context, client *mongo.Client, dbName string) error {
	db := client.Database(dbName)

	// List of collections and their indexes
	collections := map[string][]mongo.IndexModel{
		"users": {
			{
				Keys:    bson.D{{Key: "username", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		"roles": {
			{
				Keys:    bson.D{{Key: "name", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		"schools": {
			{
				Keys:    bson.D{{Key: "acronym", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys:    bson.D{{Key: "name.en_name", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys:    bson.D{{Key: "name.th_name", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		"majors": {
			{
				Keys:    bson.D{{Key: "school_id", Value: 1}},
				Options: options.Index(),
			},
			{
				Keys:    bson.D{{Key: "acronym", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys:    bson.D{{Key: "name.en_name", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
			{
				Keys:    bson.D{{Key: "name.th_name", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		"activities": {
			{
				Keys:    bson.D{{Key: "code", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		"migrations": {
			{
				Keys:    bson.D{{Key: "name", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
	}

	// Create collections and indexes
	for collectionName, indexes := range collections {
		// Create collection if it doesn't exist
		err := db.CreateCollection(ctx, collectionName)
		if err != nil {
			// Ignore error if collection already exists
			if cmdErr, ok := err.(mongo.CommandError); !ok || cmdErr.Code != 48 {
				log.Printf("Error creating collection %s: %v", collectionName, err)
				return err
			}
		}

		// Create indexes
		collection := db.Collection(collectionName)
		if len(indexes) > 0 {
			_, err := collection.Indexes().CreateMany(ctx, indexes)
			if err != nil {
				log.Printf("Error creating indexes for collection %s: %v", collectionName, err)
				return err
			}
		}

		log.Printf("Successfully initialized collection %s with indexes", collectionName)
	}

	return nil
}
