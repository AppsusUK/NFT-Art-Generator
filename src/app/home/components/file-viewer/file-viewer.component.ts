import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, Input, OnInit } from '@angular/core';
import { FolderNode, NftDirectory } from '../../../shared/models/NFTModels';


interface BigDir {
  name: string;
  children?: BigDir[]
  path?: string;
}

@Component({
  selector: 'app-file-viewer',
  templateUrl: './file-viewer.component.html',
  styleUrls: ['./file-viewer.component.scss']
})

export class FileViewerComponent implements OnInit {
  @Input() nftDirectory: NftDirectory;
  treeControl = new NestedTreeControl<BigDir>(node => node.children);
  data: BigDir[] = [];
  constructor() { }

  ngOnInit(): void {
    Array.from(this.nftDirectory.layers.values()).forEach( (layer, i) => {
      let obj = {name: layer.name, children: [] }

      Array.from(layer.itemRarityFolders.values()).forEach( (rarityFolder, ri) => {
        obj.children.push({name: rarityFolder.name, children: []})

        Array.from(rarityFolder.items.values()).forEach( (file, ii) => {
          obj.children[ri].children.push({name: file.name, path: file.path})
        })

      })
      this.data.push(obj)
    })
  }

  hasChild = (_: number, node: BigDir) => !!node.children && node.children.length > 0;

}
