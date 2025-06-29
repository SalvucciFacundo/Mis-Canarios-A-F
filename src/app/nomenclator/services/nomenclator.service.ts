import { addDoc, collection, collectionData, CollectionReference, deleteDoc, doc, DocumentReference, Firestore, query, updateDoc, where } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';
import { firstValueFrom, map, Observable } from 'rxjs';
import { Nomenclator } from '../interface/nomenclator.interface';
import { HttpClient } from '@angular/common/http';

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

  // async cargarDesdeJsonYEnviarAFirebase(path = 'assets/nomenclador2025FOCI.json'): Promise<void> {
  //   const lineas: Nomenclator[] = await firstValueFrom(this.http.get<Nomenclator[]>(path));

  //   const inserciones = lineas.map(linea =>
  //     addDoc(this.collectionRef, linea)
  //   );

  //   await Promise.all(inserciones);
  //   console.log(`✅ Se cargaron ${inserciones.length} líneas a Firebase desde ${path}`);
  // }
  async cargarDesdeJsonYEnviarAFirebase(path = 'assets/nomenclador2025FOCI.json', federacion: string): Promise<void> {
    const rawLineas: Omit<Nomenclator, 'federacion'>[] = await firstValueFrom(
      this.http.get<Omit<Nomenclator, 'federacion'>[]>(path)
    );

    const lineasConFederacion: Nomenclator[] = rawLineas.map(l => ({
      ...l,
      federacion
    }));

    const batch = lineasConFederacion.map(linea =>
      addDoc(this.collectionRef, linea)
    );

    await Promise.all(batch);

    console.log(`✅ Cargadas ${batch.length} líneas con federación "${federacion}" desde ${path}`);
  }



}
