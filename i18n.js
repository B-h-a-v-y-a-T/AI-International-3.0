/* =====================================================
   AdaptEd Ai – Internationalization (i18n) Engine
   Supports: English (en), Hindi (hi), Marathi (mr), Gujarati (gu)
===================================================== */

const TRANSLATIONS = {
  // ═══════════════════════════════════════════════════
  // SIDEBAR & NAVIGATION
  // ═══════════════════════════════════════════════════
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड', gu: 'ડેશબોર્ડ' },
  'nav.ai_assistant': { en: 'AI Assistant', hi: 'AI सहायक', mr: 'AI सहाय्यक', gu: 'AI સહાયક' },
  'nav.ai_tutor': { en: 'AI Tutor', hi: 'AI ट्यूटर', mr: 'AI ट्युटर', gu: 'AI ટ્યુટર' },
  'nav.leaderboard': { en: 'Leaderboard', hi: 'लीडरबोर्ड', mr: 'लीडरबोर्ड', gu: 'લીડરબોર્ડ' },
  'nav.daily_quiz': { en: 'Daily Quiz', hi: 'दैनिक प्रश्नोत्तरी', mr: 'दैनिक प्रश्नमंजूषा', gu: 'દૈનિક ક્વિઝ'  },
    'nav.revision': { en: 'Revision Notes', hi: 'टिप्पणियाँ', mr: 'नोट्स', gu: 'નોંધો'  },
  'nav.resources': { en: 'Resources', hi: 'संसाधन', mr: 'संसाधने', gu: 'સંસાધનો' },
  'nav.videos': { en: 'Videos', hi: 'वीडियो', mr: 'व्हिडिओ', gu: 'વીડિયો' },
  'nav.profile': { en: 'Profile', hi: 'प्रोफ़ाइल', mr: 'प्रोफाईल', gu: 'પ્રોફાઇલ' },
  'nav.settings': { en: 'Settings', hi: 'सेटिंग्स', mr: 'सेटिंग्ज', gu: 'સેટિંગ્સ' },
  'sidebar.tagline': { en: 'Emotion-Aware Study Companion', hi: 'भावना-जागरूक अध्ययन साथी', mr: 'भावना-जागरूक अभ्यास साथी', gu: 'ભાવના-જાગૃત અભ્યાસ સાથી' },
  'sidebar.welcome': { en: 'Welcome back, Vedant!', hi: 'वापस स्वागत है, वेदांत!', mr: 'पुन्हा स्वागत, वेदांत!', gu: 'પાછા આવો છો, વેદાંત!' },
  'sidebar.day_streak': { en: 'Day Streak', hi: 'दिन की लय', mr: 'दिवसांची लय', gu: 'દિવસની શ્રેણી' },

  // ═══════════════════════════════════════════════════
  // LOGIN PAGE
  // ═══════════════════════════════════════════════════
  'login.tab_login': { en: 'Log In', hi: 'लॉग इन', mr: 'लॉग इन', gu: 'લૉગ ઇન' },
  'login.tab_signup': { en: 'Sign Up', hi: 'साइन अप', mr: 'साइन अप', gu: 'સાઇન અપ' },
  'login.welcome': { en: 'Welcome back! 👋', hi: 'वापस स्वागत है! 👋', mr: 'पुन्हा स्वागत! 👋', gu: 'પાછા આવો છો! 👋' },
  'login.continue_streak': { en: 'Continue your learning streak', hi: 'अपनी सीखने की लय जारी रखें', mr: 'तुमची शिकण्याची लय कायम ठेवा', gu: 'તમારી શીખવાની શ્રેણી ચાલુ રાખો' },
  'login.email': { en: 'Email', hi: 'ईमेल', mr: 'ईमेल', gu: 'ઈમેલ' },
  'login.password': { en: 'Password', hi: 'पासवर्ड', mr: 'पासवर्ड', gu: 'પાસવર્ડ' },
  'login.forgot_password': { en: 'Forgot password?', hi: 'पासवर्ड भूल गए?', mr: 'पासवर्ड विसरलात?', gu: 'પાસવર્ડ ભૂલી ગયા?' },
  'login.login_btn': { en: 'Log In', hi: 'लॉग इन करें', mr: 'लॉग इन करा', gu: 'લૉગ ઇન કરો' },
  'login.or_continue': { en: 'or continue with', hi: 'या इसके साथ जारी रखें', mr: 'किंवा यासह सुरू ठेवा', gu: 'અથવા આ સાથે ચાલુ રાખો' },
  'login.google_btn': { en: 'Continue with Google', hi: 'Google से जारी रखें', mr: 'Google सह सुरू ठेवा', gu: 'Google સાથે ચાલુ રાખો' },
  'login.no_account': { en: "Don't have an account?", hi: 'खाता नहीं है?', mr: 'खाते नाही?', gu: 'એકાઉન્ટ નથી?' },
  'login.signup_link': { en: 'Sign up', hi: 'साइन अप करें', mr: 'साइन अप करा', gu: 'સાઇન અપ કરો' },
  'login.create_account': { en: 'Create Account ✨', hi: 'खाता बनाएं ✨', mr: 'खाते तयार करा ✨', gu: 'એકાઉન્ટ બનાવો ✨' },
  'login.start_journey': { en: 'Start your learning journey', hi: 'अपनी सीखने की यात्रा शुरू करें', mr: 'तुमचा शिकण्याचा प्रवास सुरू करा', gu: 'તમારી શીખવાની યાત્રા શરૂ કરો' },
  'login.full_name': { en: 'Full Name', hi: 'पूरा नाम', mr: 'पूर्ण नाव', gu: 'પૂરું નામ' },
  'login.target_exam': { en: 'Target Exam', hi: 'लक्ष्य परीक्षा', mr: 'लक्ष्य परीक्षा', gu: 'લક્ષ્ય પરીક્ષા' },
  'login.create_btn': { en: 'Create Account', hi: 'खाता बनाएं', mr: 'खाते तयार करा', gu: 'એકાઉન્ટ બનાવો' },
  'login.have_account': { en: 'Already have an account?', hi: 'पहले से खाता है?', mr: 'आधीच खाते आहे?', gu: 'પહેલેથી એકાઉન્ટ છે?' },
  'login.login_link': { en: 'Log in', hi: 'लॉग इन करें', mr: 'लॉग इन करा', gu: 'લૉગ ઇન કરો' },
  'login.fill_fields': { en: 'Please fill in all fields', hi: 'कृपया सभी फ़ील्ड भरें', mr: 'कृपया सर्व फील्ड भरा', gu: 'કૃપા કરીને બધા ફીલ્ડ ભરો' },
  'login.pass_min': { en: 'Password must be at least 6 characters', hi: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए', mr: 'पासवर्ड किमान 6 अक्षरांचा असावा', gu: 'પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરનો હોવો જોઈએ' },
  'login.welcome_redirect': { en: 'Welcome back! Redirecting...', hi: 'वापस स्वागत है! रीडायरेक्ट हो रहा है...', mr: 'पुन्हा स्वागत! रीडायरेक्ट होत आहे...', gu: 'પાછા આવો છો! રીડાયરેક્ટ થઈ રહ્યું છે...' },
  'login.account_created': { en: 'Account created! Welcome! 🎉', hi: 'खाता बना! स्वागत है! 🎉', mr: 'खाते तयार झाले! स्वागत! 🎉', gu: 'એકાઉન્ટ બન્યું! સ્વાગત! 🎉' },
  'login.google_soon': { en: 'Google sign-in coming soon!', hi: 'Google साइन-इन जल्द आ रहा है!', mr: 'Google साइन-इन लवकरच येत आहे!', gu: 'Google સાઇન-ઇન ટૂંક સમયમાં આવશે!' },

  // ═══════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════
  'dash.welcome': { en: 'Welcome back, Vedant!', hi: 'वापस स्वागत है, वेदांत!', mr: 'पुन्हा स्वागत, वेदांत!', gu: 'પાછા આવો છો, વેદાંત!' },
  'dash.subtitle': { en: "Let's make today count. You're preparing for", hi: 'आज को सार्थक बनाएं। आप तैयारी कर रहे हैं', mr: 'आज सार्थक करूया. तुम्ही तयारी करत आहात', gu: 'આજને સાર્થક બનાવીએ. તમે તૈયારી કરી રહ્યા છો' },
  'dash.this_weeks_streak': { en: "This Week's Streak", hi: 'इस सप्ताह की लय', mr: 'या आठवड्याची लय', gu: 'આ અઠવાડિયાની શ્રેણી' },
  'dash.on_fire': { en: "You're on fire!", hi: 'आप जोश में हैं!', mr: 'तुम्ही जबरदस्त करत आहात!', gu: 'તમે ધૂમ મચાવી રહ્યા છો!' },
  'dash.mon': { en: 'Mon', hi: 'सोम', mr: 'सोम', gu: 'સોમ' },
  'dash.tue': { en: 'Tue', hi: 'मंगल', mr: 'मंगळ', gu: 'મંગળ' },
  'dash.wed': { en: 'Wed', hi: 'बुध', mr: 'बुध', gu: 'બુધ' },
  'dash.thu': { en: 'Thu', hi: 'गुरु', mr: 'गुरु', gu: 'ગુરુ' },
  'dash.fri': { en: 'Fri', hi: 'शुक्र', mr: 'शुक्र', gu: 'શુક્ર' },
  'dash.sat': { en: 'Sat', hi: 'शनि', mr: 'शनि', gu: 'શનિ' },
  'dash.sun': { en: 'Sun', hi: 'रवि', mr: 'रवि', gu: 'રવિ' },
  'dash.questions_answered': { en: 'Questions Answered', hi: 'उत्तर दिए गए प्रश्न', mr: 'उत्तर दिलेले प्रश्न', gu: 'જવાબ આપેલા પ્રશ્નો' },
  'dash.study_hours': { en: 'Study Hours', hi: 'अध्ययन के घंटे', mr: 'अभ्यासाचे तास', gu: 'અભ્યાસના કલાકો' },
  'dash.accuracy': { en: 'Accuracy', hi: 'सटीकता', mr: 'अचूकता', gu: 'ચોકસાઈ' },
  'dash.points': { en: 'Points', hi: 'अंक', mr: 'गुण', gu: 'પોઈન્ટ્સ' },
  'dash.todays_goal': { en: "Today's Goal", hi: 'आज का लक्ष्य', mr: 'आजचे लक्ष्य', gu: 'આજનું લક્ષ્ય' },
  'dash.this_week': { en: 'this week', hi: 'इस सप्ताह', mr: 'या आठवड्यात', gu: 'આ અઠવાડિયે' },
  'dash.weekly_progress': { en: 'Weekly Progress', hi: 'साप्ताहिक प्रगति', mr: 'साप्ताहिक प्रगती', gu: 'સાપ્તાહિક પ્રગતિ' },
  'dash.complete_quiz': { en: 'Complete Daily Quiz', hi: 'दैनिक प्रश्नोत्तरी पूरी करें', mr: 'दैनिक प्रश्नमंजूषा पूर्ण करा', gu: 'દૈનિક ક્વિઝ પૂર્ણ કરો' },
  'dash.study_chapters': { en: 'Study 2 chapters of DBMS', hi: 'DBMS के 2 अध्याय पढ़ें', mr: 'DBMS चे 2 अध्याय अभ्यास करा', gu: 'DBMS ના 2 પ્રકરણ અભ્યાસ કરો' },
  'dash.practice_mcqs': { en: 'Practice 10 MCQs on Networks', hi: 'नेटवर्क पर 10 MCQ अभ्यास करें', mr: 'नेटवर्क वर 10 MCQ सराव करा', gu: 'નેટવર્ક પર 10 MCQ પ્રેક્ટિસ કરો' },
  'dash.watch_video': { en: 'Watch 1 video lecture', hi: '1 वीडियो लेक्चर देखें', mr: '1 व्हिडिओ लेक्चर बघा', gu: '1 વીડિયો લેક્ચર જુઓ' },
  'dash.revise_notes': { en: "Revise yesterday's notes", hi: 'कल के नोट्स दोहराएं', mr: 'कालच्या नोट्स उजळणी करा', gu: 'ગઈ કાલની નોટ્સ રિવાઇઝ કરો' },
  'dash.start_quiz': { en: 'Start Quiz', hi: 'प्रश्नोत्तरी शुरू करें', mr: 'प्रश्नमंजूषा सुरू करा', gu: 'ક્વિઝ શરૂ કરો' },
  'dash.ask_ai': { en: 'Ask AI', hi: 'AI से पूछें', mr: 'AI ला विचारा', gu: 'AI ને પૂછો' },
  'dash.recent_activity': { en: 'Recent Activity', hi: 'हाल की गतिविधि', mr: 'अलीकडील क्रियाकलाप', gu: 'તાજેતરની પ્રવૃત્તિ' },
  'dash.completed_quiz': { en: 'Completed Daily Quiz – JEE', hi: 'दैनिक प्रश्नोत्तरी पूरी की – JEE', mr: 'दैनिक प्रश्नमंजूषा पूर्ण केली – JEE', gu: 'દૈનિક ક્વિઝ પૂર્ણ કરી – JEE' },
  'dash.studied_os': { en: 'Studied Operating Systems 45 mins', hi: 'ऑपरेटिंग सिस्टम 45 मिनट पढ़ा', mr: 'ऑपरेटिंग सिस्टम 45 मिनिटे अभ्यास केला', gu: 'ઓપરેટિંગ સિસ્ટમ 45 મિનિટ અભ્યાસ કર્યો' },
  'dash.asked_ai': { en: 'Asked 3 questions to AI Assistant', hi: 'AI सहायक से 3 प्रश्न पूछे', mr: 'AI सहाय्यकाला 3 प्रश्न विचारले', gu: 'AI સહાયકને 3 પ્રશ્નો પૂછ્યા' },
  'dash.maintained_streak': { en: 'Maintained 12-day streak!', hi: '12 दिन की लय बनाए रखी!', mr: '12 दिवसांची लय कायम ठेवली!', gu: '12 દિવસની શ્રેણી જાળવી!' },
  'dash.ago': { en: 'ago', hi: 'पहले', mr: 'पूर्वी', gu: 'પહેલાં' },
  'dash.today': { en: 'Today', hi: 'आज', mr: 'आज', gu: 'આજે' },
  'dash.view_leaderboard': { en: 'View Leaderboard', hi: 'लीडरबोर्ड देखें', mr: 'लीडरबोर्ड बघा', gu: 'લીડરબોર્ડ જુઓ' },
  'dash.streak_toast': { en: "You're on a 12-day streak! Keep going!", hi: 'आप 12 दिन की लय पर हैं! जारी रखें!', mr: 'तुमची 12 दिवसांची लय आहे! चालू ठेवा!', gu: 'તમારી 12 દિવસની શ્રેણી છે! ચાલુ રાખો!' },

  // ═══════════════════════════════════════════════════
  // CHAT PAGE
  // ═══════════════════════════════════════════════════
  'chat.title': { en: 'AI Study Companion', hi: 'AI अध्ययन साथी', mr: 'AI अभ्यास साथी', gu: 'AI અભ્યાસ સાથી' },
  'chat.subtitle': { en: 'Your emotion-aware learning assistant', hi: 'आपका भावना-जागरूक शिक्षण सहायक', mr: 'तुमचा भावना-जागरूक शिक्षण सहाय्यक', gu: 'તમારો ભાવના-જાગૃત શીખવાનો સહાયક' },
  'chat.welcome_msg': { en: "Hello! I'm your AI study companion. How are you feeling today? Let's work together to ace your exams! 😊", hi: "नमस्ते! मैं आपका AI अध्ययन साथी हूँ। आज आप कैसा महसूस कर रहे हैं? चलिए मिलकर परीक्षा में शानदार प्रदर्शन करें! 😊", mr: "नमस्कार! मी तुमचा AI अभ्यास साथी आहे. आज तुम्हाला कसे वाटते? चला मिळून परीक्षेत उत्तम कामगिरी करूया! 😊", gu: "નમસ્તે! હું તમારો AI અભ્યાસ સાથી છું. આજે તમે કેવું અનુભવો છો? ચાલો સાથે મળીને પરીક્ષામાં ઉત્તમ પ્રદર્શન કરીએ! 😊" },
  'chat.placeholder': { en: 'Ask me anything about your studies...', hi: 'अपनी पढ़ाई के बारे में कुछ भी पूछें...', mr: 'तुमच्या अभ्यासाबद्दल काहीही विचारा...', gu: 'તમારા અભ્યાસ વિશે કંઈપણ પૂછો...' },
  'chat.confident': { en: 'Confident', hi: 'आत्मविश्वासी', mr: 'आत्मविश्वासू', gu: 'આત્મવિશ્વાસુ' },
  'chat.confused': { en: 'Confused', hi: 'भ्रमित', mr: 'गोंधळलेला', gu: 'મૂંઝાયેલા' },
  'chat.frustrated': { en: 'Frustrated', hi: 'निराश', mr: 'निराश', gu: 'નિરાશ' },
  'chat.anxious': { en: 'Anxious', hi: 'चिंतित', mr: 'चिंतित', gu: 'ચિંતિત' },
  'chat.neutral': { en: 'Neutral', hi: 'सामान्य', mr: 'सामान्य', gu: 'સામાન્ય' },
  'chat.voice_on': { en: 'Listening... 🎤 Speak now!', hi: 'सुन रहे हैं... 🎤 अब बोलें!', mr: 'ऐकत आहे... 🎤 आता बोला!', gu: 'સાંભળી રહ્યા છીએ... 🎤 હવે બોલો!' },
  'chat.voice_got_it': { en: 'Got it! Tap send to ask.', hi: 'मिल गया! भेजने के लिए टैप करें।', mr: 'मिळाले! पाठवण्यासाठी टॅप करा.', gu: 'મળી ગયું! મોકલવા ટેપ કરો.' },
  'chat.voice_error': { en: 'Could not hear you. Try again.', hi: 'सुन नहीं पाए। फिर से कोशिश करें।', mr: 'ऐकू शकलो नाही. पुन्हा प्रयत्न करा.', gu: 'સાંભળી શક્યા નહીં. ફરી પ્રયાસ કરો.' },
  'chat.voice_unsupported': { en: 'Voice not supported in this browser', hi: 'इस ब्राउज़र में वॉइस समर्थित नहीं है', mr: 'या ब्राउझरमध्ये व्हॉइस समर्थित नाही', gu: 'આ બ્રાઉઝરમાં વૉઇસ સપોર્ટેડ નથી' },
  'chat.error_connect': { en: "Sorry, I couldn't connect right now. Please check if the server is running. 😔", hi: 'क्षमा करें, अभी कनेक्ट नहीं हो पाया। कृपया जांचें कि सर्वर चल रहा है। 😔', mr: 'माफ करा, आत्ता कनेक्ट होऊ शकलो नाही. कृपया सर्व्हर चालू आहे का ते तपासा. 😔', gu: 'માફ કરજો, હમણાં કનેક્ટ થઈ શક્યા નહીં. કૃપા કરીને તપાસો કે સર્વર ચાલી રહ્યો છે. 😔' },

  // ═══════════════════════════════════════════════════
  // QUIZ PAGE
  // ═══════════════════════════════════════════════════
  'quiz.title': { en: 'Daily Quiz', hi: 'दैनिक प्रश्नोत्तरी', mr: 'दैनिक प्रश्नमंजूषा', gu: 'દૈનિક ક્વિઝ' },
  'quiz.subtitle': { en: 'Test your knowledge, earn points, build your streak!', hi: 'अपना ज्ञान परखें, अंक कमाएं, अपनी लय बनाएं!', mr: 'तुमचे ज्ञान तपासा, गुण मिळवा, लय कायम ठेवा!', gu: 'તમારું જ્ઞાન ચકાસો, પોઈન્ટ્સ મેળવો, શ્રેણી બનાવો!' },
  'quiz.todays_topics': { en: "Today's Quiz Topics", hi: 'आज के प्रश्नोत्तरी विषय', mr: 'आजचे प्रश्नमंजूषा विषय', gu: 'આજના ક્વિઝ વિષયો' },
  'quiz.personalized': { en: 'Personalized for your JEE prep — mixed subjects, medium difficulty', hi: 'आपकी JEE तैयारी के लिए — मिश्रित विषय, मध्यम कठिनाई', mr: 'तुमच्या JEE तयारीसाठी — मिश्र विषय, मध्यम कठीण', gu: 'તમારી JEE તૈયારી માટે — મિશ્ર વિષયો, મધ્યમ કઠિનાઈ' },
  'quiz.minutes': { en: 'minutes', hi: 'मिनट', mr: 'मिनिटे', gu: 'મિનિટ' },
  'quiz.questions': { en: 'Questions', hi: 'प्रश्न', mr: 'प्रश्न', gu: 'પ્રશ્નો' },
  'quiz.pts_per_correct': { en: 'pts per correct', hi: 'सही उत्तर पर अंक', mr: 'बरोबर उत्तरावर गुण', gu: 'સાચા જવાબ દીઠ પોઈન્ટ્સ' },
  'quiz.streak_bonus': { en: 'Streak bonus', hi: 'लय का बोनस', mr: 'लय बोनस', gu: 'શ્રેણી બોનસ' },
  'quiz.select_topic': { en: 'Select Topic Focus', hi: 'विषय चुनें', mr: 'विषय निवडा', gu: 'વિષય પસંદ કરો' },
  'quiz.mixed': { en: 'Mixed', hi: 'मिश्रित', mr: 'मिश्र', gu: 'મિશ્ર' },
  'quiz.physics': { en: 'Physics', hi: 'भौतिकी', mr: 'भौतिकशास्त्र', gu: 'ભૌતિકશાસ્ત્ર' },
  'quiz.chemistry': { en: 'Chemistry', hi: 'रसायन', mr: 'रसायनशास्त्र', gu: 'રસાયણશાસ્ત્ર' },
  'quiz.maths': { en: 'Maths', hi: 'गणित', mr: 'गणित', gu: 'ગણિત' },
  'quiz.biology': { en: 'Biology', hi: 'जीवविज्ञान', mr: 'जीवशास्त्र', gu: 'જીવવિજ્ઞાન' },
  'quiz.start': { en: 'Start Quiz', hi: 'प्रश्नोत्तरी शुरू करें', mr: 'प्रश्नमंजूषा सुरू करा', gu: 'ક્વિઝ શરૂ કરો' },
  'quiz.score_history': { en: 'Score History', hi: 'स्कोर इतिहास', mr: 'स्कोर इतिहास', gu: 'સ્કોર ઇતિહાસ' },
  'quiz.best_score': { en: 'Best score: 100/100 on Friday!', hi: 'सर्वश्रेष्ठ स्कोर: शुक्रवार को 100/100!', mr: 'सर्वोत्तम स्कोर: शुक्रवारी 100/100!', gu: 'શ્રેષ્ઠ સ્કોર: શુક્રવારે 100/100!' },
  'quiz.achievements': { en: 'Achievements', hi: 'उपलब्धियाँ', mr: 'उपलब्धी', gu: 'સિદ્ધિઓ' },
  'quiz.speed_demon': { en: 'Speed Demon', hi: 'स्पीड डेमन', mr: 'स्पीड डेमन', gu: 'સ્પીડ ડેમન' },
  'quiz.under_5min': { en: 'Finished in under 5 min', hi: '5 मिनट से कम में पूरा किया', mr: '5 मिनिटांत पूर्ण केले', gu: '5 મિનિટમાં પૂર્ણ કર્યું' },
  'quiz.perfect_score': { en: 'Perfect Score ×3', hi: 'पूर्ण स्कोर ×3', mr: 'परिपूर्ण स्कोर ×3', gu: 'સંપૂર્ણ સ્કોર ×3' },
  'quiz.perfect_desc': { en: '100% three times in a row', hi: 'लगातार तीन बार 100%', mr: 'सलग तीन वेळा 100%', gu: 'સતત ત્રણ વખત 100%' },
  'quiz.week_master': { en: 'Week Master', hi: 'सप्ताह का मास्टर', mr: 'आठवडा मास्टर', gu: 'અઠવાડિયાના માસ્ટર' },
  'quiz.week_master_desc': { en: 'Quiz every day for a week', hi: 'एक सप्ताह हर दिन प्रश्नोत्तरी', mr: 'एक आठवडा दररोज प्रश्नमंजूषा', gu: 'એક અઠવાડિયું દરરોજ ક્વિઝ' },
  'quiz.session_stats': { en: 'Session Stats', hi: 'सत्र आँकड़े', mr: 'सत्र आकडेवारी', gu: 'સત્ર આંકડા' },
  'quiz.correct': { en: 'Correct', hi: 'सही', mr: 'बरोबर', gu: 'સાચા' },
  'quiz.wrong': { en: 'Wrong', hi: 'गलत', mr: 'चूक', gu: 'ખોટા' },
  'quiz.points_earned': { en: 'Points earned:', hi: 'अर्जित अंक:', mr: 'मिळवलेले गुण:', gu: 'મેળવેલા પોઈન્ટ્સ:' },
  'quiz.skip': { en: 'Skip', hi: 'छोड़ें', mr: 'वगळा', gu: 'છોડો' },
  'quiz.submit': { en: 'Submit Answer', hi: 'उत्तर जमा करें', mr: 'उत्तर सबमिट करा', gu: 'જવાબ સબમિટ કરો' },
  'quiz.select_answer': { en: 'Please select an answer!', hi: 'कृपया एक उत्तर चुनें!', mr: 'कृपया उत्तर निवडा!', gu: 'કૃપા કરીને એક જવાબ પસંદ કરો!' },
  'quiz.complete': { en: 'Quiz Complete!', hi: 'प्रश्नोत्तरी पूरी!', mr: 'प्रश्नमंजूषा पूर्ण!', gu: 'ક્વિઝ પૂર્ણ!' },
  'quiz.excellent': { en: 'Excellent Work!', hi: 'उत्कृष्ट कार्य!', mr: 'उत्कृष्ट काम!', gu: 'ઉત્કૃષ્ટ કાર્ય!' },
  'quiz.good_job': { en: 'Good Job!', hi: 'अच्छा काम!', mr: 'छान काम!', gu: 'સારું કામ!' },
  'quiz.keep_practicing': { en: 'Keep Practicing!', hi: 'अभ्यास जारी रखें!', mr: 'सराव चालू ठेवा!', gu: 'પ્રેક્ટિસ ચાલુ રાખો!' },
  'quiz.try_again': { en: 'Try Again', hi: 'पुनः प्रयास करें', mr: 'पुन्हा प्रयत्न करा', gu: 'ફરી પ્રયાસ કરો' },
  'quiz.view_leaderboard': { en: 'View Leaderboard', hi: 'लीडरबोर्ड देखें', mr: 'लीडरबोर्ड बघा', gu: 'લીડરબોર્ડ જુઓ' },

  // ═══════════════════════════════════════════════════
  // LEADERBOARD PAGE
  // ═══════════════════════════════════════════════════
  'lb.title': { en: 'Leaderboard', hi: 'लीडरबोर्ड', mr: 'लीडरबोर्ड', gu: 'લીડરબોર્ડ' },
  'lb.subtitle': { en: 'Friendly competition with your JEE squad!', hi: 'अपनी JEE टीम के साथ मित्रवत प्रतियोगिता!', mr: 'तुमच्या JEE टीमसह मैत्रीपूर्ण स्पर्धा!', gu: 'તમારી JEE ટીમ સાથે મૈત્રીપૂર્ણ સ્પર્ધા!' },
  'lb.this_week': { en: 'This Week', hi: 'इस सप्ताह', mr: 'हा आठवडा', gu: 'આ અઠવાડિયું' },
  'lb.all_time': { en: 'All Time', hi: 'सभी समय', mr: 'सर्व काळ', gu: 'બધા સમય' },
  'lb.invite': { en: 'Invite Friends', hi: 'मित्रों को आमंत्रित करें', mr: 'मित्रांना आमंत्रित करा', gu: 'મિત્રોને આમંત્રિત કરો' },
  'lb.invite_toast': { en: 'Invite link copied! Share with friends', hi: 'आमंत्रण लिंक कॉपी हो गई! दोस्तों के साथ शेयर करें', mr: 'आमंत्रण लिंक कॉपी झाली! मित्रांसह शेअर करा', gu: 'આમંત્રણ લિંક કૉપી થઈ! મિત્રો સાથે શેર કરો' },
  'lb.points': { en: 'points', hi: 'अंक', mr: 'गुण', gu: 'પોઈન્ટ્સ' },
  'lb.rankings': { en: 'Rankings — Friends Only', hi: 'रैंकिंग — केवल दोस्त', mr: 'रँकिंग — फक्त मित्र', gu: 'રેન્કિંગ — ફક્ત મિત્રો' },
  'lb.your_position': { en: 'Your position this week', hi: 'इस सप्ताह आपकी स्थिति', mr: 'या आठवड्यात तुमची स्थिती', gu: 'આ અઠવાડિયે તમારી સ્થિતિ' },

  // ═══════════════════════════════════════════════════
  // VIDEOS / RESOURCES PAGE
  // ═══════════════════════════════════════════════════
  'vid.title': { en: 'Resources', hi: 'संसाधन', mr: 'संसाधने', gu: 'સંસાધનો' },
  'vid.subtitle': { en: 'AI-curated video lectures & study materials for your JEE prep', hi: 'आपकी JEE तैयारी के लिए AI-क्यूरेटेड वीडियो लेक्चर', mr: 'तुमच्या JEE तयारीसाठी AI-क्यूरेटेड व्हिडिओ लेक्चर', gu: 'તમારી JEE તૈયારી માટે AI-ક્યુરેટેડ વીડિયો લેક્ચર' },
  'vid.ai_tip': { en: 'AI Study Tip', hi: 'AI अध्ययन सुझाव', mr: 'AI अभ्यास टिप', gu: 'AI અભ્યાસ ટિપ' },
  'vid.ai_tip_text': { en: 'Based on your quiz results, you should focus on <strong>Thermodynamics</strong> today. Your accuracy was 62% — watch the recommended lectures below first!', hi: 'आपके प्रश्नोत्तरी परिणामों के आधार पर, आज <strong>ऊष्मागतिकी</strong> पर ध्यान दें। आपकी सटीकता 62% थी — पहले नीचे अनुशंसित लेक्चर देखें!', mr: 'तुमच्या प्रश्नमंजूषा निकालांवर आधारित, आज <strong>ऊष्मागतिकी</strong> वर लक्ष केंद्रित करा. तुमची अचूकता 62% होती — आधी खालील शिफारस केलेले लेक्चर बघा!', gu: 'તમારા ક્વિઝ પરિણામોના આધારે, આજે <strong>ઉષ્માગતિશાસ્ત્ર</strong> પર ધ્યાન આપો. તમારી ચોકસાઈ 62% હતી — પહેલા નીચેના ભલામણ કરેલ લેક્ચર જુઓ!' },
  'vid.show_me': { en: 'Show me', hi: 'दिखाएं', mr: 'दाखवा', gu: 'બતાવો' },
  'vid.search_placeholder': { en: 'Search topics, chapters, teachers...', hi: 'विषय, अध्याय, शिक्षक खोजें...', mr: 'विषय, अध्याय, शिक्षक शोधा...', gu: 'વિષયો, પ્રકરણો, શિક્ષકો શોધો...' },
  'vid.all_subjects': { en: 'All Subjects', hi: 'सभी विषय', mr: 'सर्व विषय', gu: 'બધા વિષયો' },
  'vid.ai_pick': { en: 'AI Pick', hi: 'AI चयन', mr: 'AI निवड', gu: 'AI પસંદગી' },
  'vid.views': { en: 'views', hi: 'व्यूज', mr: 'व्ह्यूज', gu: 'વ્યૂઝ' },

  // ═══════════════════════════════════════════════════
  // PROFILE PAGE
  // ═══════════════════════════════════════════════════
  'prof.title': { en: '👤 Profile', hi: '👤 प्रोफ़ाइल', mr: '👤 प्रोफाईल', gu: '👤 પ્રોફાઇલ' },
  'prof.subtitle': { en: 'Your learning journey snapshot', hi: 'आपकी सीखने की यात्रा का स्नैपशॉट', mr: 'तुमच्या शिकण्याच्या प्रवासाचा स्नॅपशॉट', gu: 'તમારી શીખવાની યાત્રાનો સ્નેપશૉટ' },
  'prof.edit': { en: '✏️ Edit Profile', hi: '✏️ प्रोफ़ाइल संपादित करें', mr: '✏️ प्रोफाईल संपादित करा', gu: '✏️ પ્રોફાઇલ સંપાદિત કરો' },
  'prof.edit_soon': { en: 'Profile edit coming soon! 🚧', hi: 'प्रोफ़ाइल संपादन जल्द आ रहा है! 🚧', mr: 'प्रोफाईल संपादन लवकरच येत आहे! 🚧', gu: 'પ્રોફાઇલ સંપાદન ટૂંક સમયમાં! 🚧' },
  'prof.bio': { en: 'Passionate JEE aspirant who loves Physics and Math. Aiming for IIT Bombay CSE! 💻🔥', hi: 'Physics और Math से प्यार करने वाला JEE उम्मीदवार। IIT Bombay CSE का लक्ष्य! 💻🔥', mr: 'Physics आणि Math आवडणारा JEE उमेदवार. IIT Bombay CSE चे लक्ष्य! 💻🔥', gu: 'Physics અને Math ને ચાહતા JEE ઉમેદવાર. IIT Bombay CSE નું લક્ષ્ય! 💻🔥' },
  'prof.questions': { en: 'Questions', hi: 'प्रश्न', mr: 'प्रश्न', gu: 'પ્રશ્નો' },
  'prof.study_time': { en: 'Study Time', hi: 'अध्ययन समय', mr: 'अभ्यास वेळ', gu: 'અભ્યાસ સમય' },
  'prof.accuracy': { en: 'Accuracy', hi: 'सटीकता', mr: 'अचूकता', gu: 'ચોકસાઈ' },
  'prof.points': { en: 'Points', hi: 'अंक', mr: 'गुण', gu: 'પોઈન્ટ્સ' },
  'prof.subject_perf': { en: 'Subject Performance', hi: 'विषय प्रदर्शन', mr: 'विषय कामगिरी', gu: 'વિષય પ્રદર્શન' },
  'prof.study_activity': { en: 'Study Activity', hi: 'अध्ययन गतिविधि', mr: 'अभ्यास क्रियाकलाप', gu: 'અભ્યાસ પ્રવૃત્તિ' },
  'prof.last_12': { en: 'Last 12 months', hi: 'पिछले 12 महीने', mr: 'मागील 12 महिने', gu: 'છેલ્લા 12 મહિના' },
  'prof.less': { en: 'Less', hi: 'कम', mr: 'कमी', gu: 'ઓછું' },
  'prof.more': { en: 'More', hi: 'अधिक', mr: 'अधिक', gu: 'વધુ' },
  'prof.achievements': { en: 'Achievements', hi: 'उपलब्धियाँ', mr: 'उपलब्धी', gu: 'સિદ્ધિઓ' },
  'prof.streak_master': { en: 'Streak Master', hi: 'लय मास्टर', mr: 'लय मास्टर', gu: 'શ્રેણી માસ્ટર' },
  'prof.streak_desc': { en: '12 day streak!', hi: '12 दिन की लय!', mr: '12 दिवसांची लय!', gu: '12 દિવસની શ્રેણી!' },
  'prof.sharpshooter': { en: 'Sharpshooter', hi: 'शार्पशूटर', mr: 'शार्पशूटर', gu: 'શાર્પશૂટર' },
  'prof.ss_desc': { en: '100% on quiz', hi: 'प्रश्नोत्तरी में 100%', mr: 'प्रश्नमंजूषेत 100%', gu: 'ક્વિઝમાં 100%' },
  'prof.bookworm': { en: 'Bookworm', hi: 'किताबी कीड़ा', mr: 'पुस्तकप्रेमी', gu: 'પુસ્તકપ્રેમી' },
  'prof.bw_desc': { en: '50+ hours studied', hi: '50+ घंटे अध्ययन', mr: '50+ तास अभ्यास', gu: '50+ કલાક અભ્યાસ' },
  'prof.quick_start': { en: 'Quick Start', hi: 'त्वरित शुरुआत', mr: 'जलद सुरुवात', gu: 'ઝડપી શરૂઆત' },
  'prof.qs_desc': { en: 'First 3 days done', hi: 'पहले 3 दिन पूरे', mr: 'पहिले 3 दिवस पूर्ण', gu: 'પહેલા 3 દિવસ પૂર્ણ' },
  'prof.ai_explorer': { en: 'AI Explorer', hi: 'AI एक्सप्लोरर', mr: 'AI एक्सप्लोरर', gu: 'AI એક્સપ્લોરર' },
  'prof.ae_desc': { en: '50 AI sessions', hi: '50 AI सत्र', mr: '50 AI सत्र', gu: '50 AI સત્ર' },
  'prof.top3': { en: 'Top 3', hi: 'शीर्ष 3', mr: 'शीर्ष 3', gu: 'ટોપ 3' },
  'prof.top3_desc': { en: 'Reach top leaderboard', hi: 'शीर्ष लीडरबोर्ड पर पहुंचें', mr: 'शीर्ष लीडरबोर्डवर पोहोचा', gu: 'ટોપ લીડરબોર્ડ પર પહોંચો' },

  // ═══════════════════════════════════════════════════
  // SETTINGS PAGE
  // ═══════════════════════════════════════════════════
  'set.title': { en: 'Settings', hi: 'सेटिंग्स', mr: 'सेटिंग्ज', gu: 'સેટિંગ્સ' },
  'set.subtitle': { en: 'Customize your learning experience', hi: 'अपने सीखने के अनुभव को अनुकूलित करें', mr: 'तुमचा शिकण्याचा अनुभव सानुकूलित करा', gu: 'તમારા શીખવાના અનુભવને કસ્ટમાઇઝ કરો' },
  'set.language': { en: '🌐 Language', hi: '🌐 भाषा', mr: '🌐 भाषा', gu: '🌐 ભાષા' },
  'set.lang_note': { en: '💡 AI tutor will respond in your selected language. You can switch anytime.', hi: '💡 AI ट्यूटर आपकी चुनी हुई भाषा में जवाब देगा। आप कभी भी बदल सकते हैं।', mr: '💡 AI ट्युटर तुमच्या निवडलेल्या भाषेत उत्तर देईल. तुम्ही कधीही बदलू शकता.', gu: '💡 AI ટ્યુટર તમારી પસંદ કરેલી ભાષામાં જવાબ આપશે. તમે ગમે ત્યારે બદલી શકો છો.' },
  'set.appearance': { en: '🎨 Appearance', hi: '🎨 दिखावट', mr: '🎨 दिसणे', gu: '🎨 દેખાવ' },
  'set.dark_mode': { en: 'Dark Mode', hi: 'डार्क मोड', mr: 'डार्क मोड', gu: 'ડાર્ક મોડ' },
  'set.dark_desc': { en: 'Switch between light and dark theme', hi: 'लाइट और डार्क थीम के बीच स्विच करें', mr: 'लाइट आणि डार्क थीम दरम्यान स्विच करा', gu: 'લાઇટ અને ડાર્ક થીમ વચ્ચે સ્વિચ કરો' },
  'set.notifications': { en: '🔔 Notifications', hi: '🔔 सूचनाएं', mr: '🔔 सूचना', gu: '🔔 સૂચનાઓ' },
  'set.push': { en: 'Push Notifications', hi: 'पुश सूचनाएं', mr: 'पुश सूचना', gu: 'પુશ સૂચનાઓ' },
  'set.push_desc': { en: 'Get notified about study reminders', hi: 'अध्ययन रिमाइंडर की सूचना पाएं', mr: 'अभ्यास रिमाइंडरबद्दल सूचना मिळवा', gu: 'અભ્યાસ રિમાઇન્ડર વિશે સૂચના મેળવો' },
  'set.email_digest': { en: 'Email Digest', hi: 'ईमेल डाइजेस्ट', mr: 'ईमेल डायजेस्ट', gu: 'ઈમેલ ડાયજેસ્ટ' },
  'set.email_desc': { en: 'Weekly progress summary', hi: 'साप्ताहिक प्रगति सारांश', mr: 'साप्ताहिक प्रगती सारांश', gu: 'સાપ્તાહિક પ્રગતિ સારાંશ' },
  'set.achievement_alerts': { en: 'Achievement Alerts', hi: 'उपलब्धि अलर्ट', mr: 'उपलब्धी अलर्ट', gu: 'સિદ્ધિ એલર્ટ' },
  'set.achievement_desc': { en: 'Notify when you earn badges', hi: 'बैज मिलने पर सूचित करें', mr: 'बॅज मिळाल्यावर सूचित करा', gu: 'બેજ મળે ત્યારે સૂચિત કરો' },
  'set.study_pref': { en: '📚 Study Preferences', hi: '📚 अध्ययन प्राथमिकताएं', mr: '📚 अभ्यास प्राधान्ये', gu: '📚 અભ્યાસ પ્રાથમિકતાઓ' },
  'set.daily_goal': { en: 'Daily Goal', hi: 'दैनिक लक्ष्य', mr: 'दैनिक लक्ष्य', gu: 'દૈનિક લક્ષ્ય' },
  'set.daily_goal_desc': { en: 'Set your daily study target', hi: 'अपना दैनिक अध्ययन लक्ष्य निर्धारित करें', mr: 'तुमचे दैनिक अभ्यास लक्ष्य निश्चित करा', gu: 'તમારું દૈનિક અભ્યાસ લક્ષ્ય સેટ કરો' },
  'set.ai_difficulty': { en: 'AI Difficulty', hi: 'AI कठिनाई', mr: 'AI कठीणता', gu: 'AI કઠિનાઈ' },
  'set.ai_diff_desc': { en: 'Adjust question difficulty', hi: 'प्रश्न कठिनाई समायोजित करें', mr: 'प्रश्न कठीणता समायोजित करा', gu: 'પ્રશ્ન કઠિનાઈ સમાયોજિત કરો' },
  'set.sound': { en: 'Sound Effects', hi: 'ध्वनि प्रभाव', mr: 'ध्वनी प्रभाव', gu: 'ધ્વનિ ઇફેક્ટ' },
  'set.sound_desc': { en: 'Play sounds on correct answers', hi: 'सही उत्तर पर ध्वनि बजाएं', mr: 'बरोबर उत्तरावर ध्वनी वाजवा', gu: 'સાચા જવાબ પર ધ્વનિ વગાડો' },
  'set.account': { en: '👤 Account', hi: '👤 खाता', mr: '👤 खाते', gu: '👤 એકાઉન્ટ' },
  'set.privacy': { en: 'Privacy', hi: 'गोपनीयता', mr: 'गोपनीयता', gu: 'ગોપનીયતા' },
  'set.privacy_desc': { en: 'Show profile on leaderboard', hi: 'लीडरबोर्ड पर प्रोफ़ाइल दिखाएं', mr: 'लीडरबोर्डवर प्रोफाईल दाखवा', gu: 'લીડરબોર્ડ પર પ્રોફાઇલ બતાવો' },
  'set.export': { en: 'Export Data', hi: 'डेटा निर्यात', mr: 'डेटा एक्सपोर्ट', gu: 'ડેટા એક્સપોર્ટ' },
  'set.export_desc': { en: 'Download your study history', hi: 'अपना अध्ययन इतिहास डाउनलोड करें', mr: 'तुमचा अभ्यास इतिहास डाउनलोड करा', gu: 'તમારો અભ્યાસ ઇતિહાસ ડાઉનલોડ કરો' },
  'set.export_btn': { en: 'Export', hi: 'निर्यात', mr: 'एक्सपोर्ट', gu: 'એક્સપોર્ટ' },
  'set.export_toast': { en: 'Export started! Check your email.', hi: 'निर्यात शुरू हुआ! अपना ईमेल जांचें।', mr: 'एक्सपोर्ट सुरू झाले! तुमचे ईमेल तपासा.', gu: 'એક્સપોર્ટ શરૂ થયું! તમારું ઈમેલ તપાસો.' },
  'set.signout': { en: 'Sign Out', hi: 'साइन आउट', mr: 'साइन आउट', gu: 'સાઇન આઉટ' },
  'set.signout_toast': { en: 'Signed out successfully', hi: 'सफलतापूर्वक साइन आउट हो गए', mr: 'यशस्वीरित्या साइन आउट झाले', gu: 'સફળતાપૂર્વક સાઇન આઉટ થયું' },
  'set.footer': { en: 'AdaptEd Ai v1.0 · Made with', hi: 'AdaptEd Ai v1.0 · बनाया गया', mr: 'AdaptEd Ai v1.0 · बनवले', gu: 'AdaptEd Ai v1.0 · બનાવ્યું' },
  'set.for_students': { en: 'for students', hi: 'छात्रों के लिए', mr: 'विद्यार्थ्यांसाठी', gu: 'વિદ્યાર્થીઓ માટે' },
  'set.lang_set': { en: 'Language set to', hi: 'भाषा सेट की गई', mr: 'भाषा सेट केली', gu: 'ભાષા સેટ કરી' },

  // ═══════════════════════════════════════════════════
  // COMMON / SHARED
  // ═══════════════════════════════════════════════════
  'common.loading': { en: 'Loading...', hi: 'लोड हो रहा है...', mr: 'लोड होत आहे...', gu: 'લોડ થઈ રહ્યું છે...' },
  'common.medium': { en: 'Medium', hi: 'मध्यम', mr: 'मध्यम', gu: 'મધ્યમ' },
  'common.easy': { en: 'Easy', hi: 'आसान', mr: 'सोपे', gu: 'સરળ' },
  'common.hard': { en: 'Hard', hi: 'कठिन', mr: 'कठीण', gu: 'કઠિન' },
  'common.adaptive': { en: 'Adaptive', hi: 'अनुकूली', mr: 'अनुकूल', gu: 'અનુકૂળ' },
  'common.mins_30': { en: '30 mins', hi: '30 मिनट', mr: '30 मिनिटे', gu: '30 મિનિટ' },
  'common.hour_1': { en: '1 hour', hi: '1 घंटा', mr: '1 तास', gu: '1 કલાક' },
  'common.hours_2': { en: '2 hours', hi: '2 घंटे', mr: '2 तास', gu: '2 કલાક' },
  'common.hours_3': { en: '3 hours', hi: '3 घंटे', mr: '3 तास', gu: '3 કલાક' },
};

// ═══════════════════════════════════════════════════
// LANGUAGE NAMES (for UI display)
// ═══════════════════════════════════════════════════
const LANG_META = {
  en: { name: 'English', flag: '🇬🇧', nativeName: 'English' },
  hi: { name: 'Hindi', flag: '🇮🇳', nativeName: 'हिन्दी' },
  mr: { name: 'Marathi', flag: '🇮🇳', nativeName: 'मराठी' },
  gu: { name: 'Gujarati', flag: '🇮🇳', nativeName: 'ગુજરાતી' },
};

// ═══════════════════════════════════════════════════
// i18n ENGINE
// ═══════════════════════════════════════════════════
const I18n = {
  currentLang: 'en',

  init() {
    this.currentLang = localStorage.getItem('ls-lang') || 'en';
    this.applyAll();
    this.updateLangSwitchers();
  },

  setLang(lang) {
    if (!LANG_META[lang]) return;
    this.currentLang = lang;
    localStorage.setItem('ls-lang', lang);
    this.applyAll();
    this.updateLangSwitchers();
  },

  t(key) {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[this.currentLang] || entry.en || key;
  },

  applyAll() {
    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        // Preserve child elements (like icons) by only replacing text nodes
        // If element has data-i18n-html, use innerHTML
        if (el.hasAttribute('data-i18n-html')) {
          el.innerHTML = text;
        } else {
          // Simple text replacement
          el.textContent = text;
        }
      }
    });

    // Translate elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.getAttribute('data-i18n-placeholder'));
    });

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLang === 'en' ? 'en' :
      this.currentLang === 'hi' ? 'hi' :
        this.currentLang === 'mr' ? 'mr' : 'gu';
  },

  updateLangSwitchers() {
    // Update all sidebar language selects
    document.querySelectorAll('.sidebar-lang select, #langSwitcher, #topLangSwitcher').forEach(sel => {
      sel.value = this.currentLang;
    });

    // Update settings language grid
    document.querySelectorAll('.lang-option[data-lang]').forEach(el => {
      el.classList.toggle('active', el.dataset.lang === this.currentLang);
    });
  },

  getLangName() {
    return LANG_META[this.currentLang]?.nativeName || 'English';
  },

  // For Gemini — returns the language name Gemini should respond in
  getGeminiLang() {
    const map = { en: 'English', hi: 'Hindi', mr: 'Marathi', gu: 'Gujarati' };
    return map[this.currentLang] || 'English';
  }
};
