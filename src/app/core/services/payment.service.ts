import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Payment,
  PaymentCreateDto,
  PaymentStatusUpdateDto,
  PaymentSummary,
  MonedaPago,
  EstadoPago
} from '../models/payment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/payments`;

  getPayments(filters?: {
    cliente_id?: string;
    servicio_id?: string;
    moneda?: MonedaPago;
    estado_pago?: EstadoPago;
  }): Observable<Payment[]> {
    let params = new HttpParams();
    if (filters?.cliente_id) params = params.set('cliente_id', filters.cliente_id);
    if (filters?.servicio_id) params = params.set('servicio_id', filters.servicio_id);
    if (filters?.moneda) params = params.set('moneda', filters.moneda);
    if (filters?.estado_pago) params = params.set('estado_pago', filters.estado_pago);

    return this.http.get<Payment[]>(this.apiUrl, { params });
  }

  getPaymentSummary(): Observable<PaymentSummary> {
    return this.http.get<PaymentSummary>(`${this.apiUrl}/summary/balance`);
  }

  getPaymentById(id: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  createPayment(dto: PaymentCreateDto): Observable<Payment> {
    return this.http.post<Payment>(this.apiUrl, dto);
  }

  updatePaymentStatus(id: string, dto: PaymentStatusUpdateDto): Observable<Payment> {
    return this.http.patch<Payment>(`${this.apiUrl}/${id}/status`, dto);
  }
}
