import { Injectable } from '@angular/core';
import { Birds } from '../interface/birds.interface';
import { addDoc, collection, CollectionReference, Firestore } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class BirdsRegisterService {

  constructor(private _firestore: Firestore) { }

  async addBird(email: string, bird: Birds) {
    const birdRef = collection(this._firestore, `bird-records/${email}/Birds`) as CollectionReference<Birds>;
    await addDoc(birdRef, bird);
  }
}
