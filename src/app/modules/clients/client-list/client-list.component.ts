import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
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
  private fb = inject(FormBuilder);

  clients = signal<Cliente[]>([]);
  ejecutivos = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Filtros
  searchQuery = '';
  selectedEstado = '';

  // Drawer y Modales
  activeDetailClient = signal<Cliente | null>(null);
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string | null>(null);
  selectedClientForEdit = signal<Cliente | null>(null);

  clientForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    this.loadEjecutivos();
  }

  private initForm(): void {
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
  }

  loadClients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.clientService.getClients({
      search: this.searchQuery,
      estado: this.selectedEstado || undefined
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
        // En caso de que no tenga permisos o falle, se mantiene lista vacía
      }
    });
  }

  onFilterChange(): void {
    this.loadClients();
  }

  openCreateModal(): void {
    this.selectedClientForEdit.set(null);
    this.formError.set(null);
    this.clientForm.reset({
      estado: 'ACTIVO',
      ejecutivo_id: this.ejecutivos().length > 0 ? this.ejecutivos()[0].id : ''
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
