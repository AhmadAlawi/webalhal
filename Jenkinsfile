/*
 * Jenkins pipeline: GitHub auto-pull + deploy via scripts/deploy.sh
 *
 * Server prep (one-time, as root):
 *   ln -sf /path/to/node /usr/local/bin/node
 *   ln -sf /path/to/npm  /usr/local/bin/npm
 *   ln -sf /path/to/npx  /usr/local/bin/npx
 * Jenkins runs as user 'jenkins' — use /usr/local/bin, not /root/.nvm
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
    NODE_BIN_DIR = '/usr/local/bin'
    PATH = "${NODE_BIN_DIR}:${env.PATH}"
    DEPLOY_DIR = "${WORKSPACE}"
  }

  triggers {
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
              sh 'cp "$ENV_FILE" .env.local'
            }
          } catch (ignored) {
            sh '''
              if [ ! -f .env.local ]; then
                echo "No Jenkins env credential — ensure .env.local exists on agent"
              fi
            '''
          }
        }
      }
    }

    stage('Deploy') {
      steps {
        sh '''
          set -e
          test -x "${NODE_BIN_DIR}/node" || { echo "Node missing at ${NODE_BIN_DIR}/node"; exit 1; }
          bash scripts/deploy.sh
        '''
      }
    }

    stage('Verify') {
      steps {
        sh '''
          npx pm2 status alhalnewweb || true
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
      echo 'Deploy failed — check build logs and /var/lib/jenkins/.pm2/logs/'
    }
    always {
      sh 'npx pm2 status alhalnewweb || true'
    }
  }
}
