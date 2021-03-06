# Open-Translate
![Build and Deploy](https://github.com/danielinux7/Open-Translate/workflows/Build%20and%20Deploy/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/issues)
[![GitHub license](https://img.shields.io/github/license/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/blob/master/LICENSE)

User interface for machine translation, and restful api implementaion.\
This repo is an angular project, you can build and setup the frontend following these [guidelines][angular_setup].\
The server folder were added for the backend implementation, you can build and setup the backend following these [guidelines][server].

[angular_setup]: https://github.com/danielinux7/Open-Translate/blob/master/docs/angular_setup.md
[server]: https://github.com/danielinux7/Open-Translate/blob/master/docs/server.md

## Server (backend):
To add a new language to the server, you should include your ctranslate2 model under the /models/{source langauge code-target language code}/ folder (i.e /models/en-fr/ for english and frensh), this should also map to the frontend in angular as shown in the frontend guideline.\
For sentencepiece tokenoization, it can added like this: /sentencepiece/{language code}.model and /sentencepiece/{language code}.vocab (i.e /sentencepiece/de.model and /sentencepiece/de.vocab to add trained german sentencepiece models)\
The util folder will include the preprocess.py for each language pair under their own folder /util/{source langauge code-target language code}/preprocess.py, please look at already existing examples.
The starred folder is where edited/good translation is sent from the users via the frontend, these are tab-limited formatted as {source language sentence {tab} target language sentence}, (i.e /starred/zh-jp.txt is where you would find translations from chinease to japanease added from user's inputs) 
## Angular (frontend)
