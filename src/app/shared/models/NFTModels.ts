
export interface NftItem  {
    name: string;
    path: string;
    layerName: string;
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


export interface EthNftMetaData {
  name: string;
  description: string;
  image: string;
  attributes: NftAttribute[],
  hash: string;
}

export interface SolNftMetaData {
  name: string;
  description: string;
  image: string;
  attributes: NftAttribute[],
  properties: {
    hash: string;
  }
}

export interface NftAttribute {
  trait_type: string;
  value: string | number;
}