waitress-serve --port=5000 --call run:start >flask.log 2>&1 &
nohup tensorflow_model_server \
  --rest_api_port=8501 \
  --model_config_file='models.config' >model.log 2>&1 &
