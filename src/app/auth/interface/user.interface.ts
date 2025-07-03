export interface User {
  uid: string;
  name: string;
  email: string;
  password?: string; // Opcional porque no debemos almacenar la contraseña en la base de datos
  role: 'user' | 'subscriber' | 'admin';
  createdAt?: Date;
  updatedAt?: Date;
}
