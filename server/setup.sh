sudo apt-get install curl
sudo apt-get install python3-pip
sudo apt-get install openssl
echo "deb http://storage.googleapis.com/tensorflow-serving-apt stable tensorflow-model-server tensorflow-model-server-universal" | sudo tee /etc/apt/sources.list.d/tensorflow-serving.list && \
curl https://storage.googleapis.com/tensorflow-serving-apt/tensorflow-serving.release.pub.gpg | sudo apt-key add -
sudo apt update
sudo apt-get install tensorflow-model-server
sudo pip3 install -r requirements.txt
sudo openssl genpkey -algorithm RSA -out localhost.key
sudo openssl req -new -key localhost.key -out localhost.csr
sudo openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key -out localhost.crt

