export interface Nomenclator {
  id?: string;
  code?: string;
  name?: string;
  federation?: 'FAC' | 'FOA' | 'FOCI';
  // Permitir compatibilidad con los JSON de assets
  codigo?: string;
  nombre?: string;
}
