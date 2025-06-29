import { Injectable, Signal, signal } from '@angular/core';
import { Birds } from '../interface/birds.interface';
import { addDoc, collection, CollectionReference, doc, Firestore, getDocs, getDoc, updateDoc } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class BirdsRegisterService {

  constructor(private _firestore: Firestore) { }
  private _birdsCache = signal<Birds[] | null>(null);


  get cachedBirds(): Signal<Birds[] | null> {
    return this._birdsCache;
  }

  invalidateCache() {
    this._birdsCache.set(null);
  }


  async addBird(email: string, bird: Birds) {
    const birdRef = collection(this._firestore, `bird-records/${email}/Birds`) as CollectionReference<Birds>;
    await addDoc(birdRef, bird);
  }

  async getBirds(email: string): Promise<Birds[]> {
    const cached = this._birdsCache();
    if (cached) return cached;

    const ref = collection(this._firestore, `bird-records/${email}/Birds`);
    const snapshot = await getDocs(ref);
    const birds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Birds));
    this._birdsCache.set(birds);
    return birds;
  }



  // async getBirds(email: string): Promise<Birds[]> {
  //   const birdRef = collection(this._firestore, `bird-records/${email}/Birds`) as CollectionReference<Birds>;
  //   const snapshot = await getDocs(birdRef);
  //   return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Birds));
  //   //return snapshot.docs.map(doc => doc.data());
  // }

  async getBirdById(email: string, id: string): Promise<Birds> {
    const ref = doc(this._firestore, `bird-records/${email}/Birds/${id}`);
    const snap = await getDoc(ref);
    return snap.data() as Birds;
  }

  async updateBird(email: string, id: string, bird: Partial<Birds>): Promise<void> {
    const ref = doc(this._firestore, `bird-records/${email}/Birds/${id}`);
    await updateDoc(ref, {
      ...bird,
      modificationDate: new Date()
    });
  }

}
