import os

model_config = """ 
model_config_list {
  config{
        name: 'ab-ru'
        base_path: '"""+os.path.abspath(os.getcwd())+'/models/ab-ru/'+"""'
        model_platform: 'tensorflow'
       }
  config{
        name: 'ru-ab'
        base_path: '"""+os.path.abspath(os.getcwd())+'/models/ru-ab/'+"""'
        model_platform: 'tensorflow'
        }
}
""" 
with open('models.config','w+') as f:
  f.write(model_config)
