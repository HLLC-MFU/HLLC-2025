// pkg/database/query/builder.go
package queries

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type (
	PopulateField struct {
		Field            string
		Collection      string
		LocalField      string
		ForeignField    string
		PreserveNullAndEmptyArrays bool
	}

	QueryBuilder[T any] struct {
		collection *mongo.Collection
	}
)

func NewQueryBuilder[T any](collection *mongo.Collection) *QueryBuilder[T] {
    return &QueryBuilder[T]{collection: collection}
}

// ParseQueryOptions parses common query parameters from Fiber context
func ParseQueryOptions(c *fiber.Ctx) QueryOptions {
    // Get page
    page, _ := strconv.Atoi(c.Query("page", "1"))
    if page < 1 {
        page = 1
    }

    // Get limit
    limit, _ := strconv.Atoi(c.Query("limit", "10"))
    if limit < 1 {
        limit = 10
    }

    // Get sort
    sort := c.Query("sort", "")

    // Get filter (if any)
    filter := make(map[string]interface{})

    return QueryOptions{
        Page:   page,
        Limit:  limit,
        Sort:   sort,
        Filter: filter,
    }
}

// FindAllWithPopulate finds all documents with multiple field population
func (q *QueryBuilder[T]) FindAllWithPopulate(ctx context.Context, opts QueryOptions, populateFields []PopulateField) (*Response[T], error) {
    pipeline := []bson.M{
        {"$match": opts.Filter},
    }

    // Add lookup stages for each field to populate
    for _, field := range populateFields {
        // Add $lookup stage
        pipeline = append(pipeline, bson.M{
            "$lookup": bson.M{
                "from":         field.Collection,
                "localField":   field.LocalField,
                "foreignField": field.ForeignField,
                "as":          field.Field,
            },
        })

        // Add $unwind stage with preserveNullAndEmptyArrays if specified
        unwindStage := bson.M{
            "$unwind": bson.M{
                "path": "$" + field.Field,
                "preserveNullAndEmptyArrays": field.PreserveNullAndEmptyArrays,
            },
        }
        pipeline = append(pipeline, unwindStage)
    }

    // Add sort stage if specified
    if opts.Sort != "" {
        pipeline = append(pipeline, bson.M{"$sort": q.parseSort(opts.Sort)})
    }

    // Add pagination stages
    skip := int64((opts.Page - 1) * opts.Limit)
    pipeline = append(pipeline,
        bson.M{"$skip": skip},
        bson.M{"$limit": int64(opts.Limit)},
    )

    // Execute aggregation
    cursor, err := q.collection.Aggregate(ctx, pipeline)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var results []T
    if err = cursor.All(ctx, &results); err != nil {
        return nil, err
    }

    // Get total count
    total, err := q.collection.CountDocuments(ctx, opts.Filter)
    if err != nil {
        return nil, err
    }

    return &Response[T]{
        Success: true,
        Message: "Documents fetched successfully",
        Data:    results,
        Meta: &Meta{
            Total:      total,
            Page:       opts.Page,
            Limit:      opts.Limit,
            TotalPages: int(total) / opts.Limit,
        },
    }, nil
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

    // Ensure minimum values for pagination
    if opts.Page < 1 {
        opts.Page = 1
    }
    if opts.Limit < 1 {
        opts.Limit = 10
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

    // Calculate total pages
    totalPages := 1
    if opts.Limit > 0 {
        totalPages = int((total + int64(opts.Limit) - 1) / int64(opts.Limit))
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
            TotalPages: totalPages,
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

// Helper methods
func (q *QueryBuilder[T]) parseSort(sortString string) bson.D {
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