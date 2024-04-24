## Chain store data scraper

Collects data from supermarkets into a standardised analysable format

## Features
- [x] Uses OpenAI to
* - [x] parse ingridients into a tree with metadata
* - [x] standartise units of measurements
- [x] [Headless browsing](https://pptr.dev) for evading blocks
- [x] Async loading from different stores while limiting requests to the same one
- [x] Collects data from
* - [x] Tesco
* - [x] Iceland
* - [ ] Sainsbury's


## Usage
Insert OpenAI api key in [.env](/.env.sample)

Adjust stores and level of scraping in [app.ts](/src/app.ts)

Adjust classes 
