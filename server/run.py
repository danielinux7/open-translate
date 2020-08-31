from flask import Flask, render_template, jsonify, request
import util.process as process
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/translate', methods=['POST'])
def translate():
    tgt_list = None
    language = request.form['langSrc'] + '-' + request.form['langTgt']
    sp_path_src = app.root_path +"/util/src.model"
    sp_path_tgt = app.root_path +"/util/tgt.model"
    ct_path_ab = app.root_path + "/ctranslate_model_ab"
    ct_path_ru = app.root_path + "/ctranslate_model_ru"
    if 'source' in request.form:
        src_list = request.form['source'].split("\n")
        if language == "ab-ru":
            tgt_list = process.translate(src_list,sp_path_src,sp_path_tgt,ct_path_ab)
        elif language == "ru-ab":
            tgt_list = process.translate(src_list,sp_path_tgt,sp_path_src,ct_path_ru)
        return jsonify({'target':"\n".join(tgt_list)})
    elif 'file' in request.files:
        file = request.files['file']
        return jsonify({'downloadLink':'This is working!'})

if __name__ == '__main__':
    app.run(debug=True)
