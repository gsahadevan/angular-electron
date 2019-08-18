import { Component, OnInit } from '@angular/core';
import { ipcRenderer } from 'electron';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  show() {
    let fileLocation = (<HTMLInputElement>document.getElementById('directoryLocation')).files[0].path;
    ipcRenderer.send('file-location-read', fileLocation);
  }

}
