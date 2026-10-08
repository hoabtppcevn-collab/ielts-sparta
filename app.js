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
    initStickyStackedCards();
    initFormCountdownTimer();
    initNumberTicker();
    initPricingPackages();
    initAiProductShowcase();
    initAiLightbox();
    initLiveToastNotification();
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
    function copyTextToClipboard(text, btnElem) {
      if (!btnElem) return;
      const originalHTML = btnElem.innerHTML;
      function showSuccess() {
        btnElem.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span style="color:#16A34A;font-weight:700;">Đã chép</span>`;
        setTimeout(() => { btnElem.innerHTML = originalHTML; }, 1800);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(showSuccess).catch(() => fallbackCopy(text, btnElem, originalHTML));
      } else {
        fallbackCopy(text, btnElem, originalHTML);
      }
    }

    function fallbackCopy(text, btnElem, originalHTML) {
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        btnElem.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span style="color:#16A34A;font-weight:700;">Đã chép</span>`;
        setTimeout(() => { btnElem.innerHTML = originalHTML; }, 1800);
      } catch (err) {
        btnElem.innerHTML = `<span>Lỗi</span>`;
        setTimeout(() => { btnElem.innerHTML = originalHTML; }, 1800);
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

    // Close modal handlers (Close button, Dismiss X, backdrop click, Escape key)
    const vietqrModalCloseBtn = document.getElementById('vietqrModalCloseBtn');
    if (vietqrModalCloseBtn && modalOverlay) {
      vietqrModalCloseBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('open');
      });
    }

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

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
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
  // 7. TESTIMONIALS 2-ROW MARQUEE (TOUCH PAUSE / RESUME SUPPORT)
  // ==========================================================================
  function initTestimonialCarousel() {
    const marqueeContainer = document.getElementById('testiMarqueeContainer');
    if (!marqueeContainer) return;

    const rows = marqueeContainer.querySelectorAll('.testi-marquee-row');
    rows.forEach((row) => {
      const track = row.querySelector('.testi-marquee-track');
      if (!track) return;

      // Hỗ trợ chạm giữ trên thiết bị di động để người dùng đọc review
      row.addEventListener('touchstart', () => {
        track.style.animationPlayState = 'paused';
      }, { passive: true });

      row.addEventListener('touchend', () => {
        setTimeout(() => {
          track.style.animationPlayState = 'running';
        }, 1200);
      }, { passive: true });
    });
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
  // 9. SPARTA SCROLL-PINNED DECK (4 TRANG PHÒNG THI TRÊN CÙNG 1 SECTION - PREP STYLE)
  // ==========================================================================
  function initStickyStackedCards() {
    const track = document.getElementById('spartaScrollTrack');
    const stage = document.getElementById('spartaStickyStage');
    const cards = document.querySelectorAll('.sparta-deck-card');
    const tabs = document.querySelectorAll('.deck-progress-tab');

    if (!track || !cards.length) return;

    const cardCount = cards.length;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ticking = false;
    let isIntersecting = false;
    let currentActiveIndex = -1;
    const skillNames = ['Listening', 'Reading', 'Writing', 'Speaking'];

    function updateDeck() {
      ticking = false;

      // Reset styles on mobile or reduced-motion
      if (isReducedMotion || window.innerWidth <= 768) {
        cards.forEach(card => {
          card.style.transform = '';
          card.style.filter = '';
          card.style.opacity = '';
          card.style.pointerEvents = 'auto';
        });
        return;
      }

      const rect = track.getBoundingClientRect();
      const trackHeight = track.offsetHeight;
      const vh = window.innerHeight;
      const stickyTop = 76; // matches sticky top offset

      const scrollableDist = trackHeight - vh;
      if (scrollableDist <= 0) return;

      // Global scroll progress through the pinned track: 0.0 to 1.0
      const scrolled = Math.max(0, Math.min(scrollableDist, stickyTop - rect.top));
      const globalProgress = scrolled / scrollableDist;

      const numTransitions = cardCount - 1; // 3 transitions between 4 cards

      for (let i = 0; i < cardCount; i++) {
        const card = cards[i];

        if (i === 0) {
          // Base card (Listening)
          // Scales down and slides up slightly as cards 1, 2, 3 arrive
          const p1 = Math.min(1, Math.max(0, globalProgress / (1 / numTransitions)));
          const p2 = Math.min(1, Math.max(0, (globalProgress - 1 / numTransitions) / (1 / numTransitions)));
          const p3 = Math.min(1, Math.max(0, (globalProgress - 2 / numTransitions) / (1 / numTransitions)));

          const scale = Math.max(0.88, 1 - (0.045 * p1) - (0.035 * p2) - (0.025 * p3));
          const ty = -(18 * p1 + 16 * p2 + 14 * p3);
          const brightness = Math.max(0.82, 1 - (0.06 * p1) - (0.04 * p2) - (0.03 * p3));
          const opacity = Math.max(0.75, 1 - (0.08 * p1) - (0.05 * p2) - (0.05 * p3));

          card.style.transform = `translate3d(0, ${ty.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
          card.style.filter = `brightness(${brightness.toFixed(4)})`;
          card.style.opacity = opacity.toFixed(4);
          card.style.pointerEvents = globalProgress < 0.25 ? 'auto' : 'none';
        } else {
          // Cards 1, 2, 3
          // Start below viewport (translateY: 105%), arrive smoothly at translateY(0)
          const startTime = (i - 1) / numTransitions;
          const endTime = i / numTransitions;

          let enterProgress = 0;
          if (globalProgress >= endTime) {
            enterProgress = 1;
          } else if (globalProgress <= startTime) {
            enterProgress = 0;
          } else {
            enterProgress = (globalProgress - startTime) / (endTime - startTime);
          }

          // How much later cards (j > i) push this card down in scale and translateY
          let scaleDown = 0;
          let tyDown = 0;
          let brightDown = 0;
          let opacDown = 0;

          for (let j = i + 1; j < cardCount; j++) {
            const sTime = (j - 1) / numTransitions;
            const eTime = j / numTransitions;
            let nextP = 0;
            if (globalProgress >= eTime) nextP = 1;
            else if (globalProgress <= sTime) nextP = 0;
            else nextP = (globalProgress - sTime) / (eTime - sTime);

            scaleDown += 0.045 * nextP;
            tyDown += 18 * nextP;
            brightDown += 0.06 * nextP;
            opacDown += 0.08 * nextP;
          }

          const enterTyPercent = (1 - enterProgress) * 105;
          const finalTy = -(tyDown);
          const finalScale = Math.max(0.88, 1 - scaleDown);
          const finalBrightness = Math.max(0.82, 1 - brightDown);
          const finalOpacity = enterProgress > 0 ? Math.max(0.75, 1 - opacDown) : 0;

          card.style.transform = `translate3d(0, calc(${enterTyPercent.toFixed(2)}% + ${finalTy.toFixed(1)}px), 0) scale(${finalScale.toFixed(4)})`;
          card.style.filter = `brightness(${finalBrightness.toFixed(4)})`;
          card.style.opacity = finalOpacity.toFixed(4);

          // Card is interactive when it's the active topmost card
          const isCurrentTop = (enterProgress >= 0.7) && (i === cardCount - 1 || globalProgress < (i / numTransitions) + 0.2);
          card.style.pointerEvents = isCurrentTop ? 'auto' : 'none';
        }
      }

      // Determine active index for tabs and tracking
      const activeIdx = Math.min(cardCount - 1, Math.floor(globalProgress * (cardCount - 0.01)));
      tabs.forEach((tab, idx) => {
        const isActive = idx === activeIdx;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      if (activeIdx !== currentActiveIndex) {
        currentActiveIndex = activeIdx;
        if (window.ConversionTracker) {
          ConversionTracker.track('sparta_exam_deck_change', {
            index: activeIdx,
            skill: skillNames[activeIdx] || `Skill_${activeIdx}`
          });
        }
      }
    }

    // Click tabs to smoothly scroll to that specific skill
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const idx = parseInt(tab.getAttribute('data-index'), 10);
        if (isNaN(idx)) return;
        const rect = track.getBoundingClientRect();
        const trackHeight = track.offsetHeight;
        const vh = window.innerHeight;
        const scrollableDist = trackHeight - vh;
        const numTransitions = cardCount - 1;
        const targetProg = idx / numTransitions;
        const targetScrollY = window.pageYOffset + rect.top - 76 + (targetProg * scrollableDist);
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
      });
    });

    function onScroll() {
      if (!isIntersecting) return;
      if (!ticking) {
        requestAnimationFrame(updateDeck);
        ticking = true;
      }
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            updateDeck();
          }
        });
      }, { rootMargin: '150px 0px 150px 0px' });

      observer.observe(track);
    } else {
      isIntersecting = true;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      requestAnimationFrame(updateDeck);
    }, { passive: true });

    updateDeck();
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

      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;

      const hStr = String(h).padStart(2, '0');
      const mStr = String(m).padStart(2, '0');
      const sStr = String(s).padStart(2, '0');

      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = hStr;
      if (minsEl) minsEl.textContent = mStr;
      if (secsEl) secsEl.textContent = sStr;

      if (finalDaysEl) finalDaysEl.textContent = '00';
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
      { id: 'pricingSection', linkSelector: 'a[href="#pricingSection"]' },
      { id: 'testimonialsSection', linkSelector: 'a[href="#testimonialsSection"]' }
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
  // 13. AI SCORING 2-COLUMN SAAS PRODUCT SHOWCASE (PREV/NEXT BUTTONS & DRAG/SWIPE)
  // ==========================================================================
  let aiDemoSuppressClick = false;

  function initAiProductShowcase() {
    const tabBtns = document.querySelectorAll('.ai-demo-tab-btn');
    const panes = document.querySelectorAll('.ai-demo-pane');
    const demoCard = document.getElementById('aiDemoShowcaseCard');
    const cardBody = document.getElementById('aiDemoCardBody');
    const prevBtn = document.getElementById('aiDemoPrevBtn');
    const nextBtn = document.getElementById('aiDemoNextBtn');
    const focusBtn = document.getElementById('aiDemoFocusBtn');

    if (!tabBtns.length || !cardBody) return;

    let currentSkill = 'writing';

    function switchSkill(targetSkill, direction = 'right') {
      if (targetSkill === currentSkill) return;
      currentSkill = targetSkill;

      // Update tabs
      tabBtns.forEach(btn => {
        const isActive = btn.getAttribute('data-skill') === currentSkill;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // Update panes with direction animation
      panes.forEach(pane => {
        const isMatch = pane.getAttribute('data-pane') === currentSkill;
        pane.classList.remove('slide-from-left', 'slide-from-right');
        if (isMatch) {
          pane.classList.add('active');
          pane.classList.add(direction === 'left' ? 'slide-from-left' : 'slide-from-right');
        } else {
          pane.classList.remove('active');
        }
      });

      ConversionTracker.track('ai_showcase_tab_select', { skill: currentSkill, direction });
    }

    // Tab buttons click
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const skill = btn.getAttribute('data-skill');
        if (skill) {
          const dir = skill === 'speaking' ? 'right' : 'left';
          switchSkill(skill, dir);
        }
      });
    });

    // Prev / Next arrow buttons
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextTarget = currentSkill === 'writing' ? 'speaking' : 'writing';
        switchSkill(nextTarget, 'left');
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextTarget = currentSkill === 'writing' ? 'speaking' : 'writing';
        switchSkill(nextTarget, 'right');
      });
    }

    // Touch Swipe Support (Kéo vuốt sang 2 bên trên màn hình cảm ứng)
    let touchStartX = 0;
    let touchStartY = 0;
    let touchDiffX = 0;
    let isTouchHorizontal = false;

    cardBody.addEventListener('touchstart', (e) => {
      if (!e.touches || !e.touches[0]) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDiffX = 0;
      isTouchHorizontal = false;
    }, { passive: true });

    cardBody.addEventListener('touchmove', (e) => {
      if (!e.touches || !e.touches[0]) return;
      touchDiffX = e.touches[0].clientX - touchStartX;
      const diffY = e.touches[0].clientY - touchStartY;
      if (Math.abs(touchDiffX) > Math.abs(diffY) && Math.abs(touchDiffX) > 10) {
        isTouchHorizontal = true;
      }
    }, { passive: true });

    cardBody.addEventListener('touchend', () => {
      if (isTouchHorizontal && Math.abs(touchDiffX) > 35) {
        aiDemoSuppressClick = true;
        setTimeout(() => { aiDemoSuppressClick = false; }, 200);

        if (touchDiffX < 0) {
          // Vuốt sang trái -> chuyển sang speaking
          switchSkill(currentSkill === 'writing' ? 'speaking' : 'writing', 'right');
        } else if (touchDiffX > 0) {
          // Vuốt sang phải -> chuyển sang writing
          switchSkill(currentSkill === 'speaking' ? 'writing' : 'speaking', 'left');
        }
      }
      touchDiffX = 0;
      isTouchHorizontal = false;
    });

    // Mouse Drag Support (Kéo chuột sang 2 bên trên máy tính)
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseDiffX = 0;

    cardBody.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ai-demo-nav-btn')) return;
      isMouseDown = true;
      mouseStartX = e.clientX;
      mouseDiffX = 0;
      cardBody.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!isMouseDown) return;
      mouseDiffX = e.clientX - mouseStartX;
    });

    window.addEventListener('mouseup', () => {
      if (!isMouseDown) return;
      isMouseDown = false;
      cardBody.classList.remove('is-dragging');

      if (Math.abs(mouseDiffX) > 35) {
        aiDemoSuppressClick = true;
        setTimeout(() => { aiDemoSuppressClick = false; }, 200);

        if (mouseDiffX < 0) {
          switchSkill(currentSkill === 'writing' ? 'speaking' : 'writing', 'right');
        } else if (mouseDiffX > 0) {
          switchSkill(currentSkill === 'speaking' ? 'writing' : 'speaking', 'left');
        }
      }
      mouseDiffX = 0;
    });

    // "Xem AI chấm điểm" CTA Button Focus
    if (focusBtn && demoCard) {
      focusBtn.addEventListener('click', () => {
        ConversionTracker.track('ai_showcase_demo_cta_click');
        demoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        demoCard.style.transition = 'box-shadow 0.35s ease, transform 0.35s ease';
        demoCard.style.boxShadow = '0 0 0 4px rgba(255, 90, 0, 0.4), 0 24px 54px rgba(10, 37, 64, 0.16)';
        demoCard.style.transform = 'scale(1.015)';
        setTimeout(() => {
          demoCard.style.boxShadow = '';
          demoCard.style.transform = '';
        }, 900);
      });
    }
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

        // Trigger selection of matching pill in hero form, or set hidden inputs directly
        const targetPill = document.querySelector(`.pkg-pill[data-pkg="${choice}"]`);
        if (targetPill) {
          targetPill.click();
        } else {
          const selectedPkgInput = document.getElementById('selectedPackageInput');
          const selectedPriceInput = document.getElementById('selectedPriceInput');
          if (selectedPkgInput) selectedPkgInput.value = choice;
          if (selectedPriceInput) selectedPriceInput.value = price;
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

  // ==========================================================================
  // 16. AI SCREENSHOT HIGH-RES LIGHTBOX
  // ==========================================================================

  function initAiLightbox() {
    const zoomTriggers = document.querySelectorAll('.ai-zoom-trigger');
    const lightbox = document.getElementById('aiLightboxModal');
    const lightboxImg = document.getElementById('aiLightboxImg');
    const lightboxCaption = document.getElementById('aiLightboxCaption');
    const closeBtn = document.getElementById('aiLightboxClose');

    if (!lightbox || !lightboxImg) return;

    zoomTriggers.forEach(el => {
      el.addEventListener('click', () => {
        if (aiDemoSuppressClick) return;
        const img = el.querySelector('img') || el;
        if (img && img.src) {
          lightboxImg.src = img.src;
          if (lightboxCaption) {
            lightboxCaption.textContent = img.alt || 'Ảnh minh họa chấm điểm AI IELTS Sparta';
          }
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
          ConversionTracker.track('ai_screenshot_zoom_click', { src: img.src });
        }
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }

  // ==========================================================================
  // 17. LIVE SOCIAL PROOF TOAST (Cứ 10s hiện 1 người đăng ký thành công, lặp 5 người)
  // ==========================================================================
  function initLiveToastNotification() {
    const toast = document.getElementById('liveToastNotification');
    const toastUser = document.getElementById('liveToastUser');
    const toastTime = document.getElementById('liveToastTime');
    const closeBtn = document.getElementById('liveToastClose');

    if (!toast || !toastUser || !toastTime) return;

    // Danh sách 5 người đăng ký thành công xoay vòng
    const registrations = [
      { user: 'Phạm Thanh Dung ở Hà Nội', time: '25 giây trước' },
      { user: 'Nguyễn Hoàng Long ở TP. Hồ Chí Minh', time: '18 giây trước' },
      { user: 'Trần Thu Uyên ở Đà Nẵng', time: '35 giây trước' },
      { user: 'Vũ Minh Triết ở Hải Phòng', time: '48 giây trước' },
      { user: 'Lê Bảo Ngọc ở Cần Thơ', time: '1 phút trước' }
    ];

    let currentIndex = 0;
    let isDismissed = false;
    let cycleInterval = null;

    function triggerToast() {
      if (isDismissed) return;

      const item = registrations[currentIndex];
      toastUser.textContent = item.user;
      toastTime.textContent = item.time;

      // Hiển thị toast
      toast.classList.add('active');

      // Tự động ẩn sau 4 giây
      setTimeout(() => {
        toast.classList.remove('active');
      }, 4000);

      // Chuyển sang người tiếp theo trong vòng lặp 5 người
      currentIndex = (currentIndex + 1) % registrations.length;
    }

    // Lần đầu tiên xuất hiện sau 3 giây khi vào trang
    setTimeout(() => {
      triggerToast();
      // Cứ đúng mỗi 10 giây lại nhảy 1 thông báo
      cycleInterval = setInterval(triggerToast, 10000);
    }, 3000);

    // Nút đóng thủ công nếu người dùng muốn tắt
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        isDismissed = true;
        toast.classList.remove('active');
        if (cycleInterval) clearInterval(cycleInterval);
      });
    }
  }

})();
