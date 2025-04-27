package http

import (
	"context"
	"time"

	studentPb "github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated"
	"github.com/HLLC-MFU/HLLC-2025/backend/module/user/repository"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type StudentService interface {
	CreateStudent(ctx context.Context, student *studentPb.Student) error
	GetStudentByID(ctx context.Context, id string) (*studentPb.Student, error)
	GetStudentByUsername(ctx context.Context, username string) (*studentPb.Student, error)
	ListStudents(ctx context.Context) ([]*studentPb.Student, error)
	UpdateStudent(ctx context.Context, id string, student *studentPb.Student) error
	DeleteStudent(ctx context.Context, id string) error
}

type studentService struct {
	studentRepo repository.StudentRepository
}

func NewStudentService(studentRepo repository.StudentRepository) StudentService {
	return &studentService{studentRepo: studentRepo}
}

func (s *studentService) CreateStudent(ctx context.Context, student *studentPb.Student) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return s.studentRepo.Create(ctx, student)
}

func (s *studentService) GetStudentByID(ctx context.Context, id string) (*studentPb.Student, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	return s.studentRepo.FindByID(ctx, objectID)
}

func (s *studentService) GetStudentByUsername(ctx context.Context, username string) (*studentPb.Student, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return s.studentRepo.FindByUsername(ctx, username)
}

func (s *studentService) ListStudents(ctx context.Context) ([]*studentPb.Student, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	return s.studentRepo.List(ctx)
}

func (s *studentService) UpdateStudent(ctx context.Context, id string, student *studentPb.Student) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	return s.studentRepo.Update(ctx, objectID, student)
}

func (s *studentService) DeleteStudent(ctx context.Context, id string) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}
	return s.studentRepo.Delete(ctx, objectID)
}
