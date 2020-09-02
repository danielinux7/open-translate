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
    sp_path_src = app.root_path +"/models/"+language+"/src.model"
    sp_path_tgt = app.root_path +"/models/"+language+"/tgt.model"
    model_path = app.root_path +"/models/"+language
    if 'source' in request.form:
        src_list = request.form['source'].split("\n")
        tgt_list = process.translate(src_list,sp_path_src,sp_path_tgt,model_path)
        return jsonify({'target':"\n".join(tgt_list)})
    elif 'file' in request.files:
        # File translation should be implemented here
        file = request.files['file']
        return jsonify({'downloadLink':'This is working!'})

@app.route('/read', methods=['POST'])
def read():
    language = request.form['langSrc']
    if 'photo' in request.files:
        # OCR should be implemented here
        photo = request.files['photo']
        return jsonify({'source':'Ари асахьа бзиа!'})

@app.route('/star', methods=['POST'])
def star():
    language = request.form['langSrc'] + '-' + request.form['langTgt']
    src_list = request.form['source'].split("\n")
    tgt_list = request.form['target'].split("\n")
    src_tgt_tuple_list = list(zip(src_list, tgt_list))
    src_tgt_list = []
    for line in src_tgt_tuple_list:
        src_tgt_list.append("\n"+line[0]+"\t"+line[1])
    with open(app.root_path +"/starred/"+language+".txt","a+") as file:
        file.writelines(src_tgt_list)
    return jsonify({'star':True})

if __name__ == '__main__':
    app.run(debug=True)
