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
import { MainButtonComponent } from './components/main-button/main-button.component';
import {MatRippleModule} from '@angular/material/core';
import {MatTreeModule} from '@angular/material/tree';
import { SideNavComponent } from './components/side-nav/side-nav.component';
import { FileViewerComponent } from './components/file-viewer/file-viewer.component';
import { MetadataEditorComponent } from './components/metadata-editor/metadata-editor.component';
import { TwoDigitDecimalNumberDirective } from './directives/two-digit-decimal-number/two-digit-decimal-number.directive';


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
  MatIconModule,
  MatRippleModule,
  MatTreeModule
]

const components = [
  PageNotFoundComponent, 
  WebviewDirective, 
  MainButtonComponent,
  SideNavComponent,
  FileViewerComponent,
  MetadataEditorComponent,
  TwoDigitDecimalNumberDirective
]


@NgModule({
  declarations: [...components],
  imports: [...modules],
  exports: [...modules, ...components],
  providers: [TitleCasePipe]
})
export class SharedModule {}
