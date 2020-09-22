The server is built on:
- api server [flask] 
- an inference engine [ctranslate2]
- word tokenization with [sentencepiece]
- sentence tokenization with [mosestokenizer]
- photo recognition [easyOCR] 

To run everything, you would need to install the the python packages in [requirements.txt][requirements]:\
`pip install -r requirements.txt`

[flask]: https://github.com/pallets/flask
[ctranslate2]: https://github.com/OpenNMT/CTranslate2
[easyOCR]: https://github.com/JaidedAI/EasyOCR
[sentencepiece]: https://github.com/google/sentencepiece
[mosestokenizer]: https://github.com/luismsgomes/mosestokenizer
[requirements]: https://github.com/danielinux7/Open-Translate/blob/master/server/requirements.txt
