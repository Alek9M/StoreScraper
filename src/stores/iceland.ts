import { ElementHandle, Page } from "puppeteer-core";
import Store, { StorePrice, Tile } from "./store.js";
import { currencyTextToNumber, getHref, getText } from "../scraper.js";

export class Price implements StorePrice {
  price;
  mixNmatchQuantity;
  mixNmatchTotalPrice;

  constructor(price, mixNmatchQuantity, mixNmatchTotalPrice) {
    this.price = price;
    this.mixNmatchQuantity = mixNmatchQuantity;
    this.mixNmatchTotalPrice = mixNmatchTotalPrice;
  }

  get pricePerUnit() {
    return this.mixNmatchTotalPrice && this.mixNmatchQuantity
      ? this.mixNmatchTotalPrice / this.mixNmatchQuantity
      : this.price;
  }
}

export class Iceland implements Store {
  static title = "iceland";
  static _pageStep = 25;
  static firstCounter = 0 - Iceland._pageStep;
  static foodSections = [
    { name: "fresh", postfix: "/fresh", max: 41 - 1 },
    { name: "dry", postfix: "/food-cupboard", max: 81 - 1 },
    { name: "frozen", postfix: "/frozen", max: 63 - 1 },
    { name: "health", postfix: "/health-and-beauty", max: 9 - 1 },
    { name: "home", postfix: "/household", max: 21 - 1 },
  ];
  static base = "https://www.iceland.co.uk";
  static tileClass = ".product-tile";
  currentSection: string;
  _pageCounter = Iceland.firstCounter;
  // TODO: dynamic page limit
  _lastPage: number;

  get nextPagePostfix() {
    this._pageCounter += Iceland._pageStep;
    if (this._pageCounter <= 0) return "";
    if (this._pageCounter > this._lastPage) return undefined;
    return "?start=" + this._pageCounter;
  }

  constructor() {
    this.currentSection = Iceland.foodSections[0].postfix;
    this._lastPage = Iceland._pageStep * Iceland.foodSections[0].max;
  }

  jumpSection() {
    const index = Iceland.foodSections.findIndex(
      (section) => section.postfix === this.currentSection
    );
    if (index != undefined && index < Iceland.foodSections.length - 1) {
      this._pageCounter = Iceland.firstCounter;
      let currentSection = Iceland.foodSections[index + 1];
      this.currentSection = currentSection.postfix;
      this._lastPage = Iceland._pageStep * currentSection.max;
    }
  }

  async gotoNextPage(page) {
    let next = this.nextPagePostfix;

    if (next === undefined) {
      this.jumpSection();
      next = this.nextPagePostfix;
    }

    if (next !== undefined) {
      console.log(Iceland.base + this.currentSection + next);
      try {
        await page.goto(Iceland.base + this.currentSection + next);
      } catch (e) {
        console.log(e);
      }

      return true;
    }
    return false;
  }

  static async processProductTile(tile): Promise<Tile> {
    const titleClass = ".name-link";
    const title = await tile.$eval(titleClass, getText);
    const href = await tile.$eval(titleClass, getHref);

    const price = currencyTextToNumber(
      await tile.$eval(".product-sales-price", getText)
    );

    const mmElement = await tile.$(".value");
    let mm;
    if (mmElement) {
      mm = (await mmElement.$eval("p", getText)).split(" for ");
    }

    const bcpElement = await tile.$(".product-badge");
    // console.log(bcpElement);
    let bcp;
    if (bcpElement) {
      try {
        bcp = await bcpElement.$eval(".price", getText);
        // console.log(bcp);
      } catch (e) {
        // console.log("It is expected to not have '.price' sometiimes " + e);
      }
    }

    return {
      updated: new Date(),
      title: title,
      href: href,
      price: new Price(
        bcp ? currencyTextToNumber(bcp) : price,
        mm && Number(mm[0]),
        mm && currencyTextToNumber(mm[1])
      ),
    };
  }

  static async processNutritional(page) {
    // await page.waitForSelector(".open-dialog .nutrition-table-link");

    await page.click(".link .open-dialog .nutrition-table-link");

    await page.waitForSelector(".table.table-striped.table-sm");

    // Extract nutritional data
    let nutritionData = {};
    const data = await page.$eval(".table.table-striped.table-sm", (table) => {
      // Get the headers
      const headers = Array.from(table.querySelectorAll("thead th"));
      // Find the index of the 'As Sold 100g Provides:' column
      let index = headers.findIndex((header) =>
        (<HTMLElement>header).textContent?.includes("100g")
      );
      if (index === -1) {
        return null; // or throw an error, or handle this situation differently
      }
      // Iterate over each row
      const rows = Array.from(table.querySelectorAll("tbody tr"));
      for (let row of rows) {
        let columns = Array.from((<HTMLElement>row).querySelectorAll("td"));
        // Check if the row has enough columns
        if (columns.length > index) {
          let key = (<HTMLElement>columns[0]).innerText;
          let value = (<HTMLElement>columns[index]).innerText;
          nutritionData[key] = value;
        }
      }
    });
    // console.log(nutritionData);
    return nutritionData;
  }

  static async processProduct(page, product) {
    await page.goto(product.href);

    // chack if .text-muted exists
    const ingridientsRawElement = await await page.$(
      ".product-right-col-inner"
    );
    let ingridientsRaw;
    try {
      if (ingridientsRawElement && ingridientsRawElement.$(".text-muted")) {
        ingridientsRaw = await ingridientsRawElement.$eval(
          ".text-muted",
          getText
        );
      }
    } catch (error) {
      console.log(error);
    }

    // const ingridientsRaw = await (
    //   await page.$(".product-right-col-inner")
    // )?.$eval(".text-muted", getText);
    console.log(product.href);
    return {
      ...product,
      ingridientsRaw: ingridientsRaw,
      //   nutritionalRaw: await this.processNutritional(page),
    };
  }
}
