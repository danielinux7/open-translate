from flask import Flask, render_template, jsonify, request
from importlib import import_module
from flask_cors import CORS
from flask_talisman import Talisman

app = Flask(__name__,static_folder='downloads')
CORS(app)
Talisman(app, content_security_policy=None)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    language = request.form['langSrc'] + '-' + request.form['langTgt']
    process = import_module('process')
    model_path = app.root_path +"/models/"+language+"/1"
    if 'source' in request.form:
        src_list = request.form['source'].split("\n")
        tgt_list = process.translate(src_list,model_path,language)
        return jsonify({'target':"\n".join(tgt_list)})
    elif 'file' in request.files:
        file = request.files['file']
        download = process.translateFile(file,sp_path_src,sp_path_tgt,model_path)
        download['url'] = 'https://' + request.host + download['url']
        return jsonify(download)

@app.route('/conv', methods=['POST'])
def conv():
    process = import_module('process')
    file = request.files['file']
    download = process.convFile(file)
    download['url'] = 'https://' + request.host + download['url']
    return jsonify(download)

@app.route('/read', methods=['POST'])
def read():
    language = request.form['langSrc'] + '-' + request.form['langTgt']
    process = import_module('util.'+language+'.process')
    lang = request.form['langSrc']
    if 'photo' in request.files:
        # OCR should be implemented here
        photo = request.files['photo']
        text = process.readPhoto(photo,lang)
        return jsonify({'source':text})

@app.route('/star', methods=['POST'])
def star():
    language = request.form['langSrc'] + '-' + request.form['langTgt']
    src_list = request.form['source'].split("\r\n")
    tgt_list = request.form['target'].split("\r\n")
    UUID = request.form['UUID'];
    src_tgt_tuple_list = list(zip(src_list, tgt_list))
    src_tgt_list = []
    for line in src_tgt_tuple_list:
        src_tgt_list.append("\n"+UUID+"\t"+line[0]+"\t"+line[1])
    with open(app.root_path +"/starred/"+language+".txt","a+") as file:
        file.writelines(src_tgt_list)
    return jsonify({'star':True})

def start():
   return app

if __name__ == '__main__':
    app.run()
