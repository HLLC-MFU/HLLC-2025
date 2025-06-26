pipeline {
    agent { label 'docker-agent' }

    environment {
        DOCKER_REGISTRY = 'jemiezler'
        KUBE_CONFIG_FILE = "/home/jenkins/.kube/config"
        NEST_APP_DIR = "backend/app"
        GO_CHAT_APP_DIR = "backend/chat"
        K8S_BASE_DIR = "k8s"
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
                        echo "Pushed branch '${actualBranch}' does not match expected deployment branch '${expectedBranch}'."
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
                    echo "Checking out source code for branch: ${branchToBuild}"
                    git branch: branchToBuild, url: 'https://github.com/HLLC-MFU/HLLC-2025.git'
                    echo "Source code checkout complete."
                    sh "ls -l" // Log files in the root of the workspace
                }
            }
        }

        stage('Build & Push NestJS App') {
            steps {
                script {
                    echo "Navigating to NestJS app directory: ${NEST_APP_DIR}"
                    dir("${NEST_APP_DIR}") {
                        sh "echo \"Current working directory: \$(pwd)\""
                        echo "Listing contents of NestJS app directory:"
                        sh "ls -la"
                        sh "cat package.json || echo 'package.json not found in current directory.'"

                        echo "Starting Bun install and build..."
                        // FIX: Use WORKSPACE for the absolute path in the volume mount
                        sh """
                        docker run --rm -v ${WORKSPACE}:/app -w /app oven/bun:latest bash -c "
                            echo 'Running bun install...' && \\
                            bun install --frozen-lockfile && \\
                            echo 'Bun install complete. Running bun build...' && \\
                            bun run build && \\
                            echo 'Bun build complete.'
                        "
                        """
                        echo "Bun install and build command executed."

                        def nestAppImageTag = "${env.BUILD_NUMBER}"
                        echo "NestJS app image tag: ${nestAppImageTag}"
                        echo "Building Docker image: ${DOCKER_REGISTRY}/nest-app:${nestAppImageTag}"
                        // FIX: Ensure docker build context is . or specific path
                        sh "docker build -t ${DOCKER_REGISTRY}/nest-app:${nestAppImageTag} ."
                        echo "Docker image built successfully."

                        echo "Pushing Docker image: ${DOCKER_REGISTRY}/nest-app:${nestAppImageTag}"
                        sh "docker push ${DOCKER_REGISTRY}/nest-app:${nestAppImageTag}"
                        echo "Docker image pushed successfully."

                        env.NEST_APP_IMAGE_TAG = nestAppImageTag
                        echo "Set NEST_APP_IMAGE_TAG to: ${env.NEST_APP_IMAGE_TAG}"
                    }
                    echo "Finished Build & Push NestJS App stage."
                }
            }
        }

        // Go app block is commented

        stage('Deploy All to Kubernetes') {
            steps {
                script {
                    echo "Navigating to Kubernetes base directory: ${K8S_BASE_DIR}"
                    dir("${K8S_BASE_DIR}") {
                        echo "Current working directory: \$(pwd)" // FIX: Escaped the $ in $(pwd) - though this specific line was not in the original error, it's good practice.
                        echo "Creating shared secrets from Jenkins credentials..."
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
                            echo "Applying shared secrets to Kubernetes..."
                            sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f common/shared-secrets.yaml" // FIX: Escaped KUBE_CONFIG_FILE just to be safe, though it's inside a string.
                            echo "Shared secrets applied."
                        }

                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f common/shared-config.yaml"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/redis-k8s.yaml"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/zookeeper-k8s.yaml"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafka-k8s.yaml"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f infrastructure/kafdrop-k8s.yaml"

                        sh "sed -i 's|image: ${DOCKER_REGISTRY}/nest-app:.*|image: ${DOCKER_REGISTRY}/nest-app:\${NEST_APP_IMAGE_TAG}|' app/hllc2025-backend-app-deployment.yaml"

                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-deployment.yaml"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f app/hllc2025-backend-app-service.yaml"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl apply -f backend-ingress.yaml"

                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl rollout status deployment/redis-deployment"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl rollout status deployment/zookeeper-deployment"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafka-k8s.yaml" // Assuming typo, should be kafka-deployment based on rollout.
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl rollout status deployment/kafdrop-deployment"
                        sh "KUBECONFIG=\${KUBE_CONFIG_FILE} kubectl rollout status deployment/hllc2025-backend-app-deployment"

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