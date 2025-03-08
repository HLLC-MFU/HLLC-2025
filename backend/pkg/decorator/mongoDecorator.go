package decorator

import (
	"context"

	"go.mongodb.org/mongo-driver/mongo"
)

/**
 * MongoWrapper is a wrapper for the mongo client
 *
 * @author Dev. Bengi (Backend Team)
 */

type (

	MongoWrapper struct {
		Client *mongo.Client
		Database string
	}
)

func (m *MongoWrapper) WithTransaction(ctx context.Context, fn func(ctx context.Context) error) error {
	session, err := m.Client.StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	_, err = session.WithTransaction(ctx, func(sessCtx mongo.SessionContext) (interface{}, error) {
        return nil, fn(sessCtx)
    })
    return err
}

func (m *MongoWrapper) getCollection(name string) *mongo.Collection {
	return m.Client.Database(m.Database).Collection(name)
}

