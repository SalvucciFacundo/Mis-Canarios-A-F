import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
// import { addDoc, collection, collectionData, CollectionReference, deleteDoc, doc, DocumentReference, Firestore, query, updateDoc, where } from '@angular/fire/firestore';
import { firstValueFrom } from 'rxjs';
import { Nomenclator } from '../interface/nomenclator.interface';

@Injectable({
  providedIn: 'root'
})
export class NomenclatorService {
  // collectionRef: CollectionReference<Nomenclator>;

  constructor(
    // private firestore: Firestore,
    private http: HttpClient
  ) {
    // this.collectionRef = collection(this.firestore, 'lineas') as CollectionReference<Nomenclator>;
  }

  // Métodos Firestore eliminados/comentados:
  // getAll() { ... }
  // getByFederacion(federacion: string) { ... }
  // create(linea: Omit<Nomenclator, 'id'>) { ... }
  // update(id: string, data: Partial<Nomenclator>) { ... }
  // delete(id: string) { ... }

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
// Métodos de acceso a Firestore eliminados. El sistema de nomencladores solo usa JSON de assets.
