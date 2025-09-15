// static/js/script.js
document.addEventListener('DOMContentLoaded', function() {
    // ===== SMOOTH SCROLLING =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.backdropFilter = 'blur(10px)';
                navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 1)';
                navbar.style.backdropFilter = 'none';
                navbar.style.boxShadow = 'none';
            }
        });
    }

    // ===== ANIMATE ELEMENTS ON SCROLL =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, observerOptions);

    // Observe elements for fade animation
    document.querySelectorAll('.feature-card, .hero-title, .hero-subtitle, .pricing-card, .guarantee-item').forEach(el => {
        fadeObserver.observe(el);
    });

    // ===== COUNTER ANIMATION FOR STATS =====
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => statsObserver.observe(stat));
    }

    function animateCounter(element) {
        const target = parseInt(element.textContent);
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + (element.textContent.includes('%') ? '%' : '+');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + (element.textContent.includes('%') ? '%' : '+');
            }
        }, duration / steps);
    }

    // ===== PRICING TOGGLE FUNCTIONALITY =====
    const pricingToggle = document.getElementById('pricingToggle');
    const monthlyPrices = document.querySelectorAll('.monthly-price');
    const annualPrices = document.querySelectorAll('.annual-price');

    if (pricingToggle) {
        pricingToggle.addEventListener('change', function() {
            if (this.checked) {
                // Switch to annual pricing
                monthlyPrices.forEach(price => {
                    price.classList.add('d-none');
                    price.style.opacity = '0';
                    price.style.transform = 'translateY(-20px)';
                });
                annualPrices.forEach(price => {
                    price.classList.remove('d-none');
                    setTimeout(() => {
                        price.style.opacity = '1';
                        price.style.transform = 'translateY(0)';
                    }, 50);
                });
            } else {
                // Switch to monthly pricing
                annualPrices.forEach(price => {
                    price.classList.add('d-none');
                    price.style.opacity = '0';
                    price.style.transform = 'translateY(-20px)';
                });
                monthlyPrices.forEach(price => {
                    price.classList.remove('d-none');
                    setTimeout(() => {
                        price.style.opacity = '1';
                        price.style.transform = 'translateY(0)';
                    }, 50);
                });
            }
        });
    }

    // ===== PRICING CARDS ANIMATION =====
    const pricingObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.style.transition = 'all 0.6s ease';
                }, index * 200);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.pricing-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'all 0.6s ease';
        pricingObserver.observe(card);
    });

    // ===== HERO IMAGE PARALLAX EFFECT =====
    const heroImage = document.querySelector('.hero-image');
    if (heroImage) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            heroImage.style.transform = `translate3d(0px, ${rate}px, 0px)`;
        });
    }

    // ===== FLOATING CARD ANIMATION =====
    const floatingCard = document.querySelector('.floating-card');
    if (floatingCard) {
        setInterval(() => {
            floatingCard.style.transform = 'translateY(-5px)';
            setTimeout(() => {
                floatingCard.style.transform = 'translateY(0)';
            }, 1000);
        }, 2000);
    }

    // ===== FORM VALIDATION =====
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours...';
            submitBtn.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>Message envoyé !';
                submitBtn.classList.add('btn-success');
                this.reset();
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('btn-success');
                }, 3000);
            }, 2000);
        });
    }

    // ===== LAZY LOADING FOR IMAGES =====
    const lazyImages = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // ===== BACK TO TOP BUTTON =====
    const backToTop = document.createElement('button');
    backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTop.className = 'btn btn-primary back-to-top';
    backToTop.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    `;
    document.body.appendChild(backToTop);

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    });

    // ===== INITIALIZE ALL ANIMATIONS =====
    setTimeout(() => {
        // Trigger initial scroll event to set navbar state
        window.dispatchEvent(new Event('scroll'));
        
        // Add initial animations
        document.querySelectorAll('.hero-title, .hero-subtitle').forEach(el => {
            el.classList.add('animate-fade-in-up');
        });
    }, 100);
});

// ===== RESIZE OBSERVER FOR RESPONSIVE ADJUSTMENTS =====
const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
        if (entry.contentRect.width < 768) {
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    });
});

resizeObserver.observe(document.body);