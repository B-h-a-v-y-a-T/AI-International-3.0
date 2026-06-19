const fs = require('fs');
const TRANSLATIONS = {
  'nav.dashboard': { en: 'Dashboard', hi: '????????', mr: '????????', gu: '????????' },
  'nav.ai_assistant': { en: 'AI Assistant', hi: 'AI ?????', mr: 'AI ???????', gu: 'AI ?????' },
  'nav.ai_tutor': { en: 'AI Tutor' },
  'nav.leaderboard': { en: 'Leaderboard' },
  'nav.daily_quiz': { en: 'Daily Quiz' },
  'nav.resources': { en: 'Resources' },
  'nav.videos': { en: 'Videos' },
  'nav.profile': { en: 'Profile' },
  'nav.settings': { en: 'Settings' },
  'sidebar.tagline': { en: 'Emotion-Aware Study Companion' },
  'sidebar.welcome': { en: 'Welcome back, Vedant!' },
  'sidebar.day_streak': { en: 'Day Streak' },
  'login.tab_login': { en: 'Log In' },
  'login.tab_signup': { en: 'Sign Up' },
  'login.welcome': { en: 'Welcome back! ??' },
  'login.continue_streak': { en: 'Continue your learning streak' },
  'login.email': { en: 'Email' },
  'login.password': { en: 'Password' },
  'login.forgot_password': { en: 'Forgot password?' },
  'login.login_btn': { en: 'Log In' },
  'login.or_continue': { en: 'or continue with' },
  'login.google_btn': { en: 'Continue with Google' },
  'login.no_account': { en:Don't have an account? },
  'login.signup_link': { en: 'Sign up' },
  'dash.welcome': { en: 'Welcome back, Vedant!' },
  'dash.subtitle': { en: Let's make today count. You're preparing for },
  'dash.this_weeks_streak': { en: This Week's Streak },
  'dash.on_fire': { en: You're on fire! },
  'dash.mon': { en: 'Mon' },
  'dash.tue': { en: 'Tue' },
  'dash.wed': { en: 'Wed' },
  'dash.thu': { en: 'Thu' },
  'dash.fri': { en: 'Fri' },
  'dash.sat': { en: 'Sat' },
  'dash.sun': { en: 'Sun' },
  'dash.questions_answered': { en: 'Questions Answered' },
  'dash.study_hours': { en: 'Study Hours' },
  'dash.accuracy': { en: 'Accuracy' },
  'dash.points': { en: 'Points' },
  'dash.todays_goal': { en: Today's Goal },
  'dash.this_week': { en: 'this week' },
  'dash.weekly_progress': { en: 'Weekly Progress' },
  'dash.complete_quiz': { en: 'Complete Daily Quiz' },
  'dash.study_chapters': { en: 'Study 2 chapters of DBMS' },
  'dash.practice_mcqs': { en: 'Practice 10 MCQs on Networks' },
  'dash.watch_video': { en: 'Watch 1 video lecture' },
  'dash.revise_notes': { en: Revise yesterday's notes },
  'dash.start_quiz': { en: 'Start Quiz' },
  'dash.ask_ai': { en: 'Ask AI' },
  'dash.recent_activity': { en: 'Recent Activity' },
  'dash.completed_quiz': { en: 'Completed Daily Quiz – JEE' },
  'dash.studied_os': { en: 'Studied Operating Systems 45 mins' },
  'dash.asked_ai': { en: 'Asked 3 questions to AI Assistant' },
  'dash.maintained_streak': { en: 'Maintained 12-day streak!' },
  'dash.ago': { en: 'ago' },
  'dash.today': { en: 'Today' },
  'dash.view_leaderboard': { en: 'View Leaderboard' },
  'dash.streak_toast': { en: You're on a 12-day streak! Keep going! },
  'chat.title': { en: 'AI Study Companion' },
  'chat.subtitle': { en: 'Your emotion-aware learning assistant' },
  'chat.welcome_msg': { en: Hello! I'm your AI study companion. How are you feeling today? Let's work together to ace your exams! ?? },
  'chat.placeholder': { en: 'Ask me anything about your studies...' },
  'chat.confident': { en: 'Confident' },
  'chat.confused': { en: 'Confused' },
  'chat.frustrated': { en: 'Frustrated' },
  'chat.anxious': { en: 'Anxious' },
  'chat.neutral': { en: 'Neutral' },
  'chat.voice_on': { en: 'Listening... ?? Speak now!' },
  'chat.voice_got_it': { en: 'Got it! Tap send to ask.' },
  'chat.voice_error': { en: 'Could not hear you. Try again.' },
  'chat.voice_unsupported': { en: 'Voice not supported in this browser' },
  'chat.error_connect': { en: Sorry, I couldn't connect right now. Please check if the server is running. ?? },
  'quiz.title': { en: 'Daily Quiz' },
  'quiz.subtitle': { en: 'Test your knowledge, earn points, build your streak!' },
  'quiz.todays_topics': { en: Today's Quiz Topics },
  'quiz.personalized': { en: 'Personalized for your JEE prep — mixed subjects, medium difficulty' },
  'quiz.minutes': { en: 'minutes' },
  'quiz.questions': { en: 'Questions' },
  'quiz.pts_per_correct': { en: 'pts per correct' },
  'quiz.streak_bonus': { en: 'Streak bonus' },
  'quiz.select_topic': { en: 'Select Topic Focus' },
  'quiz.mixed': { en: 'Mixed' },
  'quiz.physics': { en: 'Physics' },
  'quiz.chemistry': { en: 'Chemistry' },
  'quiz.maths': { en: 'Maths' },
  'quiz.biology': { en: 'Biology' },
  'quiz.start': { en: 'Start Quiz' },
  'quiz.score_history': { en: 'Score History' },
  'quiz.best_score': { en: 'Best score: 100/100 on Friday!' },
  'quiz.achievements': { en: 'Achievements' },
  'quiz.speed_demon': { en: 'Speed Demon' },
  'quiz.under_5min': { en: 'Finished in under 5 min' },
  'quiz.perfect_score': { en: 'Perfect Score ×3' },
  'quiz.perfect_desc': { en: '100% three times in a row' },
  'quiz.week_master': { en: 'Week Master' },
  'quiz.week_master_desc': { en: 'Quiz every day for a week' },
  'quiz.session_stats': { en: 'Session Stats' },
  'quiz.correct': { en: 'Correct' },
  'quiz.wrong': { en: 'Wrong' },
  'quiz.points_earned': { en: 'Points earned:' },
  'quiz.skip': { en: 'Skip' },
  'quiz.submit': { en: 'Submit Answer' },
  'quiz.select_answer': { en: 'Please select an answer!' },
  'quiz.complete': { en: 'Quiz Complete!' },
  'quiz.excellent': { en: 'Excellent Work!' },
  'quiz.good_job': { en: 'Good Job!' },
  'quiz.keep_practicing': { en: 'Keep Practicing!' },
  'quiz.try_again': { en: 'Try Again' },
  'lb.title': { en: 'Leaderboard' },
  'lb.subtitle': { en: 'Friendly competition with your JEE squad!' },
  'lb.this_week': { en: 'This Week' },
  'lb.all_time': { en: 'All Time' },
  'lb.invite': { en: 'Invite Friends' },
  'lb.rankings': { en: 'Rankings — Friends Only' },
  'lb.your_position': { en: 'Your position this week' },
  'vid.title': { en: 'Resources' },
  'vid.subtitle': { en: 'AI-curated video lectures & study materials for your JEE prep' },
  'vid.ai_tip': { en: 'AI Study Tip' },
  'vid.ai_tip_text': { en: 'Based on your quiz results, you should focus on <strong>Thermodynamics</strong> today. Your accuracy was 62% — watch the recommended lectures below first!' },
  'vid.show_me': { en: 'Show me' },
  'vid.search_placeholder': { en: 'Search topics, chapters, teachers...' },
  'vid.all_subjects': { en: 'All Subjects' },
  'vid.ai_pick': { en: 'AI Pick' },
  'vid.views': { en: 'views' },
  'prof.title': { en: '?? Profile' },
  'prof.subtitle': { en: 'Your learning journey snapshot' },
  'prof.edit': { en: '?? Edit Profile' },
  'prof.bio': { en: 'Passionate JEE aspirant who loves Physics and Math. Aiming for IIT Bombay CSE! ????' },
  'prof.questions': { en: 'Questions' },
  'prof.study_time': { en: 'Study Time' },
  'prof.accuracy': { en: 'Accuracy' },
  'prof.points': { en: 'Points' },
  'prof.subject_perf': { en: 'Subject Performance' },
  'prof.study_activity': { en: 'Study Activity' },
  'prof.last_12': { en: 'Last 12 months' },
  'prof.less': { en: 'Less' },
  'prof.more': { en: 'More' },
  'prof.achievements': { en: 'Achievements' },
  'prof.streak_master': { en: 'Streak Master' },
  'prof.streak_desc': { en: '12 day streak!' },
  'prof.sharpshooter': { en: 'Sharpshooter' },
  'prof.ss_desc': { en: '100% on quiz' },
  'prof.bookworm': { en: 'Bookworm' },
  'prof.bw_desc': { en: '50+ hours studied' },
  'prof.quick_start': { en: 'Quick Start' },
  'prof.qs_desc': { en: 'First 3 days done' },
  'prof.ai_explorer': { en: 'AI Explorer' },
  'prof.ae_desc': { en: '50 AI sessions' },
  'prof.top3': { en: 'Top 3' },
  'prof.top3_desc': { en: 'Reach top leaderboard' },
  'set.title': { en: 'Settings' },
  'common.loading': { en: 'Loading...' },
  'common.medium': { en: 'Medium' },
  'common.easy': { en: 'Easy' },
  'common.hard': { en: 'Hard' },
  'common.adaptive': { en: 'Adaptive' }
};

const CHEERIO = require('cheerio');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

function patchHTML(file, html) {
    const $ = CHEERIO.load(html, { decodeEntities: false });
    let changed = false;

    // Apply translations
    for (const [key, obj] of Object.entries(TRANSLATIONS)) {
        const engText = obj.en;
        
        // Find placeholders first
        [placeholder].each((i, el) => {
            if (.attr('placeholder') === engText && !.attr('data-i18n-placeholder')) {
                .attr('data-i18n-placeholder', key);
                changed = true;
            }
        });

        // Find exact text nodes
        *.each((i, el) => {
            if (el.children && el.children.length > 0 && !.attr('data-i18n')) {
                const childText = .text().trim();
                // Special case for elements that perfectly match
                if (childText === engText && el.children.length === 1 && el.children[0].type === 'text') {
                    .attr('data-i18n', key);
                    changed = true;
                }
            }
        });
        
        // Handle elements with innerHTML
        *.each((i, el) => {
            if (!.attr('data-i18n')) {
                const pureHTML = .html() ? .html().trim() : '';
                if (pureHTML === engText || pureHTML.replace(/&amp;/g, '&') === engText) {
                    .attr('data-i18n', key);
                    if (pureHTML.includes('<')) {
                         .attr('data-i18n-html', 'true');
                    }
                    changed = true;
                }
            }
        });
    }

    if (changed) {
         fs.writeFileSync(file, $.html());
         console.log('Patched', file);
    }
}

for (const f of files) {
   let content = fs.readFileSync(f, 'utf8');
   patchHTML(f, content);
}

