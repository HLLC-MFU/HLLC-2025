module github.com/HLLC-MFU/HLLC-2025/backend

go 1.24.1

require (
	github.com/go-playground/validator/v10 v10.25.0
	github.com/gofiber/fiber/v2 v2.52.6
	github.com/segmentio/kafka-go v0.4.47
	go.mongodb.org/mongo-driver v1.17.3
)

require (
	github.com/andybalholm/brotli v1.1.0 // indirect
	github.com/fasthttp/websocket v1.5.3 // indirect
	github.com/gabriel-vasile/mimetype v1.4.8 // indirect
	github.com/go-playground/locales v0.14.1 // indirect
	github.com/go-playground/universal-translator v0.18.1 // indirect
	github.com/pierrec/lz4/v4 v4.1.15 // indirect
	github.com/savsgio/gotils v0.0.0-20230208104028-c358bd845dee // indirect
	golang.org/x/crypto v0.32.0 // indirect
)

require (
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/gofiber/websocket/v2 v2.2.1
	github.com/golang/snappy v0.0.4 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/joho/godotenv v1.5.1
	github.com/klauspost/compress v1.17.9 // indirect
	github.com/leodido/go-urn v1.4.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/mattn/go-runewidth v0.0.16 // indirect
	github.com/montanaflynn/stats v0.7.1 // indirect
	github.com/redis/go-redis/v9 v9.7.1
	github.com/rivo/uniseg v0.2.0 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasthttp v1.51.0 // indirect
	github.com/valyala/tcplisten v1.0.0 // indirect
	github.com/xdg-go/pbkdf2 v1.0.0 // indirect
	github.com/xdg-go/scram v1.1.2 // indirect
	github.com/xdg-go/stringprep v1.0.4 // indirect
	github.com/youmark/pkcs8 v0.0.0-20240726163527-a2c0da244d78 // indirect
	golang.org/x/net v0.34.0 // indirect
	golang.org/x/sync v0.10.0 // indirect
	golang.org/x/sys v0.29.0 // indirect
	golang.org/x/text v0.21.0 // indirect
)

// Use replace directives to point to local packages
replace (
	github.com/HLLC-MFU/HLLC-2025/backend => ./

	//Activity
	github.com/HLLC-MFU/HLLC-2025/backend/module/activity/proto => ./module/activity/proto
	github.com/HLLC-MFU/HLLC-2025/backend/module/activity/proto/generated => ./module/activity/proto/generated

	//Auth
	github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto => ./module/auth/proto
	github.com/HLLC-MFU/HLLC-2025/backend/module/auth/proto/generated => ./module/auth/proto/generated

	//Chat
	github.com/HLLC-MFU/HLLC-2025/backend/module/chat/proto => ./module/chat/proto
	github.com/HLLC-MFU/HLLC-2025/backend/module/chat/proto/generated => ./module/chat/proto/generated

	//Checkins
	github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/proto => ./module/checkin/proto
	github.com/HLLC-MFU/HLLC-2025/backend/module/checkin/proto/generated => ./module/checkin/proto/generated

	//Major
	github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto => ./module/major/proto
	github.com/HLLC-MFU/HLLC-2025/backend/module/major/proto/generated => ./module/major/proto/generated

	//School
	github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto => ./module/school/proto
	github.com/HLLC-MFU/HLLC-2025/backend/module/school/proto/generated => ./module/school/proto/generated

	//Module

	//User
	github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto => ./module/user/proto
	github.com/HLLC-MFU/HLLC-2025/backend/module/user/proto/generated => ./module/user/proto/generated

	//Pkg
	github.com/HLLC-MFU/HLLC-2025/backend/pkg/proto/generated => ./pkg/proto/generated
)
