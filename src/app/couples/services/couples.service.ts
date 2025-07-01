import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Couples } from '../interface/couples.interface';
import { Birds } from '../../birds/interface/birds.interface';

@Injectable({
  providedIn: 'root'
})
export class CouplesService {
  private firestore = inject(Firestore);

  // Obtener la colección de parejas para un usuario específico
  private getCouplesCollection(userId: string) {
    return collection(this.firestore, `bird-records/${userId}/Couples`);
  }

  // Obtener todas las parejas de un usuario
  getCouplesByUser(userId: string): Observable<Couples[]> {
    const couplesCollection = this.getCouplesCollection(userId);
    const q = query(
      couplesCollection,
      orderBy('creationDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Couples[]>;
  }

  // Obtener parejas por temporada
  getCouplesBySeason(userId: string, season: string): Observable<Couples[]> {
    const couplesCollection = this.getCouplesCollection(userId);
    const q = query(
      couplesCollection,
      where('season', '==', season),
      orderBy('creationDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Couples[]>;
  }

  // Crear nueva pareja
  async createCouple(couple: Omit<Couples, 'id'>): Promise<string> {
    try {
      const couplesCollection = this.getCouplesCollection(couple.userId);
      const docRef = await addDoc(couplesCollection, {
        ...couple,
        creationDate: new Date(),
        modificationDate: new Date()
      });
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating couple:', error);
      throw new Error(`Error al crear la pareja: ${error.message}`);
    }
  }

  // Crear múltiples parejas en lote (más eficiente)
  async createCouplesBatch(couples: Omit<Couples, 'id'>[]): Promise<void> {
    try {
      if (couples.length === 0) return;

      const batch = writeBatch(this.firestore);
      const userId = couples[0].userId;
      const couplesCollection = this.getCouplesCollection(userId);

      couples.forEach((couple) => {
        const docRef = doc(couplesCollection);
        batch.set(docRef, {
          ...couple,
          creationDate: new Date(),
          modificationDate: new Date()
        });
      });

      await batch.commit();
    } catch (error: any) {
      console.error('Error creating couples batch:', error);
      throw new Error(`Error al crear las parejas en lote: ${error.message}`);
    }
  }

  // Actualizar pareja
  async updateCouple(id: string, couple: Partial<Couples>): Promise<void> {
    try {
      if (!couple.userId) {
        throw new Error('userId is required for update operation');
      }
      const docRef = doc(this.firestore, `bird-records/${couple.userId}/Couples/${id}`);
      await updateDoc(docRef, {
        ...couple,
        modificationDate: new Date()
      });
    } catch (error: any) {
      console.error('Error updating couple:', error);
      throw new Error(`Error al actualizar la pareja: ${error.message}`);
    }
  }

  // Eliminar pareja
  async deleteCouple(id: string, userId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, `bird-records/${userId}/Couples/${id}`);
      await deleteDoc(docRef);
    } catch (error: any) {
      console.error('Error deleting couple:', error);
      throw new Error(`Error al eliminar la pareja: ${error.message}`);
    }
  }

  // Obtener pareja por ID
  getCoupleById(id: string, userId: string): Observable<Couples | undefined> {
    const couplesCollection = this.getCouplesCollection(userId);
    const q = query(couplesCollection);
    return new Observable(observer => {
      collectionData(q, { idField: 'id' }).subscribe((couples: any[]) => {
        const couple = couples.find(c => c.id === id);
        observer.next(couple as Couples | undefined);
      });
    });
  }

  // Verificar si una pareja ya existe (mismo macho, hembra Y nido en la misma temporada)
  async checkCoupleExists(userId: string, maleId: string, femaleId: string, nestCode: string, season: string): Promise<boolean> {
    try {
      const couplesCollection = this.getCouplesCollection(userId);
      const q = query(
        couplesCollection,
        where('maleId', '==', maleId),
        where('femaleId', '==', femaleId),
        where('nestCode', '==', nestCode),
        where('season', '==', season)
      );
      return new Promise((resolve, reject) => {
        collectionData(q).subscribe({
          next: (couples: any[]) => {
            resolve(couples.length > 0);
          },
          error: (error) => {
            console.error('Error checking couple exists:', error);
            reject(new Error(`Error al verificar si la pareja existe: ${error.message}`));
          }
        });
      });
    } catch (error: any) {
      console.error('Error in checkCoupleExists:', error);
      throw new Error(`Error al verificar existencia de pareja: ${error.message}`);
    }
  }

  // Verificar si los mismos padres ya están registrados (independientemente del nido)
  async checkSameParentsExist(userId: string, maleId: string, femaleId: string, season: string): Promise<boolean> {
    try {
      // Obtener todas las parejas del usuario y filtrar localmente para evitar índices complejos
      return new Promise((resolve, reject) => {
        this.getCouplesByUser(userId).pipe(take(1)).subscribe({
          next: (couples: Couples[]) => {
            const sameParents = couples.some(couple =>
              couple.maleId === maleId &&
              couple.femaleId === femaleId &&
              couple.season === season
            );
            resolve(sameParents);
          },
          error: (error) => {
            console.error('Error checking same parents exist:', error);
            reject(new Error(`Error al verificar padres duplicados: ${error.message}`));
          }
        });
      });
    } catch (error: any) {
      console.error('Error in checkSameParentsExist:', error);
      throw new Error(`Error al verificar padres existentes: ${error.message}`);
    }
  }

  // Verificar si un nido ya está ocupado en una temporada
  async checkNestOccupied(userId: string, nestCode: string, season: string, excludeId?: string): Promise<boolean> {
    const couplesCollection = this.getCouplesCollection(userId);
    const q = query(
      couplesCollection,
      where('nestCode', '==', nestCode),
      where('season', '==', season)
    );

    return new Promise((resolve) => {
      collectionData(q, { idField: 'id' }).subscribe((couples: any[]) => {
        const filteredCouples = excludeId
          ? couples.filter(couple => couple.id !== excludeId)
          : couples;
        resolve(filteredCouples.length > 0);
      });
    });
  }
  // Obtener todas las parejas de un canario específico (como macho o hembra)
  getCouplesByBird(userId: string, birdId: string): Observable<Couples[]> {
    const couplesCollection = this.getCouplesCollection(userId);

    // Obtener todas las parejas del usuario y filtrar localmente
    // Esto evita consultas complejas que requieren índices
    return this.getCouplesByUser(userId).pipe(
      map((couples: Couples[]) => {
        const birdCouples = couples.filter(couple =>
          couple.maleId === birdId || couple.femaleId === birdId
        );
        return birdCouples.sort((a, b) =>
          new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
        );
      })
    );
  }

  // Obtener parejas activas de un canario (sin fecha de fin de postura)
  getActiveCouplesByBird(userId: string, birdId: string): Observable<Couples[]> {
    return this.getCouplesByBird(userId, birdId).pipe(
      map((couples: Couples[]) => couples.filter((couple: Couples) =>
        couple.posture && !couple.postureEndDate
      ))
    );
  }

  // Obtener historial completo de un nido (útil para ver cambios de parejas)
  getNestHistory(userId: string, nestCode: string): Observable<Couples[]> {
    const couplesCollection = this.getCouplesCollection(userId);
    const q = query(
      couplesCollection,
      where('nestCode', '==', nestCode),
      orderBy('creationDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Couples[]>;
  }

  // Finalizar postura (útil cuando se cambia la pareja)
  async finalizePosture(id: string, userId: string, endDate: Date = new Date()): Promise<void> {
    try {
      const docRef = doc(this.firestore, `bird-records/${userId}/Couples/${id}`);
      await updateDoc(docRef, {
        postureEndDate: endDate,
        modificationDate: new Date()
      });
    } catch (error: any) {
      console.error('Error finalizing posture:', error);
      throw new Error(`Error al finalizar la postura: ${error.message}`);
    }
  }

  // Obtener estadísticas de un canario reproductor
  async getBreederStats(userId: string, birdId: string): Promise<{
    totalPairings: number;
    activePairings: number;
    totalSeasons: string[];
    successfulPairings: number; // parejas con al menos 1 huevo eclosionado
  }> {
    return new Promise((resolve) => {
      this.getCouplesByBird(userId, birdId).subscribe((couples: Couples[]) => {
        const totalPairings = couples.length;
        const activePairings = couples.filter(c => c.posture && !c.postureEndDate).length;
        const totalSeasons = [...new Set(couples.map(c => c.season))];
        const successfulPairings = couples.filter(c => (c.hatchedEggs || 0) > 0).length;

        resolve({
          totalPairings,
          activePairings,
          totalSeasons,
          successfulPairings
        });
      });
    });
  }

  // Iniciar nueva postura para una pareja existente
  async startNewPosture(coupleId: string, userId: string, postureData: {
    posture: string;
    postureStartDate: Date;
    observations?: string;
  }): Promise<void> {
    const docRef = doc(this.firestore, `bird-records/${userId}/Couples/${coupleId}`);
    await updateDoc(docRef, {
      ...postureData,
      postureEndDate: null, // Limpiar fecha de fin si existía
      modificationDate: new Date()
    });
  }

  // Obtener todas las posturas de una pareja (útil para historial de posturas)
  getCouplePostureHistory(userId: string, maleId: string, femaleId: string, season: string): Observable<Couples[]> {
    const couplesCollection = this.getCouplesCollection(userId);
    const q = query(
      couplesCollection,
      where('maleId', '==', maleId),
      where('femaleId', '==', femaleId),
      where('season', '==', season),
      orderBy('creationDate', 'asc') // Orden cronológico para ver evolución
    );
    return collectionData(q, { idField: 'id' }) as Observable<Couples[]>;
  }

  // Validar que no haya parejas activas conflictivas antes de crear nueva
  async validateNewCouple(userId: string, maleId: string, femaleId: string, nestCode: string, season: string): Promise<{
    isValid: boolean;
    conflicts: string[];
    warnings: string[];
  }> {
    const conflicts: string[] = [];
    const warnings: string[] = [];

    try {
      // Verificar si los mismos padres ya están registrados (crítico - evita duplicados)
      const sameParentsExist = await this.checkSameParentsExist(userId, maleId, femaleId, season);
      if (sameParentsExist) {
        conflicts.push(`Esta pareja ya existe en la temporada ${season}. No se pueden registrar los mismos padres múltiples veces.`);
      }

      // Verificar si el nido ya está ocupado
      const nestOccupied = await this.checkNestOccupied(userId, nestCode, season);
      if (nestOccupied) {
        conflicts.push(`El nido ${nestCode} ya está ocupado en la temporada ${season}`);
      }

      // Verificar si la hembra ya está activa en otra pareja
      return new Promise((resolve, reject) => {
        this.getActiveCouplesByBird(userId, femaleId).subscribe({
          next: (activeFemaleCouple) => {
            if (activeFemaleCouple.length > 0) {
              conflicts.push(`La hembra ya está activa en otra pareja (Nido: ${activeFemaleCouple[0].nestCode})`);
            }

            // Verificar si el macho ya está activo (solo advertencia, no conflicto)
            this.getActiveCouplesByBird(userId, maleId).subscribe({
              next: (activeMaleCouple) => {
                if (activeMaleCouple.length > 0) {
                  warnings.push(`El macho ya está activo en otra pareja (Nido: ${activeMaleCouple[0].nestCode})`);
                }

                resolve({
                  isValid: conflicts.length === 0,
                  conflicts,
                  warnings
                });
              },
              error: (error) => {
                console.error('Error checking active male couples:', error);
                reject(new Error(`Error al validar parejas activas del macho: ${error.message}`));
              }
            });
          },
          error: (error) => {
            console.error('Error checking active female couples:', error);
            reject(new Error(`Error al validar parejas activas de la hembra: ${error.message}`));
          }
        });
      });
    } catch (error: any) {
      // En caso de error (como índices faltantes), permitir la creación
      console.warn('Error validating couple, allowing creation:', error);
      return {
        isValid: true,
        conflicts: [],
        warnings: ['No se pudieron verificar conflictos debido a limitaciones técnicas']
      };
    }
  }

  // Actualizar estadísticas de huevos/pichones para una pareja
  async updateEggStats(coupleId: string, userId: string, stats: {
    hatchedEggs?: number;
    unhatchedEggs?: number;
    fertiliceEggs?: number;
    unFertiliceEggs?: number;
    brokenEggs?: number;
    deathPiichons?: number;
  }): Promise<void> {
    try {
      const docRef = doc(this.firestore, `bird-records/${userId}/Couples/${coupleId}`);
      await updateDoc(docRef, {
        ...stats,
        modificationDate: new Date()
      });
    } catch (error: any) {
      console.error('Error updating egg stats:', error);
      throw new Error(`Error al actualizar estadísticas de huevos: ${error.message}`);
    }
  }

  // Obtener estadísticas completas de reproducción por temporada
  async getSeasonBreedingStats(userId: string, season: string): Promise<{
    totalCouples: number;
    activeCouples: number;
    totalEggsLaid: number;
    totalHatched: number;
    totalOffspring: number;
    hatchingRate: number;
    avgEggsPerCouple: number;
    avgOffspringPerCouple: number;
  }> {
    return new Promise((resolve) => {
      this.getCouplesBySeason(userId, season).subscribe((couples: Couples[]) => {
        const totalCouples = couples.length;
        const activeCouples = couples.filter(c => c.posture && !c.postureEndDate).length;

        const totalHatched = couples.reduce((sum, c) => sum + (c.hatchedEggs || 0), 0);
        const totalUnhatched = couples.reduce((sum, c) => sum + (c.unhatchedEggs || 0), 0);
        const totalEggsLaid = totalHatched + totalUnhatched;

        const hatchingRate = totalEggsLaid > 0 ? Math.round((totalHatched / totalEggsLaid) * 100) : 0;
        const avgEggsPerCouple = totalCouples > 0 ? Math.round(totalEggsLaid / totalCouples) : 0;
        const avgOffspringPerCouple = totalCouples > 0 ? Math.round(totalHatched / totalCouples) : 0;

        resolve({
          totalCouples,
          activeCouples,
          totalEggsLaid,
          totalHatched,
          totalOffspring: totalHatched, // Los pichones nacidos
          hatchingRate,
          avgEggsPerCouple,
          avgOffspringPerCouple
        });
      });
    });
  }

  /**
   * FUNCIÓN DE EJEMPLO PARA DESARROLLO FUTURO:
   *
   * Cuando se implemente la funcionalidad de registrar pichones desde parejas,
   * se puede usar esta función como base:
   *
   * async registerOffspringFromCouple(
   *   userId: string,
   *   coupleId: string,
   *   offspringData: Partial<Birds> []
   * ): Promise<string[]> {
   *   const birdsCollection = collection(this.firestore, `bird-records/${userId}/Birds`);
   *   const batch = writeBatch(this.firestore);
   *   const newBirdsIds: string[] = [];
   *
   *   // Obtener datos de la pareja
   *   const couple = await this.getCoupleById(userId, coupleId);
   *   if (!couple) throw new Error('Pareja no encontrada');
   *
   *   offspringData.forEach(birdData => {
   *     const newBirdRef = doc(birdsCollection);
   *     const birdToCreate: Birds = {
   *       ...birdData,
   *       registrationSource: 'breeding', // Campo automático del sistema
   *       coupleId: coupleId,             // ID de la pareja que generó este pichón
   *       father: couple.maleId,          // ID del padre
   *       mother: couple.femaleId,        // ID de la madre
   *       // origin sigue siendo llenado por el usuario (procedencia real)
   *       creationDate: new Date(),
   *       modificationDate: new Date()
   *     };
   *
   *     batch.set(newBirdRef, birdToCreate);
   *     newBirdsIds.push(newBirdRef.id);
   *   });
   *
   *   await batch.commit();
   *   return newBirdsIds;
   * }
   */
}
