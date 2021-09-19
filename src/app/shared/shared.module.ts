import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {DragDropModule} from '@angular/cdk/drag-drop'; 

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SortPipe } from './pipes/sort/sort.pipe';


const modules = [
  CommonModule,
  TranslateModule, 
  FormsModule, 
  FlexLayoutModule,
  ReactiveFormsModule,
  DragDropModule
]


@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective, SortPipe],
  imports: [...modules],
  exports: [...modules]
})
export class SharedModule {}
