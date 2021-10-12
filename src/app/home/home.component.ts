import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '../core/services/electron/electron.service';
import * as _ from "lodash";
import { Canvas, createCanvas, loadImage } from 'canvas';
import {
  CardanoMetadata,
  CardanoNFTData,
  CardanoProperties,
  EthNftMetaData,
  ItemRarityFolder,
  Layer,
  NftAttribute,
  NftDirectory,
  NftItem,
  SolMetaplexNftMetaData,
  SolNftMetaData
} from '../shared/models/NFTModels';
import { TitleCasePipe } from '@angular/common';
import { MD5 } from 'crypto-es/lib/md5.js';
import { SnackService } from '../core/services/snack/snack.service';

/*
Spaghetti recipes from authentically Italian to quick and easy dinners.

One of the most popular types of pasta, spaghetti is made from durum wheat and comes in medium-thin strands.
It originated in Naples and is found all over the world, with each Italian region boasting its own signature spaghetti dish.
Although artisanal brands may be made by hand using traditional methods, commercial varieties are produced using state-of-the-art pasta machines.
*/
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  isNavExpanded: boolean = false;
  layerRarityFormGroup: FormGroup;
  itemRarityFolderRarityFormGroup: FormGroup;
  generationLimitControl: FormControl = new FormControl(5, [Validators.min(1)])
  nftDirectory: NftDirectory;
  commonItemRarityFolders = [];
  currentNftImage = 1;
  layers: string[] = [];
  generating = false;
  randomImageUrl: string;

  // Metadata forms
  blockChain: FormControl = new FormControl('ethereum', [Validators.required])
  NftBaseName: FormControl = new FormControl('', [Validators.maxLength(100)])
  nftDescription: FormControl = new FormControl('{name} - Generated by Appsus NFT Art Generator.', [])
  creatorAddress: FormControl = new FormControl('', [Validators.maxLength(50)])
  royaltiesFee: FormControl = new FormControl(2.5, [Validators.min(0),Validators.max(100)])
  baseImageAddress: FormControl = new FormControl('', [])

  // Solana metadata
  solanaSymbol: FormControl = new FormControl('', [Validators.maxLength(10)])
  collectionName: FormControl = new FormControl('', [Validators.maxLength(100)])

  // Cardano metadata
  cardanoPolicyId: FormControl = new FormControl('', [])
  cardanoMatadata: CardanoMetadata = {
    "721": {}
  }

  constructor(private router: Router, private electron: ElectronService, private titlecasePipe: TitleCasePipe, private snack: SnackService, private ref: ChangeDetectorRef) {
  }

  ngOnInit(): void {

  }

  loadNftFolderStructure(): void {
    if(this.nftDirectory){
      this.nftDirectory = null
      this.layers = []
      this.ref.detectChanges()
    }
    if(!this.selectInputFolder()) {
      return;
    }
    let layers = this.electron.fs.readdirSync(this.nftDirectory.path, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);;
    this.layerRarityFormGroup = new FormGroup({})
    layers.forEach((layerName: string, index: number) => {
      this.layers.push(layerName);
      this.layerRarityFormGroup.addControl(layerName, new FormControl(100))

      this.nftDirectory.layers.set(layerName, {name: layerName, itemRarityFolders: new Map, index: index})

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
        .filter(entry => !!entry.name.match(/.*(gif|jpe?g|tiff?|png|webp|bmp)$/i))
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
    let bigRarityArray: string[][] = []
    let uniqueFolderNamesSet = new Set;

    this.nftDirectory.layers.forEach((layer) => {
      bigRarityArray.push(Array.from(layer.itemRarityFolders.keys()))
      layer.itemRarityFolders.forEach((rarityFolder) => {
        uniqueFolderNamesSet.add(rarityFolder.name);
      })
    })

    this.commonItemRarityFolders = _.intersection(...bigRarityArray);

    if(Array.from(uniqueFolderNamesSet.values()).toString() !== this.commonItemRarityFolders.toString()){
      this.snack.generalSnack('Layer folder children are not the same, extra folders found. Make sure rarity folder names are the same.', 'Ok')
      throw Error("Rarity folder structure not uniform")
    }

    this.itemRarityFolderRarityFormGroup = new FormGroup({});
    this.commonItemRarityFolders.forEach(rarityFolder => {
      this.itemRarityFolderRarityFormGroup.addControl(rarityFolder, new FormControl(parseInt((100/uniqueFolderNamesSet.size).toFixed(2))))
    });
    this.setNftFolderRarities();
    this.populateRandomImage();
  }

  selectInputFolder(): boolean {
    let selectedDirectory = this.electron.remote.dialog.showOpenDialogSync({
      properties: ["openDirectory"]
    });

    if (selectedDirectory) {
      this.nftDirectory = {
        "path": selectedDirectory[0],
        "layers": new Map
      };
      return true
    }
    return false;
  }

  stopGeneration() {
    this.generating = false;
  }

  async generateNfts() {
    if(!this.validateNftFolderRarities()){
      return;
    }
    this.setNftFolderRarities();
    this.setNFTImageOutputFolders();
    if(this.blockChain.value === 'cardano'){
      this.cardanoMatadata["721"] = {
        [this.cardanoPolicyId.value]: {}
      }
    }

    if(!await this.enterImageCreationLoop()) {
      return;
    }
    if(this.blockChain.value === "cardano") {
      this.electron.fs.writeFileSync(`${this.nftDirectory.path}/../output/metadata/cardano-metadata.json`, JSON.stringify(this.cardanoMatadata))
    }

    this.snack.generalSnack(`Completed generating ${this.currentNftImage-1} images`, 'Ok')
    this.currentNftImage = 1
    this.generating = false;
    this.setFormInteractability(true);
  }

  async enterImageCreationLoop(): Promise<boolean> {
    if(!this.validateGenerationLimit()) {
      return false;
    }

    this.setFormInteractability(false);

    //TODO fix UI hang when main thread intensively in this loop - delegate to web worker
    this.currentNftImage = 1
    this.generating = true;
    let createdImageHashesSet = new Set<string>();
    while(this.currentNftImage <= this.generationLimitControl.value && this.generating) {
      if(this.currentNftImage > this.generationLimitControl.value){
        this.snack.generalSnack('Completed image generation!', 'Ok')
        this.generating = false;
        break;
      }

      let selectedNftFolderItems = this.selectNftItems();
      let currentImageHash = this.getNFTImageItemsHash(selectedNftFolderItems);

      if(!createdImageHashesSet.has(currentImageHash)){
        let tmpCurrentNftImage = this.currentNftImage;
        if (this.blockChain.value === 'solana-metaplex') {
          tmpCurrentNftImage -= 1;
        }
        await this.createNftImage(selectedNftFolderItems, tmpCurrentNftImage);
        createdImageHashesSet.add(currentImageHash);
        this.currentNftImage++
        this.ref.detectChanges();
      }
    }
    return true;
  }



  setFormInteractability(isInteractable: boolean) {
    if (isInteractable) {
      this.layerRarityFormGroup.enable()
      this.itemRarityFolderRarityFormGroup.enable()
      this.generationLimitControl.enable()
      this.blockChain.enable()
      this.NftBaseName.enable()
      this.nftDescription.enable()
      this.creatorAddress.enable()
      this.royaltiesFee.enable()
    } else {
      this.layerRarityFormGroup.disable()
      this.itemRarityFolderRarityFormGroup.disable()
      this.generationLimitControl.disable()
      this.blockChain.disable()
      this.NftBaseName.disable()
      this.nftDescription.disable()
      this.creatorAddress.disable()
      this.royaltiesFee.disable()
    }
  }

  validateGenerationLimit(): boolean {
    const maxLimit = this.getMaxImageCombinations()
    if (this.generationLimitControl.value > maxLimit) {
      this.snack.generalSnack(`Cannot create ${this.generationLimitControl.value} images, maximum value is ${maxLimit}`, 'Ok')
      return false;
    }
    return true;
  }

  setNFTImageOutputFolders() {
    if(!this.electron.fs.existsSync(`${this.nftDirectory.path}/../output/`)){
      this.electron.fs.mkdirSync(`${this.nftDirectory.path}/../output/`)
    }
    if(!this.electron.fs.existsSync(`${this.nftDirectory.path}/../output/images`)){
      this.electron.fs.mkdirSync(`${this.nftDirectory.path}/../output/images`)
    }

    if(!this.electron.fs.existsSync(`${this.nftDirectory.path}/../output/metadata`)){
      this.electron.fs.mkdirSync(`${this.nftDirectory.path}/../output/metadata`)
    }
  }

  getNFTImageItemsHash(selectedNftFolderItems: NftItem[]) {
    if(selectedNftFolderItems.length === 0) {
      return undefined;
    }

    let orderedImageItemNames = selectedNftFolderItems.map((item) => item.path).toString();
    return MD5(orderedImageItemNames).toString();
  }

  getMaxImageCombinations() {
    let itemsInLayers = [];
    this.nftDirectory.layers.forEach((layer) => {
      if (layer.rarity > 0) {
        // If the layer isn't guaranteed to be picked, no item being picked it also a valid combination (empty layer is an additional state)
        let itemsInLayer = layer.rarity == 1 ? 0 : 1;
        layer.itemRarityFolders.forEach((rarityFolder) => {
          if (rarityFolder.rarity > 0) {
            itemsInLayer += rarityFolder.items.size;
          }
        })
        itemsInLayers.push(itemsInLayer);
      }
    })
    return itemsInLayers.reduce((total, num) => total * num);
  }

  validateNftFolderRarities(): boolean {
    const rarityValues: number[] = Object.values(this.itemRarityFolderRarityFormGroup.value);
    const raritySum = rarityValues.reduce((total: number, curr: number) => total + curr);

    if(raritySum != 100) {
      this.snack.generalSnack(`Sum of rarity folders does not equal 100%. Please adjust rarity folder values. Sum: ${raritySum}%`, 'Ok')
      return false;
    }
    return true;
  }

  setNftFolderRarities(): boolean {
    this.nftDirectory.layers.forEach((layer:Layer, layerName: string) => {
      this.nftDirectory.layers.get(layer.name).rarity = this.layerRarityFormGroup.controls[layerName].value/100
      layer.itemRarityFolders.forEach((rarityFolder: ItemRarityFolder, rarityFolderName: string ) => {
        this.nftDirectory.layers.get(layer.name).itemRarityFolders.get(rarityFolderName).rarity = this.itemRarityFolderRarityFormGroup.controls[rarityFolderName].value/100
      });
    })
    return true;
  }


  async loadNFtItemsToCanvas(selectedNftItems: NftItem[]): Promise<Canvas> {
    if (selectedNftItems.length === 0) {
      const canvas = createCanvas(50, 50);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(canvas,0,0)
      return canvas;
    }
    const image = this.electron.fs.readFileSync(selectedNftItems[0].path)
    var blob = new Blob([image], {type: 'image/png'});
    var url = URL.createObjectURL(blob);

    const im2g = await loadImage(url);
    const canvas = createCanvas(im2g.width, im2g.height);
    const ctx = canvas.getContext('2d');

    for (let i=0; i<selectedNftItems.length; i++) {
      const image = this.electron.fs.readFileSync(selectedNftItems[i].path)
      var blob = new Blob([image], {type: 'image/png'});
      var url = URL.createObjectURL(blob);
      const currentImage = await loadImage(url);
      ctx.drawImage(currentImage, 0, 0)
    }

    return canvas;
  }

  async populateRandomImage() {
    const canvas = await this.loadNFtItemsToCanvas(this.selectNftItems());

    this.randomImageUrl = canvas.toDataURL();
    this.ref.detectChanges();
  }

  async createNftImage(selectedNftFolderItems: NftItem[], fileName) {
    const canvas = await this.loadNFtItemsToCanvas(selectedNftFolderItems);
    this.writeImageToOutput(canvas, fileName);
    this.createMetadataFile(selectedNftFolderItems, fileName)
  }

  writeImageToOutput(canvas: Canvas, fileName: string): void {
    const img = canvas.toDataURL();
    //TODO - Consider toggling this off? May slow down the generation process if have to rerender UI every time
    this.randomImageUrl = img;
    const data = img.replace(/^data:image\/\w+;base64,/, "");
    const buf = Buffer.from(data, "base64");
    this.electron.fs.writeFileSync(`${this.nftDirectory.path}/../output/images/${fileName}.png`, buf)
  }

  createMetadataFile(selectedNftFolderItems: NftItem[], fileName: string){

    let attributes: NftAttribute[] = []
    let cardanoPropertties: CardanoProperties = {};

    if(this.blockChain.value === "cardano") {
      selectedNftFolderItems.forEach((item) => {
        cardanoPropertties[item.layerName] = this.titlecasePipe.transform(item.name.split('.')[0].split('_').join(' '))
      });
    } else {
      selectedNftFolderItems.forEach((item) => {
        attributes.push({
          trait_type: this.titlecasePipe.transform(item.layerName.split('_').join(' ')),
          value: this.titlecasePipe.transform(item.name.split('.')[0].split('_').join(' ')),
        })
      });
    }


    let metadata: EthNftMetaData | SolNftMetaData | CardanoNFTData | SolMetaplexNftMetaData;
    const description = this.nftDescription.value.replaceAll('{name}', `${this.NftBaseName.value + fileName}`)
    switch(this.blockChain.value){
      case 'ethereum': {
        metadata =  {
          name: `${this.NftBaseName.value + fileName}`,
          description,
          fee_recipient: this.creatorAddress.value,
          seller_fee_basis_points: parseFloat(this.royaltiesFee.value)*100,
          image: "",
          external_url: "",
          attributes,
          hash: this.getNFTImageItemsHash(selectedNftFolderItems)
        }
        break;
      }
      case 'solana': {
        metadata =  {
          name: `${this.NftBaseName.value + fileName}`,
          symbol: this.solanaSymbol.value,
          description,
          seller_fee_basis_points: parseFloat(this.royaltiesFee.value)*100,
          creators: [
            {
              address: this.creatorAddress.value,
              share: 100
            }
          ],
          image: "",
          category: "image",
          external_url: "",
          attributes,
          collection: {
            name: this.collectionName.value,
            family: "Appsus NFT Art Generator",
          },
          properties: {
            hash: this.getNFTImageItemsHash(selectedNftFolderItems)
          }
        }
        break;
      }
      case 'solana-metaplex': {
        metadata =  {
          name: `${this.NftBaseName.value + fileName}`,
          symbol: this.solanaSymbol.value,
          description,
          seller_fee_basis_points: parseFloat(this.royaltiesFee.value)*100,
          image: `${fileName}.png`,
          category: "image",
          external_url: "",
          attributes,
          collection: {
            name: this.collectionName.value,
            family: "Appsus NFT Art Generator",
          },
          properties: {
            creators: [
              {
                address: this.creatorAddress.value,
                share: 100
              }
            ],
          }
        }
        break;
      }
      case 'cardano': {
        this.cardanoMatadata[721][this.cardanoPolicyId.value]["nft"+fileName] = {
          id: parseInt(fileName),
          name: `${this.NftBaseName.value + fileName}`,
          description,
          image: "",
          properties: cardanoPropertties
        }
        break;
      }
    }
    if(this.blockChain.value !== 'cardano'){
      this.electron.fs.writeFileSync(`${this.nftDirectory.path}/../output/metadata/${fileName}.json`, JSON.stringify(metadata))
    }
  }




  selectNftItems(): NftItem[] {
      let selectedLayers = this.selectLayers();
      return this.selectNftFolderItems(selectedLayers);
  }

  selectNftFolderItems(selectedLayers: Layer[]): NftItem[] {
    let selectedItems = [];
    selectedLayers.forEach(layer => {
      let raritySum = 0;
      let roll = Math.random();
      for(let rarityFolder of Array.from(layer.itemRarityFolders.values())) {
        raritySum += rarityFolder.rarity;
        if(roll <= raritySum) {
          let randomItem = Array.from(rarityFolder.items.values())[Math.floor(Math.random()*rarityFolder.items.size)];
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
    let selectedLayers = [];

    this.layers.forEach((layer) => {
      let roll = Math.random();
      if (roll <= this.nftDirectory.layers.get(layer).rarity || this.nftDirectory.layers.get(layer).rarity === 1){
        selectedLayers.push(this.nftDirectory.layers.get(layer));
      }
    })

    return selectedLayers;
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.layers, event.previousIndex, event.currentIndex);
  }


  toggleNav(){
    this.isNavExpanded = !this.isNavExpanded
  }

  externalToggleNav(event){
    this.isNavExpanded = event
  }

}
