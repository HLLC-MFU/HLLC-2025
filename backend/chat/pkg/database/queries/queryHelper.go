package queries

import (
	"context"
	"errors"
	"fmt"
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
        db *mongo.Database
    }

    func NewBaseService[T any](collection *mongo.Collection) *BaseService[T] {
        return &BaseService[T]{
            collection: collection,
            db: collection.Database(),
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

    // FindAllWithPopulate finds all documents with population
    func (s *BaseService[T]) FindAllWithPopulate(ctx context.Context, opts QueryOptions, populateField string, foreignCollection string) (*Response[T], error) {
        pipeline := []bson.M{
            {"$match": opts.Filter},
            {"$lookup": bson.M{
                "from":         foreignCollection,
                "localField":   populateField,
                "foreignField": "_id",
                "as":          populateField,
            }},
            {"$unwind": bson.M{
                "path": "$" + populateField,
                "preserveNullAndEmptyArrays": true,
            }},
            // Merge the populated field back into the document
            {"$replaceRoot": bson.M{
                "newRoot": bson.M{
                    "$mergeObjects": []interface{}{
                        "$$ROOT",
                        bson.M{populateField: "$" + populateField},
                    },
                },
            }},
        }

        // Add sort stage if specified
        if opts.Sort != "" {
            pipeline = append(pipeline, bson.M{"$sort": s.parseSort(opts.Sort)})
        }

        // Add pagination stages
        skip := int64((opts.Page - 1) * opts.Limit)
        pipeline = append(pipeline,
            bson.M{"$skip": skip},
            bson.M{"$limit": int64(opts.Limit)},
        )

        // Execute aggregation
        cursor, err := s.collection.Aggregate(ctx, pipeline)
        if err != nil {
            return nil, err
        }
        defer cursor.Close(ctx)

        var results []T
        if err = cursor.All(ctx, &results); err != nil {
            return nil, err
        }

        // Get total count
        total, err := s.collection.CountDocuments(ctx, opts.Filter)
        if err != nil {
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

    func (s *BaseService[T]) FindAllWithPopulateNested(
        ctx context.Context,
        opts QueryOptions,
        nestedPath string,
        foreignCollection string,
    ) (*Response[T], error) {
        // แยก path เช่น "metadata.major"
        parts := strings.Split(nestedPath, ".")
        if len(parts) < 2 {
            return nil, fmt.Errorf("nestedPath must be a nested field (e.g. metadata.major)")
        }

        flattenField := "__pop_fk"
        lookupPath := nestedPath // where to assign the populated result

        // === BUILD PIPELINE ===
        pipeline := []bson.M{
            {"$match": opts.Filter},
            {"$addFields": bson.M{
                flattenField: "$" + nestedPath,
            }},
            {
                "$lookup": bson.M{
                "from":         "majors",
                "localField":   "__pop_fk",
                "foreignField": "_id",
                "as":           "populated_major",
                },
            },          
            {"$unwind": bson.M{
                "path":                       "$" + lookupPath + ".populated_major",
                "preserveNullAndEmptyArrays": true,
            }},
        }

        // Add sort
        if opts.Sort != "" {
            pipeline = append(pipeline, bson.M{"$sort": s.parseSort(opts.Sort)})
        }

        // Pagination
        skip := int64((opts.Page - 1) * opts.Limit)
        pipeline = append(pipeline,
            bson.M{"$skip": skip},
            bson.M{"$limit": int64(opts.Limit)},
        )

        // === EXECUTE AGGREGATION ===
        cursor, err := s.collection.Aggregate(ctx, pipeline)
        if err != nil {
            return nil, err
        }
        defer cursor.Close(ctx)

        var results []T
        if err := cursor.All(ctx, &results); err != nil {
            return nil, err
        }

        // Get total count
        total, err := s.collection.CountDocuments(ctx, opts.Filter)
        if err != nil {
            return nil, err
        }

        return &Response[T]{
            Success: true,
            Message: "Populated fetch successful",
            Data:    results,
            Meta: &Meta{
                Total:         total,
                Page:          opts.Page,
                Limit:         opts.Limit,
                TotalPages:    int(total)/opts.Limit + 1,
                LastUpdatedAt: time.Now(),
            },
        }, nil
    }

    // FindOneWithPopulate finds a document by ID and populates specified fields
    func (s *BaseService[T]) FindOneWithPopulate(ctx context.Context, filter interface{}, populateField string, foreignCollection string) (*Response[T], error) {
        pipeline := []bson.M{
            {"$match": filter},
            {"$lookup": bson.M{
                "from":         foreignCollection,
                "localField":   populateField,
                "foreignField": "_id",
                "as":          populateField,
            }},
            {"$unwind": bson.M{
                "path": "$" + populateField,
                "preserveNullAndEmptyArrays": true,
            }},
            // Merge the populated field back into the document
            {"$replaceRoot": bson.M{
                "newRoot": bson.M{
                    "$mergeObjects": []interface{}{
                        "$$ROOT",
                        bson.M{populateField: "$" + populateField},
                    },
                },
            }},
            {"$limit": 1},
        }

        cursor, err := s.collection.Aggregate(ctx, pipeline)
        if err != nil {
            return nil, err
        }
        defer cursor.Close(ctx)

        var results []T
        if err = cursor.All(ctx, &results); err != nil {
            return nil, err
        }

        if len(results) == 0 {
            return nil, mongo.ErrNoDocuments
        }

        return &Response[T]{
            Success: true,
            Message: "Document fetched successfully",
            Data:    results,
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