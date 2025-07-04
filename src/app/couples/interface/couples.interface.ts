export interface Couples {
  //datos de la jaula
  id: string;
  userId: string;
  season: string;
  nestCode: string;
  //datos de la pareja
  maleId: string;
  femaleId: string;
  //datos de la nidada
  posture?: string;
  currentPostureNumber?: number;  // Número de la postura actual
  postureStartDate?: Date;
  postureEndDate?: Date;
  //datos de los huevos
  hatchedEggs?: number;
  unhatchedEggs?: number;
  fertiliceEggs?: number;
  unFertiliceEggs?: number;
  brokenEggs?: number;
  //bajas de pichones
  deathPiichons?: number;
  observations?: string;
  postureObservations?: string;  // Observaciones específicas de postura
  creationDate: Date;
  modificationDate?: Date;
}
