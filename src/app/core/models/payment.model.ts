export type MonedaPago = 'USD' | 'VES' | 'USDT';

export type MedioPago = 
  | 'ZELLE'
  | 'PAGO_MOVIL'
  | 'USDT_BINANCE'
  | 'EFECTIVO_USD'
  | 'TRANSFERENCIA_VES';

export type ConceptoPago = 
  | 'ANTICIPO_50'
  | 'FINIQUITO'
  | 'CUOTA_RETAINER'
  | 'OTRO';

export type EstadoPago = 'PENDIENTE' | 'VERIFICADO' | 'RECHAZADO';

export interface Payment {
  id: string;
  cliente_id: string;
  servicio_id?: string | null;
  monto: number;
  moneda: MonedaPago;
  tasa_cambio_bcv?: number | null;
  medio_pago: MedioPago;
  referencia_bancaria?: string | null;
  concepto: ConceptoPago;
  estado_pago: EstadoPago;
  fecha_pago: string;
  comprobante_url?: string | null;
  notas?: string | null;
  cliente_nombre?: string;
  servicio_nombre?: string;
  monto_equivalente_usd: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreateDto {
  cliente_id: string;
  servicio_id?: string | null;
  monto: number;
  moneda: MonedaPago;
  tasa_cambio_bcv?: number | null;
  medio_pago: MedioPago;
  referencia_bancaria?: string | null;
  concepto: ConceptoPago;
  fecha_pago: string;
  comprobante_url?: string | null;
  notas?: string | null;
}

export interface PaymentStatusUpdateDto {
  estado_pago: EstadoPago;
  notas?: string | null;
}

export interface PaymentSummary {
  total_verificado_usd: number;
  total_pendiente_usd: number;
  total_rechazado_usd: number;
  conteo_verificados: number;
  conteo_pendientes: number;
  conteo_rechazados: number;
  desglose_por_moneda: {
    [key: string]: {
      total: number;
      count: number;
    };
  };
}
