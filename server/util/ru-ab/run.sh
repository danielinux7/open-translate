nohup tensorflow_model_server \
  --rest_api_port=8501 \
  --model_name=ru-ab_model \
  --model_base_path="/home/nart/Documents/open-translate/server/models/ru-ab" >server.log 2>&1
