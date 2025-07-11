export interface User {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'subscriber:monthly' | 'subscriber:unlimited' | 'admin' | 'trial';
  createdAt?: Date;
  updatedAt?: Date;
  active?: boolean; // Nuevo campo para activar/desactivar usuario
}
