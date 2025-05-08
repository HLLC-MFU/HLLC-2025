import { MongooseModuleOptions } from '@nestjs/mongoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import mongooseLeanDefaults from 'mongoose-lean-defaults';
import mongooseLeanGetters from 'mongoose-lean-getters';
import mongooseLean from 'mongoose-lean';

export const mongooseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI,
  connectionFactory: (connection) => {
    // Register plugins
    connection.plugin(mongooseLeanVirtuals);
    connection.plugin(mongooseLeanDefaults);
    connection.plugin(mongooseLeanGetters);
    connection.plugin(mongooseLean);
    
    // Set lean option globally
    connection.Query.prototype.lean = function(options = {}) {
      return this.setOptions({
        lean: {
          virtuals: true,
          defaults: true,
          getters: true,
          ...options,
        },
      });
    };
    
    return connection;
  },
  retryAttempts: 3,
  retryDelay: 1000,
};
