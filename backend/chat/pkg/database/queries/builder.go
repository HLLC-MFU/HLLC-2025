// pkg/database/query/builder.go
package queries

import (
	"context"
	"errors"
	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type QueryBuilder[T any] struct {
    collection *mongo.Collection
}

func NewQueryBuilder[T any](collection *mongo.Collection) *QueryBuilder[T] {
    return &QueryBuilder[T]{collection: collection}
}

func (q *QueryBuilder[T]) FindAll(ctx context.Context, opts QueryOptions, filter interface{}) (*Response[T], error) {
    var results []T
    
    // Parse sort
    sortBson := bson.D{}
    if opts.Sort != "" {
        // Parse sort string in format "field:ASC" or "field:DESC"
        parts := strings.Split(opts.Sort, ":")
        if len(parts) == 2 {
            field := parts[0]
            order := 1 // Default ascending
            if strings.ToUpper(parts[1]) == "DESC" {
                order = -1
            }
            sortBson = bson.D{{field, order}}
        }
    }

    // Set pagination
    skip := int64((opts.Page - 1) * opts.Limit)
    findOptions := options.Find().
        SetSort(sortBson).
        SetSkip(skip).
        SetLimit(int64(opts.Limit))

    // Get total count
    total, err := q.collection.CountDocuments(ctx, filter)
    if err != nil {
        return nil, err
    }

    // Execute query
    cursor, err := q.collection.Find(ctx, filter, findOptions)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    if err = cursor.All(ctx, &results); err != nil {
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Data fetched successfully",
        Data:    results,
        Meta: &Meta{
            Total:      total,
            Page:       opts.Page,
            Limit:      opts.Limit,
            TotalPages: int(total) / opts.Limit,
        },
    }, nil
}

func (q *QueryBuilder[T]) FindOne(ctx context.Context, filter interface{}) (*Response[T], error) {
    var result T
    err := q.collection.FindOne(ctx, filter).Decode(&result)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            return nil, errors.New("not found")
        }
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Data fetched successfully",
        Data:    []T{result},
    }, nil
}	