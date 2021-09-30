import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MetadataEditorComponent } from './metadata-editor.component';

describe('MetadataEditorComponent', () => {
  let component: MetadataEditorComponent;
  let fixture: ComponentFixture<MetadataEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MetadataEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MetadataEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
