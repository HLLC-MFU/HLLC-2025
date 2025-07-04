package connection

import (
	"errors"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gofiber/websocket/v2"
	"golang.org/x/time/rate"
)

type (
	// ConnectionConfig holds all configuration for connection management
	ConnectionConfig struct {
		MaxConnections      int32         // Maximum total connections allowed
		MaxConnectionsPerIP int32         // Maximum connections per IP
		ReadBufferSize     int           // WebSocket read buffer size in bytes
		WriteBufferSize    int           // WebSocket write buffer size in bytes
		EnableCompression  bool          // Enable WebSocket compression
		WriteTimeout       time.Duration // Write timeout duration
		ReadTimeout        time.Duration // Read timeout duration
		PingInterval       time.Duration // How often to send ping messages
		PongWait          time.Duration // How long to wait for pong response
		RateLimit         rate.Limit    // Rate limit for new connections (per second)
		RateBurst         int           // Burst size for rate limiting
	}

	// ConnectionManager handles WebSocket connection management and limits
	ConnectionManager struct {
		config ConnectionConfig
	
		// Connection tracking
		activeConnections int32
		connectionsByIP   sync.Map // map[string]int32
	
		// Resource management
		writeBufferPool sync.Pool
		rateLimiter    *rate.Limiter
	}
)

// DefaultConfig returns a default configuration suitable for most applications
func DefaultConfig() ConnectionConfig {
	return ConnectionConfig{
		MaxConnections:      50000,           // Support 50k total connections
		MaxConnectionsPerIP: 0,               // **ปิด IP limit เพื่อรองรับงานกิจกรรมที่มีคนเยอะในที่เดียว**
		ReadBufferSize:      32 * 1024,       // 32KB for efficient network reads
		WriteBufferSize:     32 * 1024,       // 32KB for efficient network writes
		EnableCompression:   true,            // Enable compression to reduce bandwidth
		WriteTimeout:        10 * time.Second,
		ReadTimeout:        60 * time.Second,
		PingInterval:       30 * time.Second,  // Keep connections alive
		PongWait:          60 * time.Second,  // Allow time for slow connections
		RateLimit:         0,                 // **ปิด rate limiting สำหรับงานกิจกรรม**
		RateBurst:         0,                 // **ปิด burst limiting**
	}
}

// NewConnectionManager creates a new connection manager with the given configuration
func NewConnectionManager(config ConnectionConfig) *ConnectionManager {
	cm := &ConnectionManager{
		config: config,
	}

	// **สร้าง rate limiter เฉพาะเมื่อมี rate limiting**
	if config.RateLimit > 0 {
		cm.rateLimiter = rate.NewLimiter(config.RateLimit, config.RateBurst)
	}

	return cm
}

// GetWebSocketConfig returns the WebSocket configuration for Fiber
func (cm *ConnectionManager) GetWebSocketConfig() websocket.Config {
	return websocket.Config{
		ReadBufferSize:    cm.config.ReadBufferSize,
		WriteBufferSize:   cm.config.WriteBufferSize,
		EnableCompression: cm.config.EnableCompression,
		WriteBufferPool:   &cm.writeBufferPool,
	}
}

// HandleNewConnection attempts to register a new connection
func (cm *ConnectionManager) HandleNewConnection(ip string) error {
	// **ข้าม rate limiting สำหรับงานกิจกรรม**
	// Apply rate limiting
	if cm.config.RateLimit > 0 && !cm.rateLimiter.Allow() {
		return errors.New("too many connection attempts")
	}

	// Check total connections
	if atomic.LoadInt32(&cm.activeConnections) >= cm.config.MaxConnections {
		return errors.New("maximum connections reached")
	}

	// **ข้าม IP limiting สำหรับงานกิจกรรม**
	// Check connections per IP
	if cm.config.MaxConnectionsPerIP > 0 {
		ipConns, _ := cm.connectionsByIP.LoadOrStore(ip, int32(0))
		if ipConns.(int32) >= cm.config.MaxConnectionsPerIP {
			return errors.New("maximum connections per IP reached")
		}
	}

	// Increment counters
	atomic.AddInt32(&cm.activeConnections, 1)
	if cm.config.MaxConnectionsPerIP > 0 {
		ipConns, _ := cm.connectionsByIP.LoadOrStore(ip, int32(0))
		cm.connectionsByIP.Store(ip, ipConns.(int32)+1)
	}
	
	return nil
}

// RemoveConnection removes a connection from tracking
func (cm *ConnectionManager) RemoveConnection(ip string) {
	atomic.AddInt32(&cm.activeConnections, -1)
	
	// **จัดการ IP counting เฉพาะเมื่อมี IP limit**
	if cm.config.MaxConnectionsPerIP > 0 {
		if ipConns, ok := cm.connectionsByIP.Load(ip); ok {
			newCount := ipConns.(int32) - 1
			if newCount <= 0 {
				cm.connectionsByIP.Delete(ip)
			} else {
				cm.connectionsByIP.Store(ip, newCount)
			}
		}
	}
}

// SetupPingPong sets up ping/pong handlers for a connection
func (cm *ConnectionManager) SetupPingPong(conn *websocket.Conn) {
	// Set pong handler
	conn.SetReadDeadline(time.Now().Add(cm.config.PongWait))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(cm.config.PongWait))
		return nil
	})

	// Start ping ticker
	go func() {
		ticker := time.NewTicker(cm.config.PingInterval)
		defer ticker.Stop()

		for range ticker.C {
			if err := conn.WriteControl(websocket.PingMessage, []byte{}, time.Now().Add(cm.config.WriteTimeout)); err != nil {
				return
			}
		}
	}()
}

// GetActiveConnections returns the current number of active connections
func (cm *ConnectionManager) GetActiveConnections() int32 {
	return atomic.LoadInt32(&cm.activeConnections)
}

// GetConnectionsByIP returns the number of connections for a specific IP
func (cm *ConnectionManager) GetConnectionsByIP(ip string) int32 {
	if conns, ok := cm.connectionsByIP.Load(ip); ok {
		return conns.(int32)
	}
	return 0
} 