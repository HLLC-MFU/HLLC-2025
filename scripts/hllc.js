#!/usr/bin/env node

const command = process.argv[2];

switch (command) {
  case 'dev': {
    const module = await import('./commands/dev.js');
    await module.runDevCommand();
    break;
  }
  case 'install': {
    const module = await import('./commands/install.js');
    await module.runInstallCommand();
    break;
  }
  default:
    console.log(`❌ ไม่รู้จักคำสั่ง: ${command}`);
    console.log('ใช้ได้: dev, install');
}
