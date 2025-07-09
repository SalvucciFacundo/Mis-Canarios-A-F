import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, CollectionReference, deleteDoc, doc, DocumentReference, Firestore, query, updateDoc, where } from '@angular/fire/firestore';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Nomenclator } from '../interface/nomenclator.interface';

@Injectable({
  providedIn: 'root'
})
export class NomenclatorService {

  collectionRef: CollectionReference<Nomenclator>;

  constructor(private firestore: Firestore, private http: HttpClient) {
    this.collectionRef = collection(this.firestore, 'lineas') as CollectionReference<Nomenclator>;
  }

  // getAll(): Observable<Nomenclator[]> {
  //   return collectionData(this.collectionRef, { idField: 'id' }) as Observable<Nomenclator[]>;
  // }
  getAll() {
    const colRef = collection(this.firestore, 'lineas');
    return collectionData(colRef, { idField: 'id' }).pipe(
      map((docs: any[]) =>
        docs.map(doc => ({
          id: doc.id,
          code: doc.codigo,
          name: doc.nombre,
          federation: doc.federacion
        }) as Nomenclator)
      )
    );
  }


  getByFederacion(federacion: string): Observable<Nomenclator[]> {
    const q = query(this.collectionRef, where('federacion', '==', federacion));
    return collectionData(q, { idField: 'id' }) as Observable<Nomenclator[]>;
  }

  create(linea: Omit<Nomenclator, 'id'>): Promise<DocumentReference> {
    return addDoc(this.collectionRef, linea);
  }

  update(id: string, data: Partial<Nomenclator>): Promise<void> {
    return updateDoc(doc(this.firestore, 'lineas', id), data);
  }

  delete(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, 'lineas', id));
  }

  /**
   * Devuelve un array de objetos desde un JSON en assets.
   * @param path Ruta al JSON en assets
   */
  getJsonFromAssets(path: string) {
    return this.http.get<any[]>(path);
  }

  /**
   * Obtiene las líneas de nomenclador desde un JSON de assets según la federación.
   * @param federacion 'FOCI' | 'FAC' | 'FOA'
   */
  async getLineasByFederacionFromAssets(federacion: string): Promise<Nomenclator[]> {
    let path = '';
    switch (federacion.toUpperCase()) {
      case 'FOCI':
        path = 'assets/Nomenclador FOCI.json';
        break;
      case 'FOA':
        path = 'assets/Nomenclador FOA.json';
        break;
      case 'FAC':
        path = 'assets/Nomenclador FAC.json';
        break;
      default:
        throw new Error('Federación no soportada');
    }
    return await firstValueFrom(this.http.get<Nomenclator[]>(path));
  }

}
// Métodos de carga masiva y eliminación masiva eliminados para evitar operaciones directas sobre Firebase.
