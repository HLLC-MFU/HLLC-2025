// Jenkinsfile สำหรับ Monorepo Project
// Pipeline นี้จะถูก Trigger โดย Webhook และ Build 'deployment' branch
// และจัดการ Build/Deploy ทั้ง NestJS และ Go App

pipeline {
    agent { label 'docker-agent' }

    environment {
        DOCKER_REGISTRY = 'jemiezler' // <<--- เปลี่ยนเป็น Docker Hub Username ของคุณ หรือโดเมนของ Private Registry
        KUBE_CONFIG_FILE = "/home/jenkins/.kube/config" // <<--- Path kubeconfig ภายใน Agent Container
        
        // # กำหนดโฟลเดอร์สำหรับแต่ละแอปพลิเคชันภายใน Monorepo
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

        // stage('Build & Push Go Chat App') {
        //     steps {
        //         script {
        //             dir("${GO_CHAT_APP_DIR}") {
        //                 sh 'go mod tidy'
        //                 sh 'go build -o app'
                        
        //                 def goChatImageTag = "${env.BUILD_NUMBER}"
        //                 sh "docker build -t ${DOCKER_REGISTRY}/go-chat:${goChatImageTag} ."
        //                 sh "docker push ${DOCKER_REGISTRY}/go-chat:${goChatImageTag}"

        //                 env.GO_CHAT_IMAGE_TAG = goChatImageTag 
        //             }
        //         }
        //     }
        // }

        stage('Deploy All to Kubernetes') {
            steps {
                script {
                    dir("${K8S_BASE_DIR}") {
                        // สร้าง Secret จาก Jenkins Credentials
                        // ต้องมีการตั้งค่า Credentials ใน Jenkins ก่อน
                        // ตัวอย่าง: 'jwt-secret' (Secret Text) และ 'db-password' (Secret Text)
                        withCredentials([
                            string(credentialsId: 'JWT_SECRET', variable: 'JWT_SECRET'),
                            string(credentialsId: 'JWT_REFRESH_SECRET', variable: 'JWT_REFRESH_SECRET'),
                            string(credentialsId: 'CRYPTO_SECRET', variable: 'CRYPTO_SECRET'),
                            string(credentialsId: 'MONGO_URI', variable: 'MONGO_URI'),
                        ]) {
                            sh """
                            cat <<EOF > common/shared-secrets.yaml
                            apiVersion: v1
                            kind: Secret
                            metadata:
                            name: shared-secrets
                            namespace: default
                            type: Opaque
                            data:
                            JWT_SECRET: \$(echo -n "${JWT_SECRET}" | base64)
                            JWT_REFRESH_SECRET: \$(echo -n "${JWT_REFRESH_SECRET}" | base64)
                            CRYPTO_SECRET: \$(echo -n "${CRYPTO_SECRET}" | base64)
                            MONGO_URI: \$(echo -n "${MONGO_URI}" | base64)
                            EOF
                            """
                            sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f common/shared-secrets.yaml"
                        }
                        // Apply ConfigMap ตามปกติ
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f common/shared-config.yaml"

                        // Infrastructure
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/redis-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/zookeeper-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafka-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafdrop-k8s.yaml"

                        // Update image tag
                        sh "sed -i 's|image: ${DOCKER_REGISTRY}/nest-app:.*|image: ${DOCKER_REGISTRY}/nest-app:${NEST_APP_IMAGE_TAG}|' app/hllc2025-backend-app-deployment.yaml"

                        // Apply backend app
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-deployment.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-service.yaml"

                        // Apply ingress
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f backend-ingress.yaml"

                        // Wait for rollouts
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/redis-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/zookeeper-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafka-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafdrop-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/hllc2025-backend-app-deployment"

                        // Clean up secret file (optional)
                        sh "rm -f common/shared-secrets.yaml"
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