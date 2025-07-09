import inquirer from 'inquirer';
import spawn from 'cross-spawn';

export async function runDevCommand() {
  const { selected } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selected',
      message: 'Select a service to start:',
      choices: [
        { name: 'Docker Compose', value: 'docker' },
        { name: 'NestJS Backend', value: 'nest' },
        { name: 'Go Chat Server', value: 'go' },
        { name: 'Next.js Admin Frontend', value: 'admin' },
        { name: 'Expo Student App', value: 'student' },
        { name: 'Next.js Student Web', value: 'student-web' },
      ],
    },
  ]);

  switch (selected) {
    case 'docker':
      console.log('[docker] Running docker-compose up...');
      spawn.sync('docker-compose', ['up', '-d'], { stdio: 'inherit' });
      break;

    case 'nest':
      console.log('[nest] Starting NestJS backend...');
      spawn.sync('pnpm', ['dev'], { cwd: 'backend/app', stdio: 'inherit' });
      break;

    case 'go':
      console.log('[go] Starting Go Chat server...');
      spawn.sync('go', ['run', 'main.go'], { cwd: 'backend/chat', stdio: 'inherit' });
      break;

    case 'admin':
      console.log('[admin] Starting Admin frontend...');
      spawn.sync('pnpm', ['dev'], { cwd: 'frontend/admin', stdio: 'inherit' });
      break;

    case 'student':
      console.log('[student] Starting Student app...');
      spawn.sync('pnpm', ['dev'], { cwd: 'frontend/student', stdio: 'inherit' });
      break;

    case 'student-web':
      console.log('[student-web] Starting Student web...');
      spawn.sync('pnpm', ['dev'], { cwd: 'frontend/student-web', stdio: 'inherit' })
      break;

    default:
      console.log('No service selected.');
  }
}
