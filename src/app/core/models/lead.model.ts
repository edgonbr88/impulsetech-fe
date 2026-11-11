import { User } from './user.model';
import { Cliente } from './client.model';

export type EmbudoLead = 'LEGAL_SAREN' | 'IA_AUTOMATIZACION' | 'SOFTWARE_MEDIDA';
export type EtapaLead = 'NUEVO' | 'DIAGNOSTICO' | 'PROPUESTA' | 'NEGOCIACION' | 'GANADO' | 'PERDIDO';

export interface Lead {
  id: string;
  nombre_contacto: string;
  empresa_o_proyecto: string;
  telefono_whatsapp: string;
  email: string;
  embudo: EmbudoLead;
  etapa: EtapaLead;
  motivo_perdida?: string | null;
  valor_estimado_usd: number;
  ejecutivo_asignado_id: string;
  cliente_id?: string | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  ejecutivo_asignado?: Pick<User, 'id' | 'nombre' | 'email'> | null;
  cliente?: Pick<Cliente, 'id' | 'razon_social' | 'rif_identificacion'> | null;
}

export interface LeadCreate {
  nombre_contacto: string;
  empresa_o_proyecto: string;
  telefono_whatsapp: string;
  email: string;
  embudo: EmbudoLead;
  etapa?: EtapaLead;
  motivo_perdida?: string | null;
  valor_estimado_usd?: number;
  ejecutivo_asignado_id: string;
  cliente_id?: string | null;
  notas?: string | null;
}

export interface LeadUpdate {
  nombre_contacto?: string;
  empresa_o_proyecto?: string;
  telefono_whatsapp?: string;
  email?: string;
  embudo?: EmbudoLead;
  etapa?: EtapaLead;
  motivo_perdida?: string | null;
  valor_estimado_usd?: number;
  ejecutivo_asignado_id?: string;
  cliente_id?: string | null;
  notas?: string | null;
}

export interface LeadStageUpdate {
  etapa: EtapaLead;
  motivo_perdida?: string | null;
}
