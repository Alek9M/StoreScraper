import puppeteer from "puppeteer-core";
import { executablePath } from "puppeteer";
import "dotenv/config.js";
import DB from "./db.js";
import Scraper from "./scraper.js";
import { Tesco } from "./stores/tesco.js";
export async function getBrowser() {
    let browser = await puppeteer.launch({
        headless: false,
        //   slowMo: 50,
        timeout: Scraper.timeOut,
        executablePath: executablePath(),
    });
    return browser;
}
async function run() {
    try {
        let db = new DB(Tesco.title);
        let scraper = new Scraper(await getBrowser(), db);
        scraper.scrape(Tesco);
        // let db2 = new DB(Iceland.title);
        // let scraper2 = new Scraper(await getBrowser(), db2);
        // scraper2.scrape(Iceland);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        // await browser.close();
    }
}
run();
//# sourceMappingURL=app.js.map