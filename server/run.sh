waitress-serve --port=5000 --call run:start >flask.log 2>&1 &
nohup tensorflow_model_server \
  --rest_api_port=8501 \
  --model_name=ru-ab_model \
  --model_base_path=$(realpath models/ru-ab/) >model.log 2>&1 &
