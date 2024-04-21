import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import fs from "fs";
import { Tile } from "./stores/store.js";

export default class DB {
  db;

  constructor(title) {
    let filePath = title + ".json";
    // check if exists and cfeate if doesnt
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]");
    }

    this.db = new LowSync(new JSONFileSync(filePath), {});
    this.db.read();
    // check if db.data is an array
    if (!Array.isArray(this.db.data)) {
      this.db.data = [];
    }

    if ((<[]>this.db.data).length % 3 === 0) {
      this.db.write();
    }
  }

  create(products: Tile[]) {
    this.db.data.push(...products);
    this.db.write();
  }

  read(): [] {
    this.db.read();
    return this.db.data;
  }
}
