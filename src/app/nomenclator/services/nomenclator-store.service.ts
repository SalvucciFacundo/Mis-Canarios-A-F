import { computed, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from '../../shared/services/loading.service';
import { Nomenclator } from '../interface/nomenclator.interface';
import { NomenclatorService } from './nomenclator.service';

@Injectable({
  providedIn: 'root'
})
export class NomenclatorStoreService {

  private readonly _lineas = signal<Nomenclator[]>([]);
  readonly lineas = computed(() => this._lineas()); // expuesta públicamente

  constructor(private service: NomenclatorService, private loadingService: LoadingService) { }

  async loadAllOnce() {
    if (this._lineas().length === 0) {
      await this.loadingService.showContentTransition('Cargando nomencladores...', 1000);
      try {
        const lineas = await firstValueFrom(this.service.getAll());
        this._lineas.set(lineas);
      } finally {
        this.loadingService.hidePageTransition();
      }
    }
  }

  clean(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // getByFederaciones(federaciones: string[]): Nomenclator[] {
  //   return this._lineas().filter(l => federaciones.includes(l.federation));
  // }
  // getByFederaciones(federaciones: string[]): Nomenclator[] {
  //   console.log('🧩 Federations:', this._lineas().map(l => l.federation));
  //   const feds = federaciones.map(f => f.toUpperCase().trim());
  //   return this._lineas().filter(l =>
  //     feds.includes(l.federation.toUpperCase().trim())
  //   );
  // }
  getByFederaciones(federaciones: string[]): Nomenclator[] {
    const feds = federaciones.map(f => f.toUpperCase().trim());

    return this._lineas().filter(l => {
      const fed = l.federation?.toUpperCase().trim();
      return fed ? feds.includes(fed) : false;
    });
  }




  searchByCodigoONombre(term: string, federaciones: string[]): Nomenclator[] {
    const searchTerm = this.clean(term.trim());
    // Ordenar por código ascendente, partiendo desde D001 en adelante
    const sortByCodigoDesdeD001 = (a: Nomenclator, b: Nomenclator) => {
      const codeA = a.code ?? '';
      const codeB = b.code ?? '';
      // Si ambos empiezan por D, comparar normalmente
      if (codeA.startsWith('D') && codeB.startsWith('D')) {
        return codeA.localeCompare(codeB);
      }
      // Si solo uno empieza por D, ese va primero
      if (codeA.startsWith('D')) return -1;
      if (codeB.startsWith('D')) return 1;
      // Si ninguno empieza por D, comparar normalmente
      return codeA.localeCompare(codeB);
    };

    if (!searchTerm) {
      return this.getByFederaciones(federaciones)
        .slice()
        .sort(sortByCodigoDesdeD001);
    }

    // Dividir el término de búsqueda en palabras individuales
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);

    return this.getByFederaciones(federaciones)
      .map(linea => {
        const cleanCode = this.clean(linea.code ?? '');
        const cleanName = this.clean(linea.name ?? '');
        const fullText = `${cleanCode} ${cleanName}`;

        // Calcular puntuación de relevancia
        let score = 0;

        // Bonificación si coincide exactamente con el código
        if (cleanCode === searchTerm) {
          score += 1000;
        }

        // Bonificación si coincide exactamente con el nombre
        if (cleanName === searchTerm) {
          score += 900;
        }

        // Bonificación si el código contiene el término completo
        if (cleanCode.includes(searchTerm)) {
          score += 800;
        }

        // Bonificación si el nombre contiene el término completo
        if (cleanName.includes(searchTerm)) {
          score += 700;
        }

        // Bonificación si el texto completo contiene el término
        if (fullText.includes(searchTerm)) {
          score += 600;
        }

        // Puntuación por palabras individuales
        searchWords.forEach(word => {
          if (cleanCode.includes(word)) {
            score += 50;
          }
          if (cleanName.includes(word)) {
            score += 40;
          }

          // Bonificación extra si la palabra está al inicio
          if (cleanCode.startsWith(word)) {
            score += 30;
          }
          if (cleanName.startsWith(word)) {
            score += 25;
          }
        });

        // Solo retornar si hay alguna coincidencia
        const hasMatch = searchWords.every(word =>
          cleanCode.includes(word) || cleanName.includes(word)
        ) || cleanCode.includes(searchTerm) || cleanName.includes(searchTerm);

        return { linea, score: hasMatch ? score : 0 };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score) // Ordenar por relevancia (mayor a menor)
      .map(item => item.linea)
      .sort(sortByCodigoDesdeD001);
  }


  // searchByCodigoONombre(term: string, federaciones: string[]): Nomenclator[] {
  //   const txt = term.toLowerCase().trim();
  //   return this.getByFederaciones(federaciones).filter(
  //     l =>
  //       (l.code && l.code.toLowerCase().includes(txt)) ||
  //       (l.name && l.name.toLowerCase().includes(txt))
  //   );
  // }

  getById(id: string): Nomenclator | undefined {
    return this._lineas().find(l => l.id === id);
  }

  add(linea: Nomenclator) {
    this._lineas.update(all => [...all, linea]);
  }

  update(id: string, changes: Partial<Nomenclator>) {
    this._lineas.update(all =>
      all.map(l => (l.id === id ? { ...l, ...changes } : l))
    );
  }

  remove(id: string) {
    this._lineas.update(all => all.filter(l => l.id !== id));
  }

  // Métodos de carga masiva y eliminación masiva eliminados para evitar operaciones directas sobre Firebase.

  /**
   * Carga todas las líneas de los nomencladores de assets según la federación y las expone en el store.
   * Si se pasan varias federaciones, concatena los resultados.
   */
  async loadAllFromAssets(federaciones: string[]) {
    let allLineas: Nomenclator[] = [];
    for (const fed of federaciones) {
      const lineas = await this.service.getLineasByFederacionFromAssets(fed);
      allLineas = allLineas.concat(lineas.map(l => ({ ...l, federation: fed as 'FOCI' | 'FAC' | 'FOA' })));
    }
    this._lineas.set(allLineas);
  }




}
