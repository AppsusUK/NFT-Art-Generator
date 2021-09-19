import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SnackService {
  constructor(private snackBar: MatSnackBar, private router: Router) {}


  generalSnack(message: string, action: string){
    return this.snackBar.open(message, action,{
      duration: 5000,
      panelClass: "success-dialog"
    })
  }

}