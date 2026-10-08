FROM jenkins/jenkins:lts-jdk17

# Copiar lista de plugins e instalarlos durante la construcción de la imagen
COPY jenkins-plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

