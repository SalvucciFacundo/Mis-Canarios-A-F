export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'subscriber:monthly' | 'subscriber:unlimited' | 'admin' | 'trial' | 'family';
  createdAt?: Date;
  updatedAt?: Date;
  active?: boolean; // Nuevo campo para activar/desactivar usuario
}
