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
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatIconModule} from '@angular/material/icon';

const modules = [
  CommonModule,
  TranslateModule, 
  FormsModule, 
  FlexLayoutModule,
  ReactiveFormsModule,
  DragDropModule,
  MatFormFieldModule,
  MatInputModule,
  MatSnackBarModule,
  MatButtonModule,
  MatSelectModule,
  MatProgressBarModule,
  MatTooltipModule,
  MatIconModule
]


@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [...modules],
  exports: [...modules],
  providers: [TitleCasePipe]
})
export class SharedModule {}
