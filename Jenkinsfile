pipeline {
    agent any

    stages {

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t cinevault-app .'
            }
        }

        stage('Stop Old Container') {
            steps {
                sh 'docker rm -f cinevault-container || true'
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