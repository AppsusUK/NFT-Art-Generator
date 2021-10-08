
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
  fee_recipient: string;
  seller_fee_basis_points: number;
  image: string;
  external_url: string;
  attributes: NftAttribute[],
  hash: string;
}

export interface SolNftMetaData {
  name: string;
  symbol: string;
  description: string;
  creators: SolCreator[],
  seller_fee_basis_points: number,
  image: string;
  category: string;
  external_url: string,
  attributes: NftAttribute[],
  properties: {
    hash: string;
  };
  collection: {
    name: string;
    family: string;
  }
}

export interface SolMetaplexNftMetaData {
  name: string;
  symbol: string;
  description: string;
  seller_fee_basis_points: number,
  image: string;
  category: string;
  external_url: string,
  attributes: NftAttribute[],
  properties: {
    creators: SolCreator[]
  };
  collection: {
    name: string;
    family: string;
  }
}

export interface CardanoMetadata {
  "721": {
    [policyId:string]: {

    }
  }
}

export interface CardanoNFTData {
  [assetName: string]: {
    id: number;
    name: string;
    image: string;
    description: string;
    properties: CardanoProperties;
  }
}

export interface CardanoProperties {
  [key:string]: string | number;
}

export interface NftAttribute {
  trait_type: string;
  value: string | number;
}

export interface SolCreator {
  address: string;
  share: number;
}


export interface FolderNode {
  name: string;
  children?: FolderNode[];
}
