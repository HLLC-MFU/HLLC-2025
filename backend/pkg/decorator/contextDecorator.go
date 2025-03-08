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

	ContextDecorator struct {
		Name string
	}

	ContextDecoratorFunc func(next func(ctx context.Context) error) func(ctx context.Context) error
)

// WithTimeout adds timeout to context operations
func WithTimeout(timeout time.Duration) ContextDecoratorFunc {
	return func(next func(ctx context.Context) error) func(ctx context.Context) error {
		return func(ctx context.Context) error {
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

// WithMetrics is a decorator that adds metrics to the service
// func WithMetrics(metrics *Metrics) ServiceDecoratorFunc {
// 	return func(next func(ctx context.Context) error) func(ctx context.Context) error {
// 		return func(ctx context.Context) error {
// 			metrics.Increment("service_calls")
// 			return next(ctx)
// 		}
// 	}
// }
