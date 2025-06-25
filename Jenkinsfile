// Jenkinsfile สำหรับ Monorepo Project
// Pipeline นี้จะถูก Trigger โดย Webhook และ Build 'deployment' branch
// และจัดการ Build/Deploy ทั้ง NestJS และ Go App

pipeline {
    agent { label 'docker-agent' }

    environment {
        DOCKER_REGISTRY = 'jemiezler' // <<--- เปลี่ยนเป็น Docker Hub Username ของคุณ หรือโดเมนของ Private Registry
        KUBE_CONFIG_FILE = "/home/jenkins/.kube/config" // <<--- Path kubeconfig ภายใน Agent Container
        
        # กำหนดโฟลเดอร์สำหรับแต่ละแอปพลิเคชันภายใน Monorepo
        NEST_APP_DIR = "app"  // <<--- โฟลเดอร์ของ NestJS App ภายใน Monorepo
        GO_CHAT_APP_DIR = "chat" // <<--- โฟลเดอร์ของ Go Chat App ภายใน Monorepo
        K8S_BASE_DIR = "k8s" // <<--- โฟลเดอร์หลักสำหรับ Kubernetes Manifests (Root ของ k8s/)
    }

    stages {
        stage('Branch Filter Check') {
            steps {
                script {
                    def expectedBranch = 'refs/heads/deployment' 
                    def actualBranch = env.BUILD_BRANCH 

                    if (actualBranch == null) {
                        echo "WARNING: BUILD_BRANCH is not set. Assuming 'deployment' for manual trigger."
                        actualBranch = expectedBranch
                    }

                    if (actualBranch != expectedBranch) {
                        echo "--- SKIPPING DEPLOYMENT ---"
                        echo "Pushed branch '${actualBranch}' does not match expected deployment branch '${expectedBranch}'."
                        currentBuild.result = 'ABORTED' 
                        error "Pipeline aborted: Not the deployment branch."
                    } else {
                        echo "Branch '${actualBranch}' matches expected deployment branch. Proceeding."
                    }
                }
            }
        }

        stage('Checkout Source Code') {
            steps {
                script {
                    def branchToBuild = env.BUILD_BRANCH ?: 'deployment' 
                    git branch: branchToBuild, url: 'https://github.com/HLLC-MFU/HLLC-2025.git' // <<--- เปลี่ยน URL ของ Monorepo ของคุณ
                }
            }
        }

        stage('Build & Push NestJS App') {
            steps {
                script {
                    dir("${NEST_APP_DIR}") {
                        sh 'bun install --frozen-lockfile'
                        sh 'bun run build'
                        
                        def nestAppImageTag = "${env.BUILD_NUMBER}"
                        sh "docker build -t ${DOCKER_REGISTRY}/nest-app:${nestAppImageTag} ."
                        sh "docker push ${DOCKER_REGISTRY}/nest-app:${nestAppImageTag}"
                        
                        env.NEST_APP_IMAGE_TAG = nestAppImageTag 
                    }
                }
            }
        }

        stage('Build & Push Go Chat App') {
            steps {
                script {
                    dir("${GO_CHAT_APP_DIR}") {
                        sh 'go mod tidy'
                        sh 'go build -o app'
                        
                        def goChatImageTag = "${env.BUILD_NUMBER}"
                        sh "docker build -t ${DOCKER_REGISTRY}/go-chat:${goChatImageTag} ."
                        sh "docker push ${DOCKER_REGISTRY}/go-chat:${goChatImageTag}"

                        env.GO_CHAT_IMAGE_TAG = goChatImageTag 
                    }
                }
            }
        }
        
        stage('Deploy All to Kubernetes') {
            steps {
                script {
                    dir("${K8S_BASE_DIR}") {
                        // Apply ConfigMap และ Secret ที่ใช้ร่วมกัน
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f common/my-app-config.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f common/my-app-secrets.yaml"

                        # Apply Infrastructure Components
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/redis-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/zookeeper-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafka-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafdrop-k8s.yaml"
                        
                        // Apply Kubernetes Manifests ของ App และ Go Chat
                        sh "sed -i 's|image: ${DOCKER_REGISTRY}/nest-app:.*|image: ${DOCKER_REGISTRY}/nest-app:${NEST_APP_IMAGE_TAG}|' app/hllc2025-backend-app-deployment.yaml"
                        sh "sed -i 's|image: ${DOCKER_REGISTRY}/go-chat:.*|image: ${DOCKER_REGISTRY}/go-chat:${GO_CHAT_IMAGE_TAG}|' chat/hllc2025-backend-chat-deployment.yaml"
                        
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-deployment.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-service.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f chat/hllc2025-backend-chat-deployment.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f chat/hllc2025-backend-chat-service.yaml"
                        
                        # Apply Ingress
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f backend-ingress.yaml"

                        # รอให้ Deployments พร้อม (Optional)
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/redis-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/zookeeper-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafka-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafdrop-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/hllc2025-backend-app-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/hllc2025-backend-chat-deployment"
                    }
                }
            }
        }

        stage('Deploy All to Kubernetes') {
            steps {
                script {
                    dir("${K8S_BASE_DIR}") { # <<--- เข้าสู่โฟลเดอร์ k8s/
                        // อัปเดต Image Tag ใน Deployment YAMLs ของแต่ละ App
                        # NestJS Deployment (อยู่ใน k8s/app/)
                        sh "sed -i 's|image: ${DOCKER_REGISTRY}/nest-app:.*|image: ${DOCKER_REGISTRY}/nest-app:${NEST_APP_IMAGE_TAG}|' app/hllc2025-backend-app-deployment.yaml"
                        # Go Chat Deployment (อยู่ใน k8s/chat/)
                        sh "sed -i 's|image: ${DOCKER_REGISTRY}/go-chat:.*|image: ${DOCKER_REGISTRY}/go-chat:${GO_CHAT_IMAGE_TAG}|' chat/hllc2025-backend-chat-deployment.yaml"
                        
                        # Apply ConfigMap และ Secret ที่ใช้ร่วมกัน (ถ้ามี)
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f common/my-app-config.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f common/my-app-secrets.yaml"

                        # Apply Kubernetes Manifests ของ NestJS App
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-deployment.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-service.yaml"
                        
                        # Apply Kubernetes Manifests ของ Go Chat App
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f chat/hllc2025-backend-chat-deployment.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f chat/hllc2025-backend-chat-service.yaml"
                        
                        # Apply Ingress (มักจะอยู่ที่ Root ของ K8s/ หรือ k8s/common/)
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f backend-ingress.yaml"

                        // รอให้ Deployments พร้อม (Optional)
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/hllc2025-backend-app-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/hllc2025-backend-chat-deployment"
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
