pipeline {
    agent {
        node {
            label 'aostp-agent'
        }
    }

    environment {
        // Customize these credentials and variables for your project
        SLACK_WEBHOOK_URL = credentials('aostp-slack-webhook')
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_IMAGE_NAME = "${DOCKER_HUB_CREDENTIALS_USR}/aostp-dashboard"
        DOCKER_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT?.take(7) ?: 'unknown'}"
        NODE_ENV = 'production'
        NEXT_PUBLIC_APP_ENV = 'production'
        NEXT_PUBLIC_API_BASE_URL = 'https://api.akomapacargo.com'
        PRODUCTION_DOMAIN = 'aostp.akomapacargo.com'
        TEST_DOMAIN = 'test.aostp.akomapacargo.com'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Checking out code from SCM...'
                checkout scm
                script {
                    env.GIT_COMMIT = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
                    env.GIT_BRANCH = sh(returnStdout: true, script: 'git rev-parse --abbrev-ref HEAD').trim()
                    env.GIT_AUTHOR = sh(returnStdout: true, script: 'git log -1 --pretty=format:"%an"').trim()
                    env.DOCKER_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                    echo "Branch: ${env.GIT_BRANCH}, Commit: ${env.GIT_COMMIT.take(7)}, Author: ${env.GIT_AUTHOR}, Tag: ${env.DOCKER_TAG}"
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh """
                    docker build --network=host --target production \\
                        --tag "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}" \\
                        --tag "${DOCKER_IMAGE_NAME}:latest" \\
                        .
                    docker images "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                """
            }
        }

        stage('Test Docker Image') {
            steps {
                echo '🧪 Testing Docker image...'
                    sh '''
                        # Cleanup any existing test containers first
                        docker stop aostp-dashboard-test || true
                        docker rm aostp-dashboard-test || true

                        if [ -f .env.template ]; then
                            envsubst < .env.template > .env.test
                        fi

                        # Start the container for testing
                        docker run -d --name aostp-dashboard-test --network aostp-internal-net --env-file .env.test "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"

                        # Wait and health check
                        sleep 10
                        for i in {1..5}; do
                            if curl -I http://aostp-dashboard-test:8080; then
                                echo "✅ Health check passed"
                            else
                                echo "❌ Health check failed"
                                if [ $i -eq 5 ]; then
                                    echo "❌ Health check failed after 10 attempts, exiting..."
                                    docker logs aostp-dashboard-test || true
                                    docker stop aostp-dashboard-test || true
                                    docker rm aostp-dashboard-test || true
                                    rm -f .env.test
                                    exit 1
                                fi
                            fi
                            echo "Retry $i/10..."
                            sleep 5
                        done
                        # Cleanup
                        docker stop aostp-dashboard-test || true
                        docker rm aostp-dashboard-test || true
                        rm -f .env.test
                    '''
            }
        }

        stage('Push to Docker Hub') {
            when {
                anyOf {
                    branch 'main'
                    branch 'test'
                }
            }
            steps {
                echo '📦 Pushing Docker image...'
                sh '''
                    echo "${DOCKER_HUB_CREDENTIALS_PSW}" | docker login -u "${DOCKER_HUB_CREDENTIALS_USR}" --password-stdin
                    docker push "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                    docker push "${DOCKER_IMAGE_NAME}:latest"
                    docker logout
                '''
            }
        }

        stage('Deploy to Test Environment') {
            when {
                branch 'test'
            }
            steps {
                echo '🚀 Deploying to test environment...'
                withCredentials(bindings: [
                    usernamePassword(credentialsId: 'google-credentials',
                    usernameVariable: 'GOOGLE_CLIENT_ID',
                    passwordVariable: 'GOOGLE_CLIENT_SECRET'),
                 ]) {
                    sh '''
                    # extract and set up .env.test
                    if [ -f .env.template ]; then
                        envsubst < .env.template > .env.test
                    fi
                    docker compose -f docker-compose.test.yml down || true
                    docker compose -f docker-compose.test.yml up -d

                    sleep 10
                    # Add health check
                    curl -I "https://${TEST_DOMAIN}" || echo "Health check failed but deployment continued"
                    rm -f .env.test
                '''
                 }
            }
        }

        stage('Deploy to Production Environment') {
            when {
                branch 'main'
            }
            steps {
                echo '🚀 Deploying to production environment...'
                withCredentials(bindings: [
                    usernamePassword(credentialsId: 'google-credentials',
                    usernameVariable: 'GOOGLE_CLIENT_ID',
                    passwordVariable: 'GOOGLE_CLIENT_SECRET'),
                 ]) {
                    sh '''
                     # extract and set up .env.production
                    if [ -f .env.template ]; then
                        envsubst < .env.template > .env.production
                    fi
                    docker compose -f docker-compose.production.yml down || true
                    docker compose -f docker-compose.production.yml up -d

                    sleep 10
                    # Add health check for production
                    curl -I "https://${PRODUCTION_DOMAIN}" || echo "Health check failed but deployment continued"
                    rm -f .env.production
                '''
                 }
            }
        }
    }

    post {
        always {
            script {
                echo '🧹 Cleaning up...'
                sh '''
                    # Clean up old images
                    docker images "${DOCKER_IMAGE_NAME}" --format "{{.Tag}}" | grep -E "^[0-9]+" | sort -nr | tail -n +4 | xargs -r -I {} docker rmi "${DOCKER_IMAGE_NAME}:{}" || true
                    docker image prune -f || true
                '''
            }
        }
        success {
            script {
                echo '✅ Pipeline completed successfully!'
                if (env.SLACK_WEBHOOK_URL) {
                    sh '''
                        curl -X POST -H "Content-type: application/json" \\
                        --data "{\\"text\\":\\"✅ AOSTP Dashboard deployment successful\\\\nBranch: ${GIT_BRANCH}\\\\nCommit: ${GIT_COMMIT}\\\\nTag: ${DOCKER_TAG}\\"}" \\
                        "${SLACK_WEBHOOK_URL}" || true
                    '''
                }
            }
        }
        failure {
            script {
                echo '❌ Pipeline failed!'
                if (env.SLACK_WEBHOOK_URL) {
                    sh '''
                        curl -X POST -H "Content-type: application/json" \\
                        --data "{\\"text\\":\\"❌ AOSTP Dashboard deployment failed\\\\nBranch: ${GIT_BRANCH}\\\\nCommit: ${GIT_COMMIT}\\\\nBuild: ${BUILD_URL}\\"}" \\
                        "${SLACK_WEBHOOK_URL}" || true
                    '''
                }
            }
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
    }
}
