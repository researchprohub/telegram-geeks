/* TelegramGeeks — Shared JavaScript */

// ─── Scroll Animations ───
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.animate-in').forEach(el => observer.observe(el));

// ─── FAQ Accordion ───
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const isOpen = item.classList.contains('open');
    // Close all
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    // Toggle current
    if (!isOpen) item.classList.add('open');
  });
});

// ─── Pricing Toggle ───
const toggle = document.getElementById('pricing-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    const isYearly = toggle.classList.contains('active');
    document.querySelectorAll('.price-monthly').forEach(el => el.style.display = isYearly ? 'none' : 'inline');
    document.querySelectorAll('.price-yearly').forEach(el => el.style.display = isYearly ? 'inline' : 'none');
  });
}

// ─── Counter Animation ───
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const increment = target / 60;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current).toLocaleString() + suffix;
  }, 16);
}

document.querySelectorAll('.counter').forEach(el => {
  const target = parseInt(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounter(el, target, suffix);
      obs.disconnect();
    }
  });
  obs.observe(el);
});

// ─── Smooth Scroll ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Navbar Scroll Effect ───
let lastScroll = 0;
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const currentScroll = window.pageYOffset;
  if (currentScroll > 100) {
    nav.style.background = 'rgba(10,10,15,0.95)';
    nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  } else {
    nav.style.background = 'rgba(10,10,15,0.85)';
    nav.style.boxShadow = 'none';
  }
  lastScroll = currentScroll;
});

// ─── Testimonial Carousel ───
let currentSlide = 0;
function showSlide(index) {
  const slides = document.querySelectorAll('.testimonial-slide');
  if (slides.length === 0) return;
  slides.forEach((s, i) => {
    s.style.opacity = i === index ? '1' : '0';
    s.style.transform = i === index ? 'translateX(0)' : 'translateX(20px)';
  });
}
function nextSlide() {
  const slides = document.querySelectorAll('.testimonial-slide');
  currentSlide = (currentSlide + 1) % slides.length;
  showSlide(currentSlide);
}
setInterval(nextSlide, 5000);

console.log('TelegramGeeks scripts loaded');
