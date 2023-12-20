gunicorn --certfile localhost.crt --keyfile localhost.key -b localhost:5000 run:app >flask.log 2>&1 &
python3 models-config.py
nohup tensorflow_model_server \
  --rest_api_port=8501 \
  --model_config_file='models.config' >model.log 2>&1 &
