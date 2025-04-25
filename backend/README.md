# HLLC-2025 Backend

## Tech Stack
- Go 1.24.1
- MongoDB
- Redis
- gRPC for inter-service communication
- JWT with HTTP-only cookies for authentication

## Project Structure
```
backend/
├── config/           # Configuration structures and loaders
├── env/             # Environment variable files
│   ├── dev/         # Development environment
│   ├── prod/        # Production environment
│   └── test/        # Testing environment
├── module/          # Service modules
│   ├── auth/        # Authentication service
│   │   ├── controller/
│   │   ├── handler/
│   │   ├── proto/
│   │   ├── repository/
│   │   └── service/
│   └── user/        # User management service
│       ├── controller/
│       ├── handler/
│       ├── proto/
│       ├── repository/
│       └── service/
├── pkg/             # Shared packages
│   ├── core/        # Core functionality
│   ├── middleware/  # HTTP middleware
│   └── migration/   # Database migrations
├── scripts/         # Utility scripts
├── server/          # Server setup and routing
└── main.go         # Application entry point
```

## Prerequisites
- Go 1.24.1
- MongoDB
- Redis
- Protocol Buffers compiler (protoc)
- Go Protocol Buffers plugins

### Installing Prerequisites

1. Install Go:
```bash
# For macOS with Homebrew
brew install go

# Verify installation
go version  # Should show 1.22.0 or later
```

2. Install Protocol Buffers:
```bash
# For macOS with Homebrew
brew install protobuf

# Verify installation
protoc --version
```

3. Install Go Protocol Buffers plugins:
```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

4. Install MongoDB:
```bash
# For macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
```

5. Install Redis:
```bash
# For macOS with Homebrew
brew install redis
```

## Setup

1. Clone the repository:
```bash
git clone https://github.com/HLLC-MFU/HLLC-2025.git
cd HLLC-2025/backend
```

2. Install dependencies:
```bash
go mod download
```

3. Set up environment variables:
```bash
# Copy example environment files
cp env/dev/.env.example env/dev/.env.auth
cp env/dev/.env.example env/dev/.env.user

# Edit the environment files with your configuration
vim env/dev/.env.auth
vim env/dev/.env.user
```

4. Generate Protocol Buffers code:
```bash
# Make the script executable
chmod +x ./pkg/scripts/proto/generate.sh

# Generate the code
./pkg/scripts/proto/generate.sh
```

## Running the Services

1. Start MongoDB and Redis:
```bash
# Start MongoDB
brew services start mongodb-community

# Start Redis
brew services start redis
```

2. Run the Auth Service:
```bash
go run main.go ./env/dev/.env.auth
```

3. Run the User Service (in a new terminal):
```bash
go run main.go ./env/dev/.env.user
```

## Development

### Generating Protocol Buffers

When you modify any `.proto` file, regenerate the Go code:

```bash
./scripts/generate_proto.sh
```

This script generates:
- Go code for Protocol Buffers messages
- gRPC service definitions
- Client and server code

### Adding New Services

1. Create a new module directory:
```bash
mkdir -p module/newservice/{controller,handler,proto,repository,service}
```

2. Define the Protocol Buffers:
```bash
touch module/newservice/proto/newServicePb.proto
```

3. Add the service to the proto generation script:
```bash
# In scripts/generate_proto.sh
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    module/newservice/proto/newServicePb.proto
```

4. Implement the service components:
- `repository/`: Database operations
- `service/`: Business logic
- `controller/`: HTTP handlers
- `handler/`: gRPC handlers

### Testing

Run tests:
```bash
# Run all tests
go test ./...

# Run tests for a specific package
go test ./module/auth/...

# Run tests with coverage
go test -cover ./...
```

## API Documentation

The API documentation is available in the Postman collection. Import the following files in Postman:
- `postman/HLLC-2025.postman_collection.json`
- `postman/HLLC-2025.postman_environment.json`

## Contributing

1. Follow the project's code style
2. Write tests for new features
3. Update documentation as needed
4. Follow the commit message guidelines from the root README.md

## License

This project is licensed under the MIT License - see the LICENSE file for details. 