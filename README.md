# Open-Translate: Bridging the Language Divide

![Build and Deploy](https://github.com/danielinux7/Open-Translate/workflows/Build%20and%20Deploy/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/issues)
[![GitHub license](https://img.shields.io/github/license/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/blob/master/LICENSE)

Welcome to Open-Translate, where innovation meets seamless communication. Our project serves as a user-friendly interface for machine translation, complemented by a robust Restful API implementation.

### Getting Started:
This repository houses an Angular project for the frontend, you can guiding you through the process of building and setting up the front. For comprehensive instructions, refer to our [Angular Setup Guidelines][angular_setup].

Additionally, the server folder contains the backend implementation. Detailed instructions for building and setting up the backend can be found in our [Server Guidelines][server].

[angular_setup]: https://github.com/danielinux7/Open-Translate/blob/master/docs/angular_setup.md
[server]: https://github.com/danielinux7/Open-Translate/blob/master/docs/server.md

## Server (Backend):
Enhancing the server's language capabilities is straightforward. Simply include your ctranslate2 model under the /models/{source language code-target language code}/ folder (e.g., /models/en-fr/ for English and French). This mapping should align with the frontend structure outlined in our Angular Setup Guidelines.

For sentencepiece tokenization, follow the convention: /sentencepiece/{language code}.model and /sentencepiece/{language code}.vocab (e.g., /sentencepiece/de.model and /sentencepiece/de.vocab for trained German sentencepiece models).

The util folder incorporates the preprocess.py for each language pair under their respective /util/{source language code-target language code}/preprocess.py directory. Refer to existing examples for guidance. Starred folder is the destination for user-submitted edited/good translations via the frontend. These are tab-limited and formatted as {source language sentence {tab} target language sentence} (e.g., /starred/zh-jp.txt for translations from Chinese to Japanese submitted by users).

## Angular (Frontend):
Explore the potential of our frontend to revolutionize your translation experience. Follow our guidelines for a smooth setup and start translating seamlessly.

Thank you for being part of the Open-Translate community, where language is no longer a barrier.