import { Component, inject } from "@angular/core";
import { AppStateService } from "../app-state";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";

@Component ({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './login.html',
    styleUrls: ['./../app.css','./login.css'],
})

export class LoginComponent {
    public state = inject(AppStateService);
    private router = inject(Router)
    loginForm: FormGroup;

    constructor(private builder: FormBuilder) {
        this.loginForm = this.builder.group({
            username: [''],
            password: ['']
        });
    }
    
    login(): void{
        console.log('Login wurde aufgerufen!');
        if (this.loginForm.valid) {
            let name = this.loginForm.get('username')?.value;
            this.state.activeSession.set({
                loggedIn: true,
                username: name,
                sections:['home']
            });
            console.log('Logged in:', this.state.activeSession());
        }
    }
}