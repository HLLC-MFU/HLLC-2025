package queries

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// FKFetcher defines a function that retrieves related entities using foreign key IDs.
type FKFetcher[P any] func(ctx context.Context, ids []primitive.ObjectID) (map[primitive.ObjectID]P, error)

// Populator holds the state of the current population chain.
type Populator[S any] struct {
	ctx    context.Context
	source []S
	err    error
}

// New initializes a new Populator with a data source.
func New[S any](ctx context.Context, source []S) *Populator[S] {
	return &Populator[S]{
		ctx:    ctx,
		source: source,
	}
}

// With applies population for a single foreign key relationship.
// This is a standalone function (not a method) to support type parameters for the foreign entity.
func With[S any, P any](
	p *Populator[S],
	extractFK func(S) primitive.ObjectID,     // how to extract the foreign key from the source
	assign func(*S, P),                        // how to assign the populated value
	fetch FKFetcher[P],                        // how to fetch the populated entities
) *Populator[S] {
	// If there's already an error from previous With, skip this one
	if p.err != nil {
		return p
	}

	// Collect unique foreign key IDs
	seen := make(map[primitive.ObjectID]bool)
	var ids []primitive.ObjectID

	for _, item := range p.source {
		id := extractFK(item)
		if !seen[id] {
			seen[id] = true
			ids = append(ids, id)
		}
	}

	// Fetch related documents
	relatedMap, err := fetch(p.ctx, ids)
	if err != nil {
		p.err = err
		return p
	}

	// Assign populated values to each source item
	for i := range p.source {
		key := extractFK(p.source[i])
		if val, ok := relatedMap[key]; ok {
			assign(&p.source[i], val)
		}
	}

	return p
}

// Result returns the final populated result and any error.
func (p *Populator[S]) Result() ([]S, error) {
	return p.source, p.err
}
