pipeline {
    agent { label 'docker-agent' }

    environment {
        DOCKER_REGISTRY = 'jemiezler'
        KUBE_CONFIG_FILE = "/home/jenkins/.kube/config"
        NEST_APP_DIR = "app"
        GO_CHAT_APP_DIR = "chat"
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
                    git branch: branchToBuild, url: 'https://github.com/HLLC-MFU/HLLC-2025.git'
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

        // Go app block is commented

        stage('Deploy All to Kubernetes') {
            steps {
                script {
                    dir("${K8S_BASE_DIR}") {
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

                        sh "sed -i 's|image: ${DOCKER_REGISTRY}/nest-app:.*|image: ${DOCKER_REGISTRY}/nest-app:${NEST_APP_IMAGE_TAG}|' app/hllc2025-backend-app-deployment.yaml"

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
            cleanWs()
        }
    }
}
