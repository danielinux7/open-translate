# Open-Translate
![Build and Deploy](https://github.com/danielinux7/Open-Translate/workflows/Build%20and%20Deploy/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/issues)
[![GitHub license](https://img.shields.io/github/license/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/blob/master/LICENSE)

User interface for machine translation, and restful api implementaion.\
This repo is an angular project, you can build and setup the frontend following these [guidelines][angular_setup].\
The server folder were added for the backend implementation, you can build and setup the backend following these [guidelines][server].

[angular_setup]: https://github.com/danielinux7/Open-Translate/blob/master/docs/angular_setup.md
[server]: https://github.com/danielinux7/Open-Translate/blob/master/docs/server.md

## Server:
To add a language to the server, you should add your ctranslate2 model under the models/<source langauge code-target language code>/ folder(i.e /models/en-fr/ for english and frensh), this should also map to the frontend in angular as shown in the anguler guideline.
