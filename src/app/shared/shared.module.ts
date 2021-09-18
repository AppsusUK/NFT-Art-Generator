import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


const modules = [
  CommonModule,
  TranslateModule, 
  FormsModule, 
  FlexLayoutModule,
  ReactiveFormsModule
]


@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [...modules],
  exports: [...modules]
})
export class SharedModule {}
