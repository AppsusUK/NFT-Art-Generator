
export interface NftItem  {
    name: string;
    path: string;
  }
  
export interface ItemRarityFolder  {
name: string;
rarity?: number;
items?: Map<string, NftItem>;
};

export interface Layer  {
name: string;
rarity?: number;
index?: number;
itemRarityFolders?: Map<string, ItemRarityFolder>
};


export interface NftDirectory  {
path: string;
layers?: Map<string,Layer>;
}