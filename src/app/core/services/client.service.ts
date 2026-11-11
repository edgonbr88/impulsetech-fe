import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cliente, ClienteCreate, ClienteUpdate } from '../models/client.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/clients';
  private usersUrl = '/api/v1/users';

  getClients(params?: { search?: string; estado?: string; ejecutivo_id?: string }): Observable<Cliente[]> {
    let httpParams = new HttpParams();
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.estado) {
      httpParams = httpParams.set('estado', params.estado);
    }
    if (params?.ejecutivo_id) {
      httpParams = httpParams.set('ejecutivo_id', params.ejecutivo_id);
    }
    return this.http.get<Cliente[]>(this.apiUrl, { params: httpParams });
  }

  getClientById(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  createClient(data: ClienteCreate): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, data);
  }

  updateClient(id: string, data: ClienteUpdate): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, data);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getEjecutivos(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl);
  }
}
