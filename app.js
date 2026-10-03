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
  // 0. CONFIGURATION
  // ==========================================================================
  // ⚠️ THAY URL BÊN DƯỚI BẰNG ENDPOINT GOOGLE APPS SCRIPT CỦA BẠN
  // Hướng dẫn deploy: xem file google_apps_script.js
  const FORM_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

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
    initHeaderNavigation();
    initForm();
    initFAQ();
    initScrollTracking();
    initStickyMobileBar();
    initSmoothScrollCTAs();
    initTestimonialCarousel();
    initCountdownTimer();
    initSoftwareScreensTabs();
    initFormCountdownTimer();
    initNumberTicker();
    initAiSimulator();
    initPricingPackages();
  });

  // ==========================================================================
  // 2. LEAD FORM UX & VALIDATION
  // ==========================================================================
  function initForm() {
    const form = document.getElementById('ieltsRegistrationForm');
    const nameInput = document.getElementById('fullNameInput');
    const phoneInput = document.getElementById('phoneInput');
    const submitBtn = document.getElementById('formSubmitBtn');

    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');

    const modalOverlay = document.getElementById('successModalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');

    if (!form || !nameInput || !phoneInput) return;

    let formStarted = false;

    // Track lead_form_start on first interaction
    [nameInput, phoneInput].forEach(field => {
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

    // Helper: show/clear inline error
    function setError(inputElem, errorElem, isVisible) {
      if (!inputElem || !errorElem) return;
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

    // Package selector pills in hero form
    const pkgPills = document.querySelectorAll('.pkg-pill');
    const selectedPkgInput = document.getElementById('selectedPackageInput');
    const selectedPriceInput = document.getElementById('selectedPriceInput');

    function selectFormPackage(pkgKey) {
      pkgPills.forEach(pill => {
        const isMatch = pill.getAttribute('data-pkg') === pkgKey;
        pill.classList.toggle('active', isMatch);
        if (isMatch) {
          const price = pill.getAttribute('data-price') || '99000';
          const label = pill.getAttribute('data-label') || 'BẮT ĐẦU THI NGAY';
          if (selectedPkgInput) selectedPkgInput.value = pkgKey;
          if (selectedPriceInput) selectedPriceInput.value = price;
          if (submitBtn) {
            const btnSpan = submitBtn.querySelector('span');
            if (btnSpan) btnSpan.textContent = label;
          }
        }
      });
    }

    pkgPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const pkg = pill.getAttribute('data-pkg');
        selectFormPackage(pkg);
        ConversionTracker.track('package_pill_select', { package: pkg });
      });
    });

    // Form submission — REAL BACKEND via Google Apps Script
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const isNameValid = validateName(nameInput.value);
      const isPhoneValid = validatePhone(phoneInput.value);

      setError(nameInput, nameError, !isNameValid);
      setError(phoneInput, phoneError, !isPhoneValid);

      if (!isNameValid || !isPhoneValid) {
        if (!isNameValid) nameInput.focus();
        else phoneInput.focus();
        return;
      }

      // UI Loading state
      submitBtn.disabled = true;
      const originalBtnHTML = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span>Đang gửi thông tin...</span>`;

      // Capture UTM params and package choice
      const urlParams = new URLSearchParams(window.location.search);
      const cleanPhone = phoneInput.value.trim().replace(/\s+/g, '').replace(/[-.]/g, '');
      const chosenPkg = selectedPkgInput ? selectedPkgInput.value : 'mock99';
      const chosenPrice = parseInt(selectedPriceInput ? selectedPriceInput.value : '99000', 10);
      const pkgTitles = {
        mock99: 'Gói Thi Thử 99K',
        save400: 'Gói Tiết Kiệm 400K / 30 ngày',
        hard850: 'Gói Chăm Chỉ 850K / 30 ngày'
      };
      const chosenTitle = pkgTitles[chosenPkg] || 'Gói Thi Thử 99K';

      const leadData = {
        fullName: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        cleanPhone: cleanPhone,
        package: chosenPkg,
        packageTitle: chosenTitle,
        packagePrice: chosenPrice,
        utmSource: urlParams.get('utm_source') || '',
        utmMedium: urlParams.get('utm_medium') || '',
        utmCampaign: urlParams.get('utm_campaign') || '',
        pageUrl: window.location.href
      };

      // Helper to configure dynamic VietQR modal
      function setupVietQRModal(phone, price = 99000, pkgTitle = 'Gói Thi Thử 99K') {
        const transferNote = `SPARTA ${phone}`;
        const vietqrImg = document.getElementById('vietqrImg');
        const transferNoteText = document.getElementById('transferNoteText');
        const modalPriceVal = document.getElementById('modalPriceVal');
        const modalSubDesc = document.getElementById('modalSubDesc');

        if (vietqrImg) {
          vietqrImg.src = `https://img.vietqr.io/image/970422-0936488338-compact2.png?amount=${price}&addInfo=${encodeURIComponent(transferNote)}&accountName=SPARTA%20EDU`;
        }
        if (transferNoteText) {
          transferNoteText.textContent = transferNote;
        }
        if (modalPriceVal) {
          modalPriceVal.textContent = price.toLocaleString('vi-VN') + 'đ';
        }
        if (modalSubDesc) {
          modalSubDesc.textContent = `Quét mã VietQR để kích hoạt ${pkgTitle} và nhận tài khoản ngay`;
        }
      }

      // Track checkout start
      ConversionTracker.track('checkout_start', {
        item_name: leadData.packageTitle,
        price: leadData.packagePrice,
        currency: 'VND'
      });

      // Send data to backend
      const sendToBackend = (FORM_ENDPOINT && FORM_ENDPOINT !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE')
        ? fetch(FORM_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(leadData)
          }).then(res => res.json())
        : new Promise(resolve => setTimeout(() => resolve({ status: 'success' }), 750));

      sendToBackend
        .then(result => {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;

          // Fire conversion events
          ConversionTracker.track('lead_form_submit', {
            fullName: leadData.fullName,
            phone: leadData.phone,
            package: leadData.package,
            offer: leadData.packagePrice + 'VND'
          });

          ConversionTracker.track('purchase_success', {
            transaction_id: 'SPARTA_' + Date.now(),
            value: leadData.packagePrice,
            currency: 'VND',
            package: leadData.package
          });

          // Set up dynamic VietQR with phone, price & open modal
          setupVietQRModal(leadData.cleanPhone, leadData.packagePrice, leadData.packageTitle);
          form.reset();
          modalOverlay.classList.add('open');
        })
        .catch(err => {
          console.error('[IELTS Sparta] Form submission error:', err);
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;

          // Still show modal + track even on network error
          ConversionTracker.track('lead_form_submit', {
            fullName: leadData.fullName,
            phone: leadData.phone,
            package: leadData.package,
            offer: leadData.packagePrice + 'VND',
            error: true
          });
          setupVietQRModal(leadData.cleanPhone, leadData.packagePrice, leadData.packageTitle);
          form.reset();
          modalOverlay.classList.add('open');
        });
    });

    // Copy to clipboard helper
    function copyTextToClipboard(text, btnElem, defaultLabel = 'Sao chép') {
      if (!btnElem) return;
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
          btnElem.textContent = '✓ Đã chép';
          setTimeout(() => { btnElem.textContent = defaultLabel; }, 2000);
        }).catch(() => fallbackCopy(text, btnElem, defaultLabel));
      } else {
        fallbackCopy(text, btnElem, defaultLabel);
      }
    }

    function fallbackCopy(text, btnElem, defaultLabel) {
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        btnElem.textContent = '✓ Đã chép';
        setTimeout(() => { btnElem.textContent = defaultLabel; }, 2000);
      } catch (err) {
        btnElem.textContent = 'Lỗi';
        setTimeout(() => { btnElem.textContent = defaultLabel; }, 2000);
      }
    }

    // Initialize Copy Buttons in VietQR Modal
    const copyAccountBtn = document.getElementById('copyAccountBtn');
    const bankAccountNum = document.getElementById('bankAccountNum');
    if (copyAccountBtn) {
      copyAccountBtn.addEventListener('click', () => {
        const accNum = bankAccountNum ? bankAccountNum.textContent.replace(/\s+/g, '') : '0936488338';
        copyTextToClipboard(accNum, copyAccountBtn);
        ConversionTracker.track('vietqr_copy_account');
      });
    }

    const copyNoteBtn = document.getElementById('copyNoteBtn');
    if (copyNoteBtn) {
      copyNoteBtn.addEventListener('click', () => {
        const transferNoteText = document.getElementById('transferNoteText');
        const note = transferNoteText ? transferNoteText.textContent.trim() : 'SPARTA THI THU';
        copyTextToClipboard(note, copyNoteBtn);
        ConversionTracker.track('vietqr_copy_note');
      });
    }

    // Close modal
    if (modalCloseBtn && modalOverlay) {
      modalCloseBtn.addEventListener('click', () => {
        ConversionTracker.track('vietqr_confirm_paid');
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

    if (!trackWrapper) return;

    const cards = trackWrapper.querySelectorAll('.testimonial-card-clean');
    if (!cards.length) return;

    let currentIndex = 0;
    let autoPlayInterval = null;
    let isUserInteracting = false;

    function getCardStep() {
      const firstCard = cards[0];
      const track = trackWrapper.querySelector('.testimonials-track');
      let gap = 24;
      if (track) {
        const computed = window.getComputedStyle(track);
        gap = parseFloat(computed.gap) || 24;
      }
      return (firstCard ? firstCard.offsetWidth : 350) + gap;
    }

    function scrollToCard(index) {
      currentIndex = Math.max(0, Math.min(index, cards.length - 1));
      const step = getCardStep();
      trackWrapper.scrollTo({
        left: currentIndex * step,
        behavior: 'smooth'
      });
      updateActiveDot();
    }

    function updateActiveDot() {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.testi-dot');
      const step = getCardStep();
      if (step <= 0) return;
      const activeIndex = Math.min(Math.round(trackWrapper.scrollLeft / step), cards.length - 1);
      currentIndex = Math.max(0, activeIndex);

      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

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
          pauseAutoPlayTemporarily();
        });
        dotsContainer.appendChild(dot);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const target = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1;
        scrollToCard(target);
        pauseAutoPlayTemporarily();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const target = (currentIndex + 1) % cards.length;
        scrollToCard(target);
        pauseAutoPlayTemporarily();
      });
    }

    let scrollTimeout;
    trackWrapper.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateActiveDot, 60);
    }, { passive: true });

    // Clean auto-advance every 6s without continuous drifting
    function startAutoPlay() {
      stopAutoPlay();
      autoPlayInterval = setInterval(() => {
        if (!isUserInteracting) {
          const nextIndex = (currentIndex + 1) % cards.length;
          scrollToCard(nextIndex);
        }
      }, 6000);
    }

    function stopAutoPlay() {
      if (autoPlayInterval) clearInterval(autoPlayInterval);
    }

    function pauseAutoPlayTemporarily() {
      isUserInteracting = true;
      stopAutoPlay();
      setTimeout(() => {
        isUserInteracting = false;
        startAutoPlay();
      }, 5000);
    }

    trackWrapper.addEventListener('mouseenter', () => { isUserInteracting = true; });
    trackWrapper.addEventListener('mouseleave', () => { isUserInteracting = false; });
    trackWrapper.addEventListener('touchstart', () => { isUserInteracting = true; }, { passive: true });
    trackWrapper.addEventListener('touchend', () => {
      setTimeout(() => { isUserInteracting = false; }, 3000);
    }, { passive: true });

    startAutoPlay();
  }

  // ==========================================================================
  // 8. REALISTIC SOFTWARE EXAM COUNTDOWN TIMERS (HERO & PRODUCT SECTION)
  // ==========================================================================
  function initCountdownTimer() {
    const heroTimer = document.getElementById('heroSoftwareTimer');
    const sectionTimer = document.getElementById('softwareExamTimer');

    if (heroTimer || sectionTimer) {
      let remainingSeconds = 32 * 60 + 16;

      function updateExamTimer() {
        if (remainingSeconds > 0) {
          remainingSeconds--;
        }
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        if (heroTimer) heroTimer.textContent = timeStr;
        if (sectionTimer) sectionTimer.textContent = timeStr;
      }

      setInterval(updateExamTimer, 1000);
    }
  }

  // ==========================================================================
  // 9. SOFTWARE SCREENSHOT TABS (LISTENING & WRITING REAL UI)
  // ==========================================================================
  function initSoftwareScreensTabs() {
    const tabButtons = document.querySelectorAll('.software-tab-btn');
    const slides = document.querySelectorAll('.software-img-slide');

    if (!tabButtons.length || !slides.length) return;

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        if (!targetId) return;

        tabButtons.forEach(b => b.classList.remove('active'));
        slides.forEach(s => s.classList.remove('active'));

        btn.classList.add('active');
        const targetSlide = document.getElementById(targetId);
        if (targetSlide) {
          targetSlide.classList.add('active');
          ConversionTracker.track('software_tab_click', { tab: targetId });
        }
      });
    });
  }

  // ==========================================================================
  // 10. FORM COUNTDOWN TIMER — PERSISTENT (localStorage)
  // ==========================================================================
  function initFormCountdownTimer() {
    const daysEl = document.getElementById('countdownDays');
    const hoursEl = document.getElementById('countdownHours');
    const minsEl = document.getElementById('countdownMinutes');
    const secsEl = document.getElementById('countdownSeconds');

    const finalDaysEl = document.getElementById('finalCountdownDays');
    const finalHoursEl = document.getElementById('finalCountdownHours');
    const finalMinsEl = document.getElementById('finalCountdownMinutes');
    const finalSecsEl = document.getElementById('finalCountdownSeconds');

    if (!hoursEl && !finalHoursEl) return;

    const COUNTDOWN_KEY = 'sparta_countdown_end_v1';
    const COUNTDOWN_DURATION = (4 * 3600 + 15 * 60) * 1000; // 4h15m in ms

    // Get or set end time from localStorage
    let endTime = parseInt(localStorage.getItem(COUNTDOWN_KEY), 10);
    if (!endTime || isNaN(endTime) || endTime <= Date.now()) {
      endTime = Date.now() + COUNTDOWN_DURATION;
      localStorage.setItem(COUNTDOWN_KEY, endTime.toString());
    }

    function renderCountdown() {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

      if (remaining <= 0) {
        // Renew countdown for next cycle
        endTime = Date.now() + COUNTDOWN_DURATION;
        localStorage.setItem(COUNTDOWN_KEY, endTime.toString());
      }

      const d = Math.floor(remaining / 86400);
      const h = Math.floor((remaining % 86400) / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;

      const dStr = String(d).padStart(2, '0');
      const hStr = String(h).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      const sStr = String(s).padStart(2, '0');

      if (daysEl) daysEl.textContent = dStr;
      if (hoursEl) hoursEl.textContent = hStr;
      if (minsEl) minsEl.textContent = mStr;
      if (secsEl) secsEl.textContent = sStr;

      if (finalDaysEl) finalDaysEl.textContent = dStr;
      if (finalHoursEl) finalHoursEl.textContent = hStr;
      if (finalMinsEl) finalMinsEl.textContent = mStr;
      if (finalSecsEl) finalSecsEl.textContent = sStr;
    }

    renderCountdown();
    setInterval(renderCountdown, 1000);
  }

  // ==========================================================================
  // 11. TOP NAVIGATION / HEADER LOGIC (SPARTA EDU)
  // ==========================================================================
  function initHeaderNavigation() {
    const header = document.getElementById('mainHeader');
    const mobileToggle = document.getElementById('navMobileToggle');
    const mobileDrawer = document.getElementById('mobileNavDrawer');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    const sections = [
      { id: 'productExperienceSection', linkSelector: 'a[href="#productExperienceSection"]' },
      { id: 'aiScoringSection', linkSelector: 'a[href="#aiScoringSection"]' },
      { id: 'comparisonSection', linkSelector: 'a[href="#comparisonSection"]' },
      { id: 'pricingSection', linkSelector: 'a[href="#pricingSection"]' },
      { id: 'testimonialsSection', linkSelector: 'a[href="#testimonialsSection"]' },
      { id: 'faqSection', linkSelector: 'a[href="#faqSection"]' }
    ];

    // Sticky Shadow on Scroll
    function handleHeaderScroll() {
      if (!header) return;
      if (window.scrollY > 15) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });
    handleHeaderScroll();

    // Mobile Drawer Toggle
    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mobileDrawer.classList.toggle('open');
        mobileToggle.classList.toggle('active', isOpen);
        mobileToggle.setAttribute('aria-expanded', String(isOpen));
        mobileDrawer.setAttribute('aria-hidden', String(!isOpen));
      });

      // Close drawer on click outside
      document.addEventListener('click', (e) => {
        if (mobileDrawer.classList.contains('open') && !header.contains(e.target)) {
          mobileDrawer.classList.remove('open');
          mobileToggle.classList.remove('active');
          mobileToggle.setAttribute('aria-expanded', 'false');
          mobileDrawer.setAttribute('aria-hidden', 'true');
        }
      });
    }

    // Smooth Scroll with Header Offset
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || !targetId.startsWith('#')) return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const headerHeight = header ? header.offsetHeight : 72;
          const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - headerHeight + 2;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Close mobile drawer if open
          if (mobileDrawer && mobileDrawer.classList.contains('open')) {
            mobileDrawer.classList.remove('open');
            if (mobileToggle) {
              mobileToggle.classList.remove('active');
              mobileToggle.setAttribute('aria-expanded', 'false');
            }
            mobileDrawer.setAttribute('aria-hidden', 'true');
          }
        }
      });
    });

    // ScrollSpy: Highlight Current Section in Navigation
    function updateActiveNav() {
      const scrollPos = window.scrollY + (header ? header.offsetHeight + 60 : 130);
      let currentSectionId = '';

      for (let i = 0; i < sections.length; i++) {
        const sec = document.getElementById(sections[i].id);
        if (sec) {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentSectionId = sections[i].id;
            break;
          }
        }
      }

      navLinks.forEach(l => {
        const href = l.getAttribute('href');
        if (currentSectionId && href === `#${currentSectionId}`) {
          l.classList.add('active');
        } else {
          l.classList.remove('active');
        }
      });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  // ==========================================================================
  // 12. MAGIC UI: NUMBER TICKER ANIMATION (CRO METRICS STRIP)
  // ==========================================================================
  function initNumberTicker() {
    const counterElements = document.querySelectorAll('[data-counter-target]');
    if (!counterElements.length) return;

    function animateCounter(el) {
      if (el.dataset.counterAnimated === 'true') return;
      el.dataset.counterAnimated = 'true';

      const target = parseFloat(el.getAttribute('data-counter-target'));
      const decimals = parseInt(el.getAttribute('data-counter-decimals') || '0', 10);
      const isComma = el.getAttribute('data-counter-format') === 'comma';
      const duration = 1800; // ms
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = target * easeProgress;

        if (decimals > 0) {
          el.textContent = currentVal.toFixed(decimals);
        } else if (isComma) {
          el.textContent = Math.floor(currentVal).toLocaleString('en-US');
        } else {
          el.textContent = Math.floor(currentVal).toString();
        }

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          if (decimals > 0) {
            el.textContent = target.toFixed(decimals);
          } else if (isComma) {
            el.textContent = target.toLocaleString('en-US');
          } else {
            el.textContent = target.toString();
          }
        }
      }

      requestAnimationFrame(update);
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    counterElements.forEach(el => observer.observe(el));
  }

  // ==========================================================================
  // 13. SHADCN CRO: AI LAB LIVE SCANNER SIMULATION
  // ==========================================================================
  function initAiSimulator() {
    const triggerBtn = document.getElementById('simulateAiBtn');
    const writingBeam = document.getElementById('writingScannerBeam');
    const speakingBeam = document.getElementById('speakingScannerBeam');
    const statusText = document.getElementById('aiSimStatus');
    const btnText = document.getElementById('simulateAiBtnText');

    if (!triggerBtn) return;

    let isScanning = false;

    triggerBtn.addEventListener('click', () => {
      if (isScanning) return;
      isScanning = true;

      ConversionTracker.track('ai_simulation_demo_click', { action: 'scan_sample' });

      // Visual state: active
      triggerBtn.disabled = true;
      triggerBtn.style.opacity = '0.85';
      if (btnText) btnText.textContent = 'Đang quét phân tích bài...';
      if (statusText) {
        statusText.innerHTML = '<span class="ai-pulse-dot" style="background:#FF5A00;box-shadow:0 0 8px #FF5A00;"></span> AI đang duyệt cấu trúc ngữ pháp và phát âm...';
      }

      // Start laser beams
      if (writingBeam) {
        writingBeam.classList.remove('active-scan');
        void writingBeam.offsetWidth; // force reflow
        writingBeam.classList.add('active-scan');
      }

      if (speakingBeam) {
        speakingBeam.classList.remove('active-scan');
        void speakingBeam.offsetWidth; // force reflow
        speakingBeam.classList.add('active-scan');
      }

      // Complete simulation after 2.4s
      setTimeout(() => {
        if (writingBeam) writingBeam.classList.remove('active-scan');
        if (speakingBeam) speakingBeam.classList.remove('active-scan');

        if (statusText) {
          statusText.innerHTML = '<span class="ai-pulse-dot" style="background:#10B981;box-shadow:0 0 8px #10B981;"></span> <strong>Chấm xong (30s):</strong> Chuẩn 4 tiêu chí khảo thí Cam 19!';
        }
        if (btnText) btnText.textContent = '✓ Quét thành công (Thử lại)';

        triggerBtn.disabled = false;
        triggerBtn.style.opacity = '1';
        isScanning = false;
      }, 2400);
    });
  }



  // ==========================================================================
  // 15. PRICING PACKAGES SELECTION & SMOOTH SCROLL TO FORM
  // ==========================================================================
  function initPricingPackages() {
    const priceBtns = document.querySelectorAll('[data-pkg-choice]');
    const formCard = document.getElementById('leadFormCard');

    priceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const choice = btn.getAttribute('data-pkg-choice');
        const pkgName = btn.getAttribute('data-pkg-name');
        const price = btn.getAttribute('data-pkg-price');

        ConversionTracker.track('pricing_card_cta_click', {
          package_choice: choice,
          package_name: pkgName,
          price: price
        });

        // Trigger selection of matching pill in hero form
        const targetPill = document.querySelector(`.pkg-pill[data-pkg="${choice}"]`);
        if (targetPill) {
          targetPill.click();
        }

        // Smooth scroll to hero form card
        if (formCard) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            const nameInput = document.getElementById('fullNameInput');
            if (nameInput) nameInput.focus();
          }, 450);
        }
      });
    });
  }

})();

