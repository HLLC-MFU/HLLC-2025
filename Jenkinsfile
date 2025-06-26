pipeline {
    agent { label 'docker-agent' }

    environment {
        DOCKER_REGISTRY = 'jemiezler'
        KUBE_CONFIG_FILE = "/home/jenkins/.kube/config"
        NEST_APP_DIR = "backend/app"
        GO_CHAT_APP_DIR = "backend/chat"
        K8S_BASE_DIR = "k8s"
        PATH = "/opt/bun/bin:$PATH" // ให้มั่นใจว่า bun ใช้งานได้
    }

    stages {
        stage('Branch Filter Check') {
            steps {
                script {
                    def expectedBranch = 'deployment'
                    def actualBranch = env.BUILD_BRANCH ?: env.BRANCH_NAME ?: 'deployment'

                    echo "Branch info - BUILD_BRANCH=${env.BUILD_BRANCH}, BRANCH_NAME=${env.BRANCH_NAME}"
                    echo "Using branch: ${actualBranch}"

                    if (actualBranch != expectedBranch) {
                        echo "--- SKIPPING DEPLOYMENT ---"
                        currentBuild.result = 'ABORTED'
                        error "Pipeline aborted: Not the deployment branch."
                    } else {
                        echo "✅ Branch '${actualBranch}' matches expected deployment branch. Proceeding."
                    }
                }
            }
        }

        stage('Checkout Source Code') {
            steps {
                script {
                    def branchToBuild = env.BUILD_BRANCH ?: env.BRANCH_NAME ?: 'deployment'
                    git branch: branchToBuild, url: 'https://github.com/HLLC-MFU/HLLC-2025.git'
                    sh "ls -l"
                }
            }
        }
        stage('Check Environment'){
            steps {
                script {
                    sh "echo 'Checking environment...'"

                    // Check and install Bun if not present
                    script {
                        try {
                            sh "bun --version"
                            echo "Bun is already installed."
                        } catch (Exception e) {
                            echo "Bun is not installed. Attempting to install Bun..."
                            sh "curl -fsSL https://bun.sh/install | bash"
                            // Add Bun to PATH for the current shell session if it's not automatically sourced
                            // This often depends on the Jenkins agent's shell configuration.
                            // A common approach is to source the bun env file, or explicitly add the install dir to PATH.
                            // For simplicity, assuming bun's installer might modify a common profile, or the path for subsequent commands is inherited.
                            // If not, you might need: sh "export PATH=\"$HOME/.bun/bin:$PATH\"" or similar.
                            sh """
                                bash -c 'curl -fsSL https://bun.sh/install | bash'
                                
                                # Add Bun to PATH for the current shell session for subsequent commands in this script block
                                # $HOME and $PATH are now interpreted by the shell, not Groovy.
                                export PATH="$HOME/.bun/bin:$PATH" 
                                
                                bun --version || error
                            """
                            echo "Bun installed successfully."
                        }
                    }

                    sh "go version || Go error"
                    sh "docker --version || Docker error"
                    sh "kubectl version --client || kubectl error"
                    sh "echo 'Environment check completed.'"
                }
            }
        }

        stage('Build & Push NestJS App') {
            steps {
                dir("${NEST_APP_DIR}") {
                    script {
                        echo "Running bun install and build..."
                        sh '''
                            export PATH=$HOME/.bun/bin:$PATH
                            bun install --frozen-lockfile
                            bun run build
                        '''
                        sh "bun install --frozen-lockfile"
                        sh "bun run build"

                        def shortTag = env.GIT_COMMIT?.take(7) ?: env.BUILD_NUMBER
                        def imageTag = "${DOCKER_REGISTRY}/nest-app:${shortTag}"

                        echo "Building Docker image: ${imageTag}"
                        sh "docker build -t ${imageTag} ."
                        sh "docker push ${imageTag}"

                        env.NEST_APP_IMAGE_TAG = shortTag
                    }
                }
            }
        }

        stage('Deploy All to Kubernetes') {
            steps {
                dir("${K8S_BASE_DIR}") {
                    script {
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

                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f common/shared-config.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/redis-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/zookeeper-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafka-k8s.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafdrop-k8s.yaml"

                        // อัปเดต image tag ใน deployment
                        sh "sed -i.bak 's|image: ${DOCKER_REGISTRY}/nest-app:.*|image: ${DOCKER_REGISTRY}/nest-app:${NEST_APP_IMAGE_TAG}|' app/hllc2025-backend-app-deployment.yaml"

                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-deployment.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-service.yaml"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl apply -f backend-ingress.yaml"

                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/redis-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/zookeeper-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafka-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafdrop-deployment"
                        sh "KUBECONFIG=${KUBE_CONFIG_FILE} kubectl rollout status deployment/hllc2025-backend-app-deployment"

                        sh "rm -f common/shared-secrets.yaml"
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                echo "Cleaning up workspace..."
                deleteDir()
            }
        }
    }
}
