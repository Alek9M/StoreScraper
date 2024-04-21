import DB from "./db.js";
import { Iceland } from "./stores/iceland.js";
import { getBrowser } from "./app.js";
export function getText(element) {
    // console.log(element?.textContent);
    return element?.textContent?.trim();
}
export function getHref(element) {
    return element.getAttribute("href");
}
export function currencyTextToNumber(text) {
    if (text == undefined)
        return undefined;
    if (text?.trim() == "Multi Offers")
        return undefined;
    return Number(text.replace(/^£/, ""));
}
export default class Scraper {
    static timeOut = 2 * 60 * 1000;
    browser;
    db;
    constructor(browser, db) {
        this.browser = browser;
        this.db = db;
    }
    async digDeeper() {
        let secondaryPage = await this.page();
        let products = this.db.read();
        let rawDB = new DB(Iceland.title + "deep");
        while (products.length > 0) {
            const product = products.pop();
            await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
            rawDB.create([await Iceland.processProduct(secondaryPage, product)]);
        }
    }
    async page() {
        let mainPage = await this.browser.newPage();
        mainPage.setDefaultNavigationTimeout(Scraper.timeOut);
        return mainPage;
    }
    async basics(storeClass) {
        const store = new storeClass();
        let mainPage = await this.page();
        let hasNext = await store.gotoNextPage(mainPage);
        while (hasNext) {
            // await for 2 seconds
            await new Promise((resolve) => setTimeout(resolve, 2 * 1000));
            //   console.log("main cycle");
            // @ts-ignore
            let productTiles = await mainPage.$$(storeClass.tileClass);
            if (productTiles.length == 0) {
                await mainPage.reload();
                productTiles = await mainPage.$$(storeClass.tileClass);
            }
            if (productTiles.launch == 0) {
                await this.handleRejection();
                mainPage = await this.page();
                continue;
            }
            // for tesco
            //   console.log("main cycle tiles");
            let products = [];
            await Promise.all(productTiles.map(async (tile) => {
                try {
                    let product = await storeClass.processProductTile(tile);
                    if (product != undefined) {
                        products.push(product);
                    }
                }
                catch (e) {
                    console.log(e);
                }
            }));
            this.db.create(products);
            hasNext = await store.gotoNextPage(mainPage);
            if (hasNext == undefined) {
                await this.handleRejection();
                mainPage = await this.page();
                hasNext = await store.gotoNextPage(mainPage);
            }
        }
    }
    async handleRejection() {
        await this.browser.close();
        this.browser = await getBrowser();
    }
    async scrape(storeClass) {
        await this.basics(storeClass);
        // await this.digDeeper();
    }
}
//# sourceMappingURL=scraper.js.map