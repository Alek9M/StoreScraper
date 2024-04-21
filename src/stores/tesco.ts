import { currencyTextToNumber, getHref, getText } from "../scraper.js";
import Store, { FoodSection, StorePrice, Tile } from "./store.js";

export class Price implements StorePrice {
  price;
  clubcard;

  constructor(price, clubcard) {
    this.price = price;
    this.clubcard = clubcard;
  }

  get pricePerUnit() {
    return this.clubcard ?? this.price;
  }
}

export class Tesco implements Store {
  static title = "tesco";
  static _pageStep = 1;
  static firstCounter = 0 - Tesco._pageStep;
  static foodSections = [
    {
      name: "fresh",
      postfix: "/fresh-food/all",
      max: 155 - 1,
    },
    { name: "dry", postfix: "food-cupboard/all", max: 244 - 1 },
    { name: "frozen", postfix: "/frozen-food/all", max: 45 - 1 },
    { name: "health", postfix: "/health-and-beauty/all", max: 197 - 1 },
    { name: "home", postfix: "/household/all", max: 51 - 1 },
  ];
  static _base = "https://www.tesco.com";
  static base = Tesco._base + "/groceries/en-GB/shop";
  static tileClass = ".product-list--list-item";
  currentSection: string;
  _pageCounter = Tesco.firstCounter;
  // TODO: dynamic page limit
  _lastPage: number;

  get nextPagePostfix() {
    this._pageCounter += Tesco._pageStep;
    if (this._pageCounter <= 0) return "";
    if (this._pageCounter > this._lastPage) return undefined;
    return "?page=" + this._pageCounter;
  }

  _undoNext() {
    this._pageCounter -= Tesco._pageStep;
  }

  constructor() {
    this.currentSection = Tesco.foodSections[0].postfix;
    this._lastPage = Tesco._pageStep * Tesco.foodSections[0].max;
  }

  jumpSection() {
    const index = Tesco.foodSections.findIndex(
      (section) => section.postfix === this.currentSection
    );
    if (index != undefined && index < Tesco.foodSections.length - 1) {
      this._pageCounter = Tesco.firstCounter;
      let currentSection = Tesco.foodSections[index + 1];
      this.currentSection = currentSection.postfix;
      this._lastPage = Tesco._pageStep * currentSection.max;
    }
  }

  get _currentSection(): FoodSection {
    const index = Tesco.foodSections.findIndex(
      (section) => section.postfix === this.currentSection
    );
    if (index != undefined) {
      return Tesco.foodSections[index];
    }
  }

  async gotoNextPage(page) {
    let next = this.nextPagePostfix;

    if (next === undefined) {
      this.jumpSection();
      next = this.nextPagePostfix;
    }

    if (next !== undefined) {
      console.log(Tesco.base + this.currentSection + next);
      try {
        await page.goto(Tesco.base + this.currentSection + next);
        let warning = await page.$("head title");
        if (warning) {
          const text = await warning.evaluate(getText);
          console.log(text);
          if (text == "Access Denied") {
            this._undoNext();
            return undefined;
          }
        }
      } catch (e) {
        console.log(e);
      }
      // console.log(new Date() + " " + Tesco.title + " " + Tesco.foodSections.map(s => s.max).reduce((total, amount) => total + amount)
      return true;
    }
    return false;
  }

  static async processProductTile(tile): Promise<Tile> {
    let titleClass = ".product-details--wrapper a";
    //   let titleElement = await tile.$(".product-details--wrapper a")
    //   // get element with titleClass and then get <a> from titleclass element
    //   if (titleElement) {
    //       let a = await titleElement.$("a")
    //   }
    tile.scrollIntoView();
    const title = await tile.$eval(titleClass, getText);
    const href = await tile.$eval(titleClass, getHref);
    const priceClass = ".beans-price__text";
    let price;
    try {
      await tile.waitForSelector(priceClass);
      const priceText = await tile.$eval(priceClass, getText);
      price = currencyTextToNumber(priceText);
    } catch (e) {
      console.log(e);
      return undefined;
    }

    // const mmElement = await tile.$(".beans-price__subtext");
    // let mm;
    // if (mmElement) {
    //   mm = await tile.$eval(".beans-price__subtext", getText);
    //   mm = mm.split("/");
    // }

    const clubCardClass = ".offer-text";
    const bcpElement = await tile.$(clubCardClass);
    // console.log(bcpElement);
    let bcp;
    if (bcpElement) {
      try {
        // bcp = await bcpElement.$eval(".price", getText);
        bcp = await tile.$eval(clubCardClass, getText);
        bcp = currencyTextToNumber(bcp.split(" ")[0]);
        // console.log(bcp);
      } catch (e) {
        // console.log("It is expected to not have '.price' sometiimes " + e);
      }
    }

    return {
      updated: new Date(),
      title: title,
      href: Tesco._base + href,
      price: new Price(price, bcp),
    };
  }

  static async processNutritional(page) {}

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
