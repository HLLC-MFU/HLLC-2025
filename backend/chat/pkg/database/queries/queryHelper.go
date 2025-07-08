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

        // Ensure minimum values for pagination
        if opts.Page < 1 {
            opts.Page = 1
        }
        if opts.Limit < 1 {
            opts.Limit = 10
        }

        // Set pagination
        skip := int64((opts.Page - 1) * opts.Limit)
        if skip < 0 {
            skip = 0
        }
        
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
                TotalPages:    (int(total) + opts.Limit - 1) / opts.Limit,
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

        // Ensure minimum values for pagination
        if opts.Page < 1 {
            opts.Page = 1
        }
        if opts.Limit < 1 {
            opts.Limit = 10
        }

        // Add pagination stages
        skip := int64((opts.Page - 1) * opts.Limit)
        if skip < 0 {
            skip = 0
        }
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
                TotalPages:    (int(total) + opts.Limit - 1) / opts.Limit,
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

    // PopulateConfig defines configuration for population
    type PopulateConfig struct {
        Field      string
        Collection string
        NestedPath string // for nested population like "metadata.major"
    }

    // FindOneWithMultiplePopulate finds a document and populates multiple fields
    func (s *BaseService[T]) FindOneWithMultiplePopulate(ctx context.Context, filter interface{}, populateConfigs []PopulateConfig) (*Response[T], error) {
        pipeline := []bson.M{
            { "$match": filter },
        }

        // Add lookup stages for each populate config
        for _, config := range populateConfigs {
            if config.NestedPath != "" {
                // Handle nested path population
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        "temp_" + config.Field: bson.M{
                            "$toObjectId": "$" + config.NestedPath,
                        },
                    },
                })
                pipeline = append(pipeline, bson.M{
                    "$lookup": bson.M{
                        "from":         config.Collection,
                        "localField":   "temp_" + config.Field,
                        "foreignField": "_id",
                        "as":           "populated_" + config.Field,
                    },
                })
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        config.NestedPath: bson.M{
                            "$arrayElemAt": []interface{}{"$populated_" + config.Field, 0},
                        },
                    },
                })
            } else {
                // Handle direct field population
                pipeline = append(pipeline, bson.M{
                    "$lookup": bson.M{
                        "from":         config.Collection,
                        "localField":   config.Field,
                        "foreignField": "_id",
                        "as":           "populated_" + config.Field,
                    },
                })
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        config.Field: bson.M{
                            "$arrayElemAt": []interface{}{"$populated_" + config.Field, 0},
                        },
                    },
                })
            }
        }

        // Clean up temporary fields
        unsetFields := []string{}
        for _, config := range populateConfigs {
            unsetFields = append(unsetFields, "temp_"+config.Field, "populated_"+config.Field)
        }
        if len(unsetFields) > 0 {
            pipeline = append(pipeline, bson.M{"$unset": unsetFields})
        }

        pipeline = append(pipeline, bson.M{"$limit": 1})

        cursor, err := s.collection.Aggregate(ctx, pipeline)
        if err != nil {
            return nil, err
        }
        defer cursor.Close(ctx)

        var results []T
        if err := cursor.All(ctx, &results); err != nil {
            return nil, err
        }

        return &Response[T]{
            Success: true,
            Message: "Document fetched successfully with population",
            Data:    results,
        }, nil
    }

    // FindAllWithMultiplePopulate finds documents and populates multiple fields
    func (s *BaseService[T]) FindAllWithMultiplePopulate(ctx context.Context, opts QueryOptions, populateConfigs []PopulateConfig) (*Response[T], error) {
        pipeline := []bson.M{
            { "$match": opts.Filter },
        }

        // Add lookup stages for each populate config
        for _, config := range populateConfigs {
            if config.NestedPath != "" {
                // Handle nested path population with error handling
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        "temp_" + config.Field: bson.M{
                            "$cond": bson.M{
                                "if": bson.M{"$ne": []interface{}{"$" + config.NestedPath, nil}},
                                "then": bson.M{
                                    "$toObjectId": "$" + config.NestedPath,
                                },
                                "else": nil,
                            },
                        },
                    },
                })
                pipeline = append(pipeline, bson.M{
                    "$lookup": bson.M{
                        "from":         config.Collection,
                        "localField":   "temp_" + config.Field,
                        "foreignField": "_id",
                        "as":           "populated_" + config.Field,
                    },
                })
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        config.NestedPath: bson.M{
                            "$cond": bson.M{
                                "if": bson.M{"$gt": []interface{}{bson.M{"$size": "$populated_" + config.Field}, 0}},
                                "then": bson.M{
                                    "$arrayElemAt": []interface{}{"$populated_" + config.Field, 0},
                                },
                                "else": "$" + config.NestedPath,
                            },
                        },
                    },
                })
            } else {
                // Handle direct field population
                pipeline = append(pipeline, bson.M{
                    "$lookup": bson.M{
                        "from":         config.Collection,
                        "localField":   config.Field,
                        "foreignField": "_id",
                        "as":           "populated_" + config.Field,
                    },
                })
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        config.Field: bson.M{
                            "$cond": bson.M{
                                "if": bson.M{"$gt": []interface{}{bson.M{"$size": "$populated_" + config.Field}, 0}},
                                "then": bson.M{
                                    "$arrayElemAt": []interface{}{"$populated_" + config.Field, 0},
                                },
                                "else": "$" + config.Field,
                            },
                        },
                    },
                })
            }
        }

        // Clean up temporary fields
        unsetFields := []string{}
        for _, config := range populateConfigs {
            unsetFields = append(unsetFields, "temp_"+config.Field, "populated_"+config.Field)
        }
        if len(unsetFields) > 0 {
            pipeline = append(pipeline, bson.M{"$unset": unsetFields})
        }

        // Add sort stage if specified
        if opts.Sort != "" {
            pipeline = append(pipeline, bson.M{"$sort": s.parseSort(opts.Sort)})
        }

        // Ensure minimum values for pagination
        if opts.Page < 1 {
            opts.Page = 1
        }
        if opts.Limit < 1 {
            opts.Limit = 10
        }

        // Add pagination stages
        skip := int64((opts.Page - 1) * opts.Limit)
        if skip < 0 {
            skip = 0
        }
        pipeline = append(pipeline,
            bson.M{"$skip": skip},
            bson.M{"$limit": int64(opts.Limit)},
        )

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
            Message: "Documents fetched successfully with population",
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

    // NestedPopulateConfig defines configuration for nested population
    type NestedPopulateConfig struct {
        Field       string
        Collection  string
        NestedPath  string // for nested population like "metadata.major"
        SubPopulate *NestedPopulateConfig // for sub-population like school in major
    }

    // FindOneWithNestedPopulate finds a document and populates nested fields
    func (s *BaseService[T]) FindOneWithNestedPopulate(ctx context.Context, filter interface{}, populateConfigs []NestedPopulateConfig) (*Response[T], error) {
        pipeline := []bson.M{
            { "$match": filter },
        }

        // Process each populate config
        for _, config := range populateConfigs {
            pipeline = s.addNestedPopulateToPipeline(pipeline, config)
        }

        pipeline = append(pipeline, bson.M{"$limit": 1})

        cursor, err := s.collection.Aggregate(ctx, pipeline)
        if err != nil {
            return nil, err
        }
        defer cursor.Close(ctx)

        var results []T
        if err := cursor.All(ctx, &results); err != nil {
            return nil, err
        }

        return &Response[T]{
            Success: true,
            Message: "Document fetched successfully with nested population",
            Data:    results,
        }, nil
    }

    // addNestedPopulateToPipeline adds populate stages to pipeline
    func (s *BaseService[T]) addNestedPopulateToPipeline(pipeline []bson.M, config NestedPopulateConfig) []bson.M {
        fieldAlias := "populated_" + config.Field
        tempField := "temp_" + config.Field

        if config.NestedPath != "" {
            // Handle nested path population
            pipeline = append(pipeline, bson.M{
                "$addFields": bson.M{
                    tempField: bson.M{
                        "$cond": bson.M{
                            "if": bson.M{"$ne": []interface{}{"$" + config.NestedPath, nil}},
                            "then": bson.M{
                                "$toObjectId": "$" + config.NestedPath,
                            },
                            "else": nil,
                        },
                    },
                },
            })

            // Main lookup
            pipeline = append(pipeline, bson.M{
                "$lookup": bson.M{
                    "from":         config.Collection,
                    "localField":   tempField,
                    "foreignField": "_id",
                    "as":           fieldAlias,
                },
            })

            // Extract first element
            pipeline = append(pipeline, bson.M{
                "$addFields": bson.M{
                    fieldAlias: bson.M{
                        "$arrayElemAt": []interface{}{"$" + fieldAlias, 0},
                    },
                },
            })

            // Handle sub-population (like school in major)
            if config.SubPopulate != nil {
                subFieldAlias := "populated_" + config.SubPopulate.Field
                subConfig := *config.SubPopulate

                // Lookup sub-populate
                pipeline = append(pipeline, bson.M{
                    "$lookup": bson.M{
                        "from":         subConfig.Collection,
                        "localField":   fieldAlias + "." + subConfig.Field + "._id",
                        "foreignField": "_id",
                        "as":           subFieldAlias,
                    },
                })

                // Merge sub-populated data
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        fieldAlias + "." + subConfig.Field: bson.M{
                            "$arrayElemAt": []interface{}{"$" + subFieldAlias, 0},
                        },
                    },
                })

                // Clean up sub-populate temp field
                pipeline = append(pipeline, bson.M{
                    "$unset": subFieldAlias,
                })
            }

            // Set the populated data to the original nested path
            pipeline = append(pipeline, bson.M{
                "$addFields": bson.M{
                    config.NestedPath: bson.M{
                        "$cond": bson.M{
                            "if": bson.M{"$ne": []interface{}{"$" + fieldAlias, nil}},
                            "then": "$" + fieldAlias,
                            "else": "$" + config.NestedPath,
                        },
                    },
                },
            })

            // Clean up temp fields
            pipeline = append(pipeline, bson.M{
                "$unset": []string{tempField, fieldAlias},
            })
        } else {
            // Handle direct field population
            pipeline = append(pipeline, bson.M{
                "$lookup": bson.M{
                    "from":         config.Collection,
                    "localField":   config.Field,
                    "foreignField": "_id",
                    "as":           fieldAlias,
                },
            })

            // Handle sub-population
            if config.SubPopulate != nil {
                subFieldAlias := "populated_" + config.SubPopulate.Field
                subConfig := *config.SubPopulate

                pipeline = append(pipeline, bson.M{
                    "$lookup": bson.M{
                        "from":         subConfig.Collection,
                        "localField":   fieldAlias + "." + subConfig.Field + "._id",
                        "foreignField": "_id",
                        "as":           subFieldAlias,
                    },
                })

                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        fieldAlias + "." + subConfig.Field: bson.M{
                            "$arrayElemAt": []interface{}{"$" + subFieldAlias, 0},
                        },
                    },
                })

                pipeline = append(pipeline, bson.M{
                    "$unset": subFieldAlias,
                })
            }

            // Only replace field if it should be populated (don't replace role, only metadata.major)
            if config.Field == "role" {
                // For role, keep original ObjectID - don't populate it 
                pipeline = append(pipeline, bson.M{
                    "$unset": fieldAlias,
                })
            } else {
                // For other fields, use conditional population
                pipeline = append(pipeline, bson.M{
                    "$addFields": bson.M{
                        config.Field: bson.M{
                            "$cond": bson.M{
                                "if": bson.M{
                                    "$and": []bson.M{
                                        {"$isArray": "$" + fieldAlias},
                                        {"$gt": []interface{}{bson.M{"$size": "$" + fieldAlias}, 0}},
                                    },
                                },
                                "then": bson.M{"$arrayElemAt": []interface{}{"$" + fieldAlias, 0}},
                                "else": "$" + config.Field,
                            },
                        },
                    },
                })

                pipeline = append(pipeline, bson.M{
                    "$unset": fieldAlias,
                })
            }
        }

        return pipeline
    }

    // Add this method to BaseService
    func (s *BaseService[T]) GetMongoCollection() *mongo.Collection {
        return s.collection
    }