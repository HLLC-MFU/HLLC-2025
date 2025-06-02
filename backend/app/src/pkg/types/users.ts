import { FastifyRequest } from 'fastify';

export interface UserRequest extends FastifyRequest {
  user: {
    _id: string;
    // ใส่ field อื่นๆ ของ user ที่คุณต้องการ (username, role, etc.)
  };
}

export type RoleCountResult = {
  _id: string; // role name
  count: number;
};
