import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ElectronService } from '../core/services/electron/electron.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  layerWeightsFormGroup: FormGroup;
  layerWeightsArray: FormArray = new FormArray([])
  nftDirectory: NftDirectory;
  generationLimit: number;

  constructor(private router: Router, private electron: ElectronService) { }

  ngOnInit(): void {
    console.log('HomeComponent INIT');

  }


  loadNftFolder(): void {
    this.selectInputFolder();
    let layers = this.electron.fs.readdirSync(this.nftDirectory.path);
    layers.forEach((layerName) => {
      this.layerWeightsArray.push(new FormControl('', [Validators.required, Validators.min(0), Validators.max(100)]))
      this.nftDirectory.layers.set(layerName, {name: layerName, itemRarityFolders: new Map})
      //TODO Handle case of differing number of rarity folders/values
      let itemRarityFolders = this.electron.fs.readdirSync(this.nftDirectory.path + "/" + layerName, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);

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

    this.layerWeightsFormGroup = new FormGroup({
      layerWeights: this.layerWeightsArray
    })





    console.log(this.nftDirectory)
    console.log(Math.random())
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
    this.nftDirectory.layers.forEach((layer, index) => {
      console.log(index)
      console.log(this.layerWeightsFormGroup.controls.layerWeights.value)
      this.nftDirectory.layers.get(layer.name).rarity = this.layerWeightsFormGroup.controls.layerWeights.value[index]
    })
    console.log(this.nftDirectory)
    //let selectNftItems = this.selectNftItems();

    //3 create and save nft images + metadata
  }
  selectNftItems() {
     /*TODO Take into account:
     1 - duplicates
     2 - z-index's
     3 - no image in folders
     */
     for(let i = 0; i < this.generationLimit; i++) {
      let selectedLayers = this.selectLayers();
      let selectedNftFolderItems = this.selectNftFolderItems(selectedLayers);
    }  
    throw new Error('Method not implemented.');
  }
  
  selectNftFolderItems(selectedLayers: Layer[]) {
    let selectedItems = [];
    selectedLayers.forEach(layer => {
      let raritySum = 0;
      let roll = Math.random();
      layer.itemRarityFolders.forEach((rarityFolder) => {
        raritySum += rarityFolder.rarity;
        if(roll <= raritySum) {
          let randomItem = rarityFolder.items.values[Math.floor(Math.random()*rarityFolder.items.values.length)];
          selectedItems.push(randomItem)
          return;
        }
      })
    });
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
Root folder:

c                                              l                                                 r

random.choice(, layers.length, array of probabilities)
                      ,             , .2,.6,.2
*/




/*
1 - User will fill in input information
2 - Press "Generate"
3 - Inputs sent to generation function


*/


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