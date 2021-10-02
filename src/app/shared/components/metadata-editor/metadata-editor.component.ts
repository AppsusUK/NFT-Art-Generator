import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ElectronService } from '../../../core/services/electron/electron.service';
import { SnackService } from '../../../core/services/snack/snack.service';
import { EthNftMetaData, NftDirectory, SolNftMetaData } from '../../models/NFTModels';

@Component({
  selector: 'app-metadata-editor',
  templateUrl: './metadata-editor.component.html',
  styleUrls: ['./metadata-editor.component.scss']
})
export class MetadataEditorComponent implements OnInit {
  @Input() nftDirectory: NftDirectory;
  @Input() blockChain: FormControl
  @Input() nftBaseName: FormControl
  @Input() nftDescription: FormControl
  @Input() creatorAddress: FormControl
  @Input() royaltiesFee: FormControl
  @Input() collectionName: FormControl
  @Input() solanaSymbol: FormControl
  @Input() cardanoPolicyId: FormControl
  @Input() baseImageAddress: FormControl

  constructor(private electron: ElectronService, private snack: SnackService) { }

  ngOnInit(): void {
  }

  updateImageMetadata(){
    let selectedDirectory = this.electron.remote.dialog.showOpenDialogSync({
      properties: ["openDirectory"]
    });

    if(!selectedDirectory){
      return;
    }

    let metadataFiles = this.electron.fs.readdirSync(selectedDirectory[0], { withFileTypes: true })
    .filter(entry => entry.isFile)
    .filter(entry => !!entry.name.match(/.*(json)$/i))
    .map(entry => entry.name);
    if(metadataFiles.length <= 0){
      this.snack.generalSnack("No existing metadata found in folder", "Ok")
      return;
    }
    if(this.blockChain.value !== 'cardano'){

      metadataFiles.forEach((file) => {
        const jsonFile = this.electron.fs.readFileSync(selectedDirectory[0] + '/' + file)
        const data: EthNftMetaData | SolNftMetaData = JSON.parse(jsonFile.toString())
        data.image = this.baseImageAddress.value ? `${this.baseImageAddress.value}/${file.split('.')[0]}.png` : ""
        this.electron.fs.writeFileSync(`${selectedDirectory[0]}/${file}`, JSON.stringify(data))
      })

    } else {
      if(metadataFiles.length > 1) {
        this.snack.generalSnack("Make sure cardano metadata json is only file in selected folder", "Ok")
      }

      const jsonFile = this.electron.fs.readFileSync(selectedDirectory[0] + '/' + metadataFiles[0])
      const data = JSON.parse(jsonFile.toString())
      const policyId = Object.keys(data[721])[0]

      Object.values(data[721][policyId]).forEach(value => {
        value['image'] = this.baseImageAddress.value ? `${this.baseImageAddress.value}/${value['id']}.png` : ""
      })
      this.electron.fs.writeFileSync(`${selectedDirectory[0]}/cardano-metadata.json`, JSON.stringify(data))
    }

    this.snack.generalSnack("Metadata updated successfully", "Ok")

  }

}
