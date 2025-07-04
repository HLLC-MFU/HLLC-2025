package service

import (
	"chat/module/user/model"
	"chat/pkg/database/queries"
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type (
	UserService struct {
		*queries.BaseService[model.User]
		majorService *MajorService
		db          *mongo.Database
	}
)

func NewUserService(db *mongo.Database) *UserService {
	collection := db.Collection("users")
	return &UserService{
		BaseService:  queries.NewBaseService[model.User](collection),
		majorService: NewMajorService(db),
		db:          db,
	}
}

func (s *UserService) GetUsers(ctx context.Context, opts queries.QueryOptions) (*queries.Response[model.UserResponse], error) {
	if opts.Filter == nil {
		opts.Filter = make(map[string]interface{})
	}

	// Use the working aggregation pipeline from debug endpoint
	collection := s.db.Collection("users")
	
	pipeline := []bson.M{
		{"$match": opts.Filter},
		
		// Convert role to ObjectID if it's a string for consistent lookup
		{"$addFields": bson.M{
			"role_id": bson.M{
				"$cond": bson.M{
					"if":   bson.M{"$eq": []interface{}{bson.M{"$type": "$role"}, "string"}},
					"then": bson.M{"$toObjectId": "$role"},
					"else": "$role",
				},
			},
		}},
		
		// Populate role using the converted role_id
		{"$lookup": bson.M{
			"from":         "roles",
			"localField":   "role_id",
			"foreignField": "_id",
			"as":           "role_populated",
		}},
		{"$addFields": bson.M{
			"role": bson.M{
				"$cond": bson.M{
					"if":   bson.M{"$gt": []interface{}{bson.M{"$size": "$role_populated"}, 0}},
					"then": bson.M{"$first": "$role_populated"}, // Use $first instead of $arrayElemAt
					"else": "$role",
				},
			},
		}},
		{"$unset": []string{"role_populated", "role_id"}},

		// Populate metadata.major
		{"$lookup": bson.M{
			"from": "majors",
			"let":  bson.M{"majorId": "$metadata.major"},
			"pipeline": []bson.M{
				{"$match": bson.M{
					"$expr": bson.M{
						"$and": []bson.M{
							{"$ne": []interface{}{"$$majorId", nil}},
							{"$ne": []interface{}{"$$majorId", ""}},
							{"$eq": []interface{}{"$_id", bson.M{"$toObjectId": "$$majorId"}}},
						},
					},
				}},
			},
			"as": "major_populated",
		}},

		// Populate school in major
		{"$lookup": bson.M{
			"from": "schools",
			"let":  bson.M{"schoolId": bson.M{"$first": "$major_populated.school"}},
			"pipeline": []bson.M{
				{"$match": bson.M{
					"$expr": bson.M{
						"$and": []bson.M{
							{"$ne": []interface{}{"$$schoolId", nil}},
							{"$eq": []interface{}{"$_id", "$$schoolId"}},
						},
					},
				}},
			},
			"as": "school_populated",
		}},

		// Merge school into major
		{"$addFields": bson.M{
			"major_populated": bson.M{
				"$map": bson.M{
					"input": "$major_populated",
					"as":    "major",
					"in": bson.M{
						"$mergeObjects": []interface{}{
							"$$major",
							bson.M{"school": bson.M{"$first": "$school_populated"}},
						},
					},
				},
			},
		}},
		{"$unset": "school_populated"},

		// Replace metadata.major with populated data
		{"$addFields": bson.M{
			"metadata.major": bson.M{
				"$cond": bson.M{
					"if":   bson.M{"$gt": []interface{}{bson.M{"$size": "$major_populated"}, 0}},
					"then": bson.M{"$first": "$major_populated"},
					"else": "$metadata.major",
				},
			},
		}},
		{"$unset": "major_populated"},

		// Exclude sensitive fields
		{"$unset": []string{
			"password", 
			"refreshToken", 
			"metadata.secret", 
			"__v", 
			"role.__v", 
			"role.permissions",
			"metadata.major.__v", 
			"metadata.major.school.__v",
		}},
	}

	// Add sort if specified
	if opts.Sort != "" {
		pipeline = append(pipeline, bson.M{"$sort": bson.M{"createdAt": -1}})
	}

	// Ensure minimum values for pagination
	if opts.Page < 1 {
		opts.Page = 1
	}
	if opts.Limit < 1 {
		opts.Limit = 10
	}

	// Add pagination
	skip := int64((opts.Page - 1) * opts.Limit)
	if skip < 0 {
		skip = 0
	}
	pipeline = append(pipeline,
		bson.M{"$skip": skip},
		bson.M{"$limit": int64(opts.Limit)},
	)

	// Execute aggregation
	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("aggregation failed: %w", err)
	}
	defer cursor.Close(ctx)

	// Decode to bson.M first to avoid type conflicts
	var rawResults []bson.M
	if err = cursor.All(ctx, &rawResults); err != nil {
		return nil, fmt.Errorf("cursor decode failed: %w", err)
	}

	// Convert bson.M to UserResponse manually to avoid Key-Value array issues
	var results []model.UserResponse
	for _, raw := range rawResults {
		user := model.UserResponse{
			ID:        raw["_id"].(primitive.ObjectID),
			Username:  raw["username"].(string),
			Role:      raw["role"], // Keep as interface{} to preserve object structure
			CreatedAt: raw["createdAt"].(primitive.DateTime).Time(),
			UpdatedAt: raw["updatedAt"].(primitive.DateTime).Time(),
		}
		
		// Handle name
		if nameData, ok := raw["name"].(bson.M); ok {
			user.Name.First = nameData["first"].(string)
			if middle, exists := nameData["middle"]; exists && middle != nil {
				user.Name.Middle = middle.(string)
			}
			if last, exists := nameData["last"]; exists && last != nil {
				user.Name.Last = last.(string)
			}
		}
		
		// Handle metadata
		if metadata, ok := raw["metadata"].(bson.M); ok {
			user.Metadata = make(map[string]interface{})
			for k, v := range metadata {
				user.Metadata[k] = v
			}
		}
		
		results = append(results, user)
	}

	// Get total count
	total, err := collection.CountDocuments(ctx, opts.Filter)
	if err != nil {
		return nil, err
	}

	// Calculate total pages
	totalPages := int(total) / opts.Limit
	if int(total)%opts.Limit != 0 {
		totalPages++
	}

	return &queries.Response[model.UserResponse]{
		Success: true,
		Message: "Documents fetched successfully with nested population",
		Data:    results,
		Meta: &queries.Meta{
			Total:         total,
			Page:          opts.Page,
			Limit:         opts.Limit,
			TotalPages:    totalPages,
			LastUpdatedAt: time.Now(),
		},
	}, nil
}

func (s *UserService) GetUserById(ctx context.Context, id string) (*model.User, error) {
	response, err := s.FindOneById(ctx, id)
	if err != nil {
		return nil, err
	}
	return &response.Data[0], nil
}

func (s *UserService) GetUserByIdWithPopulate(ctx context.Context, id string) (*model.User, error) {
	userObjID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	populateConfigs := []queries.NestedPopulateConfig{
		{
			Field:      "role",
			Collection: "roles",
		},
		{
			Field:      "metadata.major",
			Collection: "majors",
			NestedPath: "metadata.major",
			SubPopulate: &queries.NestedPopulateConfig{
				Field:      "school",
				Collection: "schools",
			},
		},
	}

	filter := map[string]interface{}{"_id": userObjID}
	response, err := s.FindOneWithNestedPopulate(ctx, filter, populateConfigs)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	if len(response.Data) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return &response.Data[0], nil
}

// GetDB returns the database instance for debugging
func (s *UserService) GetDB() *mongo.Database {
	return s.db
}

// GetUsersByMetadataField ค้นหา users ตาม metadata field
func (s *UserService) GetUsersByMetadataField(ctx context.Context, field string, value interface{}) ([]*model.User, error) {
	log.Printf("[GetUsersByMetadataField] Searching by field: %s, value: %v", field, value)
	
	// จัดการ field พิเศษที่ต้องใช้ logic เฉพาะ
	switch field {
	case "school":
		valueStr := fmt.Sprintf("%v", value)
		log.Printf("[GetUsersByMetadataField] Using GetUsersBySchool for school: %s", valueStr)
		return s.GetUsersBySchool(ctx, valueStr)
	case "major":
		valueStr := fmt.Sprintf("%v", value)
		log.Printf("[GetUsersByMetadataField] Using GetUsersByMajor for major: %s", valueStr)
		return s.GetUsersByMajor(ctx, valueStr)
	}
	
	// สำหรับ field อื่นๆ ใช้การค้นหาปกติ
	log.Printf("[GetUsersByMetadataField] Using generic metadata search for field: %s", field)
	var users []*model.User
	
	// สร้าง filter สำหรับ metadata field
	filter := bson.M{
		fmt.Sprintf("metadata.%s", field): value,
	}
	
	log.Printf("[GetUsersByMetadataField] Filter: %+v", filter)
	
	collection := s.db.Collection("users")
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find users by metadata field %s: %w", field, err)
	}
	defer cursor.Close(ctx)
	
	if err = cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}
	
	log.Printf("[GetUsersByMetadataField] Found %d users for field %s", len(users), field)
	return users, nil
}

// GetUsersByMajor ค้นหา users ตาม major ID
func (s *UserService) GetUsersByMajor(ctx context.Context, majorID string) ([]*model.User, error) {
	// ใช้ metadata.major ที่เก็บเป็น string ID
	filter := bson.M{
		"metadata.major": majorID,
	}
	
	collection := s.db.Collection("users")
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find users by major: %w", err)
	}
	defer cursor.Close(ctx)
	
	var users []*model.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}
	
	return users, nil
}

// GetUsersBySchool ค้นหา users ตาม school ID ผ่าน majors ที่อยู่ใน school นั้น
func (s *UserService) GetUsersBySchool(ctx context.Context, schoolID string) ([]*model.User, error) {
	log.Printf("[GetUsersBySchool] Looking for users in school: %s", schoolID)
	
	// ขั้นตอนที่ 1: หา majors ทั้งหมดที่อยู่ใน school นี้
	schoolObjID, err := primitive.ObjectIDFromHex(schoolID)
	if err != nil {
		return nil, fmt.Errorf("invalid school ID: %w", err)
	}

	majorsCollection := s.db.Collection("majors")
	majorsCursor, err := majorsCollection.Find(ctx, bson.M{"school": schoolObjID})
	if err != nil {
		return nil, fmt.Errorf("failed to find majors in school: %w", err)
	}
	defer majorsCursor.Close(ctx)

	var majors []bson.M
	if err = majorsCursor.All(ctx, &majors); err != nil {
		return nil, fmt.Errorf("failed to decode majors: %w", err)
	}

	log.Printf("[GetUsersBySchool] Found %d majors in school %s", len(majors), schoolID)

	if len(majors) == 0 {
		log.Printf("[GetUsersBySchool] No majors found in school %s", schoolID)
		return []*model.User{}, nil // ไม่มี majors ใน school นี้
	}

	// สร้าง array ของ major IDs
	var majorIDs []interface{}
	for _, major := range majors {
		majorID := major["_id"].(primitive.ObjectID).Hex()
		majorIDs = append(majorIDs, majorID)
		log.Printf("[GetUsersBySchool] Major ID: %s", majorID)
	}

	// ขั้นตอนที่ 2: หา users ที่มี metadata.major อยู่ใน list ของ major IDs
	filter := bson.M{
		"metadata.major": bson.M{"$in": majorIDs},
	}

	log.Printf("[GetUsersBySchool] Searching users with filter: %+v", filter)

	collection := s.db.Collection("users")
	cursor, err := collection.Find(ctx, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to find users by school: %w", err)
	}
	defer cursor.Close(ctx)

	var users []*model.User
	if err = cursor.All(ctx, &users); err != nil {
		return nil, fmt.Errorf("failed to decode users: %w", err)
	}

	log.Printf("[GetUsersBySchool] Found %d users in school %s", len(users), schoolID)
	
	for _, user := range users {
		log.Printf("[GetUsersBySchool] User: %s (ID: %s) with major: %v", user.Username, user.ID.Hex(), user.Metadata["major"])
	}

	return users, nil
}

// GetUsersMetadataStats สถิติการแบ่งกลุ่ม users ตาม metadata
func (s *UserService) GetUsersMetadataStats(ctx context.Context) (map[string]interface{}, error) {
	pipeline := []bson.M{
		{
			"$group": bson.M{
				"_id": bson.M{
					"major":  "$metadata.major",
					"school": "$metadata.school",
				},
				"count": bson.M{"$sum": 1},
				"users": bson.M{"$push": bson.M{
					"_id":      "$_id",
					"username": "$username",
					"name":     "$name",
				}},
			},
		},
		{
			"$group": bson.M{
				"_id": nil,
				"majorStats": bson.M{
					"$push": bson.M{
						"major": "$_id.major",
						"count": "$count",
						"users": "$users",
					},
				},
				"schoolStats": bson.M{
					"$push": bson.M{
						"school": "$_id.school", 
						"count":  "$count",
						"users":  "$users",
					},
				},
			},
		},
	}
	
	collection := s.db.Collection("users")
	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, fmt.Errorf("failed to get metadata stats: %w", err)
	}
	defer cursor.Close(ctx)
	
	var results []bson.M
	if err = cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("failed to decode stats: %w", err)
	}
	
	if len(results) == 0 {
		return map[string]interface{}{
			"majorStats":  []interface{}{},
			"schoolStats": []interface{}{},
		}, nil
	}
	
	return map[string]interface{}{
		"majorStats":  results[0]["majorStats"],
		"schoolStats": results[0]["schoolStats"],
	}, nil
}

