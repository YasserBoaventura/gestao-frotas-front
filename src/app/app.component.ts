import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


// Angular Material modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormGroup, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { MatCommonModule } from '@angular/material/core';
import { VeiculosComponent } from './components/Veiculos/veiculos/veiculos.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'; // ← IMPORTE ESTE
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
// Seu componente de login
//import { LoginComponent } from './components/login/login.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatIconModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatCardModule,
    ReactiveFormsModule,    MatCommonModule,               MdbModalModule,   ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'gestao-frotas';
}
