pipeline {
    agent any

    stages {

        stage('Build Docker Image') {
            steps {
                sh 'docker build --no-cache -t cinevault-app .'
            }
        }

        stage('Stop Old Container') {
            steps {
                sh '''
                docker rm -f cinevault-container || true
                docker rmi cinevault-app || true
                '''
            }
        }

        stage('Run Container') {
            steps {
                sh 'docker run -d -p 8085:80 --name cinevault-container cinevault-app'
            }
        }

        stage('Verify') {
            steps {
                sh 'docker ps'
            }
        }
    }
}