sudo apt-get install curl
sudo apt-get install python3-pip
echo "deb http://storage.googleapis.com/tensorflow-serving-apt stable tensorflow-model-server tensorflow-model-server-universal" | sudo tee /etc/apt/sources.list.d/tensorflow-serving.list && \
curl https://storage.googleapis.com/tensorflow-serving-apt/tensorflow-serving.release.pub.gpg | sudo apt-key add -
sudo apt update
sudo apt-get install tensorflow-model-server
sudo pip3 install -r requirements.txt
sudo apt-get install certbot
sudo certbot certonly -d server.bagrat.space -n --standalone --agree-tos -m daniel.abzakh@gmail.com
