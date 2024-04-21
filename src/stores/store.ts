export interface FoodSection {
  name: string;
  postfix: string;
  max: number;
}

export type Tile = {
  updated: Date;
  title: string;
  href: string;
  price: StorePrice;
};

export interface StoreConstructable {
  new (): Store;
  foodSections: FoodSection[];
  base: string;
  title: string;
  tileClass: string;
  processProductTile(tile: Tile);
}

export default interface Store {
  //   _pageStep: number;
  gotoNextPage(mainPage: any);
}

// export class SimilarStore implements StoreConstructable {
//     jumpSection() {
//         const index = SimilarStore.foodSections.findIndex(
//           (section) => section.postfix === this.currentSection
//         );
//         if (
//           index != undefined &&
//           index < SimilarStore.foodSections.length - 1
//         ) {
//           this._pageCounter = SimilarStore.firstCounter;
//           let currentSection = SimilarStore.foodSections[index + 1];
//           this.currentSection = currentSection.postfix;
//           this._lastPage = SimilarStore._pageStep * currentSection.max;
//         }
//     }
// }

export interface StorePrice {
  price: number;
  get pricePerUnit(): number;
}
