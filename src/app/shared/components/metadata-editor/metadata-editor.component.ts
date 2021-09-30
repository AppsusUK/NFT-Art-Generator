import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-metadata-editor',
  templateUrl: './metadata-editor.component.html',
  styleUrls: ['./metadata-editor.component.scss']
})
export class MetadataEditorComponent implements OnInit {
  @Input() blockChain: FormControl
  @Input() nftBaseName: FormControl
  @Input() nftDescription: FormControl
  @Input() creatorAddress: FormControl
  @Input() royaltiesFee: FormControl
  @Input() collectionName: FormControl
  @Input() solanaSymbol: FormControl

  constructor() { }

  ngOnInit(): void {
  }

}
