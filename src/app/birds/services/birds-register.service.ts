import { Injectable } from '@angular/core';
import { Birds } from '../interface/birds.interface';
import { addDoc, collection, CollectionReference, doc, Firestore, getDocs, getDoc } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class BirdsRegisterService {

  constructor(private _firestore: Firestore) { }

  async addBird(email: string, bird: Birds) {
    const birdRef = collection(this._firestore, `bird-records/${email}/Birds`) as CollectionReference<Birds>;
    await addDoc(birdRef, bird);
  }

  async getBirds(email: string): Promise<Birds[]> {
    const birdRef = collection(this._firestore, `bird-records/${email}/Birds`) as CollectionReference<Birds>;
    const snapshot = await getDocs(birdRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Birds));
    //return snapshot.docs.map(doc => doc.data());
  }

  async getBirdById(email: string, id: string): Promise<Birds> {
    const ref = doc(this._firestore, `bird-records/${email}/Birds/${id}`);
    const snap = await getDoc(ref);
    return snap.data() as Birds;
  }


}
