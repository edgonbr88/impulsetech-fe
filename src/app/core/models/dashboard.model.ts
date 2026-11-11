export interface LeadsMetrics {
  total_leads: number;
  leads_ganados: number;
  leads_perdidos: number;
  tasa_conversion: number;
  valor_pipeline_usd: number;
  desglose_por_embudo: { [key: string]: number };
}

export interface ClientesMetrics {
  total_clientes: number;
  clientes_activos: number;
  clientes_morosos: number;
  clientes_inactivos: number;
}

export interface ServiciosMetrics {
  total_servicios: number;
  proyectos_activos: number;
  retainers_activos: number;
  mrr_recurrente_usd: number;
  servicios_por_tipo: { [key: string]: number };
}

export interface FinanzasMetrics {
  total_verificado_usd: number;
  total_pendiente_usd: number;
  conteo_verificados: number;
  conteo_pendientes: number;
  desglose_por_moneda: {
    [key: string]: {
      total: number;
      count: number;
    };
  };
}

export interface RecienteItem {
  id: string;
  titulo: string;
  subtitulo: string;
  monto_o_tag?: string | null;
  estado: string;
  fecha: string;
}

export interface DashboardMetrics {
  leads: LeadsMetrics;
  clientes: ClientesMetrics;
  servicios: ServiciosMetrics;
  finanzas: FinanzasMetrics;
  ultimos_pagos: RecienteItem[];
  ultimos_leads: RecienteItem[];
  servicios_destacados: RecienteItem[];
}
