require("dotenv").config();

/**
 * Get environment instance variables
 * @param {string} key - key of environment variable
 * @param {string} project - project to get
 * @param {"string"|"number"} type - xtype of value to return
 * @returns environment instance variables
 */
const getEnv = (key, project, type, init) => {
  const env =
    process.env[`HLLC_${key.toUpperCase()}_${project.toUpperCase()}`] || init;
  if (type === "number") {
    return parseInt(env) || 1;
  }
  return env;
};

const getPort = (project, init) => {
  return getEnv("PORT", project, "number", init);
};
const getInstance = (project, init) => {
  return getEnv("INSTANCE", project, "number", init);
};

module.exports = {
  apps: [
    {
      name: "backend-2025",
      script: "dist/main.js",
      cwd: "./backend/app",
      port: getPort("backend", 5000),
      instances: getInstance("backend", 1),
      exec_mode: "cluster_mode",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "admin-2025",
      cwd: "./frontend/admin",
      script: "bun",
      args: "run start --port 3011",
      interpreter: "none", // บอก PM2 ว่าไม่ต้องใช้ Node รัน
    },

  ],
};
