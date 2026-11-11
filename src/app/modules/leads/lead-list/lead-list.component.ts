import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LeadService } from '../../../core/services/lead.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Lead,
  LeadCreate,
  EmbudoLead,
  EtapaLead,
  LeadConvertToClientRequest,
} from '../../../core/models/lead.model';
import { User } from '../../../core/models/user.model';

export interface KanbanColumn {
  etapa: EtapaLead;
  title: string;
  badgeClass: string;
}

@Component({
  selector: 'app-lead-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lead-list.component.html',
  styleUrls: ['./lead-list.component.scss']
})
export class LeadListComponent implements OnInit {
  private leadService = inject(LeadService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  leads = signal<Lead[]>([]);
  ejecutivos = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Modo de Vista: 'TABLE' o 'KANBAN'
  viewMode = signal<'TABLE' | 'KANBAN'>('KANBAN');

  // Filtros
  selectedEmbudo: EmbudoLead | 'TODOS' = 'LEGAL_SAREN';
  selectedEtapa: string = '';
  searchQuery: string = '';

  // Modales
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string | null>(null);
  selectedLeadForEdit = signal<Lead | null>(null);

  // Modal de Conversión
  isConvertModalOpen = signal<boolean>(false);
  isConverting = signal<boolean>(false);
  convertError = signal<string | null>(null);
  selectedLeadForConversion = signal<Lead | null>(null);

  leadForm!: FormGroup;
  convertForm!: FormGroup;

  // Columnas Kanban
  kanbanColumns: KanbanColumn[] = [
    { etapa: 'NUEVO', title: 'Nuevo Lead', badgeClass: 'border-blue-700/60 text-blue-400 bg-blue-950/40' },
    { etapa: 'DIAGNOSTICO', title: 'Diagnóstico', badgeClass: 'border-purple-700/60 text-purple-400 bg-purple-950/40' },
    { etapa: 'PROPUESTA', title: 'Propuesta', badgeClass: 'border-amber-700/60 text-amber-400 bg-amber-950/40' },
    { etapa: 'NEGOCIACION', title: 'Negociación', badgeClass: 'border-cyan-700/60 text-cyan-400 bg-cyan-950/40' },
    { etapa: 'GANADO', title: 'Ganado (Cliente)', badgeClass: 'border-emerald-700/60 text-emerald-400 bg-emerald-950/40' },
    { etapa: 'PERDIDO', title: 'Perdido', badgeClass: 'border-rose-700/60 text-rose-400 bg-rose-950/40' },
  ];

  ngOnInit(): void {
    this.initForms();
    this.loadLeads();
    this.loadEjecutivos();
  }

  private initForms(): void {
    this.leadForm = this.fb.group({
      nombre_contacto: ['', [Validators.required, Validators.minLength(3)]],
      empresa_o_proyecto: ['', [Validators.required]],
      telefono_whatsapp: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      embudo: ['LEGAL_SAREN', [Validators.required]],
      etapa: ['NUEVO', [Validators.required]],
      motivo_perdida: [''],
      valor_estimado_usd: [0, [Validators.required, Validators.min(0)]],
      ejecutivo_asignado_id: ['', [Validators.required]],
      notas: ['']
    });

    this.convertForm = this.fb.group({
      rif_identificacion: ['', [Validators.required, Validators.pattern(/^[JjGgVvEePp]-?[0-9]{5,9}-?[0-9]?$/)]],
      razon_social: ['', [Validators.required]],
      direccion_ciudad: ['Caracas, Venezuela'],
      notas_adicionales: ['Conversión aprobada desde el embudo de ventas.']
    });

    // Validar motivo si etapa es PERDIDO
    this.leadForm.get('etapa')?.valueChanges.subscribe((etapa) => {
      const motivoCtrl = this.leadForm.get('motivo_perdida');
      if (etapa === 'PERDIDO') {
        motivoCtrl?.setValidators([Validators.required]);
      } else {
        motivoCtrl?.clearValidators();
      }
      motivoCtrl?.updateValueAndValidity();
    });
  }

  loadLeads(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const embudoParam = this.selectedEmbudo === 'TODOS' ? undefined : this.selectedEmbudo;

    this.leadService.getLeads({
      embudo: embudoParam,
      etapa: this.selectedEtapa || undefined,
      search: this.searchQuery || undefined
    }).subscribe({
      next: (data) => {
        this.leads.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Error al cargar los leads.');
        this.isLoading.set(false);
      }
    });
  }

  loadEjecutivos(): void {
    this.leadService.getEjecutivos().subscribe({
      next: (users) => {
        this.ejecutivos.set(users);
      },
      error: () => {}
    });
  }

  setEmbudoFilter(embudo: EmbudoLead | 'TODOS'): void {
    this.selectedEmbudo = embudo;
    this.loadLeads();
  }

  setViewMode(mode: 'TABLE' | 'KANBAN'): void {
    this.viewMode.set(mode);
  }

  onFilterChange(): void {
    this.loadLeads();
  }

  // Filtrado de Leads por Columna Kanban
  getLeadsByEtapa(etapa: EtapaLead): Lead[] {
    return this.leads().filter((l) => l.etapa === etapa);
  }

  getColumnTotalUsd(etapa: EtapaLead): number {
    return this.getLeadsByEtapa(etapa).reduce(
      (sum, item) => sum + Number(item.valor_estimado_usd || 0),
      0
    );
  }

  // Mover de Etapa rápidamente en el Kanban
  advanceStage(lead: Lead, nextEtapa: EtapaLead): void {
    if (nextEtapa === 'GANADO') {
      this.openConvertModal(lead);
      return;
    }

    this.leadService.updateLeadStage(lead.id, { etapa: nextEtapa }).subscribe({
      next: () => {
        this.loadLeads();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.detail || 'Error al actualizar etapa.');
      }
    });
  }

  openCreateModal(): void {
    this.selectedLeadForEdit.set(null);
    this.formError.set(null);
    const defaultEjecutivo = this.ejecutivos().length > 0
      ? (this.authService.currentUser()?.id || this.ejecutivos()[0].id)
      : '';

    const currentEmbudo = this.selectedEmbudo === 'TODOS' ? 'LEGAL_SAREN' : this.selectedEmbudo;

    this.leadForm.reset({
      embudo: currentEmbudo,
      etapa: 'NUEVO',
      valor_estimado_usd: 0,
      ejecutivo_asignado_id: defaultEjecutivo
    });
    this.isModalOpen.set(true);
  }

  openEditModal(lead: Lead): void {
    this.selectedLeadForEdit.set(lead);
    this.formError.set(null);
    this.leadForm.patchValue({
      nombre_contacto: lead.nombre_contacto,
      empresa_o_proyecto: lead.empresa_o_proyecto,
      telefono_whatsapp: lead.telefono_whatsapp,
      email: lead.email,
      embudo: lead.embudo,
      etapa: lead.etapa,
      motivo_perdida: lead.motivo_perdida || '',
      valor_estimado_usd: lead.valor_estimado_usd,
      ejecutivo_asignado_id: lead.ejecutivo_asignado_id,
      notas: lead.notas || ''
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedLeadForEdit.set(null);
    this.formError.set(null);
  }

  saveLead(): void {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    const formValue = this.leadForm.value;
    const leadData: LeadCreate = {
      nombre_contacto: formValue.nombre_contacto,
      empresa_o_proyecto: formValue.empresa_o_proyecto,
      telefono_whatsapp: formValue.telefono_whatsapp,
      email: formValue.email,
      embudo: formValue.embudo as EmbudoLead,
      etapa: formValue.etapa as EtapaLead,
      motivo_perdida: formValue.etapa === 'PERDIDO' ? formValue.motivo_perdida : null,
      valor_estimado_usd: formValue.valor_estimado_usd,
      ejecutivo_asignado_id: formValue.ejecutivo_asignado_id,
      notas: formValue.notas || null
    };

    const currentEdit = this.selectedLeadForEdit();

    if (currentEdit) {
      this.leadService.updateLead(currentEdit.id, leadData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadLeads();
        },
        error: (err) => {
          this.formError.set(err?.error?.detail || 'Error al actualizar el lead.');
          this.isSaving.set(false);
        }
      });
    } else {
      this.leadService.createLead(leadData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadLeads();
        },
        error: (err) => {
          this.formError.set(err?.error?.detail || 'Error al registrar el lead.');
          this.isSaving.set(false);
        }
      });
    }
  }

  // Flujo de Conversión a Cliente
  openConvertModal(lead: Lead): void {
    this.selectedLeadForConversion.set(lead);
    this.convertError.set(null);
    this.convertForm.patchValue({
      razon_social: lead.empresa_o_proyecto,
      rif_identificacion: '',
      direccion_ciudad: 'Caracas, Venezuela',
      notas_adicionales: `Lead originado en ${lead.embudo}. Contacto: ${lead.nombre_contacto}.`
    });
    this.isConvertModalOpen.set(true);
  }

  closeConvertModal(): void {
    this.isConvertModalOpen.set(false);
    this.selectedLeadForConversion.set(null);
    this.convertError.set(null);
  }

  submitConversion(): void {
    if (this.convertForm.invalid || !this.selectedLeadForConversion()) {
      this.convertForm.markAllAsTouched();
      return;
    }

    this.isConverting.set(true);
    this.convertError.set(null);

    const leadId = this.selectedLeadForConversion()!.id;
    const data: LeadConvertToClientRequest = this.convertForm.value;

    this.leadService.convertLeadToClient(leadId, data).subscribe({
      next: (res) => {
        this.isConverting.set(false);
        this.closeConvertModal();
        this.loadLeads();
      },
      error: (err) => {
        this.convertError.set(err?.error?.detail || 'Error al convertir lead a cliente.');
        this.isConverting.set(false);
      }
    });
  }

  goToClients(): void {
    this.router.navigate(['/clients']);
  }

  cleanPhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  }

  getEtapaBadgeClass(etapa: EtapaLead): string {
    switch (etapa) {
      case 'NUEVO':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
      case 'DIAGNOSTICO':
        return 'bg-purple-950/60 text-purple-400 border-purple-800/60';
      case 'PROPUESTA':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      case 'NEGOCIACION':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60';
      case 'GANADO':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      case 'PERDIDO':
        return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  }
}
