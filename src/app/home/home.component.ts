import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '../core/services/electron/electron.service';
import * as _ from "lodash";
import { createCanvas, loadImage } from 'canvas';
import { EthNftMetaData, ItemRarityFolder, Layer, NftAttribute, NftDirectory, NftItem, SolNftMetaData } from '../shared/models/NFTModels';
import { TitleCasePipe } from '@angular/common';
import { MD5 } from 'crypto-es/lib/md5.js';
import { SnackService } from '../core/services/snack/snack.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {

  layerRarityFormGroup: FormGroup;
  itemRarityFolderRarityFormGroup: FormGroup;
  generationLimitControl: FormControl = new FormControl(5, [Validators.min(1)])
  blockChain: FormControl = new FormControl('ethereum', [Validators.required])
  nftDirectory: NftDirectory;
  commonItemRarityFolders = [];
  currentNftImage = 1;
  layers: string[] = [];
  generating = false;
  constructor(private router: Router, private electron: ElectronService, private titlecasePipe: TitleCasePipe, private snack: SnackService, private ref: ChangeDetectorRef) { 
  }

  ngOnInit(): void {
    console.log('HomeComponent INIT');
  }


  loadNftFolderStructure(): void {
    if(this.nftDirectory){
      this.nftDirectory = null
      this.layers = []
    }
    this.selectInputFolder();
    let layers = this.electron.fs.readdirSync(this.nftDirectory.path);
    this.layerRarityFormGroup = new FormGroup({})
    layers.forEach((layerName: string, index: number) => {
      this.layers.push(layerName);
      this.layerRarityFormGroup.addControl(layerName, new FormControl(100))

      this.nftDirectory.layers.set(layerName, {name: layerName, itemRarityFolders: new Map, index: index})
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
            path: `${this.nftDirectory.path}/${layerName}/${itemRarityFolderName}/${itemName}`,
            layerName
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
      console.log('different folders found')
    }

    this.itemRarityFolderRarityFormGroup = new FormGroup({});
    this.commonItemRarityFolders.forEach(rarityFolder => {
      this.itemRarityFolderRarityFormGroup.addControl(rarityFolder, new FormControl(25))
    });
    // console.log(this.nftDirectory)
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




  
  async generateNfts() {
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


    if(!this.electron.fs.existsSync("output/")){
      this.electron.fs.mkdirSync("output/")
    }
    if(!this.electron.fs.existsSync("output/images")){
      this.electron.fs.mkdirSync("output/images")
    }

    if(!this.electron.fs.existsSync("output/metadata")){
      this.electron.fs.mkdirSync("output/metadata")
    }

    this.currentNftImage = 1
    let dupes = 0;
    let createdImageHashes = []
    this.generating = true;

    this.layerRarityFormGroup.disable()
    this.itemRarityFolderRarityFormGroup.disable()
    while(this.currentNftImage <= this.generationLimitControl.value){
      if(this.currentNftImage > this.generationLimitControl.value){
        this.snack.generalSnack('Generated image limit', 'Ok')
        this.generating = false;
        break;
      }
      let selectedNftFolderItems = this.selectNftItems();
      let orderedImageItemNames = selectedNftFolderItems.map((item) => item.path).toString();
      let nftImageHash = MD5(orderedImageItemNames).toString();
      const foundHash = createdImageHashes.find(e => e === nftImageHash)
      if(foundHash === undefined){
        await this.createNftImage(selectedNftFolderItems, this.currentNftImage);
        createdImageHashes.push(nftImageHash)
        this.currentNftImage++
        this.ref.detectChanges();
      } else {
        console.log('found already')
        if(dupes > 30000){
          this.snack.generalSnack('Too many duplicates stopping run', 'Ok')
          this.generating = false;
          break;
        }
        dupes++
      }
    }

    this.snack.generalSnack(`Completed generating ${this.currentNftImage-1} images`, 'Ok')
    this.generating = false;
    this.layerRarityFormGroup.enable()
    this.itemRarityFolderRarityFormGroup.enable()
  }



  async createNftImage(selectedNftFolderItems: NftItem[], i) {
    let orderedImageItemNames = selectedNftFolderItems.map((item) => item.name).toString();
    let nftImageHash = MD5(orderedImageItemNames).toString();
    console.log(nftImageHash);


    let attributes: NftAttribute[] = []
    const image = this.electron.fs.readFileSync(selectedNftFolderItems[0].path)
    var blob = new Blob([image], {type: 'image/png'});
    var url = URL.createObjectURL(blob);
    
    const im2g = await loadImage(url);
    const canvas = createCanvas(im2g.width, im2g.height);
    const ctx = canvas.getContext('2d');
    for (let i=0; i<selectedNftFolderItems.length; i++) {
      const image = this.electron.fs.readFileSync(selectedNftFolderItems[i].path)
      var blob = new Blob([image], {type: 'image/png'});
      var url = URL.createObjectURL(blob);
      const currentImage = await loadImage(url);
 
      ctx.drawImage(currentImage, 0, 0)
      attributes.push({
        trait_type: this.titlecasePipe.transform(selectedNftFolderItems[i].layerName.split('_').join(' ')),
        value: this.titlecasePipe.transform(selectedNftFolderItems[i].name.split('.')[0].split('_').join(' ')),
      })
    }

    const img = canvas.toDataURL();
    const data = img.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(data, "base64");
    this.electron.fs.writeFileSync(`output/images/${i}.png`, buf)

    let metadata: EthNftMetaData | SolNftMetaData;


    switch(this.blockChain.value){
      case 'ethereum': {
        metadata =  {
          name: `${i}`,
          description: `Image description ${i}`,
          image: "",
          attributes,
          hash: nftImageHash
        }
        break;
      }
      case 'solana': {
        metadata =  {
          name: `${i}`,
          description: `Image description ${i}`,
          image: "",
          attributes,
          properties: {
            hash: nftImageHash
          }
        }
        break;
      }
    }

    

    this.createMetadataFile(metadata)
     console.log(`Saved image ${i}.png`)
  }


  createMetadataFile(metadata: EthNftMetaData| SolNftMetaData){
    this.electron.fs.writeFileSync(`output/metadata/${metadata.name}.json`, JSON.stringify(metadata))
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
    // console.log(selectedLayers)
    selectedLayers.forEach(layer => {
      let raritySum = 0;
      for(let rarityFolder of Array.from(layer.itemRarityFolders.values())) {
        let roll = Math.random();
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

    this.layers.forEach((layer) => {
      if (roll <= this.nftDirectory.layers.get(layer).rarity || this.nftDirectory.layers.get(layer).rarity === 1){
        selectedLayers.push(this.nftDirectory.layers.get(layer));
      }
    })

    return selectedLayers;
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.layers, event.previousIndex, event.currentIndex);
  }
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