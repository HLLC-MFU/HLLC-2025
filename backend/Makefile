# Proto generation
.PHONY: proto
proto:
	@echo "Generating proto files..."
	@chmod +x scripts/proto/generate.sh
	@./scripts/proto/generate.sh
	@chmod +x scripts/proto/fix_generated.sh
	@./scripts/proto/fix_generated.sh
	@echo "Proto files generated and fixed successfully"

# Clean generated files
.PHONY: clean
clean:
	@echo "Cleaning generated files..."
	@rm -rf pkg/proto/generated/*
	@rm -rf module/*/proto/generated/*
	@echo "Generated files cleaned successfully"

# Install proto dependencies
.PHONY: proto-deps
proto-deps:
	@echo "Installing protoc dependencies..."
	@go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	@go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
	@echo "Proto dependencies installed successfully"

# Generate all
.PHONY: gen
gen: proto-deps clean proto
	@echo "All generation tasks completed successfully" 