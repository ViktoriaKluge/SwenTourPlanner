import { Component, inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { FormBuilder, FormGroup, ReactiveFormsModule } from "@angular/forms";

@Component ({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './login.html',
    styleUrls: ['../../../app.css', './login.css'],
})

export class LoginComponent {
    private readonly auth = inject(AuthService);
    loginForm: FormGroup;

    constructor(private builder: FormBuilder) {
        this.loginForm = this.builder.group({
            username: [''],
            password: ['']
        });
    }

    login(): void {
        console.log('Login wurde aufgerufen!');
        if (this.loginForm.valid) {
            const name = this.loginForm.get('username')?.value;
            this.auth.login(name);
        }
    }
}
