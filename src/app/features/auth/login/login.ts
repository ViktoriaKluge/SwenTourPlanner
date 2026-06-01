import { Component, inject, signal } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";

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
    error = '';
    registerMode = false;
    readonly busy = signal(false);

    constructor(private builder: FormBuilder) {
        this.loginForm = this.builder.group({
            username: ['', [Validators.required, Validators.minLength(2)]],
            password: ['', Validators.required]
        });
    }

    async login(): Promise<void> {
        if (this.loginForm.valid && !this.busy()) {
            const name = this.loginForm.get('username')?.value;
            const password = this.loginForm.get('password')?.value;
            this.error = '';
            this.busy.set(true);
            try {
                if (this.registerMode) {
                    await this.auth.register(name, password);
                } else {
                    await this.auth.login(name, password);
                }
            } catch (err: any) {
                const backendOffline = err?.status === 0 || err?.status === 500;
                if (backendOffline) {
                    this.error = 'Backend nicht erreichbar. Starte zuerst die Spring-Boot-App in IntelliJ.';
                    return;
                }
                this.error = this.registerMode
                    ? 'Registrierung fehlgeschlagen. Username ist eventuell bereits vergeben.'
                    : 'Login fehlgeschlagen. Bitte Username und Passwort prüfen.';
            } finally {
                this.busy.set(false);
            }
        }
    }

    toggleMode(): void {
        if (this.busy()) return;
        this.registerMode = !this.registerMode;
        this.error = '';
    }
}
