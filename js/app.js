/**
 * ResumeAI Pro — Main Application JavaScript
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
                <a href="app.html">Resume Builder</a>
                <a href="pricing.html">Pricing</a>
                <a href="index.html#features">Features</a>
                <button class="btn btn-outline" onclick="this.parentElement.classList.remove('active')">Close</button>
            `;
            document.body.appendChild(menu);
        }
        menu.classList.toggle('active');
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => menu.classList.remove('active'));
        });
    });
}

// ==========================================
// APP NAVIGATION (Resume Builder)
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const formSections = document.querySelectorAll('.form-section');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');
let currentSection = 0;

function showSection(index) {
    formSections.forEach((section, i) => {
        section.classList.toggle('active', i === index);
    });
    navItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
    currentSection = index;
    updateButtons();
    updateProgress();
}

function updateButtons() {
    if (!prevBtn || !nextBtn || !finishBtn) return;
    prevBtn.style.visibility = currentSection === 0 ? 'hidden' : 'visible';
    if (currentSection === formSections.length - 1) {
        nextBtn.classList.add('hidden');
        finishBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        finishBtn.classList.add('hidden');
    }
}

function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const atsScore = document.getElementById('atsScore');
    if (!progressBar) return;
    
    const progress = ((currentSection + 1) / formSections.length) * 100;
    progressBar.setAttribute('stroke-dasharray', `${progress}, 100`);
    progressText.textContent = `${Math.round(progress)}%`;
    
    // Simulate ATS score based on progress
    if (atsScore) {
        const score = Math.round(60 + (progress * 0.38));
        atsScore.textContent = `${score}%`;
        atsScore.style.color = score >= 85 ? 'var(--success)' : score >= 70 ? 'var(--warning)' : 'var(--danger)';
    }
}

navItems.forEach((item, index) => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(index);
    });
});

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (currentSection > 0) showSection(currentSection - 1);
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (currentSection < formSections.length - 1) showSection(currentSection + 1);
    });
}

if (finishBtn) {
    finishBtn.addEventListener('click', () => {
        alert('🎉 Your AI-optimized resume is ready for download!\n\nIn the full version, this would generate and download your resume.');
    });
}

// ==========================================
// ADD EXPERIENCE / EDUCATION
// ==========================================
const addExperienceBtn = document.getElementById('addExperience');
const experienceList = document.getElementById('experienceList');

if (addExperienceBtn && experienceList) {
    addExperienceBtn.addEventListener('click', () => {
        const card = document.createElement('div');
        card.className = 'exp-card';
        card.innerHTML = `
            <div class="form-grid">
                <div class="form-group"><label>Job Title</label><input type="text" placeholder="e.g. Senior AI Engineer"></div>
                <div class="form-group"><label>Company</label><input type="text" placeholder="e.g. TechCorp AI Labs"></div>
                <div class="form-group"><label>Start Date</label><input type="month"></div>
                <div class="form-group"><label>End Date</label><input type="month"></div>
                <div class="form-group full"><label>Description <span class="ai-badge"><i class="fas fa-sparkles"></i> AI Assist</span></label><textarea rows="4" placeholder="Describe your responsibilities and achievements..."></textarea></div>
            </div>
            <button class="btn-remove"><i class="fas fa-trash"></i></button>
        `;
        card.querySelector('.btn-remove').addEventListener('click', () => card.remove());
        experienceList.appendChild(card);
    });
}

const addEducationBtn = document.getElementById('addEducation');
const educationList = document.getElementById('educationList');

if (addEducationBtn && educationList) {
    addEducationBtn.addEventListener('click', () => {
        const card = document.createElement('div');
        card.className = 'edu-card';
        card.innerHTML = `
            <div class="form-grid">
                <div class="form-group"><label>Degree</label><input type="text" placeholder="e.g. B.S. Computer Science"></div>
                <div class="form-group"><label>School / University</label><input type="text" placeholder="e.g. University of Technology"></div>
                <div class="form-group"><label>Graduation Year</label><input type="number" placeholder="2021"></div>
                <div class="form-group"><label>GPA (Optional)</label><input type="text" placeholder="3.8/4.0"></div>
            </div>
            <button class="btn-remove"><i class="fas fa-trash"></i></button>
        `;
        card.querySelector('.btn-remove').addEventListener('click', () => card.remove());
        educationList.appendChild(card);
    });
}

// Remove buttons (for initial cards)
document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.exp-card, .edu-card').remove());
});

// ==========================================
// SKILLS TAGS
// ==========================================
const skillInput = document.getElementById('skillInput');
const skillsTags = document.getElementById('skillsTags');

if (skillInput && skillsTags) {
    skillInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = skillInput.value.trim();
            if (value) {
                addSkillTag(value);
                skillInput.value = '';
            }
        }
    });
    
    // Add click handlers to existing tags
    skillsTags.querySelectorAll('.skill-tag i').forEach(icon => {
        icon.addEventListener('click', () => icon.parentElement.remove());
    });
}

function addSkillTag(text) {
    const tag = document.createElement('span');
    tag.className = 'skill-tag';
    tag.innerHTML = `${text} <i class="fas fa-times"></i>`;
    tag.querySelector('i').addEventListener('click', () => tag.remove());
    skillsTags.appendChild(tag);
}

// Suggestion chips
document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        addSkillTag(chip.textContent);
    });
});

// ==========================================
// AI SUMMARY GENERATION
// ==========================================
const generateSummaryBtn = document.getElementById('generateSummary');
const summaryText = document.getElementById('summaryText');
const previewSummary = document.getElementById('previewSummary');

if (generateSummaryBtn && summaryText) {
    generateSummaryBtn.addEventListener('click', () => {
        generateSummaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateSummaryBtn.disabled = true;
        
        setTimeout(() => {
            const summaries = [
                "Results-driven AI Engineer with 5+ years of experience building intelligent systems and scalable applications. Proven track record of delivering production-ready ML models that drive business value.",
                "Creative technologist specializing in AI-powered solutions and full-stack development. Passionate about leveraging cutting-edge technology to solve complex problems and enhance user experiences.",
                "Dedicated software engineer with expertise in machine learning, natural language processing, and cloud architecture. Committed to writing clean, maintainable code and delivering high-quality products."
            ];
            const randomSummary = summaries[Math.floor(Math.random() * summaries.length)];
            summaryText.value = randomSummary;
            if (previewSummary) previewSummary.textContent = randomSummary;
            generateSummaryBtn.innerHTML = '<i class="fas fa-check"></i> Generated!';
            setTimeout(() => {
                generateSummaryBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate with AI';
                generateSummaryBtn.disabled = false;
            }, 2000);
        }, 1500);
    });
}

// ==========================================
// LIVE PREVIEW UPDATES
// ==========================================
const fullName = document.getElementById('fullName');
const jobTitle = document.getElementById('jobTitle');
const previewName = document.getElementById('previewName');
const previewTitle = document.getElementById('previewTitle');

if (fullName && previewName) {
    fullName.addEventListener('input', () => {
        previewName.textContent = fullName.value || 'Yuen Hui';
    });
}

if (jobTitle && previewTitle) {
    jobTitle.addEventListener('input', () => {
        previewTitle.textContent = jobTitle.value || 'AI Engineer & Developer';
    });
}

if (summaryText && previewSummary) {
    summaryText.addEventListener('input', () => {
        previewSummary.textContent = summaryText.value || 'Experienced AI Engineer with 5+ years building intelligent systems...';
    });
}

// ==========================================
// KEYWORD MATCHING SIMULATION
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
            { word: 'AWS', found: text.includes('aws') || text.includes('amazon web') },
            { word: 'React', found: text.includes('react') },
            { word: 'Leadership', found: text.includes('leadership') || text.includes('lead') },
        ];
        
        const keywordList = keywordMatch.querySelector('.keyword-list');
        keywordList.innerHTML = keywords.map(kw => `
            <span class="${kw.found ? 'kw-match' : 'kw-missing'}">
                <i class="fas ${kw.found ? 'fa-check' : 'fa-plus'}"></i> ${kw.word}
            </span>
        `).join('');
    });
}

// ==========================================
// SCROLL ANIMATIONS
// ==========================================
const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.market-card, .feature-card, .testimonial-card, .step, .plan-card, .faq-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Add visible class style
const style = document.createElement('style');
style.textContent = '.visible { opacity: 1 !important; transform: translateY(0) !important; }';
document.head.appendChild(style);

// ==========================================
// NAVBAR SCROLL
// ==========================================
const navbar = document.querySelector('.navbar');
if (navbar) {
    window.addEventListener('scroll', () => {
        navbar.style.boxShadow = window.pageYOffset > 50 ? '0 4px 30px rgba(0,0,0,0.2)' : 'none';
    });
}

// ==========================================
// PAGE LOAD ANIMATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.4s ease';
    setTimeout(() => { document.body.style.opacity = '1'; }, 50);
    
    // Initialize progress on app page
    updateProgress();
});
