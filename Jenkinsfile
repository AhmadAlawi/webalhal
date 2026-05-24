/*
 * Jenkins pipeline: GitHub auto-pull + full deploy with PM2
 *
 * Jenkins job setup (one-time):
 * 1. Install plugins: GitHub, Pipeline, NodeJS (optional)
 * 2. Create a Pipeline job pointing to this repo / Jenkinsfile
 * 3. Add GitHub webhook: https://YOUR_JENKINS/github-webhook/
 *    Events: push (and optionally pull_request if you add a branch filter)
 * 4. Store production env as a "Secret file" credential (id: alhalnewweb-env)
 *    containing at least: NEXT_PUBLIC_API_URL=https://alhal.awnak.net
 * 5. Ensure the Jenkins agent has Node.js 20+ and npm (PM2 comes from project devDependencies)
 *
 * Optional: set DEPLOY_DIR if the app lives outside the Jenkins workspace.
 */

pipeline {
  agent any

  options {
    buildDiscarder(logRotator(numToKeepStr: '10'))
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    APP_NAME = 'alhalnewweb'
    NODE_ENV = 'production'
    NODE_BIN_DIR = '/root/.nvm/versions/node/v24.12.0/bin'
    PATH = "${NODE_BIN_DIR}:${env.PATH}"
    // Override in Jenkins job or global env if deploying elsewhere
    DEPLOY_DIR = "${WORKSPACE}"
  }

  triggers {
    // Poll every 5 minutes if GitHub webhook is unavailable
    pollSCM('H/5 * * * *')
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_COMMIT_SHORT = sh(
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim()
        }
        echo "Building ${env.APP_NAME} @ ${env.GIT_COMMIT_SHORT}"
      }
    }

    stage('Prepare environment') {
      steps {
        script {
          try {
            withCredentials([file(credentialsId: 'alhalnewweb-env', variable: 'ENV_FILE')]) {
              sh '''
                cp "$ENV_FILE" .env.local
                echo "Loaded production env from Jenkins credentials."
              '''
            }
          } catch (ignored) {
            sh '''
              if [ -f .env.local ]; then
                echo "Using existing .env.local on the server."
              else
                echo "No Jenkins env credential and no .env.local; set NEXT_PUBLIC_API_URL on the agent."
              fi
            '''
          }
        }
      }
    }

    stage('Install dependencies') {
      steps {
        sh '''
          NODE=/root/.nvm/versions/node/v24.12.0/bin/node
          NPM=/root/.nvm/versions/node/v24.12.0/bin/npm
          test -x "$NODE" || { echo "Jenkins cannot access $NODE — symlink to /usr/local/bin"; exit 1; }
          "$NPM" ci
        '''
      }
    }

    stage('Build') {
      steps {
        sh '''
          NPM=/root/.nvm/versions/node/v24.12.0/bin/npm
          "$NPM" run build
        '''
      }
    }

    stage('Deploy with PM2') {
      steps {
        sh '''
          set -e
          mkdir -p logs
          NPX=/root/.nvm/versions/node/v24.12.0/bin/npx
          PM2="$NPX pm2"
          if $PM2 describe alhalnewweb >/dev/null 2>&1; then
            $PM2 reload ecosystem.config.cjs --env production --update-env
          else
            $PM2 start ecosystem.config.cjs --env production
          fi
          $PM2 save
        '''
      }
    }

    stage('Verify') {
      steps {
        sh '''
          NPX=/root/.nvm/versions/node/v24.12.0/bin/npx
          $NPX pm2 status alhalnewweb || true
          echo "Deployed commit: $(git rev-parse --short HEAD)"
        '''
      }
    }
  }

  post {
    success {
      echo "Deploy succeeded for ${env.APP_NAME} (${env.GIT_COMMIT_SHORT})"
    }
    failure {
      echo 'Deploy failed — check build logs and PM2 status on the server.'
    }
    always {
      sh '/root/.nvm/versions/node/v24.12.0/bin/npx pm2 status alhalnewweb || true'
    }
  }
}
