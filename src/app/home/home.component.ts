import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '../core/services/electron/electron.service';
import * as _ from "lodash";
import { createCanvas, loadImage } from 'canvas';
import { fstat } from 'fs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  layerRarityFormGroup: FormGroup;
  itemRarityFolderRarityFormGroup: FormGroup;
  nftDirectory: NftDirectory;
  generationLimit: number = 1;
  commonItemRarityFolders = [];
  constructor(private router: Router, private electron: ElectronService) { }

  ngOnInit(): void {
    console.log('HomeComponent INIT');

  }


  loadNftFolderStructure(): void {
    this.selectInputFolder();
    let layers = this.electron.fs.readdirSync(this.nftDirectory.path);
    this.layerRarityFormGroup = new FormGroup({})
    layers.forEach((layerName) => {
      this.layerRarityFormGroup.addControl(layerName, new FormControl(100))

      this.nftDirectory.layers.set(layerName, {name: layerName, itemRarityFolders: new Map})
      //TODO Handle case of differing number of rarity folders/values
      let itemRarityFolders = this.electron.fs.readdirSync(this.nftDirectory.path + "/" + layerName, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
      this.commonItemRarityFolders = itemRarityFolders

      // Reading and setting all folder/files names
      itemRarityFolders.forEach((itemRarityFolderName) => {
        this.nftDirectory
        .layers
        .get(layerName)
        .itemRarityFolders.set(itemRarityFolderName, {name: itemRarityFolderName, items: new Map})

        let itemNames = this.electron.fs.readdirSync(this.nftDirectory.path + "/" + layerName + "/" + itemRarityFolderName, { withFileTypes: true })
        .filter(entry => !entry.isDirectory())
        .map(entry => entry.name);
        
        itemNames.forEach((itemName) => {
          this.nftDirectory
          .layers
          .get(layerName)
          .itemRarityFolders
          .get(itemRarityFolderName)
          .items
          .set(itemName, {
            name: itemName,
            path: `${this.nftDirectory.path}/${layerName}/${itemRarityFolderName}/${itemName}`
           });
        })
      })
    })



    //TODO extract to function + throw error
    let bigRarityArray = []
    let uniqueFolderNamesSet = new Set;
  
    this.nftDirectory.layers.forEach((layer) => {
      bigRarityArray.push(Array.from(layer.itemRarityFolders.keys()))
      layer.itemRarityFolders.forEach((rarityFolder) => {
        uniqueFolderNamesSet.add(rarityFolder.name);
      })
    })

    this.commonItemRarityFolders = _.intersection(...bigRarityArray);

    if( Array.from(uniqueFolderNamesSet.values()).toString() === this.commonItemRarityFolders.toString()){
      console.log('all folders are the same')
    } else {
      console.log(Array.from(uniqueFolderNamesSet.values()))
      console.log(this.commonItemRarityFolders)
      console.log('yourmum')
    }

    this.itemRarityFolderRarityFormGroup = new FormGroup({});
    this.commonItemRarityFolders.forEach(rarityFolder => {
      this.itemRarityFolderRarityFormGroup.addControl(rarityFolder, new FormControl(25))
    });
      
  }

  selectInputFolder(): void {
    // TODO: Add validation/Exception handling
    this.nftDirectory = {
      "path": this.electron.remote.dialog.showOpenDialogSync({
        properties: ["openDirectory"]
      })[0],
      "layers": new Map
    };
  }




  
  generateNfts() {
    //Todo
    //1 validation

    //2 set rarities
    //Fix index at reorganisation
    this.nftDirectory.layers.forEach((layer:Layer, layerName: string) => {
      this.nftDirectory.layers.get(layer.name).rarity = this.layerRarityFormGroup.controls[layerName].value/100
      layer.itemRarityFolders.forEach((rarityFolder: ItemRarityFolder, rarityFolderName: string ) => {
        this.nftDirectory.layers.get(layer.name).itemRarityFolders.get(rarityFolderName).rarity = this.itemRarityFolderRarityFormGroup.controls[rarityFolderName].value/100
      });
    })


    console.log(this.nftDirectory)
    for(let i = 0; i < this.generationLimit; i++) {
      let selectedNftFolderItems = this.selectNftItems();
      console.log(selectedNftFolderItems)
      //3 create and save nft images + metadata
      this.createNftImage(selectedNftFolderItems, i)
    }  
  }



  async createNftImage(selectedNftFolderItems: NftItem[], i) {
    /*let image = await loadImage(selectedNftFolderItems[0].path);
    const nftImage = createCanvas(image.width, image.height);
    let ctx = nftImage.getContext("2d");

    selectedNftFolderItems.forEach((nftFolderItem) => {
      let currentImage = loadImage(nftFolderItem.path)
      ctx.drawImage(currentImage)
    })
    
    this.electron.fs.writeFileSync(`../${this.nftDirectory.path}`,nftImage.toBuffer())*/
    console.log(selectedNftFolderItems[0].path)
    const image = this.electron.fs.readFileSync(selectedNftFolderItems[0].path)
      var blob = new Blob([image], {type: 'image/png'});
      var url = URL.createObjectURL(blob);

      const im2g = await loadImage(url);
      const canvas = createCanvas(im2g.width, im2g.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(im2g, 0, 0, im2g.width, im2g.height);
      
      window.open(canvas.toDataURL())

      this.electron.fs.writeFileSync(`${i}.png`, canvas.toDataURL("image/png"))

  }




  selectNftItems() {
     /*TODO Take into account:
     1 - duplicates
     2 - z-index's
     3 - no image in folders
     */
      let selectedLayers = this.selectLayers();
      return this.selectNftFolderItems(selectedLayers);
  }
  
  selectNftFolderItems(selectedLayers: Layer[]): any {
    let selectedItems = [];
    selectedLayers.forEach(layer => {
      let raritySum = 0;
      let roll = Math.random();
      for(let rarityFolder of Array.from(layer.itemRarityFolders.values())) {
        raritySum += rarityFolder.rarity;
        if(roll <= raritySum) {
          let randomItem = Array.from(rarityFolder.items.values())[Math.floor(Math.random()*rarityFolder.items.values.length)];
          if(randomItem) {
            selectedItems.push(randomItem)
          }
          break;
        }
      }
    });
    return selectedItems;
  }

  selectLayers(): any {
    //Rolls number between 0 and 1
    let roll = Math.random();
    let selectedLayers = [];

    this.nftDirectory.layers.forEach((layer) => {
      if (roll <= layer.rarity || layer.rarity === 1){
        selectedLayers.push(layer);
      }
    })

    return selectedLayers;
  }
}


interface NftItem  {
  name: string;
  path: string;
}

interface ItemRarityFolder  {
  name: string;
  rarity?: number;
  items?: Map<string, NftItem>;
};

interface Layer  {
  name: string;
  rarity?: number;
  itemRarityFolders?: Map<string, ItemRarityFolder>
};


interface NftDirectory  {
  path: string;
  layers?: Map<string,Layer>;
}
/*
1 - User will fill in input information
2 - Press "Generate"
3 - Inputs sent to generation function


/*
Inputs to collect:
- Input folder location
- Selected blockchain:
  -Solana
  -Ethereum
- Rarity of layers
- Number of NFTS to generate

Folder structure:
Layers -> Rarity buckets -> items







*/