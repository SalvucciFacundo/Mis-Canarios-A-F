import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '../../../shared/services/loading.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UserLimitsService } from '../../../shared/services/user-limits.service';
import { BirdsStoreService } from '../../services/birds-store.service';
import { BirdsFormComponent } from '../../utils/birds-form.component';
@Component({
    selector: 'app-birds-edit',
    imports: [ReactiveFormsModule, CommonModule, BirdsFormComponent],
    templateUrl: './birds-edit.component.html',
    styleUrl: './birds-edit.component.css'
})
export class BirdsEditComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private store = inject(BirdsStoreService);
    private loadingService = inject(LoadingService);
    private toastService = inject(ToastService);
    private userLimitsService = inject(UserLimitsService);

    birdId = signal<string | null>(null);
    birdDataSignal = computed(() => {
        const id = this.birdId();
        if (!id) return null;
        const birdSignal = this.store.getCanarioSignalById(id);
        const bird = birdSignal();
        return bird;
    });

    ngOnInit() {
        // Obtener el ID del canario desde los parámetros de la ruta
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            this.birdId.set(id);
            if (id) {
                // Proteger edición según permisos
                this.userLimitsService.checkRecordAccess('bird', 1).subscribe(access => {
                    if (!access.editable) {
                        this.toastService.error('No tienes permiso para editar este canario con tu plan actual.');
                        this.router.navigate(['/birds/birds-list']);
                    }
                });
            }
        });
    }

    async actualizarBird(data: any) {
        const id = this.birdId();
        const email = this.store.userEmail();
        if (!id || !email) {
            console.error('Faltan datos para actualizar: ID o email');
            this.toastService.error('Error: faltan datos para actualizar el canario');
            return;
        }

        try {
            console.log('Actualizando canario:', { id, email, data });
            // Mostrar spinner solo para la operación de guardado
            await this.loadingService.showContentTransition('Guardando cambios...', 700);
            await this.store.actualizarCanario(email, id, data);
            console.log('Canario actualizado exitosamente');
            this.router.navigate(['/birds/birds-list']);
            this.loadingService.hidePageTransition();
        } catch (error) {
            console.error('Error al actualizar canario:', error);
            this.loadingService.hidePageTransition();
            // El toast de error ya se maneja en el store
        }
    }

    returnList() {
        // Navegación interna rápida, sin spinner
        this.router.navigate(['/birds/birds-list']);
    }
}
