# Open Translate

![Build and Deploy](https://github.com/danielinux7/Open-Translate/workflows/Build%20and%20Deploy/badge.svg)
[![GitHub issues](https://img.shields.io/github/issues/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/issues)
[![GitHub license](https://img.shields.io/github/license/danielinux7/Open-Translate)](https://github.com/danielinux7/Open-Translate/blob/master/LICENSE)

Welcome to Open-Translate, where innovation meets seamless communication. Our project serves as a user-friendly interface for machine translation, complemented by a robust Restful API implementation.

## Table of Contents

- [Open Translate](#open-translate)
  - [Table of Contents](#table-of-contents)
  - [Frontend](#frontend)
    - [Installation and Setup](#installation-and-setup)
    - [Customization](#customization)
      - [Adding Languages](#adding-languages)
      - [API Configuration](#api-configuration)
  - [Backend](#backend)
    - [Setup and Run](#setup-and-run)
    - [API Payload](#api-payload)
    - [Language Capabilities Enhancement](#language-capabilities-enhancement)
    - [User-Submitted Translations](#user-submitted-translations)

## Frontend

The provided code is intentionally generic, allowing you to seamlessly integrate the frontend with your unique project requirements.

### Installation and Setup

   ```bash
   git clone https://github.com/danielinux7/open-translate.git
   cd open-translate
   npm install
   ng serve
   ```

### Customization

To tailor the frontend to your specific requirements, consider the following customization options:

#### Adding Languages

Expand the language options by adding a new language to the `src/app/languages.ts` file. Simply include it in the languages object list.

#### API Configuration

Adjust API calls to suit your needs by modifying the relevant sections in the `src/app/translate.service.ts` file. For local testing of the API server, set the endpoint to `localhost`.

## Backend

The backend comprises two servers: a Flask server responsible for handling RESTful API calls, and a TensorFlow server dedicated to managing Neural Machine Translation (NMT) models. When a call is initiated, the Flask server manages the requests and seamlessly passes them to the TensorFlow server.

### Setup and Run

   ```bash
   git clone https://github.com/danielinux7/open-translate.git
   cd open-translate/server
   bash setup_prod.sh # use setup.sh for localhost
   bash run_prod.sh # use run.sh for localhost
   ```

You should configure your production server name in `setup_prod.sh` and `run_prod.sh`. You can stop the servers by running `bash stop.sh`.

### API Payload

The payload for API calls includes the following key components:

- `langSrc`: Source language identifier.
- `langTgt`: Target language identifier.
- `source`: Representing the source content.

The response includes a `target` key-value pair, providing the translated content.

### Language Capabilities Enhancement

Expanding the server's language capabilities is a straightforward process. To integrate your TensorFlow saved model:

- Place the model under the `/models/<langSrc-langTgt>/<Version>` folder.
  - Example: `/models/en-fr/1/` for English to French translation, version 1.
- If you introduce a new version, TensorFlow serves the latest version.

For tokenization, the backend uses Sentencepiece. Include the `src.model` and `tgt.model` models in the `/models/<langSrc-langTgt>/<Version>/assets` folder.

### User-Submitted Translations

The `/starred` folder serves as the destination for user-submitted edited or high-quality translations via the frontend.
