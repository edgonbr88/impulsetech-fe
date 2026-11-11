import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Servicio,
  ServicioCreate,
  ServicioUpdate,
  ServicioStatusUpdate,
} from '../models/service.model';
import { Cliente } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceContractsService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/services';
  private clientsUrl = '/api/v1/clients';

  getServices(params?: {
    cliente_id?: string;
    tipo?: string;
    modalidad?: string;
    estado_operativo?: string;
    search?: string;
  }): Observable<Servicio[]> {
    let httpParams = new HttpParams();
    if (params?.cliente_id) {
      httpParams = httpParams.set('cliente_id', params.cliente_id);
    }
    if (params?.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }
    if (params?.modalidad) {
      httpParams = httpParams.set('modalidad', params.modalidad);
    }
    if (params?.estado_operativo) {
      httpParams = httpParams.set('estado_operativo', params.estado_operativo);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<Servicio[]>(this.apiUrl, { params: httpParams });
  }

  getServiceById(id: string): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.apiUrl}/${id}`);
  }

  createService(data: ServicioCreate): Observable<Servicio> {
    return this.http.post<Servicio>(this.apiUrl, data);
  }

  updateService(id: string, data: ServicioUpdate): Observable<Servicio> {
    return this.http.put<Servicio>(`${this.apiUrl}/${id}`, data);
  }

  updateServiceStatus(id: string, data: ServicioStatusUpdate): Observable<Servicio> {
    return this.http.patch<Servicio>(`${this.apiUrl}/${id}/status`, data);
  }

  deleteService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.clientsUrl);
  }
}
