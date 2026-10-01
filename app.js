/**
 * IELTS Sparta - High-Conversion Landing Page Logic
 * Features:
 * - Conversion tracking event bus (Google Ads / Analytics ready)
 * - Robust form validation with inline feedback & UX best practices
 * - Smooth scroll & auto-focus for all conversion CTAs
 * - Accordion interaction for FAQs with accessible ARIA management
 * - Scroll depth detection (25%, 50%, 75%) and section visibility tracking
 * - Sticky mobile conversion bar with IntersectionObserver
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. CONVERSION TRACKING EVENT BUS
  // ==========================================================================
  const ConversionTracker = {
    eventsDispatched: new Set(),

    track(eventName, params = {}) {
      const payload = {
        event: eventName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        ...params
      };

      // Push to dataLayer if available for GTM / Google Ads
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(payload);

      // Custom window event for external listeners
      window.dispatchEvent(new CustomEvent('sparta_conversion_event', { detail: payload }));

      console.log(`[ConversionTracker] Event: ${eventName}`, payload);
    },

    trackOnce(eventName, params = {}) {
      if (!this.eventsDispatched.has(eventName)) {
        this.eventsDispatched.add(eventName);
        this.track(eventName, params);
      }
    }
  };

  // Dispatch initial landing view
  document.addEventListener('DOMContentLoaded', () => {
    ConversionTracker.trackOnce('landing_view', { offer: 'MockTest_99K_4Skills' });
    initForm();
    initFAQ();
    initScrollTracking();
    initStickyMobileBar();
    initSmoothScrollCTAs();
    initTestimonialCarousel();
    initCountdownTimer();
  });

  // ==========================================================================
  // 2. LEAD FORM UX & VALIDATION
  // ==========================================================================
  function initForm() {
    const form = document.getElementById('ieltsRegistrationForm');
    const nameInput = document.getElementById('fullNameInput');
    const phoneInput = document.getElementById('phoneInput');
    const emailInput = document.getElementById('emailInput');
    const requirementInput = document.getElementById('requirementInput');
    const submitBtn = document.getElementById('formSubmitBtn');

    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');
    const emailError = document.getElementById('emailError');

    const modalOverlay = document.getElementById('successModalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    let formStarted = false;

    // Track lead_form_start on first interaction
    [nameInput, phoneInput, emailInput, requirementInput].forEach(field => {
      if (!field) return;
      field.addEventListener('focus', () => {
        if (!formStarted) {
          formStarted = true;
          ConversionTracker.trackOnce('lead_form_start');
        }
      }, { once: true });
    });

    // Validation patterns
    const validateName = (val) => val.trim().length >= 2;
    const validatePhone = (val) => {
      const cleanPhone = val.replace(/\s+/g, '').replace(/[-.]/g, '');
      // Accepts Vietnam phone standard: 10 digits starting with 0
      return /^(0)(3|5|7|8|9|2)[0-9]{8}$/.test(cleanPhone);
    };
    const validateEmail = (val) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
    };

    // Helper: show/clear inline error
    function setError(inputElem, errorElem, isVisible) {
      if (isVisible) {
        inputElem.classList.add('error');
        errorElem.classList.add('visible');
      } else {
        inputElem.classList.remove('error');
        errorElem.classList.remove('visible');
      }
    }

    // Realtime field validation on input / blur
    nameInput.addEventListener('input', () => {
      if (nameInput.classList.contains('error')) {
        setError(nameInput, nameError, !validateName(nameInput.value));
      }
    });

    phoneInput.addEventListener('input', () => {
      if (phoneInput.classList.contains('error')) {
        setError(phoneInput, phoneError, !validatePhone(phoneInput.value));
      }
    });

    emailInput.addEventListener('input', () => {
      if (emailInput.classList.contains('error')) {
        setError(emailInput, emailError, !validateEmail(emailInput.value));
      }
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const isNameValid = validateName(nameInput.value);
      const isPhoneValid = validatePhone(phoneInput.value);
      const isEmailValid = validateEmail(emailInput.value);

      setError(nameInput, nameError, !isNameValid);
      setError(phoneInput, phoneError, !isPhoneValid);
      setError(emailInput, emailError, !isEmailValid);

      if (!isNameValid || !isPhoneValid || !isEmailValid) {
        // Focus first invalid element
        if (!isNameValid) nameInput.focus();
        else if (!isPhoneValid) phoneInput.focus();
        else emailInput.focus();
        return;
      }

      // UI Loading state
      submitBtn.disabled = true;
      const originalBtnHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>Đang gửi thông tin...</span>`;

      // Track checkout start
      ConversionTracker.track('checkout_start', {
        item_name: 'IELTS Sparta Full Mock Test 4 Ky Nang',
        price: 99000,
        currency: 'VND'
      });

      // Simulate network request
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;

        // Fire conversion events
        ConversionTracker.track('lead_form_submit', {
          fullName: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          email: emailInput.value.trim(),
          offer: '99K'
        });

        ConversionTracker.track('purchase_success', {
          transaction_id: 'SPARTA_' + Date.now(),
          value: 99000,
          currency: 'VND'
        });

        // Reset form & show modal
        form.reset();
        modalOverlay.classList.add('open');
      }, 750);
    });

    // Close modal
    if (modalCloseBtn && modalOverlay) {
      modalCloseBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('open');
      });

      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          modalOverlay.classList.remove('open');
        }
      });
    }
  }

  // ==========================================================================
  // 3. FAQ ACCORDION
  // ==========================================================================
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item-clean, .faq-item');
    faqItems.forEach((item) => {
      const btn = item.querySelector('.faq-btn, .faq-question-btn');
      if (!btn) return;

      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close other items for neat presentation
        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('active');
            const otherBtn = other.querySelector('.faq-btn, .faq-question-btn');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        if (isActive) {
          item.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
          const qText = btn.querySelector('span')?.textContent || '';
          ConversionTracker.track('faq_open', { question: qText });
        }
      });
    });
  }

  // ==========================================================================
  // 4. SCROLL DEPTH & SECTION VIEW TRACKING
  // ==========================================================================
  function initScrollTracking() {
    let scrollDepths = { 25: false, 50: false, 75: false };

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalDocHeight <= 0) return;

      const percentage = Math.round((scrollPos / totalDocHeight) * 100);

      if (percentage >= 25 && !scrollDepths[25]) {
        scrollDepths[25] = true;
        ConversionTracker.trackOnce('scroll_25');
      }
      if (percentage >= 50 && !scrollDepths[50]) {
        scrollDepths[50] = true;
        ConversionTracker.trackOnce('scroll_50');
      }
      if (percentage >= 75 && !scrollDepths[75]) {
        scrollDepths[75] = true;
        ConversionTracker.trackOnce('scroll_75');
      }
    }, { passive: true });

    // Section visibility tracking using IntersectionObserver
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id === 'aiScoringSection') {
              ConversionTracker.trackOnce('writing_result_view');
              ConversionTracker.trackOnce('speaking_result_view');
            } else if (id === 'skillsSection' || id === 'finalCtaSection') {
              ConversionTracker.trackOnce('pricing_view');
            }
          }
        });
      }, { threshold: 0.3 });

      ['aiScoringSection', 'skillsSection', 'finalCtaSection'].forEach(id => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }
  }

  // ==========================================================================
  // 5. STICKY MOBILE CONVERSION BAR
  // ==========================================================================
  function initStickyMobileBar() {
    const stickyBar = document.getElementById('stickyMobileCta');
    const heroSection = document.getElementById('heroSection');
    const leadFormCard = document.getElementById('leadFormCard');

    if (!stickyBar || !heroSection) return;

    if ('IntersectionObserver' in window) {
      // Show sticky bar once hero is scrolled past
      const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && window.scrollY > 300) {
            stickyBar.classList.add('visible');
          } else {
            stickyBar.classList.remove('visible');
          }
        });
      }, { threshold: 0.1 });

      heroObserver.observe(heroSection);

      // Hide sticky bar when lead form is in viewport so it doesn't obstruct
      if (leadFormCard) {
        const formObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              stickyBar.classList.remove('visible');
            } else if (window.scrollY > heroSection.offsetHeight) {
              stickyBar.classList.add('visible');
            }
          });
        }, { threshold: 0.2 });

        formObserver.observe(leadFormCard);
      }
    }
  }

  // ==========================================================================
  // 6. SMOOTH SCROLL FOR ALL CTA BUTTONS
  // ==========================================================================
  function initSmoothScrollCTAs() {
    const ctaButtons = [
      { id: 'heroPrimaryCta', event: 'hero_cta_click' },
      { id: 'navCtaBtn', event: 'nav_cta_click' },
      { id: 'dashboardCtaBtn', event: 'pricing_cta_click' },
      { id: 'finalCtaBtn', event: 'pricing_cta_click' },
      { id: 'stickyBottomCtaBtn', event: 'sticky_cta_click' }
    ];

    ctaButtons.forEach(({ id, event }) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        ConversionTracker.track(event, { button_id: id });

        const formCard = document.getElementById('leadFormCard');
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const firstInput = document.getElementById('fullNameInput');
            if (firstInput) firstInput.focus();
          }, 450);
        }
      });
    });
  }

  // ==========================================================================
  // 7. TESTIMONIALS CAROUSEL SLIDER (PREV / NEXT NAVIGATION)
  // ==========================================================================
  function initTestimonialCarousel() {
    const trackWrapper = document.getElementById('testimonialsTrackWrapper');
    const prevBtn = document.getElementById('testiPrevBtn');
    const nextBtn = document.getElementById('testiNextBtn');
    const dotsContainer = document.getElementById('testiCarouselDots');

    if (!trackWrapper || !prevBtn || !nextBtn) return;

    const cards = trackWrapper.querySelectorAll('.testimonial-card-clean');
    if (!cards.length) return;

    // Build dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      cards.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `testi-dot ${idx === 0 ? 'active' : ''}`;
        dot.type = 'button';
        dot.setAttribute('aria-label', `Đi tới đánh giá ${idx + 1}`);
        dot.addEventListener('click', () => {
          scrollToCard(idx);
        });
        dotsContainer.appendChild(dot);
      });
    }

    function getCardStep() {
      const firstCard = cards[0];
      return firstCard.offsetWidth + 20; // card width + gap
    }

    function updateActiveDot() {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.testi-dot');
      const step = getCardStep();
      const activeIndex = Math.min(Math.round(trackWrapper.scrollLeft / step), cards.length - 1);

      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === activeIndex);
      });
    }

    function scrollToCard(index) {
      const step = getCardStep();
      trackWrapper.scrollTo({
        left: index * step,
        behavior: 'smooth'
      });
    }

    prevBtn.addEventListener('click', () => {
      const step = getCardStep();
      const currentScroll = trackWrapper.scrollLeft;
      if (currentScroll <= 10) {
        // Wrap to the last card
        trackWrapper.scrollTo({
          left: (cards.length - 1) * step,
          behavior: 'smooth'
        });
      } else {
        trackWrapper.scrollBy({ left: -step, behavior: 'smooth' });
      }
    });

    nextBtn.addEventListener('click', () => {
      const step = getCardStep();
      const maxScroll = trackWrapper.scrollWidth - trackWrapper.clientWidth;
      if (trackWrapper.scrollLeft >= maxScroll - 15) {
        // Wrap to the first card
        trackWrapper.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        trackWrapper.scrollBy({ left: step, behavior: 'smooth' });
      }
    });

    let scrollTimeout;
    trackWrapper.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateActiveDot, 50);
    }, { passive: true });
  }

  // ==========================================================================
  // 8. 15-MINUTE COUNTDOWN TIMER FOR EXCLUSIVE OFFER
  // ==========================================================================
  function initCountdownTimer() {
    const cdDays = document.getElementById('cdDays');
    const cdHours = document.getElementById('cdHours');
    const cdMinutes = document.getElementById('cdMinutes');
    const cdSeconds = document.getElementById('cdSeconds');

    if (!cdMinutes || !cdSeconds) return;

    const STORAGE_KEY = 'sparta_15m_offer_countdown';
    let endTime = sessionStorage.getItem(STORAGE_KEY);

    if (!endTime || isNaN(endTime)) {
      endTime = Date.now() + 15 * 60 * 1000;
      sessionStorage.setItem(STORAGE_KEY, endTime);
    } else {
      endTime = parseInt(endTime, 10);
      if (Date.now() > endTime) {
        endTime = Date.now() + 15 * 60 * 1000;
        sessionStorage.setItem(STORAGE_KEY, endTime);
      }
    }

    function updateTimer() {
      const now = Date.now();
      const remainingMs = Math.max(0, endTime - now);
      const remainingSec = Math.floor(remainingMs / 1000);

      const mins = Math.floor((remainingSec % 3600) / 60);
      const secs = remainingSec % 60;

      if (cdDays) cdDays.textContent = '00';
      if (cdHours) cdHours.textContent = '00';
      if (cdMinutes) cdMinutes.textContent = String(mins).padStart(2, '0');
      if (cdSeconds) cdSeconds.textContent = String(secs).padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
  }

})();
