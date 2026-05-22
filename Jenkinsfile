pipeline {
    agent any

    stages {

        stage('Clone') {
            steps {
                git branch: 'main',
                url: 'YOUR_GITHUB_REPO_URL'
            }
        }

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
                sh 'docker run -d -p 8080:80 --name cinevault-container cinevault-app'
            }
        }

        stage('Verify') {
            steps {
                sh 'curl http://localhost:8080'
            }
        }
    }
}