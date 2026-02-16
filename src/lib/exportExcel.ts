import * as XLSX from 'xlsx';

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportMetricsToExcel(metrics: {
  usuarios: { total: number };
  productos: { total: number; activos: number };
  ventasCompras: { transaccionesTotal: number };
  token: { saldoEnCirculacion: number; volumenTransacciones: number; tokenGastadoCompras: number; tokenRecibidoVentas: number };
  contacto: { conversacionesTotal: number; mensajesTotal: number };
}) {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Métrica', 'Valor'],
    ['Usuarios totales', metrics.usuarios.total],
    ['Productos totales', metrics.productos.total],
    ['Productos activos', metrics.productos.activos],
    ['Transacciones totales', metrics.ventasCompras.transaccionesTotal],
    ['Saldo en circulación (IX)', metrics.token.saldoEnCirculacion],
    ['Volumen transacciones (IX)', metrics.token.volumenTransacciones],
    ['Token gastado compras (IX)', metrics.token.tokenGastadoCompras],
    ['Token recibido ventas (IX)', metrics.token.tokenRecibidoVentas],
    ['Conversaciones', metrics.contacto.conversacionesTotal],
    ['Mensajes totales', metrics.contacto.mensajesTotal],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Métricas');
  downloadWorkbook(wb, `intercambius-metricas-${new Date().toISOString().slice(0, 10)}`);
}

export function exportUsersToExcel(data: any[]) {
  const rows = data.map((u) => ({
    ID: u.id,
    Nombre: u.nombre,
    Email: u.email,
    Contacto: u.contacto,
    Saldo: u.saldo,
    Límite: u.limite,
    Ubicación: u.ubicacion,
    MiembroDesde: u.miembroDesde,
    Verificado: u.verificado ? 'Sí' : 'No',
    Baneado: u.bannedAt ? 'Sí' : 'No',
    ProductosPublicados: u.productosPublicados,
    Intercambios: u.intercambios,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
  downloadWorkbook(wb, `intercambius-usuarios-${new Date().toISOString().slice(0, 10)}`);
}

export function exportProductosToExcel(data: any[]) {
  const rows = data.map((p) => ({
    ID: p.id,
    Título: p.titulo,
    Precio: p.precio,
    Estado: p.status,
    Rubro: p.rubro,
    Ubicación: p.ubicacion,
    VendedorId: p.vendedor?.id,
    VendedorNombre: p.vendedor?.nombre,
    VendedorEmail: p.vendedor?.email,
    Creado: p.createdAt,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Productos');
  downloadWorkbook(wb, `intercambius-productos-${new Date().toISOString().slice(0, 10)}`);
}

export function exportIntercambiosToExcel(data: any[]) {
  const rows = data.map((i) => ({
    ID: i.id,
    CompradorId: i.usuario?.id,
    Comprador: i.usuario?.nombre,
    VendedorId: i.otraPersona?.id,
    Vendedor: i.otraPersona?.nombre,
    Créditos: i.creditos,
    Estado: i.estado,
    ProductoId: i.marketItem?.id,
    ProductoTítulo: i.marketItem?.titulo,
    Fecha: i.fecha,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
  downloadWorkbook(wb, `intercambius-transacciones-${new Date().toISOString().slice(0, 10)}`);
}
