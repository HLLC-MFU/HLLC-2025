package enrichment

import (
	"context"
	"sync"
)

// Enricher provides generic data enrichment functionality
type Enricher[T any, E any] struct {
	// Function to enrich a single item
	enrichFn func(ctx context.Context, item T) (E, error)
	// Optional function to enrich items in batch
	batchEnrichFn func(ctx context.Context, items []T) ([]E, error)
	// Maximum batch size for batch enrichment
	batchSize int
}

// NewEnricher creates a new Enricher instance
func NewEnricher[T any, E any](
	enrichFn func(ctx context.Context, item T) (E, error),
	batchEnrichFn func(ctx context.Context, items []T) ([]E, error),
	batchSize int,
) *Enricher[T, E] {
	if batchSize <= 0 {
		batchSize = 100
	}
	return &Enricher[T, E]{
		enrichFn:      enrichFn,
		batchEnrichFn: batchEnrichFn,
		batchSize:     batchSize,
	}
}

// EnrichOne enriches a single item
func (e *Enricher[T, E]) EnrichOne(ctx context.Context, item T) (E, error) {
	return e.enrichFn(ctx, item)
}

// EnrichMany enriches multiple items, using batch enrichment if available
func (e *Enricher[T, E]) EnrichMany(ctx context.Context, items []T) ([]E, error) {
	if len(items) == 0 {
		return make([]E, 0), nil
	}

	if e.batchEnrichFn != nil {
		return e.batchEnrichFn(ctx, items)
	}

	// Fallback to parallel individual enrichment
	enriched := make([]E, len(items))
	var wg sync.WaitGroup
	errCh := make(chan error, len(items))

	for i, item := range items {
		wg.Add(1)
		go func(idx int, it T) {
			defer wg.Done()
			result, err := e.enrichFn(ctx, it)
			if err != nil {
				errCh <- err
				return
			}
			enriched[idx] = result
		}(i, item)
	}

	wg.Wait()
	close(errCh)

	// Check for errors
	if len(errCh) > 0 {
		return nil, <-errCh // Return first error
	}

	return enriched, nil
}

// EnrichManyInBatches enriches items in batches
func (e *Enricher[T, E]) EnrichManyInBatches(ctx context.Context, items []T) ([]E, error) {
	if len(items) == 0 {
		return make([]E, 0), nil
	}

	var results []E
	for i := 0; i < len(items); i += e.batchSize {
		end := i + e.batchSize
		if end > len(items) {
			end = len(items)
		}

		batch := items[i:end]
		enriched, err := e.EnrichMany(ctx, batch)
		if err != nil {
			return nil, err
		}
		results = append(results, enriched...)
	}

	return results, nil
} 