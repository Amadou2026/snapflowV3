/**
 * Dashboard JavaScript - Gestion des interactions et animations
 */

class DashboardManager {
  constructor() {
    this.charts = {};
    this.tooltips = [];
    this.animations = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeTooltips();
    this.setupChartAnimations();
    this.initializePerformanceCircles();
  }

  setupEventListeners() {
    // Gestionnaire pour le changement de période
    const periodeSelect = document.getElementById('periodeSelect');
    if (periodeSelect) {
      periodeSelect.addEventListener('change', (e) => {
        this.handlePeriodChange(e.target.value);
      });
    }

    // Gestionnaire pour les cartes cliquables
    document.querySelectorAll('.kpi-clickable').forEach(card => {
      card.addEventListener('click', (e) => {
        this.handleCardClick(e.currentTarget);
      });
    });

    // Gestionnaire pour les hover effects sur les cartes
    document.querySelectorAll('.hover-card').forEach(card => {
      card.addEventListener('mouseenter', (e) => {
        this.animateCardHover(e.currentTarget, true);
      });
      
      card.addEventListener('mouseleave', (e) => {
        this.animateCardHover(e.currentTarget, false);
      });
    });

    // Gestionnaire de redimensionnement pour les graphiques
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
  }

  initializeTooltips() {
    // Initialiser tous les tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    this.tooltips = tooltipTriggerList.map(tooltipTriggerEl => {
      return new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover focus',
        delay: { show: 200, hide: 100 }
      });
    });
  }

  setupChartAnimations() {
    // Configuration des animations pour Chart.js
    Chart.defaults.animation = {
      duration: 1000,
      easing: 'easeInOutQuart'
    };

    Chart.defaults.elements.arc.borderWidth = 2;
    Chart.defaults.elements.arc.hoverBorderWidth = 3;
  }

  initializePerformanceCircles() {
    // Animer les cercles de performance
    const circles = document.querySelectorAll('.performance-circle');
    circles.forEach(circle => {
      this.animatePerformanceCircle(circle);
    });
  }

  animatePerformanceCircle(circle) {
    const value = circle.querySelector('.performance-value');
    if (!value) return;

    const percentage = parseFloat(value.textContent);
    const degrees = (percentage / 100) * 360;
    
    // Animer le dégradé conique
    let currentDegrees = 0;
    const increment = degrees / 50; // 50 étapes d'animation

    const animate = () => {
      if (currentDegrees < degrees) {
        currentDegrees += increment;
        const color = circle.classList.contains('success') ? '#28a745' : '#dc3545';
        circle.style.background = `conic-gradient(from 0deg, #e9ecef ${360 - currentDegrees}deg, ${color} ${360 - currentDegrees}deg)`;
        requestAnimationFrame(animate);
      }
    };

    // Démarrer l'animation avec un délai
    setTimeout(animate, 500);
  }

  handlePeriodChange(period) {
    const indicator = document.getElementById('periodeIndicator');
    const loader = document.getElementById('chartLoader');
    
    if (indicator) {
      const periodText = this.getPeriodText(period);
      indicator.textContent = `Période: ${periodText}`;
      indicator.style.animation = 'pulse 0.6s ease-in-out';
    }

    // Afficher le loader
    if (loader) {
      loader.classList.remove('d-none');
    }

    // Simuler le chargement des données
    this.loadPeriodData(period).then(data => {
      this.updateErrorChart(data);
      if (loader) {
        loader.classList.add('d-none');
      }
    });
  }

  getPeriodText(period) {
    const periods = {
      'jour': 'Dernier jour',
      'semaine': 'Dernière semaine',
      'mois': 'Dernier mois',
      'annee': 'Dernière année'
    };
    return periods[period] || period;
  }

  async loadPeriodData(period) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const projetId = urlParams.get('projet_id');
      const queryParam = projetId ? `?projet_id=${projetId}&periode=${period}` : `?periode=${period}`;
      
      const response = await fetch(`/api/stats/erreurs-par-projet/${queryParam}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      this.showNotification('Erreur lors du chargement des données', 'error');
      return null;
    }
  }

  updateErrorChart(data) {
    if (!data || !this.charts.projetErreurChart) return;

    const chart = this.charts.projetErreurChart;
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.values;
    
    // Animation de mise à jour
    chart.update('active');
  }

  handleCardClick(card) {
    // Ajouter un effet de ripple
    this.createRippleEffect(card);
    
    // Animer la carte
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);
  }

  createRippleEffect(element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: scale(0);
      animation: ripple 600ms linear;
      left: ${rect.width / 2 - size / 2}px;
      top: ${rect.height / 2 - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      pointer-events: none;
      z-index: 1000;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  animateCardHover(card, isHover) {
    const duration = this.animations.duration;
    
    if (isHover) {
      card.style.transition = `all ${duration}ms ${this.animations.easing}`;
      card.style.transform = 'translateY(-4px) scale(1.02)';
    } else {
      card.style.transform = '';
    }
  }

  handleResize() {
    // Redimensionner tous les graphiques
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });
  }

  updateKPIWithAnimation(elementId, newValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.add('kpi-updating');
    
    // Animer le changement de valeur
    const currentValue = parseInt(element.textContent) || 0;
    const targetValue = parseInt(newValue) || 0;
    const duration = 1000;
    const steps = 50;
    const increment = (targetValue - currentValue) / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const displayValue = Math.round(currentValue + (increment * currentStep));
      element.textContent = displayValue + suffix;
      
      if (currentStep >= steps) {
        clearInterval(timer);
        element.textContent = targetValue + suffix;
        element.classList.remove('kpi-updating');
      }
    }, duration / steps);
  }

  showNotification(message, type = 'info', duration = 5000) {
    const toastContainer = this.getOrCreateToastContainer();
    const toast = this.createToast(message, type);
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
      delay: duration
    });
    
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }

  getOrCreateToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
    }
    return container;
  }

  createToast(message, type) {
    const toast = document.createElement('div');
    const bgClass = type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : 'bg-info';
    
    toast.className = `toast align-items-center text-white ${bgClass} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-${this.getIconForType(type)} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    return toast;
  }

  getIconForType(type) {
    const icons = {
      'success': 'check-circle',
      'error': 'exclamation-circle',
      'warning': 'exclamation-triangle',
      'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  // Utilitaire de debounce
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Méthode pour enregistrer un graphique
  registerChart(name, chart) {
    this.charts[name] = chart;
  }

  // Méthode pour détruire les ressources
  destroy() {
    // Détruire les tooltips
    this.tooltips.forEach(tooltip => tooltip.dispose());
    
    // Détruire les graphiques
    Object.values(this.charts).forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    // Nettoyer les événements
    window.removeEventListener('resize', this.handleResize);
  }
}

// Ajouter les animations CSS via JavaScript
const animationStyles = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translate3d(0, 40px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

.slide-in-up {
  animation: slideInUp 0.6s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.fade-in-scale {
  animation: fadeInScale 0.4s ease-out;
}
`;

// Injecter les styles
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Instance globale du gestionnaire de dashboard
let dashboardManager;

// Initialiser le dashboard quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  dashboardManager = new DashboardManager();
  
  // Ajouter les classes d'animation aux éléments
  document.querySelectorAll('.card').forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.classList.add('slide-in-up');
  });
});

// Nettoyer lors du déchargement de la page
window.addEventListener('beforeunload', () => {
  if (dashboardManager) {
    dashboardManager.destroy();
  }
});

// Exposer certaines méthodes globalement pour compatibilité
window.updateKPIWithAnimation = function(elementId, newValue, suffix = '') {
  if (dashboardManager) {
    dashboardManager.updateKPIWithAnimation(elementId, newValue, suffix);
  }
};

window.showToast = function(message, type = 'info') {
  if (dashboardManager) {
    dashboardManager.showNotification(message, type);
  }
};