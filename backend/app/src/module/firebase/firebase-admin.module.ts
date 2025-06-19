import { Global, Module } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

@Global()
@Module({
  providers: [
    {
      provide: 'FIREBASE_ADMIN',
      useFactory: () => {
        const path = join(__dirname, '../../../firebase-service-account.json');

        try {
          if (!existsSync(path)) {
            console.error(`[FirebaseAdminModule] ❌ File not found: ${path}`);
            return null;
          }

          const serviceAccount = JSON.parse(readFileSync(path, 'utf8'));

          return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        } catch (error) {
          console.error('[FirebaseAdminModule] ⚠️ Failed to initialize Firebase Admin:', error);
          return null;
        }
      },
    },
  ],
  exports: ['FIREBASE_ADMIN'],
})
export class FirebaseAdminModule {}
