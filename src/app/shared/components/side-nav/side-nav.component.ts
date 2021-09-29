import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {
  @Input() isExpanded: any = false;
  @Output() onToggleClick = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
  }

  toggleNav(){

  }

  toggleClicked() {
    this.onToggleClick.emit(!this.isExpanded);
  }



}
