import type { IdComponente } from '@/engine';

export interface ParteInterna {
  nombre: string;
  descripcion: string;
}

export interface FichaComponente {
  id: IdComponente;
  nombre: string;
  simbolo: string;
  rol: string;
  ecuacion: string;
  unidad: string;
  partes: ParteInterna[];
  comportamiento: string;
  representacion: string;
}

/** Fichas educativas que alimentan el panel contextual del laboratorio y la presentación. */
export const FICHAS: Record<Exclude<IdComponente, 'conductores'>, FichaComponente> = {
  fuente: {
    id: 'fuente',
    nombre: 'Fuente de voltaje',
    simbolo: 'E(t)',
    rol: 'Entrega la energía al circuito. Impone el voltaje E(t), el término independiente de la ecuación diferencial.',
    ecuacion: 'E(t) = V_L + V_R + V_C',
    unidad: 'Voltios (V)',
    partes: [
      { nombre: 'Carcasa metálica', descripcion: 'Cubierta de acero que protege y actúa como contacto negativo.' },
      { nombre: 'Cátodo (MnO₂)', descripcion: 'Dióxido de manganeso: recibe electrones durante la reacción química.' },
      { nombre: 'Separador', descripcion: 'Membrana porosa que permite el paso de iones pero no de electrones.' },
      { nombre: 'Ánodo (zinc)', descripcion: 'Polvo de zinc en gel: se oxida y libera electrones.' },
      { nombre: 'Colector de corriente', descripcion: 'Varilla central de latón que conduce los electrones al terminal.' },
    ],
    comportamiento: 'En el modelo ideal mantiene el voltaje E₀ sin importar la corriente. También puede generar pulsos, ondas cuadradas o sinusoidales.',
    representacion: 'El indicador muestra E(t) calculado por el motor en el instante actual.',
  },
  interruptor: {
    id: 'interruptor',
    nombre: 'Interruptor',
    simbolo: 'S',
    rol: 'Cierra el circuito en t = 0. Desde ese instante se aplican las condiciones iniciales q(0) = 0, i(0) = 0.',
    ecuacion: 'q(0) = q_0, \\quad i(0) = i_0',
    unidad: '—',
    partes: [
      { nombre: 'Cuchilla de cobre', descripcion: 'Palanca conductora que une los dos contactos al cerrarse.' },
      { nombre: 'Contactos', descripcion: 'Mordazas metálicas donde se apoya la cuchilla.' },
      { nombre: 'Base aislante', descripcion: 'Material dieléctrico que separa eléctricamente los contactos.' },
    ],
    comportamiento: 'Abierto: no circula corriente (estado desconectado). Cerrado: el circuito queda preparado para la simulación.',
    representacion: 'Haz clic sobre el interruptor 3D para abrirlo o cerrarlo.',
  },
  resistor: {
    id: 'resistor',
    nombre: 'Resistor',
    simbolo: 'R',
    rol: 'Se opone al paso de la corriente y convierte energía eléctrica en calor. Es el responsable del amortiguamiento.',
    ecuacion: 'V_R = R\\,i, \\qquad P_R = R\\,i^2',
    unidad: 'Ohmios (Ω)',
    partes: [
      { nombre: 'Recubrimiento epóxico', descripcion: 'Capa protectora aislante donde se pintan las bandas de color.' },
      { nombre: 'Bandas de color', descripcion: 'Código IEC 60062: las bandas del modelo representan el valor actual de R.' },
      { nombre: 'Película de carbón', descripcion: 'Capa resistiva tallada en espiral: su longitud fija el valor de R.' },
      { nombre: 'Núcleo cerámico', descripcion: 'Soporte aislante que disipa el calor generado.' },
      { nombre: 'Capuchones y terminales', descripcion: 'Contactos metálicos que conectan la película con el circuito.' },
    ],
    comportamiento: 'Mayor R ⇒ mayor α = R/2L ⇒ las oscilaciones se extinguen más rápido. Si R supera 2√(L/C) desaparece la oscilación.',
    representacion: 'El brillo térmico es proporcional a la potencia disipada P_R = R·i²(t) (efecto ilustrativo).',
  },
  inductor: {
    id: 'inductor',
    nombre: 'Inductor',
    simbolo: 'L',
    rol: 'Almacena energía en un campo magnético y se opone a los cambios bruscos de corriente (ley de Faraday-Lenz).',
    ecuacion: 'V_L = L\\,\\frac{di}{dt}, \\qquad E_L = \\tfrac{1}{2}L\\,i^2',
    unidad: 'Henrios (H)',
    partes: [
      { nombre: 'Devanado de cobre', descripcion: 'Espiras de alambre esmaltado: más espiras ⇒ mayor inductancia.' },
      { nombre: 'Núcleo de ferrita', descripcion: 'Material ferromagnético que concentra las líneas de campo.' },
      { nombre: 'Carrete aislante', descripcion: 'Soporte con bridas que mantiene las espiras en su lugar.' },
      { nombre: 'Campo magnético B', descripcion: 'Representación ilustrativa: su intensidad sigue a la corriente i(t).' },
    ],
    comportamiento: 'Actúa como "inercia eléctrica": hace que la corriente cambie suavemente. Junto con C produce la oscilación.',
    representacion: 'Las líneas de campo son una representación visual simplificada, no una simulación electromagnética completa.',
  },
  capacitor: {
    id: 'capacitor',
    nombre: 'Capacitor',
    simbolo: 'C',
    rol: 'Almacena carga eléctrica en dos placas separadas por un dieléctrico. Su carga q(t) es la incógnita de la EDO.',
    ecuacion: 'V_C = \\frac{q}{C}, \\qquad E_C = \\frac{q^2}{2C}',
    unidad: 'Faradios (F)',
    partes: [
      { nombre: 'Placa positiva', descripcion: 'Conductor donde se acumula la carga +q.' },
      { nombre: 'Dieléctrico', descripcion: 'Aislante entre placas: aumenta la capacitancia y evita el paso de corriente.' },
      { nombre: 'Placa negativa', descripcion: 'Conductor donde se acumula la carga −q.' },
      { nombre: 'Campo eléctrico E', descripcion: 'Representación ilustrativa: su intensidad sigue a q(t)/C.' },
    ],
    comportamiento: 'Con fuente constante termina cargado a q = C·E₀ y bloquea la corriente continua.',
    representacion: 'El número de cargas visibles y el brillo del campo son proporcionales a q(t)/(C·E₀).',
  },
};
