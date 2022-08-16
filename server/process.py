import os
import json
import requests
import sentencepiece as sp
from mosestokenizer import *

class Translator(object):
    
    
    def __init__(self, export_dir, language):
        self._tokenizer = sp.SentencePieceProcessor()
        self._detokenizer = sp.SentencePieceProcessor()
        self._tokenizer.load(os.path.join(export_dir, "assets", "src.model"))
        self._detokenizer.load(os.path.join(export_dir, "assets", "tgt.model"))
        self.lang = language
        
    def translate(self, texts):
        """Translates a batch of texts."""
        inputs, count = self._preprocess(texts)
        data = json.dumps({"inputs": inputs})
        headers = {"content-type": "application/json"}
        model_url = 'http://localhost:8501/v1/models/'+self.lang+':predict'
        json_response = requests.post(model_url, data=data, headers=headers)
        outputs = json.loads(json_response.text)['outputs']
        return self._postprocess(outputs,count)

    def _preprocess(self, texts):
        count = []
        tokenize = MosesTokenizer('ru')
        temp = []
        for text in texts:
           text = text.replace("-","- ")
           if text == '\r' or text == '':
             text = "▁"
           with MosesSentenceSplitter('ru') as splitsents:
              text = splitsents([text])
           count.append(len(text))
           temp.extend(text)
        texts = temp
        
        all_tokens = []
        lengths = []
        max_length = 0
        for text in texts:
            tokens = self._tokenizer.encode(text.lower(), out_type=str)
            tokens.insert(0,"<v7>")
            if self.lang == "ab-ru":
               tokens.insert(0,"<ab>")
            if self.lang == "ru-ab":
               tokens.insert(0,"<ru>")            
            length = len(tokens)
            all_tokens.append(tokens)
            lengths.append(length)
            max_length = max(max_length, length)
        for tokens, length in zip(all_tokens, lengths):
            if length < max_length:
                tokens += [""] * (max_length - length)

        inputs = {
            "tokens": all_tokens,
            "length": lengths
        }
        return inputs, count

    def _postprocess(self, outputs,count):
        texts = []
        for tokens, length in zip(outputs["tokens"], outputs["length"]):
            tokens = self._detokenizer.decode(tokens[0]).replace("- ","-")
            texts.append(tokens)
            
        temp = []
        i = 0    
        for length in count:
          text = ''
          for j in range(length):
            text = text.strip() + " " + texts[i+j].capitalize()
          temp.append(text.strip())
          i = i + length
        texts = temp
        return texts

def translate(src_list,sm_path,language):
    tgt_list = Translator(sm_path,language).translate(src_list)
    return tgt_list
    
def convFile(file):
    if file.filename[-5:] == ".docx":
        def decode(line):
            return line.decode("utf-8")
        tgt_list = "here is me"
        with open("./downloads/"+file.filename[:-5]+"_еиҭакганы.docx","w+")as f:
            f.writelines(tgt_list)
        download = {'url':'/downloads/'+file.filename[:-5]+'_еиҭакганы.docx','filename':file.filename[:-5]+'_еиҭакганы.docx'}
        return download
