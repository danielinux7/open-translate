import os
import json
import requests
import sentencepiece as sp
from mosestokenizer import *

class Translator(object):
    
    
    def __init__(self, export_dir):
        self._tokenizer = sp.SentencePieceProcessor()
        self._detokenizer = sp.SentencePieceProcessor()
        self._tokenizer.load(os.path.join(export_dir, "assets", "src.model"))
        self._detokenizer.load(os.path.join(export_dir, "assets", "tgt.model"))

    def translate(self, texts):
        """Translates a batch of texts."""
        inputs, count = self._preprocess(texts)
        data = json.dumps({"inputs": inputs})
        headers = {"content-type": "application/json"}
        json_response = requests.post('http://localhost:8501/v1/models/ru-ab_model:predict', data=data, headers=headers)
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

def translate(src_list,sm_path):
    tgt_list = Translator(sm_path).translate(src_list)
    return tgt_list
