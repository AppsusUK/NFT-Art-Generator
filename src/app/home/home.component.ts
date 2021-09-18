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

  inputFolder: string = null;
  layers: string[] = null;
  layerWeightsFormGroup: FormGroup;
  layerWeightsArray: FormArray = new FormArray([])

  constructor(private router: Router, private electron: ElectronService) { }

  ngOnInit(): void {
    console.log('HomeComponent INIT');

  }

  loadNftFolder(): void {
    this.selectInputFolder();
    this.layers = this.electron.fs.readdirSync(this.inputFolder);

    this.layers.forEach(() => {
      this.layerWeightsArray.push(new FormControl('', [Validators.required, Validators.min(0), Validators.max(100)]))
    })

    this.layerWeightsFormGroup = new FormGroup({
      layerWeights: this.layerWeightsArray
    })
  }

  selectInputFolder(): void {
    // TODO: Add validation/Exception handling
    this.inputFolder = this.electron.remote.dialog.showOpenDialogSync({
      properties: ["openDirectory"]
    })[0];
  }
  
  generateNfts() {


  }



}
/*
Root folder:



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