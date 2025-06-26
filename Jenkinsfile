pipeline {
  agent any

  environment {
    PM2_HOME = "$HOME/.pm2"
    NODE_ENV = "production"
    DEPLOY_DIR = "/home/ubuntu/hllc-2025"
  }

  stages {
    stage('Install Node Dependencies (NestJS)') {
      steps {
        dir("${env.DEPLOY_DIR}/backend/app") {
          sh 'bun install'
        }
      }
    }

    stage('Build NestJS App') {
      steps {
        dir("${env.DEPLOY_DIR}/backend/app") {
          sh 'bun build'
        }
      }
    }

    stage('Build Go Chat Service') {
      steps {
        dir("${env.DEPLOY_DIR}/backend/chat") {
          sh 'go mod tidy'
          sh 'go build -o chat-server .'
        }
      }
    }

    stage('Restart Services') {
      steps {
        dir("${env.DEPLOY_DIR}") {
          sh '''
            pm2 reload ecosystem.config.js --only backend-app --env production || \
            pm2 start ecosystem.config.js --only backend-app --env production
            pm2 save

            pkill -f chat-server || true
            nohup ./backend/chat/chat-server > chat.log 2>&1 &
          '''
        }
      }
    }

    stage('Replace Nginx Config') {
      steps {
        sh '''
          echo "🧩 Combining Nginx config parts from backend/nginx/*.conf"
          cat ${DEPLOY_DIR}/backend/nginx/*.conf > /tmp/hllc.conf

          echo "🔄 Replacing /etc/nginx/sites-available/hllc.conf"
          sudo cp /tmp/hllc.conf /etc/nginx/sites-available/hllc.conf

          if [ ! -L /etc/nginx/sites-enabled/hllc.conf ]; then
            echo "🔗 Creating symlink in sites-enabled..."
            sudo ln -s /etc/nginx/sites-available/hllc.conf /etc/nginx/sites-enabled/
          fi

          echo "🧪 Testing Nginx config..."
          sudo nginx -t

          echo "♻️ Reloading Nginx..."
          sudo systemctl reload nginx
        '''
      }
    }
  }

  post {
    success {
      echo '✅ Backend deployment succeeded.'
    }
    failure {
      echo '❌ Deployment failed.'
    }
  }
}
