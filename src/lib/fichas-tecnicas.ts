// Fichas técnicas por rubro (compartido entre CrearProducto y EditarProducto)

export const FICHAS_TECNICAS = {
  productos: {
    categoria: {
      label: "Categoría",
      type: "select",
      options: ["Electrónica", "Ropa", "Hogar", "Deportes", "Libros", "Juguetes", "Otros"],
    },
    estado: {
      label: "Estado",
      type: "select",
      options: ["Nuevo", "Usado - Como nuevo", "Usado - Buen estado", "Usado - Aceptable"],
    },
    marca: { label: "Marca", type: "text" },
    modelo: { label: "Modelo", type: "text" },
    entrega: {
      label: "Forma de entrega",
      type: "select",
      options: ["Retiro", "Envío", "Ambos"],
    },
  },
  servicios: {
    tipo: {
      label: "Tipo de servicio",
      type: "select",
      options: ["Reparaciones", "Limpieza", "Clases", "Consultoría", "Diseño", "Fotografía", "Otros"],
    },
    modalidad: {
      label: "Modalidad",
      type: "select",
      options: ["Presencial", "Online", "Ambos"],
    },
    experiencia: {
      label: "Nivel de experiencia",
      type: "select",
      options: ["Principiante", "Intermedio", "Avanzado", "Profesional"],
    },
    duracion: {
      label: "Duración estimada",
      type: "text",
      placeholder: "Ej: 2 horas, 1 día, etc.",
    },
  },
  alimentos: {
    tipo: {
      label: "Tipo",
      type: "select",
      options: ["Orgánico", "Vegano", "Sin TACC", "Casero", "Artesanal", "Otros"],
    },
    conservacion: {
      label: "Conservación",
      type: "select",
      options: ["Fresco", "Congelado", "Envasado", "Seco"],
    },
    cantidad: {
      label: "Cantidad",
      type: "select",
      options: ["Individual", "Familiar", "Mayorista"],
    },
    fechaVencimiento: { label: "Fecha de vencimiento", type: "date" },
  },
  experiencias: {
    tipo: {
      label: "Tipo de experiencia",
      type: "select",
      options: ["Eventos", "Talleres", "Tours", "Actividades", "Otros"],
    },
    duracion: {
      label: "Duración",
      type: "select",
      options: ["1 hora", "2-4 horas", "Medio día", "Día completo"],
    },
    participantes: {
      label: "Participantes",
      type: "select",
      options: ["Individual", "Pareja", "Grupo pequeño", "Grupo grande"],
    },
    fecha: { label: "Fecha disponible", type: "date" },
  },
} as const;
