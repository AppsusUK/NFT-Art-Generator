import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import {DragDropModule} from '@angular/cdk/drag-drop'; 

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


import {MatFormFieldModule} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

const modules = [
  CommonModule,
  TranslateModule, 
  FormsModule, 
  FlexLayoutModule,
  ReactiveFormsModule,
  DragDropModule,
  MatFormFieldModule,
  MatInputModule
]


@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [...modules],
  exports: [...modules],
  providers: [TitleCasePipe]
})
export class SharedModule {}
