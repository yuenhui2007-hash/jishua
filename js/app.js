/**
 * ResumeAI Pro — Application JavaScript
 */

// ==========================================
// MOBILE MENU
// ==========================================
const mobileToggle = document.getElementById('mobileToggle');
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        let menu = document.querySelector('.mobile-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'mobile-menu';
            menu.innerHTML = `
                <a href="index.html">Home</a>
                <a href="app.html">Builder</a>
                <a href="pricing.html">Pricing</a>
                <button class="btn-primary" onclick="this.parentElement.classList.remove('active')">Close</button>
            `;
            document.body.appendChild(menu);
        }
        menu.classList.toggle('active');
    });
}

// ==========================================
// NAVBAR SCROLL
// ==========================================
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ==========================================
// SCROLL PROGRESS
// ==========================================
const scrollProgress = document.getElementById('scrollProgress');
if (scrollProgress) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        scrollProgress.style.width = progress + '%';
    });
}

// ==========================================
// MOUSE GLOW
// ==========================================
const mouseGlow = document.getElementById('mouseGlow');
if (mouseGlow) {
    let mouseX = 0, mouseY = 0, currentX = 0, currentY = 0;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    function animateGlow() {
        currentX += (mouseX - currentX) * 0.08;
        currentY += (mouseY - currentY) * 0.08;
        mouseGlow.style.left = currentX + 'px';
        mouseGlow.style.top = currentY + 'px';
        requestAnimationFrame(animateGlow);
    }
    animateGlow();
}

// ==========================================
// PARALLAX
// ==========================================
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual) {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const rate = scrolled * 0.15;
        heroVisual.style.transform = `translateY(${rate}px)`;
    });
}

// ==========================================
// SCROLL ANIMATIONS
// ==========================================
const animateOnScroll = () => {
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.85;
        if (isVisible) {
            const delay = el.dataset.delay || 0;
            setTimeout(() => el.classList.add('animated'), parseInt(delay));
        }
    });
};

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// ==========================================
// COUNTER ANIMATION
// ==========================================
const animateCounters = () => {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    counters.forEach(counter => {
        const rect = counter.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.9 && !counter.classList.contains('counted')) {
            counter.classList.add('counted');
            const target = parseFloat(counter.dataset.target);
            const isDecimal = target % 1 !== 0;
            const duration = 2000;
            const start = performance.now();

            const update = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = target * eased;
                counter.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString();
                if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        }
    });
};

window.addEventListener('scroll', animateCounters);
window.addEventListener('load', animateCounters);

// ==========================================
// APP NAVIGATION
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const formSections = document.querySelectorAll('.form-section');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');
let currentSection = 0;

function showSection(index) {
    formSections.forEach((section, i) => section.classList.toggle('active', i === index));
    navItems.forEach((item, i) => item.classList.toggle('active', i === index));
    currentSection = index;
    updateButtons();
    updateProgress();
}

function updateButtons() {
    if (!prevBtn || !nextBtn || !finishBtn) return;
    prevBtn.style.visibility = currentSection === 0 ? 'hidden' : 'visible';
    nextBtn.classList.toggle('hidden', currentSection === formSections.length - 1);
    finishBtn.classList.toggle('hidden', currentSection !== formSections.length - 1);
}

function updateProgress() {
    const bar = document.getElementById('progressBar');
    const text = document.getElementById('progressText');
    const ats = document.getElementById('atsScore');
    if (!bar) return;
    const progress = ((currentSection + 1) / formSections.length) * 100;
    bar.setAttribute('stroke-dasharray', `${progress}, 100`);
    text.textContent = `${Math.round(progress)}%`;
    if (ats) {
        const score = Math.round(60 + (progress * 0.38));
        ats.textContent = `${score}%`;
    }
}

navItems.forEach((item, index) => {
    item.addEventListener('click', (e) => { e.preventDefault(); showSection(index); });
});

if (prevBtn) prevBtn.addEventListener('click', () => { if (currentSection > 0) showSection(currentSection - 1); });
if (nextBtn) nextBtn.addEventListener('click', () => { if (currentSection < formSections.length - 1) showSection(currentSection + 1); });
if (finishBtn) finishBtn.addEventListener('click', () => alert('Your AI-optimized resume is ready for download!'));

// ==========================================
// ADD EXPERIENCE / EDUCATION
// ==========================================
const addExpBtn = document.getElementById('addExperience');
const expList = document.getElementById('experienceList');
if (addExpBtn && expList) {
    addExpBtn.addEventListener('click', () => {
        const card = document.createElement('div');
        card.className = 'exp-card';
        card.innerHTML = `
            <div class="form-grid">
                <div class="form-group"><label>Job Title</label><input type="text" placeholder="e.g. Senior AI Engineer"></div>
                <div class="form-group"><label>Company</label><input type="text" placeholder="e.g. TechCorp AI Labs"></div>
                <div class="form-group"><label>Start Date</label><input type="month"></div>
                <div class="form-group"><label>End Date</label><input type="month"></div>
                <div class="form-group full"><label>Description <span class="ai-badge"><i class="fas fa-sparkles"></i> AI Assist</span></label><textarea rows="4" placeholder="Describe your responsibilities..."></textarea></div>
            </div>
            <button class="btn-remove"><i class="fas fa-trash"></i></button>`;
        card.querySelector('.btn-remove').addEventListener('click', () => card.remove());
        expList.appendChild(card);
    });
}

const addEduBtn = document.getElementById('addEducation');
const eduList = document.getElementById('educationList');
if (addEduBtn && eduList) {
    addEduBtn.addEventListener('click', () => {
        const card = document.createElement('div');
        card.className = 'edu-card';
        card.innerHTML = `
            <div class="form-grid">
                <div class="form-group"><label>Degree</label><input type="text" placeholder="e.g. B.S. Computer Science"></div>
                <div class="form-group"><label>School / University</label><input type="text" placeholder="e.g. University of Technology"></div>
                <div class="form-group"><label>Graduation Year</label><input type="number" placeholder="2021"></div>
                <div class="form-group"><label>GPA (Optional)</label><input type="text" placeholder="3.8/4.0"></div>
            </div>
            <button class="btn-remove"><i class="fas fa-trash"></i></button>`;
        card.querySelector('.btn-remove').addEventListener('click', () => card.remove());
        eduList.appendChild(card);
    });
}

document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.exp-card, .edu-card').remove());
});

// ==========================================
// SKILLS
// ==========================================
const skillInput = document.getElementById('skillInput');
const skillsTags = document.getElementById('skillsTags');

function addSkillTag(text) {
    if (!skillsTags) return;
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${text} <i class="fas fa-times"></i>`;
    tag.querySelector('i').addEventListener('click', () => tag.remove());
    skillsTags.appendChild(tag);
}

if (skillInput && skillsTags) {
    skillInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = skillInput.value.trim();
            if (val) { addSkillTag(val); skillInput.value = ''; }
        }
    });
    skillsTags.querySelectorAll('.skill-tag i').forEach(icon => {
        icon.addEventListener('click', () => icon.parentElement.remove());
    });
}

document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => addSkillTag(chip.textContent));
});

// ==========================================
// AI SUMMARY
// ==========================================
const genSummaryBtn = document.getElementById('generateSummary');
const summaryText = document.getElementById('summaryText');
const previewSummary = document.getElementById('previewSummary');

if (genSummaryBtn && summaryText) {
    genSummaryBtn.addEventListener('click', () => {
        genSummaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        genSummaryBtn.disabled = true;
        setTimeout(() => {
            const summaries = [
                "Results-driven AI Engineer with 5+ years of experience building intelligent systems and scalable applications. Proven track record of delivering production-ready ML models.",
                "Creative technologist specializing in AI-powered solutions and full-stack development. Passionate about leveraging cutting-edge technology to solve complex problems.",
                "Dedicated software engineer with expertise in machine learning, natural language processing, and cloud architecture. Committed to delivering high-quality products."
            ];
            const s = summaries[Math.floor(Math.random() * summaries.length)];
            summaryText.value = s;
            if (previewSummary) previewSummary.textContent = s;
            genSummaryBtn.innerHTML = '<i class="fas fa-check"></i> Generated!';
            setTimeout(() => {
                genSummaryBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate with AI';
                genSummaryBtn.disabled = false;
            }, 2000);
        }, 1500);
    });
}

// ==========================================
// LIVE PREVIEW
// ==========================================
const fullName = document.getElementById('fullName');
const jobTitle = document.getElementById('jobTitle');
const previewName = document.getElementById('previewName');
const previewTitle = document.getElementById('previewTitle');

if (fullName && previewName) fullName.addEventListener('input', () => previewName.textContent = fullName.value || 'Yuen Hui');
if (jobTitle && previewTitle) jobTitle.addEventListener('input', () => previewTitle.textContent = jobTitle.value || 'AI Engineer & Developer');
if (summaryText && previewSummary) summaryText.addEventListener('input', () => previewSummary.textContent = summaryText.value || 'Experienced AI Engineer...');

// ==========================================
// KEYWORDS
// ==========================================
const jobDesc = document.getElementById('jobDesc');
const keywordMatch = document.getElementById('keywordMatch');
if (jobDesc && keywordMatch) {
    jobDesc.addEventListener('input', () => {
        const text = jobDesc.value.toLowerCase();
        const keywords = [
            { word: 'Python', found: text.includes('python') },
            { word: 'Machine Learning', found: text.includes('machine learning') || text.includes('ml') },
            { word: 'SQL', found: text.includes('sql') },
            { word: 'Docker', found: text.includes('docker') },
            { word: 'AWS', found: text.includes('aws') },
            { word: 'React', found: text.includes('react') },
            { word: 'Leadership', found: text.includes('leadership') },
        ];
        const list = keywordMatch.querySelector('.keyword-list');
        list.innerHTML = keywords.map(kw => `
            <span class="${kw.found ? 'kw-match' : 'kw-missing'}">
                <i class="fas ${kw.found ? 'fa-check' : 'fa-plus'}"></i> ${kw.word}
            </span>`).join('');
    });
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s ease';
    setTimeout(() => document.body.style.opacity = '1', 100);
    updateProgress();
    animateOnScroll();
});
