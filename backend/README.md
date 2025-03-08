# HLLC-2025 Backend

A modern, clean-architecture based backend service for the HLLC-2025 project.

## Technology Stack

- Go 1.21+
- MongoDB
- Fiber (Web Framework)
- Protocol Buffers (gRPC)
- Clean Architecture

## Project Structure
```go
backend/
├── config/         # Configuration management
├── module/         # Business domain modules
│   ├── user/      # User management module
│   │   ├── dto/       # Data Transfer Objects
│   │   ├── entity/    # Domain entities
│   │   ├── repository/# Data access layer
│   │   ├── service/   # Business logic
│   │   └── controller/# HTTP handlers
│   └── auth/      # Authentication module
│       ├── dto/
│       ├── entity/
│       ├── repository/
│       ├── service/
│       └── controller/
└── pkg/           # Shared utilities
```

## Features

- Clean Architecture implementation
- RESTful API endpoints
- MongoDB integration
- JWT-based authentication
- Role-based access control
- Input validation
- Error handling
- Logging
- CORS support
- Graceful shutdown

## Prerequisites

- Go 1.21 or higher
- MongoDB 4.4 or higher
- Protocol Buffers compiler (protoc)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/bricksocoolxd/HLLC-2025.git
cd HLLC-2025/backend
```

2. Install dependencies:
```bash
go mod download
```

3. Set up environment variables:
```bash
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DATABASE="hllc"
export PORT=":8080"
```

4. Run the application:
```bash
go run main.go
```

## API Endpoints

### User Management

- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users` - List users (with pagination)
- `PUT /api/users/:id/password` - Update user password

## Error Handling

The application uses the `merry` package for error handling, which provides:
- HTTP status codes
- Error wrapping
- Stack traces
- Error context

## Monitoring and Logging

- Request logging using Fiber's logger middleware
- Panic recovery using Fiber's recover middleware
- NewRelic integration for monitoring
- Sentry integration for error tracking

## Security

- Password hashing using bcrypt
- CORS configuration
- Input validation
- Role-based access control

## Development

### Code Generation

To generate Protocol Buffers code:

```bash
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/user/proto/*.proto
```

### Testing

Run tests:
```bash
go test ./...
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 