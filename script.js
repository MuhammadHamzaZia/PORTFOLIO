document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // --- JOURNEY RENDER ---
    function renderJourney() {
        const container = document.getElementById('journey-container');
        if (!container || typeof translations === 'undefined' || typeof journeyItems === 'undefined') return;
        const t = translations[lang];
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        journeyItems.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'reveal active';
            div.style.transitionDelay = (idx * 0.1) + 's';
            div.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-12 border-b border-white/10 pb-8 hover:border-primary/50 transition-colors group">
                    <div class="md:col-span-4 font-headline font-bold text-3xl ${item.current ? 'text-primary opacity-100' : 'outlined-text opacity-80 group-hover:opacity-100'} transition-opacity whitespace-nowrap">
                        ${item.date}
                    </div>
                    <div class="md:col-span-8">
                        <h3 class="text-2xl font-headline font-bold mb-2 ${item.current ? 'text-gradient' : ''}">${item.role}</h3>
                        <p class="text-dim max-w-xl font-body">${item.desc}</p>
                    </div>
                </div>`;
            fragment.appendChild(div);
        });
        container.appendChild(fragment);
    }

    // --- TOOLS RENDER ---
    function renderTools() {
        const container = document.getElementById('tools-container');
        if (!container || typeof toolsData === 'undefined') return;
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        toolsData.forEach((tool, idx) => {
            const t = tool[lang] || tool['en'];
            const div = document.createElement('div');
            div.className = 'scroll-item reveal active';
            div.style.transitionDelay = (idx * 0.1) + 's';
            div.innerHTML = `
                <div class="liquid-card flex items-center gap-6 h-full group hover:bg-white/[0.06] transition-all">
                    <div class="flex-shrink-0 w-20 h-20 bg-black/20 rounded-lg flex items-center justify-center p-3 border border-white/5">
                        <img src="${tool.icon}" class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" alt="">
                    </div>
                    <div class="flex-grow">
                        <div class="flex justify-between items-start mb-2">
                             <h3 class="text-xl font-headline font-black text-white group-hover:text-primary transition-colors leading-tight">${t.title}</h3>
                             ${tool.link ? `<a href="${tool.link}" target="_blank" class="text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"><i class="fa-solid fa-arrow-up-right-from-square text-sm"></i></a>` : ''}
                        </div>
                        <p class="text-white/80 text-xs font-medium leading-normal line-clamp-2 max-w-md">${t.description}</p>
                    </div>
                </div>`;
            fragment.appendChild(div);
        });
        container.appendChild(fragment);
    }

    // --- MODALS ---
    function initModals() {
        const modal = document.getElementById('qr-bank-modal');
        const closeBtn = document.getElementById('close-modal');
        const qrImage = modal ? modal.querySelector('img') : null;
        const jcTrigger = document.getElementById('jazzcash-trigger');
        const alfaTrigger = document.getElementById('alfalah-trigger');

        if (modal && jcTrigger && alfaTrigger) {
            jcTrigger.onclick = () => { if (qrImage) qrImage.src = "F:\\JAZZCASH_QR.jpeg"; modal.style.display = 'flex'; };
            alfaTrigger.onclick = () => { if (qrImage) qrImage.src = "F:\\ALFALAH_QR.jpeg"; modal.style.display = 'flex'; };
            modal.onclick = (e) => { if (e.target === modal || e.target === closeBtn) modal.style.display = 'none'; };
        }
    }

    // --- CRYPTO COPY ---
    function initCryptoCopy() {
        document.querySelectorAll('.crypto-copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const addr = btn.getAttribute('data-address');
                const icon = btn.querySelector('i');
                const originalIconClass = icon.className;
                navigator.clipboard.writeText(addr).then(() => {
                    icon.className = 'fa-solid fa-check text-primary animate-bounce';
                    btn.style.borderColor = 'var(--primary)';
                    setTimeout(() => { icon.className = originalIconClass; btn.style.borderColor = ''; }, 2000);
                });
            });
        });
    }

    // --- CONTACT FORM (FIXED REDIRECT) ---
    function initContactForm() {
        const form = document.getElementById('form');
        const result = document.getElementById('result');
        const btn = document.getElementById('submit-btn');
        const nameInput = document.querySelector('input[name="name"]');
        const emailInput = document.querySelector('input[name="email"]');

        if (!form || !btn || !result) return;

        const MAX_SUBMISSIONS = 10;
        const LIMIT_KEY = 'transmission_logs';
        const IDENTITY_KEY = 'operator_identity';

        // Auto-fill & Welcome message logic
        const savedIdentity = JSON.parse(localStorage.getItem(IDENTITY_KEY));
        if (savedIdentity) {
            if (nameInput) nameInput.value = savedIdentity.name || '';
            if (emailInput) emailInput.value = savedIdentity.email || '';
            const titleContainer = document.querySelector('.contact-title-fit');
            if (titleContainer && savedIdentity.name) {
                const welcome = document.createElement('div');
                welcome.className = "text-primary font-mono text-[10px] mb-4 tracking-[0.3em] animate-pulse";
                welcome.innerHTML = `> RECOGNIZED OPERATOR: ${savedIdentity.name.toUpperCase()}`;
                titleContainer.prepend(welcome);
            }
        }

        // Live Save
        [nameInput, emailInput].forEach(input => {
            if (!input) return;
            input.addEventListener('input', () => {
                const identity = JSON.parse(localStorage.getItem(IDENTITY_KEY)) || {};
                identity.name = nameInput.value;
                identity.email = emailInput.value;
                localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
            });
        });

        function checkRateLimit() {
            const data = localStorage.getItem(LIMIT_KEY);
            const now = new Date().getTime();
            if (!data) return { count: 0, firstAttempt: now, allowed: true };
            let logs = JSON.parse(data);
            if (now - logs.firstAttempt > 86400000) return { count: 0, firstAttempt: now, allowed: true };
            return { count: logs.count, firstAttempt: logs.firstAttempt, allowed: logs.count < MAX_SUBMISSIONS };
        }

        function recordSubmission() {
            let logs = checkRateLimit();
            logs.count += 1;
            localStorage.setItem(LIMIT_KEY, JSON.stringify(logs));
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault(); // STOP REDIRECT

            const status = checkRateLimit();
            if (!status.allowed) {
                result.innerHTML = `<span class='text-red-500'>ERROR: DAILY LIMIT REACHED.</span>`;
                return;
            }
            
            btn.style.opacity = "0.5";
            btn.disabled = true;
            btn.innerHTML = "<span>TRANSMITTING...</span>";

            const formData = new FormData(form);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: json
            })
            .then(async (response) => {
                let res = await response.json();
                if (response.status == 200) {
                    result.innerHTML = "<span class='text-primary animate-pulse'>SIGNAL RECEIVED SUCESSFULLY.</span>";
                    const notification = document.getElementById('success-notification');

    if (notification) {
        notification.classList.add('notification-active');
        
        // Slide it back up after 3 seconds
        setTimeout(() => {
            notification.classList.remove('notification-active');
        }, 5000);
    }
                    // Reset Fields
                    if (emailInput) emailInput.value = '';
                    const messageInput = document.querySelector('textarea[name="message"]');
                    if (messageInput) messageInput.value = '';

                    // Clear Email from storage but keep Name
                    const identity = JSON.parse(localStorage.getItem(IDENTITY_KEY)) || {};
                    delete identity.email;
                    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
                    
                    recordSubmission();
                } else {
                    result.innerHTML = "<span>SIGNAL LOST: " + res.message + "</span>";
                }
            })
            .catch(err => {
                result.innerHTML = "<span class='text-red-500'>CONNECTION ERROR</span>";
            })
            .finally(() => {
                btn.style.opacity = "1";
                btn.disabled = false;
                btn.innerHTML = "<span>Send Message →</span>";
            });
        });
    }

    // --- PRIVACY PROTOCOL ---
    function initPrivacyProtocol() {
        const protocolBanner = document.getElementById('privacy-protocol');
        const acceptBtn = document.getElementById('accept-protocol');
        const PROTOCOL_KEY = 'system_authorization_granted';

        if (!localStorage.getItem(PROTOCOL_KEY)) {
            setTimeout(() => {
                protocolBanner.classList.remove('hidden');
                requestAnimationFrame(() => {
                    protocolBanner.classList.remove('opacity-0', 'translate-y-10');
                    protocolBanner.classList.add('opacity-100', 'translate-y-0');
                });
            }, 2000);
        }

        if (acceptBtn) {
            acceptBtn.onclick = () => {
                localStorage.setItem(PROTOCOL_KEY, 'true');
                protocolBanner.classList.add('opacity-0', 'translate-y-10');
                setTimeout(() => protocolBanner.classList.add('hidden'), 700);
            };
        }
    }

    // --- WELCOME SEQUENCE ---
    function handleWelcomeSequence() {
        const welcomeOverlay = document.getElementById('welcome-overlay');
        const welcomeText = document.getElementById('welcome-message-text');
        const savedData = JSON.parse(localStorage.getItem('operator_identity'));
        const lastWelcome = localStorage.getItem('last_welcome_timestamp');
        const now = new Date().getTime();

        if (savedData && savedData.name && (!lastWelcome || (now - lastWelcome > 86400000))) {
            welcomeText.innerText = `WELCOME BACK, ${savedData.name}`;
            welcomeOverlay.classList.remove('pointer-events-none');
            welcomeOverlay.classList.add('opacity-100');
            localStorage.setItem('last_welcome_timestamp', now);
            setTimeout(() => {
                welcomeOverlay.classList.remove('opacity-100');
                welcomeOverlay.classList.add('opacity-0', 'pointer-events-none');
            }, 3500);
        }
    }

    // --- SYSTEM RESET ---
    const resetLink = document.getElementById('system-reset-link');
    if (resetLink) {
        resetLink.onclick = (e) => {
            e.preventDefault();
            if (confirm("CAUTION: Wipe data stored on your browser for this site?")) {
                localStorage.clear();
                resetLink.innerHTML = "<span class='text-red-500 animate-pulse'>WIPING...</span>";
                setTimeout(() => window.location.reload(), 1000);
            }
        };
    }

    // --- GLOBAL INITIALIZATION ---
    window.addEventListener('load', () => {
        const preloader = document.getElementById('system-preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('preloader-complete');
                handleWelcomeSequence();
            }, 300);
        }
    });

    initModals();
    initCryptoCopy();
    initContactForm();
    initPrivacyProtocol();
});