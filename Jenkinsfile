def tagAndPush(String localImage, String repo, String registry, String credential) {
    docker.withRegistry(registry, credential) {
        sh "docker tag ${localImage} ${repo}:latest"
        sh "docker tag ${localImage} ${repo}:${env.BUILD_NUMBER}"
        sh "docker tag ${localImage} ${repo}:${env.APP_SEMANTIC_VERSION}"
        sh "docker push ${repo}:latest"
        sh "docker push ${repo}:${env.BUILD_NUMBER}"
        sh "docker push ${repo}:${env.APP_SEMANTIC_VERSION}"
    }
}

pipeline {
    agent any

    environment {
        IMAGE_NAME     = "curso-devops-lab3"
        DH_REPO        = "csotodocker/curso-devops-lab3"
        GHCR_REPO      = "ghcr.io/theperfecthost/curso-devops-lab3"
        K8S_NAMESPACE  = "csoto"
        K8S_DEPLOYMENT = "curso-devops-lab3-deployment"
        K8S_CONTAINER  = "contenedor-curso-devops"
    }

    stages {
        stage("Integracion continua") {
            agent {
                docker {
                    image "node:24"
                    reuseNode true
                }
            }
            stages {
                stage("CI de la aplicacion - version") {
                    steps {
                        script {
                            env.APP_SEMANTIC_VERSION = sh(
                                script: 'npm pkg get version | tr -d \'"\'',
                                returnStdout: true
                            ).trim()
                            echo "Version semantica detectada: ${env.APP_SEMANTIC_VERSION}"
                        }
                    }
                }
                stage("CI de la aplicacion - Instalación de dependencias") {
                    steps {
                        echo 'Instalando dependencias de Node...'
                        sh "npm install"
                    }
                }
                stage("CI de la aplicacion - lint") {
                    steps {
                        echo 'Ejecutando analisis estatico...'
                        sh "npm run lint"
                    }
                }
                stage("CI de la aplicacion - test") {
                    steps {
                        echo 'Ejecutando pruebas...'
                        sh "npm run test:cov"
                    }
                }
                stage("CI de la aplicacion - build") {
                    steps {
                        sh "npm run build"
                    }
                }
            }
        }
        
        stage("Quality Assurance"){
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli'
                    args '--network=devops-infra_default'
                    reuseNode true
                }
            }
            stages{
                stage("validacion de codigo"){
                    steps{
                        withSonarQubeEnv('sonarqube'){
                            sh 'sonar-scanner'
                        }
                    }
                }
                stage('validacion quality gate'){
                    steps{
                        script{
                            def qualityGate = waitForQualityGate()
                            if(qualityGate.status != 'OK'){
                                error "La puerta de calidad ha fallado: ${qualityGate.status}"
                            }
                        }
                    }
                }
            }
        }
        
        stage("CD de la aplicacion - build dockerfile") {
            // MEJORA 1: Solo construye y empuja imágenes si estamos en develop (o main)
            when {
                branch 'develop'
            }
            steps {
                sh "docker build -t ${env.IMAGE_NAME} ."
                script {
                    if (!env.APP_SEMANTIC_VERSION?.trim()) {
                        error("APP_SEMANTIC_VERSION no definida en el stage anterior")
                    }
                    tagAndPush(env.IMAGE_NAME, env.DH_REPO, "https://index.docker.io/v1/", "credencial-dh")
                    tagAndPush(env.IMAGE_NAME, env.GHCR_REPO, "https://ghcr.io", "credencial-gh")
                }
            }
        }
        
        stage("CD - Despliegue continuo en develop"){
            // MEJORA 1: Protección de rama para el despliegue
            when {
                branch 'develop'
            }
            agent {
                docker {
                    image 'alpine/k8s:1.34.6'
                    reuseNode true
                }
            }
            steps{
                script {
                    if (!env.BUILD_NUMBER?.trim()) {
                        error("BUILD_NUMBER no definida para el despliegue")
                    }
                }
                withKubeConfig([credentialsId: 'credencial-k8']) {
                    sh """
                        kubectl -n ${env.K8S_NAMESPACE} set image deployment/${env.K8S_DEPLOYMENT} ${env.K8S_CONTAINER}=${env.DH_REPO}:${env.BUILD_NUMBER}
                    """
                    // MEJORA 2: Evitar que Jenkins se quede pegado si Kubernetes falla al levantar el pod
                    timeout(time: 3, unit: 'MINUTES') {
                        sh "kubectl -n ${env.K8S_NAMESPACE} rollout status deployment/${env.K8S_DEPLOYMENT}"
                    }
                }
            }
        }
    }

    // MEJORA 3: Limpieza y control final
    post {
        always {
            // Limpia el workspace para no saturar el disco del servidor Jenkins
            cleanWs()
        }
        success {
            echo ":) Pipeline ejecutado con éxito. Despliegue finalizado correctamente."
        }
        failure {
            echo ":( El pipeline ha fallado. Revise los logs de ejecución."
        }
    }
}