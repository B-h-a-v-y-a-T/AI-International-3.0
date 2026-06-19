
/* script block 0 */

/* script block 1 */

/* script block 2 */

/* script block 3 */

        // ── Exam → Subject mapping (same as quiz.html) ──────────────────
        const EXAM_TOPICS = {
            'JEE': ['Physics', 'Chemistry', 'Maths'],
            'NEET': ['Physics', 'Chemistry', 'Biology'],
            'MHT CET': ['Physics', 'Chemistry', 'Maths'],
            'CAT': ['QA', 'DILR', 'VARC'],
            'UPSC': ['History &amp; Polity', 'Geography', 'Economy', 'Environment', 'Science &amp; Tech'],
            '12th Boards': ['Physics', 'Chemistry', 'Maths', 'Biology'],
            'GATE': ['Engineering Maths', 'General Aptitude', 'Data Structures', 'Operating Systems', 'Computer Networks', 'DBMS', 'Algorithms'],
        };

        const TOPIC_EMOJI = {
            Physics: '⚛️', Chemistry: '🧪', Maths: '📐', Biology: '🌱',
            QA: '🔢', DILR: '🧩', VARC: '📖',
            'History &amp; Polity': '🏛️', Geography: '🗺️', Economy: '📊', Environment: '🌿', 'Science &amp; Tech': '🔬',
            'Engineering Maths': '∑', 'General Aptitude': '🧠', 'Data Structures': '🌲',
            'Operating Systems': '💻', 'Computer Networks': '🌐', DBMS: '🗄️', Algorithms: '⚙️'
        };

        function getExamTopics() {
            const exam = (typeof ExamManager !== 'undefined') ? ExamManager.get() : 'JEE';
            return EXAM_TOPICS[exam] || ['Physics', 'Chemistry', 'Maths'];
        }

        // Called by app.js when sidebar exam dropdown changes
        function renderTopicPills() {
            const topics = getExamTopics();
            const container = document.getElementById('filterRow');
            if (!container) return;

            // Reset active subject if it no longer belongs to this exam
            if (activeSubject !== 'all' && !topics.map(t => t.toLowerCase()).includes(activeSubject)) {
                activeSubject = 'all';
            }

            container.innerHTML = [
                `<button class="topic-btn ${activeSubject === 'all' ? 'active' : ''}" onclick="filterSubject('all',this)" data-i18n="vid.all_subjects">📚 All Subjects</button>`,
                ...topics.map(t => {
                    const key = t.toLowerCase();
                    const emoji = TOPIC_EMOJI[t] || '📘';
                    return `<button class="topic-btn ${activeSubject === key ? 'active' : ''}" onclick="filterSubject('${key}',this)">${emoji} ${t}</button>`;
                })
            ].join('');

            // Also re-fetch videos if search is active
            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                filterVideos();
            } else {
                // Re-fetch initial videos with the new exam context
                initVideos();
            }
        }

        // Hardcoded fallback videos
        const FALLBACK_VIDEOS = [
            { title: 'Laws of Motion – Complete Chapter', subject: 'physics', duration: '48:22', teacher: 'Prof. Sharma', views: '124K', gradient: 'linear-gradient(135deg,#6CA8F1,#7C3AED)', ai: true },
            { title: 'Thermodynamics Part 1: First Law', subject: 'physics', duration: '36:14', teacher: 'Dr. Mehta', views: '98K', gradient: 'linear-gradient(135deg,#F97316,#EF4444)', ai: true },
            { title: 'Chemical Bonding – Complete Guide', subject: 'chemistry', duration: '52:08', teacher: 'Prof. Rao', views: '87K', gradient: 'linear-gradient(135deg,#10B981,#059669)', ai: false },
            { title: 'Organic Chemistry – Mechanisms', subject: 'chemistry', duration: '44:30', teacher: 'Dr. Gupta', views: '76K', gradient: 'linear-gradient(135deg,#6EE7B7,#3B82F6)', ai: false },
            { title: 'Integration Techniques – JEE', subject: 'maths', duration: '61:45', teacher: 'Prof. Iyer', views: '145K', gradient: 'linear-gradient(135deg,#A78BFA,#7C3AED)', ai: true },
            { title: 'Coordinate Geometry Masterclass', subject: 'maths', duration: '54:00', teacher: 'Dr. Bose', views: '112K', gradient: 'linear-gradient(135deg,#FDE68A,#F97316)', ai: false },
            { title: 'Plant Physiology – NEET 2025', subject: 'biology', duration: '39:20', teacher: 'Dr. Nair', views: '64K', gradient: 'linear-gradient(135deg,#6EE7B7,#22C55E)', ai: false },
            { title: 'Electrostatics – Problems &amp; Solutions', subject: 'physics', duration: '58:10', teacher: 'Prof. Sharma', views: '201K', gradient: 'linear-gradient(135deg,#93C5FD,#6CA8F1)', ai: true },
        ];

        let activeSubject = 'all';
        let currentVideos = [];
        let isLoadingVideos = false;
        let searchTimeout = null;
        let lastSearchQuery = '';

        // Video Modal Functions
        function openVideoModal(videoUrl, title) {
            const modal = document.getElementById('videoModal');
            const modalTitle = document.getElementById('videoModalTitle');
            const modalBody = document.getElementById('videoModalBody');

            // Extract video ID from URL
            const videoId = videoUrl.includes('youtube.com')
                ? new URL(videoUrl).searchParams.get('v')
                : videoUrl.split('/').pop();

            modalTitle.textContent = title;
            modalBody.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();
        }

        function closeVideoModal() {
            const modal = document.getElementById('videoModal');
            const modalBody = document.getElementById('videoModalBody');
            modalBody.innerHTML = '';
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeVideoModal();
        });

        // Gradient colors for video thumbnails
        const GRADIENTS = [
            'linear-gradient(135deg,#6CA8F1,#7C3AED)',
            'linear-gradient(135deg,#F97316,#EF4444)',
            'linear-gradient(135deg,#10B981,#059669)',
            'linear-gradient(135deg,#6EE7B7,#3B82F6)',
            'linear-gradient(135deg,#A78BFA,#7C3AED)',
            'linear-gradient(135deg,#FDE68A,#F97316)',
            'linear-gradient(135deg,#93C5FD,#6CA8F1)',
        ];

        function getRandomGradient() {
            return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
        }

        // Fetch videos from API
        async function fetchVideosFromAPI(topic) {
            if (!topic || topic.length < 2) {
                currentVideos = FALLBACK_VIDEOS;
                renderVideos();
                return;
            }

            isLoadingVideos = true;
            showLoadingState();

            try {
                const response = await fetch('http://localhost:5050/api/videos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, maxResults: 8 })
                });

                const data = await response.json();

                if (data.videos && data.videos.length > 0) {
                    currentVideos = data.videos.map((v, i) => ({
                        title: v.title,
                        videoUrl: v.videoUrl,
                        thumbnail: v.thumbnail,
                        teacher: v.channel,
                        gradient: getRandomGradient(),
                        ai: i < 2, // Mark first 2 as AI picks
                        isYouTube: true
                    }));
                } else {
                    currentVideos = FALLBACK_VIDEOS;
                    Toast.show('Using sample videos (configure YouTube API key for live search)', 'info');
                }
            } catch (error) {
                console.error('Video fetch error:', error);
                currentVideos = FALLBACK_VIDEOS;
                Toast.show('Could not fetch live videos, showing samples', 'warning');
            }

            isLoadingVideos = false;
            renderVideos();
        }

        function showLoadingState() {
            const grid = document.getElementById('videoGrid');
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted)">
                    <i data-lucide="loader" style="width:32px;height:32px;display:inline-block;animation:spin 1s linear infinite"></i>
                    <p style="margin-top:12px">Searching videos...</p>
                </div>
            `;
            lucide.createIcons();
        }

        function filterSubject(sub, btn) {
            activeSubject = sub;
            document.querySelectorAll('.filter-row .topic-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const searchInput = document.getElementById('searchInput');
            if (searchInput && searchInput.value.trim()) {
                const query = `${searchInput.value} ${sub === 'all' ? '' : sub}`.trim();
                fetchVideosFromAPI(query);
            } else {
                renderVideos();
            }
        }

        function filterVideos() {
            const searchInput = document.getElementById('searchInput');
            const query = searchInput?.value.trim() || '';

            if (searchTimeout) clearTimeout(searchTimeout);

            if (!query) {
                currentVideos = FALLBACK_VIDEOS;
                renderVideos();
                return;
            }

            searchTimeout = setTimeout(() => {
                if (query !== lastSearchQuery) {
                    lastSearchQuery = query;
                    const fullQuery = activeSubject === 'all' ? query : `${query} ${activeSubject}`;
                    fetchVideosFromAPI(fullQuery);
                }
            }, 800);
        }

        function renderVideos() {
            const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
            const grid = document.getElementById('videoGrid');

            let videosToRender = currentVideos.length > 0 ? currentVideos : FALLBACK_VIDEOS;

            if (activeSubject !== 'all' && !currentVideos[0]?.isYouTube) {
                videosToRender = videosToRender.filter(v => v.subject === activeSubject);
            }

            if (videosToRender.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding:60px 20px; color:var(--text-muted)">
                        <i data-lucide="video-off" style="width:48px;height:48px;display:inline-block;opacity:0.5"></i>
                        <p style="margin-top:16px;font-size:15px">No videos found. Try a different search term.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            grid.innerHTML = videosToRender.map(v => {
                const title = v.title.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
                const clickAction = v.isYouTube
                    ? `openVideoModal('${v.videoUrl}', '${title}')`
                    : `Toast.show('Opening: ${v.title.replace(/'/g, "\\'")}','info')`;

                return `
    <div class="video-card" onclick="${clickAction}">
      <div class="video-thumb">
        ${v.isYouTube && v.thumbnail
                        ? `<img src="${v.thumbnail}" style="width:100%;height:100%;object-fit:cover" alt="${v.title}">
             <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2)">
               <div class="play-btn"><i data-lucide="play" style="width:20px;height:20px;color:var(--primary)"></i></div>
             </div>`
                        : `<div class="thumb-gradient" style="background:${v.gradient}">
               <div class="play-btn"><i data-lucide="play" style="width:20px;height:20px;color:var(--primary)"></i></div>
               ${v.duration ? `<div class="duration-badge">${v.duration}</div>` : ''}
             </div>`
                    }
      </div>
      <div class="video-info">
        ${v.ai ? '<div class="ai-recommend-badge" style="margin-bottom:8px"><i data-lucide="sparkles" style="width:10px;height:10px"></i> AI Pick</div>' : ''}
        <div class="video-title">${v.title}</div>
        <div class="video-meta">
          <i data-lucide="user" style="width:12px;height:12px"></i>${v.teacher || 'Unknown'}
          ${v.views ? `<span>·</span><i data-lucide="eye" style="width:12px;height:12px"></i>${v.views} views` : ''}
        </div>
      </div>
    </div>`;
            }).join('');
            lucide.createIcons();
        }

        // Initialize — try to fetch real YouTube videos, fallback to static cards
        async function initVideos() {
            const exam = (typeof ExamManager !== 'undefined') ? ExamManager.get() : 'JEE';
            const topics = getExamTopics();
            const searchTopic = `${exam} best video lectures ${topics.join(' ')}`;
            try {
                const response = await fetch('http://localhost:5050/api/videos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic: searchTopic, maxResults: 8 })
                });
                const data = await response.json();
                if (data.videos && data.videos.length > 0) {
                    currentVideos = data.videos.map((v, i) => ({
                        title: v.title,
                        videoUrl: v.videoUrl,
                        thumbnail: v.thumbnail,
                        teacher: v.channel,
                        gradient: getRandomGradient(),
                        ai: i < 3,
                        isYouTube: true
                    }));
                } else {
                    currentVideos = FALLBACK_VIDEOS;
                }
            } catch (e) {
                console.error('Init video fetch error:', e);
                currentVideos = FALLBACK_VIDEOS;
            }
            renderVideos();
            lucide.createIcons();
        }
        // Render pills first, then fetch videos
        renderTopicPills();
    