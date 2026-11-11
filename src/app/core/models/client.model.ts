import { User } from './user.model';

export type EstadoCliente = 'ACTIVO' | 'INACTIVO' | 'MOROSO';

export interface Cliente {
  id: string;
  razon_social: string;
  rif_identificacion: string;
  contacto_principal: string;
  telefono_whatsapp: string;
  email: string;
  direccion_ciudad?: string | null;
  ejecutivo_id: string;
  estado: EstadoCliente;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  ejecutivo?: Pick<User, 'id' | 'nombre' | 'email'> | null;
}

export interface ClienteCreate {
  razon_social: string;
  rif_identificacion: string;
  contacto_principal: string;
  telefono_whatsapp: string;
  email: string;
  direccion_ciudad?: string | null;
  ejecutivo_id: string;
  estado?: EstadoCliente;
  notas?: string | null;
}

export interface ClienteUpdate {
  razon_social?: string;
  rif_identificacion?: string;
  contacto_principal?: string;
  telefono_whatsapp?: string;
  email?: string;
  direccion_ciudad?: string | null;
  ejecutivo_id?: string;
  estado?: EstadoCliente;
  notas?: string | null;
}
