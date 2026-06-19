// Lightweight multilingual language layer for chatbot.
// This file wraps existing chat behavior without changing core bot logic.
(function () {
    const STORAGE_KEY = 'chat-language';
    const SELECT_ID = 'chatLanguageSelect';

    const LANG = {
        en: { label: 'English', speechLocale: 'en-IN', ttsLocale: 'en-IN', apiName: 'English' },
        hi: { label: 'हिन्दी', speechLocale: 'hi-IN', ttsLocale: 'hi-IN', apiName: 'Hindi' },
        mr: { label: 'मराठी', speechLocale: 'mr-IN', ttsLocale: 'mr-IN', apiName: 'Marathi' },
        gu: { label: 'ગુજરાતી', speechLocale: 'gu-IN', ttsLocale: 'gu-IN', apiName: 'Gujarati' }
    };

    const STATIC_TRANSLATIONS = {
        hi: {
            'Got it!': 'समझ गया!',
            "Sorry, I couldn't connect right now. Please check if your backend is running on port 5050.": 'माफ करें, अभी कनेक्ट नहीं हो सका। कृपया जांचें कि आपका बैकएंड 5050 पोर्ट पर चल रहा है।',
            "Sorry, I couldn't connect right now. Please check if your backend is running on port 5000.": 'माफ करें, अभी कनेक्ट नहीं हो सका। कृपया जांचें कि आपका बैकएंड 5000 पोर्ट पर चल रहा है।',
            "Sorry, I couldn't connect right now. Please check if your servers are running.": 'माफ करें, अभी कनेक्ट नहीं हो सका। कृपया जांचें कि आपके सर्वर चल रहे हैं।'
        },
        mr: {
            'Got it!': 'समजले!',
            "Sorry, I couldn't connect right now. Please check if your backend is running on port 5050.": 'माफ करा, आत्ता कनेक्ट होऊ शकलो नाही. कृपया तुमचा बॅकएंड 5050 पोर्टवर चालू आहे का ते तपासा.',
            "Sorry, I couldn't connect right now. Please check if your backend is running on port 5000.": 'माफ करा, आत्ता कनेक्ट होऊ शकलो नाही. कृपया तुमचा बॅकएंड 5000 पोर्टवर चालू आहे का ते तपासा.',
            "Sorry, I couldn't connect right now. Please check if your servers are running.": 'माफ करा, आत्ता कनेक्ट होऊ शकलो नाही. कृपया तुमचे सर्व्हर चालू आहेत का ते तपासा.'
        },
        gu: {
            'Got it!': 'સમજી ગયો!',
            "Sorry, I couldn't connect right now. Please check if your backend is running on port 5050.": 'માફ કરશો, હમણાં કનેક્ટ થઈ શક્યું નથી. કૃપા કરીને તપાસો કે તમારું બેકએન્ડ 5050 પોર્ટ પર ચાલુ છે.',
            "Sorry, I couldn't connect right now. Please check if your backend is running on port 5000.": 'માફ કરશો, હમણાં કનેક્ટ થઈ શક્યું નથી. કૃપા કરીને તપાસો કે તમારું બેકએન્ડ 5000 પોર્ટ પર ચાલુ છે.',
            "Sorry, I couldn't connect right now. Please check if your servers are running.": 'માફ કરશો, હમણાં કનેક્ટ થઈ શક્યું નથી. કૃપા કરીને તપાસો કે તમારા સર્વર ચાલુ છે.'
        }
    };

    const LISTENING_TEXT = {
        en: 'Listening...',
        hi: 'सुन रहा है...',
        mr: 'ऐकत आहे...',
        gu: 'સાંભળી રહ્યા છીએ...'
    };

    const CHAT_UI_TEXT = {
        greeting: {
            en: 'What shall we learn today, {name}?',
            hi: 'आज हम क्या सीखें, {name}?',
            mr: 'आज आपण काय शिकू, {name}?',
            gu: 'આજે આપણે શું શીખીએ, {name}?'
        },
        placeholder: {
            en: 'Ask AI Tutor to create a study plan...',
            hi: 'AI Tutor से अध्ययन योजना बनवाने के लिए पूछें...',
            mr: 'AI Tutor ला अभ्यास योजना तयार करण्यासाठी विचारा...',
            gu: 'AI Tutor ને અભ્યાસ યોજના બનાવવા માટે પૂછો...'
        }
    };

    const nativeFetch = window.fetch ? window.fetch.bind(window) : null;

    let currentLang = 'en';
    let recognition = null;
    let recognitionInput = null;
    let recognitionButton = null;
    let voiceEnabled = true;
    let syncFromLayer = false;

    function normalizeLang(code) {
        return LANG[code] ? code : 'en';
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isHindiOrMarathiScript(text) {
        return /[\u0900-\u097F]/.test(text);
    }

    function isGujaratiScript(text) {
        return /[\u0A80-\u0AFF]/.test(text);
    }

    function alreadyLocalized(text, langCode) {
        if (langCode === 'hi' || langCode === 'mr') return isHindiOrMarathiScript(text);
        if (langCode === 'gu') return isGujaratiScript(text);
        return false;
    }

    function getStaticTranslation(text, langCode) {
        if (langCode === 'en') return text;
        const table = STATIC_TRANSLATIONS[langCode] || {};
        return table[text] || text;
    }

    async function translateText(text, langCode) {
        if (!text || langCode === 'en') return text;
        if (alreadyLocalized(text, langCode)) return text;

        const staticText = getStaticTranslation(text, langCode);
        if (staticText !== text) return staticText;
        if (!nativeFetch) return text;

        try {
            const controller = new AbortController();
            const timeout = window.setTimeout(function () {
                controller.abort();
            }, 2500);

            const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' +
                encodeURIComponent(langCode) + '&dt=t&q=' + encodeURIComponent(text);

            const response = await nativeFetch(url, { signal: controller.signal });
            window.clearTimeout(timeout);

            if (!response.ok) return text;
            const payload = await response.json();
            if (!Array.isArray(payload) || !Array.isArray(payload[0])) return text;

            const translated = payload[0]
                .map(function (chunk) { return Array.isArray(chunk) ? chunk[0] : ''; })
                .join('');

            return translated || text;
        } catch (err) {
            return text;
        }
    }

    function persistLanguage(langCode) {
        localStorage.setItem(STORAGE_KEY, langCode);
        localStorage.setItem('ls-lang', langCode);
    }

    function getLocalizedUiText(group) {
        return (group && group[currentLang]) || (group && group.en) || '';
    }

    function getFirstName() {
        let name = 'Vedant';
        const lsUser = localStorage.getItem('ls-user');
        if (!lsUser) return name;

        try {
            const user = JSON.parse(lsUser);
            if (user && user.name) {
                const first = String(user.name).trim().split(' ')[0];
                if (first) name = first;
            }
        } catch (err) {
            // no-op
        }

        return name;
    }

    function applyLocalizedChatUiText() {
        const greetingEl = document.getElementById('chatGreeting');
        const firstName = getFirstName();

        if (greetingEl) {
            const greeting = getLocalizedUiText(CHAT_UI_TEXT.greeting).replace('{name}', firstName);
            greetingEl.innerHTML = '';
            greeting.split(' ').forEach(function (word, index) {
                const span = document.createElement('span');
                span.textContent = word;
                span.className = 'word-reveal';
                span.style.animationDelay = (index * 0.15) + 's';
                greetingEl.appendChild(span);
            });
        }

        const placeholder = getLocalizedUiText(CHAT_UI_TEXT.placeholder);
        ['chatInput', 'chatInputHero', 'chatInputDocked'].forEach(function (id) {
            const input = document.getElementById(id);
            if (!input) return;
            input.placeholder = placeholder;
        });
    }

    function applyLangToInputs() {
        const locale = LANG[currentLang].speechLocale;
        ['chatInput', 'chatInputHero', 'chatInputDocked'].forEach(function (id) {
            const input = document.getElementById(id);
            if (!input) return;
            input.setAttribute('lang', locale);
            input.setAttribute('inputmode', 'text');
        });
    }

    function updateSelects() {
        const ids = [SELECT_ID, 'langSwitcher'];
        ids.forEach(function (id) {
            const el = document.getElementById(id);
            if (el && el.value !== currentLang) el.value = currentLang;
        });
    }

    function clearRecognitionUi() {
        if (recognitionButton) recognitionButton.style.color = '';
        if (recognitionInput && recognitionInput.dataset.originalPlaceholder) {
            recognitionInput.placeholder = recognitionInput.dataset.originalPlaceholder;
        }
        recognitionInput = null;
        recognitionButton = null;
    }

    function stopRecognition() {
        if (!recognition) return;
        try {
            recognition.onend = null;
            recognition.stop();
        } catch (err) {
            // no-op
        }
        recognition = null;
        clearRecognitionUi();
    }

    function chooseVoice(synth, langCode) {
        const voices = synth.getVoices() || [];
        if (!voices.length) return null;

        const desiredPrefix = LANG[langCode].ttsLocale.toLowerCase().split('-')[0];
        const exact = voices.find(function (voice) {
            return (voice.lang || '').toLowerCase().startsWith(desiredPrefix);
        });
        if (exact) return exact;

        const english = voices.find(function (voice) {
            return (voice.lang || '').toLowerCase().startsWith('en');
        });
        return english || voices[0] || null;
    }

    function setLanguage(nextLang, options) {
        const opts = options || {};
        const normalized = normalizeLang(nextLang);
        currentLang = normalized;
        persistLanguage(normalized);

        if (window.I18n && typeof window.I18n.setLang === 'function' && opts.syncI18n !== false) {
            if (window.I18n.currentLang !== normalized) {
                syncFromLayer = true;
                try {
                    window.I18n.setLang(normalized);
                } finally {
                    syncFromLayer = false;
                }
            }
        }

        updateSelects();
        applyLangToInputs();
        applyLocalizedChatUiText();
    normalizeTopNavLayout();

        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        stopRecognition();

        if (opts.announce && window.Toast && typeof window.Toast.show === 'function') {
            window.Toast.show('Language set to ' + LANG[normalized].label, 'success');
        }

        window.dispatchEvent(new CustomEvent('chat-language-changed', {
            detail: {
                code: normalized,
                speechLocale: LANG[normalized].speechLocale,
                ttsLocale: LANG[normalized].ttsLocale,
                apiName: LANG[normalized].apiName
            }
        }));
    }

    function normalizeTopNavLayout() {
        const topNav = document.querySelector('.top-nav');
        if (!topNav) return;

        topNav.style.display = 'flex';
        topNav.style.alignItems = 'center';
        topNav.style.justifyContent = 'flex-end';
        topNav.style.gap = '12px';
        topNav.style.flexWrap = 'nowrap';

        const emotionTag = document.getElementById('emotionTag');
        if (emotionTag) {
            const parent = emotionTag.parentElement;
            if (parent && parent !== topNav && parent.childElementCount === 1) {
                topNav.appendChild(emotionTag);
                parent.remove();
            }

            emotionTag.style.display = 'inline-flex';
            emotionTag.style.alignItems = 'center';
            emotionTag.style.gap = '6px';
            emotionTag.style.padding = '8px 16px';
            emotionTag.style.minHeight = '48px';
            emotionTag.style.borderRadius = '999px';
            emotionTag.style.border = '1.5px solid var(--border)';
            emotionTag.style.background = 'rgba(255,255,255,0.9)';
            emotionTag.style.boxSizing = 'border-box';
            emotionTag.style.margin = '0';
            emotionTag.style.whiteSpace = 'nowrap';
        }

        Array.prototype.forEach.call(topNav.children, function (child) {
            child.style.margin = '0';
            child.style.flexShrink = '0';
            child.style.pointerEvents = 'auto';
        });
    }

    function ensureSelector() {
        if (document.getElementById(SELECT_ID)) return;
        const topNav = document.querySelector('.top-nav');
        if (!topNav) return;

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.9);padding:8px 14px;border-radius:16px;border:1.5px solid var(--border);backdrop-filter:blur(8px);min-height:48px;box-sizing:border-box;white-space:nowrap;';

        wrapper.innerHTML =
            '<label for="' + SELECT_ID + '" style="font-size:12px;font-weight:700;color:#334155;">Language</label>' +
            '<select id="' + SELECT_ID + '" style="height:32px;border:1px solid #cbd5e1;border-radius:10px;padding:0 10px;background:#fff;color:#0f172a;font-size:13px;font-weight:600;">' +
            '<option value="en">English</option>' +
            '<option value="hi">हिन्दी</option>' +
            '<option value="mr">मराठी</option>' +
            '<option value="gu">ગુજરાતી</option>' +
            '</select>';

        const first = topNav.firstElementChild;
        if (first) {
            topNav.insertBefore(wrapper, first);
        } else {
            topNav.appendChild(wrapper);
        }

        const select = document.getElementById(SELECT_ID);
        if (select) {
            select.value = currentLang;
            select.addEventListener('change', function (e) {
                setLanguage(e.target.value, { announce: true });
            });
        }

        normalizeTopNavLayout();
    }

    function patchI18nSetLang() {
        if (!window.I18n || typeof window.I18n.setLang !== 'function' || window.I18n.__chatLangWrapped) return;

        const originalSetLang = window.I18n.setLang.bind(window.I18n);
        window.I18n.setLang = function wrappedSetLang(lang) {
            originalSetLang(lang);
            const normalized = normalizeLang(lang);
            if (!syncFromLayer && normalized !== currentLang) {
                setLanguage(normalized, { syncI18n: false });
            }
        };

        window.I18n.__chatLangWrapped = true;
    }

    function patchFetchTranslation() {
        if (!nativeFetch || window.__chatLangFetchWrapped) return;

        window.fetch = async function wrappedFetch(input, init) {
            const response = await nativeFetch(input, init);
            try {
                const url = typeof input === 'string' ? input : (input && input.url) || '';
                if (!/\/api\/chat(?:\?|$)/.test(url)) return response;

                const contentType = (response.headers.get('content-type') || '').toLowerCase();
                if (contentType.indexOf('application/json') === -1) return response;

                const payload = await response.clone().json();
                if (payload && typeof payload.reply === 'string') {
                    payload.reply = await translateText(payload.reply, currentLang);
                }

                const headers = new Headers(response.headers);
                headers.set('content-type', 'application/json');
                headers.delete('content-length');

                return new Response(JSON.stringify(payload), {
                    status: response.status,
                    statusText: response.statusText,
                    headers: headers
                });
            } catch (err) {
                return response;
            }
        };

        window.__chatLangFetchWrapped = true;
    }

    function patchAppendBubble() {
        if (typeof window.appendBubble !== 'function' || window.appendBubble.__chatLangWrapped) return;

        const originalAppendBubble = window.appendBubble;
        const wrapped = function (text, who) {
            const safeText = who === 'ai' ? getStaticTranslation(String(text), currentLang) : text;
            return originalAppendBubble.call(this, safeText, who);
        };

        wrapped.__chatLangWrapped = true;
        window.appendBubble = wrapped;
    }

    function patchSpeakerToggle() {
        if (typeof window.toggleSpeaker !== 'function' || window.toggleSpeaker.__chatLangWrapped) return;

        const originalToggleSpeaker = window.toggleSpeaker;
        const wrappedToggleSpeaker = function () {
            originalToggleSpeaker.apply(this, arguments);

            const mutedIcon = document.querySelector('.speaker-icon[data-lucide="volume-x"]');
            voiceEnabled = !mutedIcon;

            if (!voiceEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };

        wrappedToggleSpeaker.__chatLangWrapped = true;
        window.toggleSpeaker = wrappedToggleSpeaker;
    }

    function patchPlayVoice() {
        window.playVoice = function layeredPlayVoice(text) {
            const synth = window.speechSynthesis;
            if (!voiceEnabled || !synth || !text) return;

            synth.cancel();
            const cleanText = String(text)
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/<[^>]*>?/gm, '');

            const utterance = new SpeechSynthesisUtterance(cleanText);
            const voice = chooseVoice(synth, currentLang);

            if (voice) {
                utterance.voice = voice;
                utterance.lang = voice.lang || LANG[currentLang].ttsLocale;
            } else if (currentLang === 'en') {
                utterance.lang = LANG[currentLang].ttsLocale;
            } else {
                utterance.lang = 'en-IN';
            }

            synth.speak(utterance);
        };
    }

    function patchMic() {
        window.toggleRealMic = function layeredToggleRealMic(inputId, btnId) {
            const input = document.getElementById(inputId);
            const button = document.getElementById(btnId);
            if (!input || !button) return;

            if (recognition) {
                stopRecognition();
                return;
            }

            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Your browser does not support the Web Speech API');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.interimResults = true;
            recognition.continuous = false;
            recognition.lang = LANG[currentLang].speechLocale;

            recognitionInput = input;
            recognitionButton = button;

            recognition.onstart = function () {
                recognitionButton.style.color = '#EF4444';
                recognitionInput.dataset.originalPlaceholder = recognitionInput.placeholder;
                recognitionInput.placeholder = LISTENING_TEXT[currentLang] || LISTENING_TEXT.en;
                recognitionInput.value = '';
            };

            recognition.onresult = function (event) {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                recognitionInput.value = transcript;

                if (transcript.trim().length > 0) {
                    const sendBtn = recognitionInput.parentElement.querySelector('.send-pill');
                    if (sendBtn) sendBtn.style.background = '#3B82F6';
                }
            };

            recognition.onend = function () {
                recognition = null;
                clearRecognitionUi();
            };

            recognition.onerror = function () {
                recognition = null;
                clearRecognitionUi();
            };

            recognition.start();
        };
    }

    function initialLang() {
        return normalizeLang(
            localStorage.getItem(STORAGE_KEY) ||
            localStorage.getItem('ls-lang') ||
            (window.I18n && window.I18n.currentLang) ||
            'en'
        );
    }

    function init() {
        patchI18nSetLang();
        currentLang = initialLang();
        setLanguage(currentLang, { announce: false });

        ensureSelector();
        normalizeTopNavLayout();
        patchFetchTranslation();
        patchAppendBubble();
        patchSpeakerToggle();
        patchPlayVoice();
        patchMic();

        // Localized hero text is now managed solely by this file, so no timeout needed.

        const sidebarSwitcher = document.getElementById('langSwitcher');
        if (sidebarSwitcher && !sidebarSwitcher.__chatLangHooked) {
            sidebarSwitcher.addEventListener('change', function (e) {
                const next = normalizeLang(e.target.value);
                if (next !== currentLang) {
                    setLanguage(next, { announce: false });
                }
            });
            sidebarSwitcher.__chatLangHooked = true;
        }
    }

    window.MultilingualChat = {
        init: init,
        switchLanguage: function (langCode) {
            setLanguage(langCode, { announce: true });
        },
        getCurrentLanguage: function () {
            return LANG[currentLang].apiName;
        },
        getLanguageCode: function () {
            return currentLang;
        },
        getSpeechLocale: function () {
            return LANG[currentLang].speechLocale;
        },
        translateText: function (text) {
            return translateText(text, currentLang);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
