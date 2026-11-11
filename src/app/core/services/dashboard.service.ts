import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardMetrics } from '../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/dashboard/metrics`;

  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(this.apiUrl);
  }
}
