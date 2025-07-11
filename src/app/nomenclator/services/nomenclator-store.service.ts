import { computed, Injectable, signal } from '@angular/core';
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
        await this.loadAllFromAssets(['FOCI', 'FAC', 'FOA']);
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
    // Ordenar por código base según federación
    const getSortBase = () => {
      if (federaciones[0] === 'FOCI') return 'D001';
      if (federaciones[0] === 'FOA') return 'D.001';
      if (federaciones[0] === 'FAC') return 'CO001';
      return '';
    };
    const sortBase = getSortBase();
    const sortByCodigo = (a: Nomenclator, b: Nomenclator) => {
      const codeA = a.code ?? a.codigo ?? '';
      const codeB = b.code ?? b.codigo ?? '';
      if (codeA.startsWith(sortBase[0]) && codeB.startsWith(sortBase[0])) {
        return codeA.localeCompare(codeB);
      }
      if (codeA.startsWith(sortBase[0])) return -1;
      if (codeB.startsWith(sortBase[0])) return 1;
      return codeA.localeCompare(codeB);
    };
    let lineasFiltradas = this.getByFederaciones(federaciones);
    if (!searchTerm) return lineasFiltradas.slice().sort(sortByCodigo);
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    return lineasFiltradas.filter(linea => {
      const cleanCode = this.clean(linea.code ?? linea.codigo ?? '');
      const cleanName = this.clean(linea.name ?? linea.nombre ?? '');
      return (
        cleanCode.includes(searchTerm) ||
        cleanName.includes(searchTerm) ||
        searchWords.every(word => cleanCode.includes(word) || cleanName.includes(word))
      );
    }).sort(sortByCodigo);
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
