import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cliente, ClienteCreate, EstadoCliente } from '../../../core/models/client.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent implements OnInit {
  private clientService = inject(ClientService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  clients = signal<Cliente[]>([]);
  ejecutivos = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Filtros de Cartera
  carteraFilter = signal<'TODOS' | 'MI_CARTERA'>('TODOS');
  selectedEjecutivoFilter = '';
  searchQuery = '';
  selectedEstado = '';

  // Drawer y Modales
  activeDetailClient = signal<Cliente | null>(null);
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string | null>(null);
  selectedClientForEdit = signal<Cliente | null>(null);

  // Modal de Reasignación
  isReassignModalOpen = signal<boolean>(false);
  isReassigning = signal<boolean>(false);
  reassignError = signal<string | null>(null);
  reassignForm!: FormGroup;

  clientForm!: FormGroup;

  ngOnInit(): void {
    // Si el usuario es EJECUTIVO, por defecto mostrar Mi Cartera
    if (!this.authService.isAdmin()) {
      this.carteraFilter.set('MI_CARTERA');
    }

    this.initForms();
    this.loadClients();
    this.loadEjecutivos();
  }

  private initForms(): void {
    this.clientForm = this.fb.group({
      razon_social: ['', [Validators.required, Validators.minLength(3)]],
      rif_identificacion: ['', [Validators.required, Validators.pattern(/^[JjGgVvEePp]-?[0-9]{5,9}-?[0-9]?$/)]],
      contacto_principal: ['', [Validators.required]],
      telefono_whatsapp: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      direccion_ciudad: [''],
      ejecutivo_id: ['', [Validators.required]],
      estado: ['ACTIVO', [Validators.required]],
      notas: ['']
    });

    this.reassignForm = this.fb.group({
      nuevo_ejecutivo_id: ['', [Validators.required]],
      motivo: ['Transferencia de cuenta para gestión especializada', [Validators.required]]
    });
  }

  loadClients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const isMiCartera = this.carteraFilter() === 'MI_CARTERA';

    this.clientService.getClients({
      search: this.searchQuery || undefined,
      estado: this.selectedEstado || undefined,
      ejecutivo_id: !isMiCartera && this.selectedEjecutivoFilter ? this.selectedEjecutivoFilter : undefined,
      solo_mi_cartera: isMiCartera
    }).subscribe({
      next: (data) => {
        this.clients.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Error al cargar los clientes.');
        this.isLoading.set(false);
      }
    });
  }

  loadEjecutivos(): void {
    this.clientService.getEjecutivos().subscribe({
      next: (users) => {
        this.ejecutivos.set(users);
      },
      error: () => {
        // Silencioso o mantener vacío
      }
    });
  }

  setCarteraFilter(filter: 'TODOS' | 'MI_CARTERA'): void {
    this.carteraFilter.set(filter);
    if (filter === 'MI_CARTERA') {
      this.selectedEjecutivoFilter = '';
    }
    this.loadClients();
  }

  onFilterChange(): void {
    this.loadClients();
  }

  openCreateModal(): void {
    this.selectedClientForEdit.set(null);
    this.formError.set(null);
    const defaultEjecutivo = this.ejecutivos().length > 0
      ? (this.authService.currentUser()?.id || this.ejecutivos()[0].id)
      : '';

    this.clientForm.reset({
      estado: 'ACTIVO',
      ejecutivo_id: defaultEjecutivo
    });
    this.isModalOpen.set(true);
  }

  openEditModal(cliente: Cliente): void {
    this.selectedClientForEdit.set(cliente);
    this.formError.set(null);
    this.clientForm.patchValue({
      razon_social: cliente.razon_social,
      rif_identificacion: cliente.rif_identificacion,
      contacto_principal: cliente.contacto_principal,
      telefono_whatsapp: cliente.telefono_whatsapp,
      email: cliente.email,
      direccion_ciudad: cliente.direccion_ciudad || '',
      ejecutivo_id: cliente.ejecutivo_id,
      estado: cliente.estado,
      notas: cliente.notas || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedClientForEdit.set(null);
    this.formError.set(null);
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    const formValue = this.clientForm.value;
    const clientData: ClienteCreate = {
      razon_social: formValue.razon_social,
      rif_identificacion: formValue.rif_identificacion,
      contacto_principal: formValue.contacto_principal,
      telefono_whatsapp: formValue.telefono_whatsapp,
      email: formValue.email,
      direccion_ciudad: formValue.direccion_ciudad || null,
      ejecutivo_id: formValue.ejecutivo_id,
      estado: formValue.estado as EstadoCliente,
      notas: formValue.notas || null
    };

    const currentEdit = this.selectedClientForEdit();

    if (currentEdit) {
      this.clientService.updateClient(currentEdit.id, clientData).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadClients();
          if (this.activeDetailClient()?.id === updated.id) {
            this.activeDetailClient.set(updated);
          }
        },
        error: (err) => {
          this.formError.set(err?.error?.detail || 'Error al actualizar el cliente.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.clientService.createClient(clientData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadClients();
        },
        error: (err) => {
          this.formError.set(err?.error?.detail || 'Error al registrar el cliente.');
          this.isSaving.set(false);
        }
      });
    }
  }

  openReassignModal(cliente: Cliente): void {
    this.activeDetailClient.set(cliente);
    this.reassignError.set(null);
    this.reassignForm.reset({
      nuevo_ejecutivo_id: '',
      motivo: 'Transferencia de cuenta para balance de cartera y atención prioritaria'
    });
    this.isReassignModalOpen.set(true);
  }

  closeReassignModal(): void {
    this.isReassignModalOpen.set(false);
    this.reassignError.set(null);
  }

  submitReassignment(): void {
    if (this.reassignForm.invalid || !this.activeDetailClient()) {
      this.reassignForm.markAllAsTouched();
      return;
    }

    this.isReassigning.set(true);
    this.reassignError.set(null);

    const clienteId = this.activeDetailClient()!.id;
    const { nuevo_ejecutivo_id, motivo } = this.reassignForm.value;

    this.clientService.reassignClient(clienteId, { nuevo_ejecutivo_id, motivo }).subscribe({
      next: (updated) => {
        this.isReassigning.set(false);
        this.activeDetailClient.set(updated);
        this.closeReassignModal();
        this.loadClients();
      },
      error: (err) => {
        this.reassignError.set(err?.error?.detail || 'Error al reasignar el cliente.');
        this.isReassigning.set(false);
      }
    });
  }

  openDetailDrawer(cliente: Cliente): void {
    this.activeDetailClient.set(cliente);
  }

  closeDetailDrawer(): void {
    this.activeDetailClient.set(null);
  }

  cleanPhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }
}
