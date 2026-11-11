import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentService } from '../../../core/services/payment.service';
import { ClientService } from '../../../core/services/client.service';
import { ServiceContractsService } from '../../../core/services/service-contracts.service';
import {
  Payment,
  PaymentSummary,
  MonedaPago,
  MedioPago,
  ConceptoPago,
  EstadoPago
} from '../../../core/models/payment.model';
import { Cliente } from '../../../core/models/client.model';
import { Servicio } from '../../../core/models/service.model';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './payment-list.component.html',
  styleUrls: ['./payment-list.component.scss']
})
export class PaymentListComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private clientService = inject(ClientService);
  private serviceContractsService = inject(ServiceContractsService);
  private fb = inject(FormBuilder);

  payments: Payment[] = [];
  filteredPayments: Payment[] = [];
  clients: Cliente[] = [];
  clientServices: Servicio[] = [];
  summary: PaymentSummary | null = null;
  loading = false;
  errorMsg = '';
  successMsg = '';

  selectedMonedaFilter: MonedaPago | 'ALL' = 'ALL';
  selectedEstadoFilter: EstadoPago | 'ALL' = 'ALL';

  showCreateModal = false;
  showStatusModal = false;
  selectedPayment: Payment | null = null;

  createForm!: FormGroup;
  statusForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadData();
    this.loadClients();
  }

  private initForms(): void {
    const today = new Date().toISOString().split('T')[0];

    this.createForm = this.fb.group({
      cliente_id: ['', Validators.required],
      servicio_id: [''],
      monto: ['', [Validators.required, Validators.min(0.01)]],
      moneda: ['USD' as MonedaPago, Validators.required],
      tasa_cambio_bcv: [''],
      medio_pago: ['ZELLE' as MedioPago, Validators.required],
      referencia_bancaria: [''],
      concepto: ['ANTICIPO_50' as ConceptoPago, Validators.required],
      fecha_pago: [today, Validators.required],
      comprobante_url: [''],
      notas: ['']
    });

    this.statusForm = this.fb.group({
      estado_pago: ['VERIFICADO' as EstadoPago, Validators.required],
      notas: ['']
    });

    this.createForm.get('moneda')?.valueChanges.subscribe((moneda: MonedaPago) => {
      const tasaControl = this.createForm.get('tasa_cambio_bcv');
      if (moneda === 'VES') {
        tasaControl?.setValidators([Validators.required, Validators.min(0.0001)]);
      } else {
        tasaControl?.clearValidators();
      }
      tasaControl?.updateValueAndValidity();
    });

    this.createForm.get('cliente_id')?.valueChanges.subscribe((clienteId: string) => {
      if (clienteId) {
        this.loadServicesForClient(clienteId);
      } else {
        this.clientServices = [];
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.errorMsg = '';
    this.paymentService.getPayments().subscribe({
      next: (data) => {
        this.payments = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Error al cargar los pagos del sistema.';
        this.loading = false;
      }
    });

    this.paymentService.getPaymentSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: () => {}
    });
  }

  loadClients(): void {
    this.clientService.getClients().subscribe({
      next: (res) => {
        this.clients = res;
      },
      error: () => {}
    });
  }

  loadServicesForClient(clienteId: string): void {
    this.serviceContractsService.getServices({ cliente_id: clienteId }).subscribe({
      next: (services) => {
        this.clientServices = services;
      },
      error: () => {
        this.clientServices = [];
      }
    });
  }

  setMonedaFilter(moneda: MonedaPago | 'ALL'): void {
    this.selectedMonedaFilter = moneda;
    this.applyFilters();
  }

  setEstadoFilter(estado: EstadoPago | 'ALL'): void {
    this.selectedEstadoFilter = estado;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredPayments = this.payments.filter((p) => {
      const matchMoneda = this.selectedMonedaFilter === 'ALL' || p.moneda === this.selectedMonedaFilter;
      const matchEstado = this.selectedEstadoFilter === 'ALL' || p.estado_pago === this.selectedEstadoFilter;
      return matchMoneda && matchEstado;
    });
  }

  openCreateModal(): void {
    this.createForm.reset({
      moneda: 'USD',
      medio_pago: 'ZELLE',
      concepto: 'ANTICIPO_50',
      fecha_pago: new Date().toISOString().split('T')[0]
    });
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openStatusModal(payment: Payment): void {
    this.selectedPayment = payment;
    this.statusForm.reset({
      estado_pago: payment.estado_pago === 'PENDIENTE' ? 'VERIFICADO' : payment.estado_pago,
      notas: ''
    });
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.selectedPayment = null;
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const val = this.createForm.value;
    const dto = {
      ...val,
      monto: Number(val.monto),
      tasa_cambio_bcv: val.tasa_cambio_bcv ? Number(val.tasa_cambio_bcv) : null,
      servicio_id: val.servicio_id || null
    };

    this.loading = true;
    this.paymentService.createPayment(dto).subscribe({
      next: () => {
        this.showSuccess('Pago registrado exitosamente.');
        this.closeCreateModal();
        this.loadData();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al registrar el pago.';
        this.loading = false;
      }
    });
  }

  submitStatus(): void {
    if (!this.selectedPayment || this.statusForm.invalid) return;

    this.loading = true;
    const dto = this.statusForm.value;

    this.paymentService.updatePaymentStatus(this.selectedPayment.id, dto).subscribe({
      next: () => {
        this.showSuccess('Estado de conciliación actualizado con éxito.');
        this.closeStatusModal();
        this.loadData();
      },
      error: (err) => {
        this.errorMsg = err.error?.detail || 'Error al actualizar el estado del pago.';
        this.loading = false;
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => {
      this.successMsg = '';
    }, 4000);
  }
}
