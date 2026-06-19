
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
            if (activeSubject !== 'all' &amp;&amp; !topics.map(t =&gt; t.toLowerCase()).includes(activeSubject)) {
                activeSubject = 'all';
            }

            container.innerHTML = [
                `&lt;button class="topic-btn ${activeSubject === 'all' ? 'active' : ''}" onclick="filterSubject('all',this)" data-i18n="vid.all_subjects"&gt;📚 All Subjects&lt;/button&gt;`,
                ...topics.map(t =&gt; {
                    const key = t.toLowerCase();
                    const emoji = TOPIC_EMOJI[t] || '📘';
                    return `&lt;button class="topic-btn ${activeSubject === key ? 'active' : ''}" onclick="filterSubject('${key}',this)"&gt;${emoji} ${t}&lt;/button&gt;`;
                })
            ].join('');

            // Also re-fetch videos if search is active
            const searchInput = document.getElementById('searchInput');
            if (searchInput &amp;&amp; searchInput.value.trim()) {
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
            modalBody.innerHTML = `&lt;iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen&gt;&lt;/iframe&gt;`;
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
        document.addEventListener('keydown', (e) =&gt; {
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
            if (!topic || topic.length &lt; 2) {
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

                if (data.videos &amp;&amp; data.videos.length &gt; 0) {
                    currentVideos = data.videos.map((v, i) =&gt; ({
                        title: v.title,
                        videoUrl: v.videoUrl,
                        thumbnail: v.thumbnail,
                        teacher: v.channel,
                        gradient: getRandomGradient(),
                        ai: i &lt; 2, // Mark first 2 as AI picks
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
                &lt;div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-muted)"&gt;
                    &lt;i data-lucide="loader" style="width:32px;height:32px;display:inline-block;animation:spin 1s linear infinite"&gt;&lt;/i&gt;
                    &lt;p style="margin-top:12px"&gt;Searching videos...&lt;/p&gt;
                &lt;/div&gt;
            `;
            lucide.createIcons();
        }

        function filterSubject(sub, btn) {
            activeSubject = sub;
            document.querySelectorAll('.filter-row .topic-btn').forEach(b =&gt; b.classList.remove('active'));
            btn.classList.add('active');

            const searchInput = document.getElementById('searchInput');
            if (searchInput &amp;&amp; searchInput.value.trim()) {
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

            searchTimeout = setTimeout(() =&gt; {
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

            let videosToRender = currentVideos.length &gt; 0 ? currentVideos : FALLBACK_VIDEOS;

            if (activeSubject !== 'all' &amp;&amp; !currentVideos[0]?.isYouTube) {
                videosToRender = videosToRender.filter(v =&gt; v.subject === activeSubject);
            }

            if (videosToRender.length === 0) {
                grid.innerHTML = `
                    &lt;div style="grid-column: 1/-1; text-align:center; padding:60px 20px; color:var(--text-muted)"&gt;
                        &lt;i data-lucide="video-off" style="width:48px;height:48px;display:inline-block;opacity:0.5"&gt;&lt;/i&gt;
                        &lt;p style="margin-top:16px;font-size:15px"&gt;No videos found. Try a different search term.&lt;/p&gt;
                    &lt;/div&gt;
                `;
                lucide.createIcons();
                return;
            }

            grid.innerHTML = videosToRender.map(v =&gt; {
                const title = v.title.replace(/'/g, "&amp;#39;").replace(/"/g, "&amp;quot;");
                const clickAction = v.isYouTube
                    ? `openVideoModal('${v.videoUrl}', '${title}')`
                    : `Toast.show('Opening: ${v.title.replace(/'/g, "\\'")}','info')`;

                return `
    &lt;div class="video-card" onclick="${clickAction}"&gt;
      &lt;div class="video-thumb"&gt;
        ${v.isYouTube &amp;&amp; v.thumbnail
                        ? `&lt;img src="${v.thumbnail}" style="width:100%;height:100%;object-fit:cover" alt="${v.title}"&gt;
             &lt;div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2)"&gt;
               &lt;div class="play-btn"&gt;&lt;i data-lucide="play" style="width:20px;height:20px;color:var(--primary)"&gt;&lt;/i&gt;&lt;/div&gt;
             &lt;/div&gt;`
                        : `&lt;div class="thumb-gradient" style="background:${v.gradient}"&gt;
               &lt;div class="play-btn"&gt;&lt;i data-lucide="play" style="width:20px;height:20px;color:var(--primary)"&gt;&lt;/i&gt;&lt;/div&gt;
               ${v.duration ? `&lt;div class="duration-badge"&gt;${v.duration}&lt;/div&gt;` : ''}
             &lt;/div&gt;`
                    }
      &lt;/div&gt;
      &lt;div class="video-info"&gt;
        ${v.ai ? '&lt;div class="ai-recommend-badge" style="margin-bottom:8px"&gt;&lt;i data-lucide="sparkles" style="width:10px;height:10px"&gt;&lt;/i&gt; AI Pick&lt;/div&gt;' : ''}
        &lt;div class="video-title"&gt;${v.title}&lt;/div&gt;
        &lt;div class="video-meta"&gt;
          &lt;i data-lucide="user" style="width:12px;height:12px"&gt;&lt;/i&gt;${v.teacher || 'Unknown'}
          ${v.views ? `&lt;span&gt;·&lt;/span&gt;&lt;i data-lucide="eye" style="width:12px;height:12px"&gt;&lt;/i&gt;${v.views} views` : ''}
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;`;
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
                if (data.videos &amp;&amp; data.videos.length &gt; 0) {
                    currentVideos = data.videos.map((v, i) =&gt; ({
                        title: v.title,
                        videoUrl: v.videoUrl,
                        thumbnail: v.thumbnail,
                        teacher: v.channel,
                        gradient: getRandomGradient(),
                        ai: i &lt; 3,
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
    