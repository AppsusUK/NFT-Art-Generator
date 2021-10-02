import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NftDirectory } from '../../models/NFTModels';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {
  @Input() isExpanded: any = false;
  @Output() onToggleClick = new EventEmitter()
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

  expandedFiles: boolean = true
  expandedMetadata: boolean = true


  constructor() { }

  ngOnInit(): void {
  }

  toggleFiles(){
    this.expandedFiles = !this.expandedFiles
  }

  toggleMetadata(){
    this.expandedMetadata = !this.expandedMetadata
  }

  toggleClicked() {
    this.onToggleClick.emit(!this.isExpanded);
  }

}
