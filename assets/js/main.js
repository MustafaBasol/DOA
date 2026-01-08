(() => {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const setupYear = () => {
    const year = qs('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  };

  const setupHeader = () => {
    const toggle = qs('.site-header__toggle');
    const menu = qs('.site-header__links');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (evt) => {
      if (!menu.classList.contains('is-open')) return;
      if (evt.target.closest('.site-header')) return;
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  };

  const setupRevealObserver = () => {
    const animated = qsa('[data-animate]');
    if (!animated.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2 });

    animated.forEach((el) => observer.observe(el));
  };

  const setupParallax = () => {
    const items = qsa('[data-parallax]');
    if (!items.length) return;

    const pointer = { x: 0, y: 0 };

    const update = () => {
      const scrollY = window.scrollY;
      const viewport = window.innerHeight;

      items.forEach((item, index) => {
        const depth = 0.10 + index * 0.04;
        const rect = item.getBoundingClientRect();
        const offsetY = (rect.top + scrollY - viewport / 2) * depth * -0.10;
        const offsetX = pointer.x * depth;
        item.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      });
    };

    window.addEventListener('scroll', () => requestAnimationFrame(update));
    document.addEventListener('pointermove', (evt) => {
      pointer.x = (evt.clientX / window.innerWidth - 0.5) * 24;
      pointer.y = (evt.clientY / window.innerHeight - 0.5) * 18;
      requestAnimationFrame(update);
    }, { passive: true });

    update();
  };

  const setupAnalyticsConsent = () => {
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;

    const acceptBtn = banner.querySelector('.cookie-banner__accept');
    const rejectBtn = banner.querySelector('.cookie-banner__reject');
    const stored = localStorage.getItem('cookieConsent');

    const loadAnalytics = () => {
      if (window.__gaLoaded) return;
      window.__gaLoaded = true;
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=G-5D6FMVNHRD';
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag(){ window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', 'G-5D6FMVNHRD');
    };

    const setConsent = (value) => {
      localStorage.setItem('cookieConsent', value);
      banner.classList.add('cookie-banner--hidden');
      if (value === 'accepted') loadAnalytics();
    };

    if (stored === 'accepted') {
      banner.classList.add('cookie-banner--hidden');
      loadAnalytics();
      return;
    }

    if (stored === 'rejected') {
      banner.classList.add('cookie-banner--hidden');
      return;
    }

    acceptBtn?.addEventListener('click', () => setConsent('accepted'));
    rejectBtn?.addEventListener('click', () => setConsent('rejected'));
  };

const setupForm = () => {
  const form = document.querySelector('.cta__form');
  if (!form) return;

  const button = form.querySelector('.button');
  const honeypot = form.querySelector('#website');

  const normalizeValue = (value, maxLength) => {
    if (!value) return '';
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  };

  const showToast = (msg, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  form.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (honeypot && honeypot.value.trim()) {
      form.reset();
      return;
    }

    const payload = {
      name: normalizeValue(form.querySelector('#name')?.value, 80),
      email: normalizeValue(form.querySelector('#email')?.value, 254),
      message: normalizeValue(form.querySelector('#message')?.value, 280),
      page: location.href,
      ts: new Date().toISOString()
    };

    try {
      button.disabled = true;
      button.textContent = 'Gönderiliyor...';

      const res = await fetch('https://n8n.srv1021253.hstgr.cloud/webhook/79572a93-08d4-4cbf-ae1d-bb58f9a8c393', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Webhook error');
      form.reset();
      showToast('Mesajınız başarıyla gönderildi!', 'success');
      button.textContent = 'Gönderildi';
      setTimeout(() => {
        button.disabled = false;
        button.textContent = 'Gönder';
      }, 1500);

    } catch (e) {
      showToast('Gönderim sırasında bir hata oluştu. Lütfen tekrar deneyin.', 'error');
      button.disabled = false;
      button.textContent = 'Tekrar dene';
    }
  });
};


  setupYear();
  setupHeader();
  setupRevealObserver();
  setupParallax();
  setupAnalyticsConsent();
  setupForm();
})();
