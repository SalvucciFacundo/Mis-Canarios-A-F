export interface Birds {
  id?: string;
  origin?: string; // Procedencia del canario (apellido del vendedor, criador, etc.) - campo llenado por el usuario
  registrationSource?: 'manual' | 'breeding'; // Control interno: 'manual' (bird-add) o 'breeding' (couple-add) - campo automático del sistema
  season?: number;
  ringColor?: string;
  ringNumber?: number;
  gender?: string;
  line?: string;
  state?: string;
  stateObservation?: string;
  father?: string;
  mother?: string;
  coupleId?: string; // ID de la pareja que generó este pichón (para cuando se implemente funcionalidad de registro de pichones)
  posture?: number;
  observations?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * NOTA PARA DESARROLLO FUTURO:
 *
 * Cuando se implemente la funcionalidad de registrar pichones desde parejas:
 * 1. Establecer registrationSource: 'breeding'
 * 2. Establecer coupleId: [id de la pareja]
 * 3. Establecer father: [maleId de la pareja]
 * 4. Establecer mother: [femaleId de la pareja]
 * 5. El campo origin debe ser llenado por el usuario (procedencia real del canario)
 *
 * Esto garantizará que los pichones se asocien correctamente con las parejas
 * y evitará los "pichones fantasma" causados por coincidencias en los IDs de padres.
 */

