import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent {
  mobileMenuOpen = false;

  features = [
    {
      icon: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l6 6l6-6Z',
      title: 'Gestión de Canarios',
      description: 'Registra y monitorea todos tus canarios con información detallada como anillos, líneas, estados y colores.'
    },
    {
      icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
      title: 'Control de Parejas',
      description: 'Gestiona las parejas reproductoras, controla nidadas, huevos y seguimiento de pichones.'
    },
    {
      icon: 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Nomenclador Oficial',
      description: 'Acceso completo al nomenclador FOCI 2025 con todas las líneas y colores oficiales.'
    },
    {
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l9 6 9-6',
      title: 'Reportes y Estadísticas',
      description: 'Genera reportes detallados sobre tu criadero, estadísticas de reproducción y evolución de tu plantel.'
    },
    {
      icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      title: 'Datos Seguros',
      description: 'Tus datos están seguros en la nube con respaldos automáticos y acceso desde cualquier dispositivo.'
    },
    {
      icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
      title: 'Acceso Rápido',
      description: 'Interfaz intuitiva y rápida diseñada para criadores, con búsquedas avanzadas y filtros inteligentes.'
    }
  ];

  plans = [
    {
      name: 'Plan Gratuito',
      price: 'Gratis',
      period: 'para siempre',
      popular: false,
      features: [
        '30 canarios máximo',
        '10 parejas máximo',
        'Nomenclador básico',
        'Reportes limitados',
        'Soporte por email'
      ],
      limitations: [
        'Sin reportes avanzados',
        'Sin exportación de datos',
        'Sin respaldos automáticos'
      ],
      buttonText: 'Comenzar Gratis',
      buttonLink: '/auth/sign-up'
    },
    {
      name: 'Plan Premium',
      price: '$9.99',
      period: '/mes',
      popular: true,
      features: [
        'Canarios ilimitados',
        'Parejas ilimitadas',
        'Nomenclador completo FOCI',
        'Reportes avanzados y estadísticas',
        'Exportación de datos (Excel, PDF)',
        'Respaldos automáticos',
        'Soporte prioritario',
        'Múltiples temporadas',
        'Análisis genético básico'
      ],
      limitations: [],
      buttonText: 'Comenzar Prueba Gratis',
      buttonLink: '/auth/sign-up'
    }
  ];

  testimonials = [
    {
      name: 'Carlos Rodríguez',
      role: 'Criador Profesional',
      content: 'Esta aplicación ha revolucionado la forma en que gestiono mi criadero. Los reportes son increíbles y me ayudan a tomar mejores decisiones.',
      rating: 5
    },
    {
      name: 'María González',
      role: 'Criadora Aficionada',
      content: 'Fácil de usar y muy completa. El nomenclador FOCI integrado es una característica excelente que ahorra mucho tiempo.',
      rating: 5
    },
    {
      name: 'José Martínez',
      role: 'Club de Canaricultura',
      content: 'Recomendamos esta herramienta a todos nuestros socios. La gestión de parejas y el seguimiento de nidadas es perfecto.',
      rating: 5
    }
  ];

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
