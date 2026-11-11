import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LeadService } from '../../../core/services/lead.service';
import { AuthService } from '../../../core/services/auth.service';
import { Lead, LeadCreate, EmbudoLead, EtapaLead } from '../../../core/models/lead.model';
import { User } from '../../../core/models/user.model';

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

  leads = signal<Lead[]>([]);
  ejecutivos = signal<User[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Filtros
  selectedEmbudo: EmbudoLead | 'TODOS' = 'TODOS';
  selectedEtapa: string = '';
  searchQuery: string = '';

  // Modales
  isModalOpen = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  formError = signal<string | null>(null);
  selectedLeadForEdit = signal<Lead | null>(null);

  leadForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadLeads();
    this.loadEjecutivos();
  }

  private initForm(): void {
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

  onFilterChange(): void {
    this.loadLeads();
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
