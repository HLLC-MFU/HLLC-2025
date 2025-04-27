package decorator

import (
	"context"
	"log"
	"time"
)

/**
 * ContextDecorator is a decorator that adds a timeout to the context
 *
 * @author Dev. Bengi (Backend Team)
 */

type (
	ContextDecoratorFunc func(next func(ctx context.Context) error) func(ctx context.Context) error
)

// WithTimeout adds timeout to context operations
func WithTimeout[T any](timeout time.Duration) func(func(context.Context) (T, error)) func(context.Context) (T, error) {
	return func(next func(ctx context.Context) (T, error)) func(context.Context) (T, error) {
		return func(ctx context.Context) (T, error) {
			ctx, cancel := context.WithTimeout(ctx, timeout)
			defer cancel()
			return next(ctx)
		}
	}
}

// WithValue adds value to context
func WithValue(ctx context.Context, key, value interface{}) ContextDecoratorFunc {
	return func(next func(ctx context.Context) error) func(ctx context.Context) error {
		return func(ctx context.Context) error {
			return next(context.WithValue(ctx, key, value))
		}
	}
}

// WithRetry for retrying connect mongoDB or cloud (!! Production Only !!)
func WithRetry[T any] (maxAttempts int, delay time.Duration, fn func() (T, error)) (T, error) {
	var result T
	var err error
	
	for attempts := 0; attempts < maxAttempts; attempts++ {
		result, err = fn()
		if err != nil {
			time.Sleep(delay)
			continue
		}
	}
	return result, err
}

// WithLogger adds logger to context
func WithLogger(logger *log.Logger) ContextDecoratorFunc {
	return func(next func(ctx context.Context) error) func(ctx context.Context) error {
		return func(ctx context.Context) error {
			logger.Println("Starting service")
			err := next(ctx)
			if err != nil {
				logger.Println("Error:", err)
			}
			return err
		}
	}
}

// ComposeContextDecorators chains multiple ContextDecoratorFunc into one
func ComposeContextDecorators(decorators ...ContextDecoratorFunc) ContextDecoratorFunc {
	return func(finalHandler func(ctx context.Context) error) func(ctx context.Context) error {
		// Apply decorators from last to first
		for i := len(decorators) - 1; i >= 0; i-- {
			finalHandler = decorators[i](finalHandler)
		}
		return finalHandler
	}
}