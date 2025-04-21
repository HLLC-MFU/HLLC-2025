// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    // App Router ปกติไม่ต้องตั้ง experimental.appDir อีก
    // ระบุ allowedDevOrigins ตรงนี้ (root level)
    allowedDevOrigins: [
      "https://localhost:3000",
      "https://172.25.4.25:3000",
      "http://172.25.4.25:3000",
    ],
  };
  
  module.exports = nextConfig;
  