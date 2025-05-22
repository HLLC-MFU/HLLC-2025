import spawn from 'cross-spawn';

function installPnpm(cwd, name) {
  console.log(`install dependencies for ${name}...`);
  const result = spawn.sync('pnpm', [
    'install',
    '--prefer-offline',
  ], {
    cwd,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    console.error(`failed to install ${name} (skipping)\n`);
    return;
  }

  console.log(`installed ${name}\n`);
}

function installGo(cwd, name) {
  console.log(`install dependencies for ${name}...`);
  const result = spawn.sync('go', ['mod', 'tidy'], {
    cwd,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    console.error(`failed to install ${name} (skipping)\n`);
    return;
  }

  console.log(`installed ${name}\n`);
}

function startRedis() {
  console.log('starting Redis with docker-compose...');
  const result = spawn.sync('docker-compose', ['up', '-d'], {
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    console.error('failed to start Redis container (skipped)\n');
  } else {
    console.log('Redis container started\n');
  }
}

export async function runInstallCommand() {
  startRedis();
  installPnpm('backend/app', 'NestJS Backend');
  installGo('backend/chat', 'Go Chat Server');
  installPnpm('frontend/admin', 'Admin Frontend');
  installPnpm('frontend/student', 'Student App');

  console.log('installation complete!\n');
  console.log('run `hllc dev` to start the development server');
}
