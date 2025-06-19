// pkg/database/query/base.service.go
package queries

import (
	"context"
	"errors"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
    ErrNotFound = errors.New("document not found")
)

type BaseService[T any] struct {
    collection *mongo.Collection
}

func NewBaseService[T any](collection *mongo.Collection) *BaseService[T] {
    return &BaseService[T]{
        collection: collection,
    }
}

// FindOne finds a single document
func (s *BaseService[T]) FindOne(ctx context.Context, filter interface{}) (*Response[T], error) {
    var result T
    err := s.collection.FindOne(ctx, filter).Decode(&result)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            return nil, ErrNotFound
        }
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Document found successfully",
        Data:    []T{result},
    }, nil
}

// FindOneById finds a document by ID
func (s *BaseService[T]) FindOneById(ctx context.Context, id string) (*Response[T], error) {
    objectID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        return nil, err
    }
    
    return s.FindOne(ctx, bson.M{"_id": objectID})
}

// FindAll finds all documents with pagination
func (s *BaseService[T]) FindAll(ctx context.Context, opts QueryOptions) (*Response[T], error) {
    var results []T
    
    // Parse sort
    sortBson := bson.D{}
    if opts.Sort != "" {
        sortBson = s.parseSort(opts.Sort)
    }

    // Set pagination
    skip := int64((opts.Page - 1) * opts.Limit)
    findOptions := options.Find().
        SetSort(sortBson).
        SetSkip(skip).
        SetLimit(int64(opts.Limit))

    // Get total count
    total, err := s.collection.CountDocuments(ctx, opts.Filter)
    if err != nil {
        return nil, err
    }

    // Execute query
    cursor, err := s.collection.Find(ctx, opts.Filter, findOptions)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    if err = cursor.All(ctx, &results); err != nil {
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Documents fetched successfully",
        Data:    results,
        Meta: &Meta{
            Total:         total,
            Page:          opts.Page,
            Limit:         opts.Limit,
            TotalPages:    int(total) / opts.Limit,
            LastUpdatedAt: time.Now(),
        },
    }, nil
}

// Create creates a new document
func (s *BaseService[T]) Create(ctx context.Context, document T) (*Response[T], error) {
    result, err := s.collection.InsertOne(ctx, document)
    if err != nil {
        return nil, err
    }

    var created T
    err = s.collection.FindOne(ctx, bson.M{"_id": result.InsertedID}).Decode(&created)
    if err != nil {
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Document created successfully",
        Data:    []T{created},
    }, nil
}

// UpdateById updates a document by ID
func (s *BaseService[T]) UpdateById(ctx context.Context, id string, update interface{}) (*Response[T], error) {
    objectID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        return nil, err
    }

    var updated T
    err = s.collection.FindOneAndUpdate(
        ctx,
        bson.M{"_id": objectID},
        bson.M{"$set": update},
        options.FindOneAndUpdate().SetReturnDocument(options.After),
    ).Decode(&updated)

    if err != nil {
        if err == mongo.ErrNoDocuments {
            return nil, ErrNotFound
        }
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Document updated successfully",
        Data:    []T{updated},
    }, nil
}

// DeleteById deletes a document by ID
func (s *BaseService[T]) DeleteById(ctx context.Context, id string) (*Response[T], error) {
    objectID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        return nil, err
    }

    var deleted T
    err = s.collection.FindOneAndDelete(
        ctx,
        bson.M{"_id": objectID},
    ).Decode(&deleted)

    if err != nil {
        if err == mongo.ErrNoDocuments {
            return nil, ErrNotFound
        }
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Document deleted successfully",
        Data:    []T{deleted},
    }, nil
}

// Helper methods
func (s *BaseService[T]) parseSort(sortString string) bson.D {
    // Implementation similar to NestJS version
    sortFields := strings.Split(sortString, ",")
    sort := bson.D{}
    
    for _, field := range sortFields {
        if field == "" {
            continue
        }
        
        order := 1
        if strings.HasPrefix(field, "-") {
            order = -1
            field = field[1:]
        }
        
        sort = append(sort, bson.E{Key: field, Value: order})
    }
    
    return sort
}