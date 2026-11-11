import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Lead, LeadCreate, LeadUpdate, LeadStageUpdate, EmbudoLead, EtapaLead } from '../models/lead.model';
import { User } from '../models/user.model';
import { Cliente } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/leads';
  private usersUrl = '/api/v1/users/ejecutivos';
  private clientsUrl = '/api/v1/clients';

  getLeads(params?: {
    embudo?: EmbudoLead | string;
    etapa?: EtapaLead | string;
    ejecutivo_id?: string;
    solo_mi_cartera?: boolean;
    search?: string;
  }): Observable<Lead[]> {
    let httpParams = new HttpParams();
    if (params?.embudo) {
      httpParams = httpParams.set('embudo', params.embudo);
    }
    if (params?.etapa) {
      httpParams = httpParams.set('etapa', params.etapa);
    }
    if (params?.ejecutivo_id) {
      httpParams = httpParams.set('ejecutivo_id', params.ejecutivo_id);
    }
    if (params?.solo_mi_cartera) {
      httpParams = httpParams.set('solo_mi_cartera', 'true');
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<Lead[]>(this.apiUrl, { params: httpParams });
  }

  getLeadById(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.apiUrl}/${id}`);
  }

  createLead(data: LeadCreate): Observable<Lead> {
    return this.http.post<Lead>(this.apiUrl, data);
  }

  updateLead(id: string, data: LeadUpdate): Observable<Lead> {
    return this.http.put<Lead>(`${this.apiUrl}/${id}`, data);
  }

  updateLeadStage(id: string, data: LeadStageUpdate): Observable<Lead> {
    return this.http.patch<Lead>(`${this.apiUrl}/${id}/stage`, data);
  }

  deleteLead(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEjecutivos(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl);
  }

  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.clientsUrl);
  }
}
