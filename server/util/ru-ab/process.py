import os
import tensorflow as tf
import sentencepiece as sp
from mosestokenizer import *

class Translator(object):
    
    
    def __init__(self, export_dir):
        imported = tf.saved_model.load(export_dir)
        self._translate_fn = imported.signatures["serving_default"]
        self._tokenizer = sp.SentencePieceProcessor()
        self._tokenizer.load(os.path.join(export_dir, "assets", "src.model"))

    def translate(self, texts):
        """Translates a batch of texts."""
        inputs, count = self._preprocess(texts)
        outputs = self._translate_fn(**inputs)
        return self._postprocess(outputs,count)

    def _preprocess(self, texts):
        count = []
        tokenize = MosesTokenizer('ru')
        temp = []
        for text in texts:
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
            "tokens": tf.constant(all_tokens, dtype=tf.string),
            "length": tf.constant(lengths, dtype=tf.int32),
        }
        return inputs, count

    def _postprocess(self, outputs,count):
        texts = []
        for tokens, length in zip(outputs["tokens"].numpy(), outputs["length"].numpy()):
            tokens = tokens[0][: length[0]].tolist()
            tokens = "".join([token.decode("utf-8") for token in tokens])
            tokens = tokens.replace("▁"," ").replace("- ","-").strip()
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
