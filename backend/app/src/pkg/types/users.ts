import { FastifyRequest } from 'fastify';

export interface UserRequest extends FastifyRequest {
  user: {
    _id: string;
    metadata: {
      school: {
        _id: string;
        name: Record<string, string>;
      };
      major: {
        _id: string;
        name: Record<string, string>;
      };
    };
    // ใส่ field อื่นๆ ของ user ที่คุณต้องการ (username, role, etc.)
  };
}

export type RoleCountResult = {
  _id: string; // role name
  count: number;
};
