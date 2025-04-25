package logging

import (
	"context"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/HLLC-MFU/HLLC-2025/backend/pkg/decorator"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// Logger field names
const (
	FieldRequestID  = "request_id"
	FieldUserID     = "user_id"
	FieldStatusCode = "status_code"
	FieldMethod     = "method"
	FieldPath       = "path"
	FieldIP         = "ip"
	FieldDuration   = "duration_ms"
	FieldOperation  = "operation"
	FieldEntity     = "entity"
	FieldEntityID   = "entity_id"
	FieldModule     = "module"
	FieldHandler    = "handler"
)

// Level represents a log level
type Level int8

// Log levels
const (
	DebugLevel Level = iota
	InfoLevel
	WarnLevel
	ErrorLevel
	FatalLevel
)

var (
	// DefaultLogger is the default logger instance
	DefaultLogger *Logger
)

// Logger is a wrapper around zerolog.Logger with additional functionality
type Logger struct {
	logger zerolog.Logger
	level  Level
}

// Init initializes the default logger
func Init(level Level, pretty bool) {
	// Set default time format
	zerolog.TimeFieldFormat = time.RFC3339

	// Configure output
	var output io.Writer = os.Stdout
	if pretty {
		output = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		}
	}

	// Create logger
	zl := zerolog.New(output).With().Timestamp().Logger()

	// Set log level
	var zLevel zerolog.Level
	switch level {
	case DebugLevel:
		zLevel = zerolog.DebugLevel
	case InfoLevel:
		zLevel = zerolog.InfoLevel
	case WarnLevel:
		zLevel = zerolog.WarnLevel
	case ErrorLevel:
		zLevel = zerolog.ErrorLevel
	case FatalLevel:
		zLevel = zerolog.FatalLevel
	default:
		zLevel = zerolog.InfoLevel
	}
	zl = zl.Level(zLevel)

	// Set global logger
	log.Logger = zl

	// Create default logger
	DefaultLogger = &Logger{
		logger: zl,
		level:  level,
	}
}

// WithContext creates a logger with context values
func (l *Logger) WithContext(ctx context.Context) *Logger {
	// Extract values from context
	var logger zerolog.Logger
	
	// Add request ID if available
	if requestID, ok := ctx.Value(FieldRequestID).(string); ok && requestID != "" {
		logger = l.logger.With().Str(FieldRequestID, requestID).Logger()
	} else {
		logger = l.logger
	}
	
	// Add user ID if available
	if userID, ok := ctx.Value(FieldUserID).(string); ok && userID != "" {
		logger = logger.With().Str(FieldUserID, userID).Logger()
	}
	
	return &Logger{
		logger: logger,
		level:  l.level,
	}
}

// Debug logs a debug message
func (l *Logger) Debug(msg string, fields ...interface{}) {
	l.log(zerolog.DebugLevel, msg, fields...)
}

// Info logs an info message
func (l *Logger) Info(msg string, fields ...interface{}) {
	l.log(zerolog.InfoLevel, msg, fields...)
}

// Warn logs a warning message
func (l *Logger) Warn(msg string, fields ...interface{}) {
	l.log(zerolog.WarnLevel, msg, fields...)
}

// Error logs an error message
func (l *Logger) Error(msg string, err error, fields ...interface{}) {
	event := l.logger.Error()
	
	if err != nil {
		event = event.Err(err)
	}
	
	l.addFields(event, fields...)
	event.Msg(msg)
}

// Fatal logs a fatal message and exits
func (l *Logger) Fatal(msg string, err error, fields ...interface{}) {
	event := l.logger.Fatal()
	
	if err != nil {
		event = event.Err(err)
	}
	
	l.addFields(event, fields...)
	event.Msg(msg)
}

// log logs a message with the specified level
func (l *Logger) log(level zerolog.Level, msg string, fields ...interface{}) {
	event := l.logger.WithLevel(level)
	l.addFields(event, fields...)
	event.Msg(msg)
}

// addFields adds fields to a log event
func (l *Logger) addFields(event *zerolog.Event, fields ...interface{}) {
	if len(fields)%2 != 0 {
		event.Str("warning", "odd number of fields provided to logger")
	}
	
	for i := 0; i < len(fields); i += 2 {
		if i+1 < len(fields) {
			key, ok := fields[i].(string)
			if !ok {
				continue
			}
			
			value := fields[i+1]
			switch v := value.(type) {
			case string:
				event.Str(key, v)
			case int:
				event.Int(key, v)
			case int64:
				event.Int64(key, v)
			case float64:
				event.Float64(key, v)
			case bool:
				event.Bool(key, v)
			case time.Duration:
				event.Dur(key, v)
			case time.Time:
				event.Time(key, v)
			case []string:
				event.Strs(key, v)
			case error:
				event.AnErr(key, v)
			default:
				event.Interface(key, v)
			}
		}
	}
}

// WithLogger creates a decorator that adds logging to a context operation
func WithLogger(operation string, entity string) decorator.ContextDecoratorFunc {
	return func(next func(ctx context.Context) error) func(ctx context.Context) error {
		return func(ctx context.Context) error {
			// Get logger from context or use default
			logger := DefaultLogger.WithContext(ctx)
			
			// Get request ID if available
			requestID, _ := ctx.Value(FieldRequestID).(string)
			
			// Log operation start
			start := time.Now()
			logger.Info(fmt.Sprintf("Started %s", operation),
				FieldOperation, operation,
				FieldEntity, entity,
				FieldRequestID, requestID,
			)
			
			// Execute operation
			err := next(ctx)
			
			// Calculate duration
			duration := time.Since(start)
			
			// Log operation result
			if err != nil {
				logger.Error(fmt.Sprintf("Failed %s", operation), err,
					FieldOperation, operation,
					FieldEntity, entity,
					FieldRequestID, requestID,
					FieldDuration, duration.Milliseconds(),
				)
			} else {
				logger.Info(fmt.Sprintf("Completed %s", operation),
					FieldOperation, operation,
					FieldEntity, entity,
					FieldRequestID, requestID,
					FieldDuration, duration.Milliseconds(),
				)
			}
			
			return err
		}
	}
}

// WithStructuredLogging adds structured logging to a context operation
func WithStructuredLogging(operation string, entity string) decorator.ContextDecoratorFunc {
	return WithLogger(operation, entity)
} 