import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ServiceContractsService } from '../../../core/services/service-contracts.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Servicio,
  ServicioCreate,
  TipoServicio,
  ModalidadServicio,
  EstadoOperativoServicio,
} from '../../../core/models/service.model';
import { Cliente } from '../../../core/models/client.model';

@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.scss']
})
export class ServiceListComponent implements OnInit {
  private serviceContracts = inject(ServiceContractsService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  services = signal<Servicio[]>([]);
  clientes = signal<Cliente[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Filtros
  selectedModalidad: ModalidadServicio | 'TODOS' = 'TODOS';
  selectedEstado: string = '';
  searchQuery: string = '';

  // Modales
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string | null>(null);
  selectedServiceForEdit = signal<Servicio | null>(null);

  // Modal de Estado
  isStatusModalOpen = signal<boolean>(false);
  isUpdatingStatus = signal<boolean>(false);
  statusError = signal<string | null>(null);
  activeService = signal<Servicio | null>(null);

  serviceForm!: FormGroup;
  statusForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadServices();
    this.loadClientes();
  }

  private initForms(): void {
    const todayStr = new Date().toISOString().substring(0, 10);

    this.serviceForm = this.fb.group({
      cliente_id: ['', [Validators.required]],
      tipo: ['SOFTWARE_MEDIDA', [Validators.required]],
      nombre_servicio: ['', [Validators.required, Validators.minLength(3)]],
      modalidad: ['PROYECTO_UNICO', [Validators.required]],
      estado_operativo: ['EN_ESPERA', [Validators.required]],
      especialista_responsable: ['', [Validators.required]],
      monto_pactado_usd: [0, [Validators.required, Validators.min(0)]],
      fecha_inicio: [todayStr, [Validators.required]],
      fecha_entrega_estimada: [''],
      dia_corte_mensual: [null],
      notas: ['']
    });

    this.statusForm = this.fb.group({
      estado_operativo: ['EN_DESARROLLO', [Validators.required]],
      notas_actualizacion: ['']
    });

    // Validación condicional de dia_corte_mensual según modalidad
    this.serviceForm.get('modalidad')?.valueChanges.subscribe((mod) => {
      const diaCtrl = this.serviceForm.get('dia_corte_mensual');
      if (mod === 'RECURRENTE_MENSUAL') {
        diaCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(31)]);
      } else {
        diaCtrl?.clearValidators();
      }
      diaCtrl?.updateValueAndValidity();
    });
  }

  loadServices(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const modParam = this.selectedModalidad === 'TODOS' ? undefined : this.selectedModalidad;

    this.serviceContracts.getServices({
      modalidad: modParam,
      estado_operativo: this.selectedEstado || undefined,
      search: this.searchQuery || undefined
    }).subscribe({
      next: (data) => {
        this.services.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Error al cargar los servicios.');
        this.isLoading.set(false);
      }
    });
  }

  loadClientes(): void {
    this.serviceContracts.getClientes().subscribe({
      next: (data) => {
        this.clientes.set(data);
      },
      error: () => {}
    });
  }

  setModalidadFilter(mod: ModalidadServicio | 'TODOS'): void {
    this.selectedModalidad = mod;
    this.loadServices();
  }

  onFilterChange(): void {
    this.loadServices();
  }

  openCreateModal(): void {
    this.selectedServiceForEdit.set(null);
    this.formError.set(null);
    const todayStr = new Date().toISOString().substring(0, 10);

    this.serviceForm.reset({
      cliente_id: this.clientes().length > 0 ? this.clientes()[0].id : '',
      tipo: 'SOFTWARE_MEDIDA',
      modalidad: 'PROYECTO_UNICO',
      estado_operativo: 'EN_ESPERA',
      monto_pactado_usd: 0,
      fecha_inicio: todayStr
    });
    this.isModalOpen.set(true);
  }

  openEditModal(srv: Servicio): void {
    this.selectedServiceForEdit.set(srv);
    this.formError.set(null);
    this.serviceForm.patchValue({
      cliente_id: srv.cliente_id,
      tipo: srv.tipo,
      nombre_servicio: srv.nombre_servicio,
      modalidad: srv.modalidad,
      estado_operativo: srv.estado_operativo,
      especialista_responsable: srv.especialista_responsable,
      monto_pactado_usd: srv.monto_pactado_usd,
      fecha_inicio: srv.fecha_inicio,
      fecha_entrega_estimada: srv.fecha_entrega_estimada || '',
      dia_corte_mensual: srv.dia_corte_mensual || null,
      notas: srv.notas || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedServiceForEdit.set(null);
    this.formError.set(null);
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    const fv = this.serviceForm.value;
    const srvData: ServicioCreate = {
      cliente_id: fv.cliente_id,
      tipo: fv.tipo as TipoServicio,
      nombre_servicio: fv.nombre_servicio,
      modalidad: fv.modalidad as ModalidadServicio,
      estado_operativo: fv.estado_operativo as EstadoOperativoServicio,
      especialista_responsable: fv.especialista_responsable,
      monto_pactado_usd: fv.monto_pactado_usd,
      fecha_inicio: fv.fecha_inicio,
      fecha_entrega_estimada: fv.modalidad === 'PROYECTO_UNICO' ? (fv.fecha_entrega_estimada || null) : null,
      dia_corte_mensual: fv.modalidad === 'RECURRENTE_MENSUAL' ? Number(fv.dia_corte_mensual) : null,
      notas: fv.notas || null
    };

    const currentEdit = this.selectedServiceForEdit();

    if (currentEdit) {
      this.serviceContracts.updateService(currentEdit.id, srvData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadServices();
        },
        error: (err) => {
          this.formError.set(err?.error?.detail || 'Error al actualizar servicio.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.serviceContracts.createService(srvData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadServices();
        },
        error: (err) => {
          this.formError.set(err?.error?.detail || 'Error al aperturar servicio.');
          this.isSaving.set(false);
        }
      });
    }
  }

  // Cambio Rápido de Estado
  openStatusModal(srv: Servicio): void {
    this.activeService.set(srv);
    this.statusError.set(null);
    this.statusForm.reset({
      estado_operativo: srv.estado_operativo,
      notas_actualizacion: ''
    });
    this.isStatusModalOpen.set(true);
  }

  closeStatusModal(): void {
    this.isStatusModalOpen.set(false);
    this.activeService.set(null);
    this.statusError.set(null);
  }

  submitStatusUpdate(): void {
    if (this.statusForm.invalid || !this.activeService()) {
      return;
    }

    this.isUpdatingStatus.set(true);
    this.statusError.set(null);

    const srvId = this.activeService()!.id;
    const { estado_operativo, notas_actualizacion } = this.statusForm.value;

    this.serviceContracts.updateServiceStatus(srvId, { estado_operativo, notas_actualizacion }).subscribe({
      next: () => {
        this.isUpdatingStatus.set(false);
        this.closeStatusModal();
        this.loadServices();
      },
      error: (err) => {
        this.statusError.set(err?.error?.detail || 'Error al actualizar estado.');
        this.isUpdatingStatus.set(false);
      }
    });
  }

  getTipoBadgeClass(tipo: TipoServicio): string {
    switch (tipo) {
      case 'LEGAL_SAREN':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/60';
      case 'IA_AUTOMATIZACION':
        return 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60';
      case 'SOFTWARE_MEDIDA':
        return 'bg-sky-950/40 text-sky-300 border-sky-800/60';
      case 'RETAINER_MENSUAL':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }

  getEstadoOperativoBadgeClass(estado: EstadoOperativoServicio): string {
    switch (estado) {
      case 'EN_ESPERA':
        return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'EN_DESARROLLO':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
      case 'EN_REVISION':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'ACTIVO_PRODUCCION':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      case 'FINALIZADO':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60';
      case 'PAUSADO':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }
}
