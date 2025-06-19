export type RoleStats = {
  registered: number;
  notRegistered: number;
  total: number;
};

export type UseruseSystem = {
  [role: string]: RoleStats;
};
