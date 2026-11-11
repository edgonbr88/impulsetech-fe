import { Cliente } from './client.model';

export type TipoServicio = 'LEGAL_SAREN' | 'IA_AUTOMATIZACION' | 'SOFTWARE_MEDIDA' | 'RETAINER_MENSUAL';
export type ModalidadServicio = 'PROYECTO_UNICO' | 'RECURRENTE_MENSUAL';
export type EstadoOperativoServicio = 'EN_ESPERA' | 'EN_DESARROLLO' | 'EN_REVISION' | 'ACTIVO_PRODUCCION' | 'FINALIZADO' | 'PAUSADO';

export interface Servicio {
  id: string;
  cliente_id: string;
  tipo: TipoServicio;
  nombre_servicio: string;
  modalidad: ModalidadServicio;
  estado_operativo: EstadoOperativoServicio;
  especialista_responsable: string;
  monto_pactado_usd: number;
  fecha_inicio: string;
  fecha_entrega_estimada?: string | null;
  dia_corte_mensual?: number | null;
  notas?: string | null;
  created_at: string;
  updated_at: string;
  cliente?: Pick<Cliente, 'id' | 'razon_social' | 'rif_identificacion'> | null;
}

export interface ServicioCreate {
  cliente_id: string;
  tipo: TipoServicio;
  nombre_servicio: string;
  modalidad: ModalidadServicio;
  estado_operativo?: EstadoOperativoServicio;
  especialista_responsable: string;
  monto_pactado_usd: number;
  fecha_inicio: string;
  fecha_entrega_estimada?: string | null;
  dia_corte_mensual?: number | null;
  notas?: string | null;
}

export interface ServicioUpdate {
  cliente_id?: string;
  tipo?: TipoServicio;
  nombre_servicio?: string;
  modalidad?: ModalidadServicio;
  estado_operativo?: EstadoOperativoServicio;
  especialista_responsable?: string;
  monto_pactado_usd?: number;
  fecha_inicio?: string;
  fecha_entrega_estimada?: string | null;
  dia_corte_mensual?: number | null;
  notas?: string | null;
}

export interface ServicioStatusUpdate {
  estado_operativo: EstadoOperativoServicio;
  notas_actualizacion?: string;
}
