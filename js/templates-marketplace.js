/**
 * Template Marketplace - 30+ Resume Templates
 */

const allTemplates = [
    // EXECUTIVE (5 templates)
    { id: 1, name: 'Executive Prime', slug: 'executive-prime', agent: 'Aurelius', category: 'executive', price: 0, isPremium: false, downloads: 15420, rating: 4.9, desc: 'Boardroom-ready with commanding presence. Gold accents and refined typography for C-suite aspirants.', features: ['Two-column layout', 'Executive summary block', 'Leadership metrics sidebar', 'ATS-optimized'], preview: 'aurelius' },
    { id: 2, name: 'C-Suite Gold', slug: 'c-suite-gold', agent: 'Aurelius', category: 'executive', price: 9.99, isPremium: true, downloads: 8930, rating: 4.8, desc: 'Premium executive template with KPI dashboard and strategic impact sections.', features: ['KPI dashboard', 'Board experience block', 'M&A highlights', 'Strategic vision statement'], preview: 'aurelius' },
    { id: 3, name: 'Director Elite', slug: 'director-elite', agent: 'Aurelius', category: 'executive', price: 9.99, isPremium: true, downloads: 6720, rating: 4.7, desc: 'For senior directors and VPs. Clean authority with understated elegance.', features: ['Management scope callout', 'Team size metrics', 'Revenue impact blocks', 'Timeline visualization'], preview: 'aurelius' },
    { id: 4, name: 'Founder Vision', slug: 'founder-vision', agent: 'Aurelius', category: 'executive', price: 14.99, isPremium: true, downloads: 5430, rating: 4.9, desc: 'Built for founders and entrepreneurs. Startup story + traction metrics.', features: ['Company showcase', 'Funding raised block', 'Growth metrics', 'Advisor roles'], preview: 'aurelius' },
    { id: 5, name: 'Global Leader', slug: 'global-leader', agent: 'Aurelius', category: 'executive', price: 14.99, isPremium: true, downloads: 4210, rating: 4.8, desc: 'Multinational executive template with international experience emphasis.', features: ['Global experience map', 'Language proficiencies', 'Cross-cultural leadership', 'Regional P&L blocks'], preview: 'aurelius' },

    // CREATIVE (5 templates)
    { id: 6, name: 'Visionary Split', slug: 'visionary-split', agent: 'Nova', category: 'creative', price: 0, isPremium: false, downloads: 22100, rating: 4.8, desc: 'Bold split-layout with portfolio-forward presentation for designers and artists.', features: ['Color-block sidebar', 'Portfolio gallery', 'Skill visualization', 'Project case studies'], preview: 'nova' },
    { id: 7, name: 'Artist Canvas', slug: 'artist-canvas', agent: 'Nova', category: 'creative', price: 9.99, isPremium: true, downloads: 9870, rating: 4.9, desc: 'Full-bleed creative canvas. Asymmetric grids for visual professionals.', features: ['Masonry portfolio grid', 'Typography-driven layout', 'Process showcase', 'Awards section'], preview: 'nova' },
    { id: 8, name: 'Motion Designer', slug: 'motion-designer', agent: 'Nova', category: 'creative', price: 9.99, isPremium: true, downloads: 7650, rating: 4.7, desc: 'For animators and motion designers. Video-first with reel integration.', features: ['Reel embed section', 'Software stack badges', 'Client logos grid', 'Shot breakdown format'], preview: 'nova' },
    { id: 9, name: 'Brand Strategist', slug: 'brand-strategist', agent: 'Nova', category: 'creative', price: 14.99, isPremium: true, downloads: 6540, rating: 4.8, desc: 'Strategic creative template for brand designers and art directors.', features: ['Brand case studies', 'Campaign results', 'Mood board section', 'Client testimonials'], preview: 'nova' },
    { id: 10, name: 'Photographer Pro', slug: 'photographer-pro', agent: 'Nova', category: 'creative', price: 14.99, isPremium: true, downloads: 5430, rating: 4.7, desc: 'Image-forward layout for photographers and visual storytellers.', features: ['Hero image section', 'Gallery thumbnails', 'Equipment list', 'Publication credits'], preview: 'nova' },

    // TECHNICAL (5 templates)
    { id: 11, name: 'Stack Matrix', slug: 'stack-matrix', agent: 'Cipher', category: 'technical', price: 0, isPremium: false, downloads: 31200, rating: 4.9, desc: 'Precision-engineered for tech roles. Clean structure with skill visualization.', features: ['Tech stack matrix', 'GitHub integration', 'Project architecture diagrams', 'ATS-maximized'], preview: 'cipher' },
    { id: 12, name: 'DevOps Pipeline', slug: 'devops-pipeline', agent: 'Cipher', category: 'technical', price: 9.99, isPremium: true, downloads: 11200, rating: 4.8, desc: 'Infrastructure and DevOps focused with pipeline visualization.', features: ['Infrastructure diagram', 'Cloud cert badges', 'Incident response metrics', 'Automation showcase'], preview: 'cipher' },
    { id: 13, name: 'Data Scientist', slug: 'data-scientist', agent: 'Cipher', category: 'technical', price: 9.99, isPremium: true, downloads: 9870, rating: 4.9, desc: 'Research-focused template for data scientists and ML engineers.', features: ['Publication list', 'Model performance charts', 'Tool stack matrix', 'Research interests'], preview: 'cipher' },
    { id: 14, name: 'Security Analyst', slug: 'security-analyst', agent: 'Cipher', category: 'technical', price: 14.99, isPremium: true, downloads: 6780, rating: 4.7, desc: 'Cybersecurity-focused with threat assessment and compliance blocks.', features: ['Certification badges', 'Compliance frameworks', 'Incident timeline', 'Tool proficiency matrix'], preview: 'cipher' },
    { id: 15, name: 'Mobile Engineer', slug: 'mobile-engineer', agent: 'Cipher', category: 'technical', price: 14.99, isPremium: true, downloads: 7650, rating: 4.8, desc: 'iOS/Android focused with app store metrics and download stats.', features: ['App store badges', 'Download metrics', 'Tech stack per app', 'Performance benchmarks'], preview: 'cipher' },

    // MINIMAL (4 templates)
    { id: 16, name: 'Swiss Pure', slug: 'swiss-pure', agent: 'Luna', category: 'minimal', price: 9.99, isPremium: true, downloads: 18700, rating: 4.7, desc: 'Swiss-inspired elegance. Generous whitespace and refined typography hierarchy.', features: ['8pt baseline grid', 'Neutral palette', 'Optimal line length', 'Typographic purity'], preview: 'luna' },
    { id: 17, name: 'Mono Space', slug: 'mono-space', agent: 'Luna', category: 'minimal', price: 9.99, isPremium: true, downloads: 12300, rating: 4.8, desc: 'Monospace-driven minimalism for developers and writers.', features: ['Monospace body text', 'Terminal aesthetic', 'ASCII skill bars', 'Clean structure'], preview: 'luna' },
    { id: 18, name: 'Grid System', slug: 'grid-system', agent: 'Luna', category: 'minimal', price: 14.99, isPremium: true, downloads: 9870, rating: 4.8, desc: 'Strict grid-based layout inspired by classic editorial design.', features: ['Column grid system', 'Modular spacing', 'Editorial hierarchy', 'Print-optimized'], preview: 'luna' },
    { id: 19, name: 'Whitespace Pro', slug: 'whitespace-pro', agent: 'Luna', category: 'minimal', price: 14.99, isPremium: true, downloads: 8760, rating: 4.6, desc: 'Maximum breathing room. For those who believe less is more.', features: ['Extreme whitespace', 'Single accent color', 'Breathing typography', 'Focus-driven layout'], preview: 'luna' },

    // CAREER CHANGE (4 templates)
    { id: 20, name: 'Narrative Flow', slug: 'narrative-flow', agent: 'Phoenix', category: 'career-change', price: 9.99, isPremium: true, downloads: 14500, rating: 4.8, desc: 'Designed for pivots. Strategic skill highlighting and transferable experience framing.', features: ['Transferable skills bridge', 'Pivot narrative section', 'Impact storytelling', 'Adaptability signals'], preview: 'phoenix' },
    { id: 21, name: 'Side Hustle Pro', slug: 'side-hustle-pro', agent: 'Phoenix', category: 'career-change', price: 9.99, isPremium: true, downloads: 11200, rating: 4.7, desc: 'For freelancers going full-time. Client work becomes professional experience.', features: ['Client portfolio section', 'Revenue progression', 'Service offerings', 'Testimonial quotes'], preview: 'phoenix' },
    { id: 22, name: 'Military Transition', slug: 'military-transition', agent: 'Phoenix', category: 'career-change', price: 14.99, isPremium: true, downloads: 8900, rating: 4.9, desc: 'Military-to-civilian transition with MOS translation and leadership focus.', features: ['MOS translation', 'Clearance level badge', 'Leadership quantification', 'Mission outcome framing'], preview: 'phoenix' },
    { id: 23, name: 'Return to Work', slug: 'return-to-work', agent: 'Phoenix', category: 'career-change', price: 14.99, isPremium: true, downloads: 7650, rating: 4.8, desc: 'For professionals returning after a career break. Gap explanation made elegant.', features: ['Career break narrative', 'Skills refresh section', 'Volunteer experience', 'Updated certifications'], preview: 'phoenix' },

    // ACADEMIC (3 templates)
    { id: 24, name: 'Scholar Formal', slug: 'scholar-formal', agent: 'Atlas', category: 'academic', price: 9.99, isPremium: true, downloads: 9870, rating: 4.9, desc: 'Formal credentials-forward design for academia and research roles.', features: ['Publication list (APA)', 'Research timeline', 'Grant funding section', 'Conference presentations'], preview: 'atlas' },
    { id: 25, name: 'Research CV', slug: 'research-cv', agent: 'Atlas', category: 'academic', price: 14.99, isPremium: true, downloads: 7650, rating: 4.8, desc: 'Extended CV format for researchers. Full publication and grant history.', features: ['Full bibliography', 'H-index display', 'Collaboration network', 'Lab management'], preview: 'atlas' },
    { id: 26, name: 'Grad Student', slug: 'grad-student', agent: 'Atlas', category: 'academic', price: 9.99, isPremium: true, downloads: 15400, rating: 4.7, desc: 'For PhD and Masters students applying for industry or postdoc roles.', features: ['Thesis abstract', 'Teaching assistantships', 'Research interests', 'Advisor highlight'], preview: 'atlas' },

    // INDUSTRY (4 templates)
    { id: 27, name: 'Healthcare Pro', slug: 'healthcare-pro', agent: 'Aurelius', category: 'industry', price: 9.99, isPremium: true, downloads: 11200, rating: 4.8, desc: 'Medical and healthcare professionals. License numbers and clinical hours.', features: ['License & certification', 'Clinical hours tracker', 'Specialty badges', 'Patient outcome metrics'], preview: 'aurelius' },
    { id: 28, name: 'Legal Eagle', slug: 'legal-eagle', agent: 'Aurelius', category: 'industry', price: 14.99, isPremium: true, downloads: 8760, rating: 4.7, desc: 'Attorneys and legal professionals. Case results and bar admissions.', features: ['Bar admission badges', 'Case result highlights', 'Practice areas', 'Court admissions'], preview: 'aurelius' },
    { id: 29, name: 'Sales Shark', slug: 'sales-shark', agent: 'Aurelius', category: 'industry', price: 9.99, isPremium: true, downloads: 14300, rating: 4.8, desc: 'Sales professionals with quota attainment and revenue metrics.', features: ['Quota attainment chart', 'Revenue generated', 'Pipeline metrics', 'Client logos'], preview: 'aurelius' },
    { id: 30, name: 'Marketing Maven', slug: 'marketing-maven', agent: 'Nova', category: 'industry', price: 9.99, isPremium: true, downloads: 13200, rating: 4.7, desc: 'Marketing professionals with campaign results and channel expertise.', features: ['Campaign results grid', 'Channel expertise badges', 'ROI metrics', 'Brand portfolio'], preview: 'nova' },
];

let currentFilter = 'all';
let currentSort = 'popular';
let searchQuery = '';
let selectedTemplate = null;

function renderTemplates() {
    const grid = document.getElementById('marketplaceGrid');
    let filtered = allTemplates;

    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.category === currentFilter);
    }

    // Apply search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q) ||
            t.agent.toLowerCase().includes(q) ||
            t.features.some(f => f.toLowerCase().includes(q))
        );
    }

    // Apply sort
    filtered = [...filtered].sort((a, b) => {
        switch (currentSort) {
            case 'popular': return b.downloads - a.downloads;
            case 'newest': return b.id - a.id;
            case 'price-low': return a.price - b.price;
            case 'price-high': return b.price - a.price;
            default: return 0;
        }
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="marketplace-empty">
                <i class="fas fa-search"></i>
                <p>No templates found. Try a different search or filter.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(t => `
        <div class="marketplace-card" data-category="${t.category}" onclick="openTemplateModal(${t.id})">
            <div class="mp-card-preview mp-preview-${t.preview}">
                ${getPreviewHTML(t.preview, t.name)}
            </div>
            <div class="mp-card-badge">
                ${t.isPremium ? '<span class="badge-premium"><i class="fas fa-crown"></i> Premium</span>' : '<span class="badge-free"><i class="fas fa-gift"></i> Free</span>'}
                <span class="badge-agent" style="color:${getAgentColor(t.agent)}"><i class="fas fa-robot"></i> ${t.agent}</span>
            </div>
            <div class="mp-card-info">
                <h3>${t.name}</h3>
                <p>${t.desc.substring(0, 80)}...</p>
                <div class="mp-card-meta">
                    <span class="mp-card-price">${t.price === 0 ? 'Free' : '$' + t.price}</span>
                    <span class="mp-card-rating"><i class="fas fa-star"></i> ${t.rating}</span>
                    <span class="mp-card-downloads"><i class="fas fa-download"></i> ${formatNumber(t.downloads)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function getPreviewHTML(preview, name) {
    const previews = {
        aurelius: `<div style="padding:16px;background:#fff;"><div style="text-align:center;border-bottom:2px solid #c9a96e;padding-bottom:8px;margin-bottom:8px;"><div style="font-size:0.7rem;font-weight:600;color:#1a1a2e;">${name}</div><div style="font-size:0.5rem;color:#8a7030;">Executive</div></div><div style="height:4px;background:#eee;border-radius:2px;margin-bottom:4px;"></div><div style="height:4px;background:#eee;border-radius:2px;width:60%;margin-bottom:4px;"></div><div style="height:4px;background:#eee;border-radius:2px;"></div></div>`,
        nova: `<div style="display:grid;grid-template-columns:60px 1fr;min-height:100%;"><div style="background:linear-gradient(180deg,#e8a0bf,#d484a8);"></div><div style="padding:12px;background:#fff;"><div style="font-size:0.6rem;color:#e8a0bf;font-weight:600;">${name}</div><div style="height:3px;background:#f0e0e8;border-radius:2px;margin-top:6px;"></div></div></div>`,
        cipher: `<div style="padding:16px;background:#fff;"><div style="text-align:center;border-bottom:2px solid #22d3ee;padding-bottom:8px;"><div style="font-size:0.7rem;font-weight:600;color:#1a1a2e;">${name}</div></div><div style="display:flex;gap:2px;margin:8px 0;"><span style="height:3px;flex:1;background:#22d3ee;border-radius:2px;opacity:0.3;"></span><span style="height:3px;flex:1;background:#22d3ee;border-radius:2px;"></span><span style="height:3px;flex:1;background:#22d3ee;border-radius:2px;"></span></div></div>`,
        luna: `<div style="padding:16px;background:#fafafa;"><div style="font-size:0.7rem;font-weight:500;color:#333;letter-spacing:-0.5px;">${name}</div><div style="height:3px;background:#e8e8e8;border-radius:2px;margin-top:8px;"></div><div style="height:3px;background:#e8e8e8;border-radius:2px;width:60%;margin-top:4px;"></div></div>`,
        phoenix: `<div style="padding:16px;background:#fff;"><div style="background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(239,68,68,0.04));padding:10px;border-radius:6px;margin-bottom:8px;"><div style="font-size:0.65rem;font-weight:600;color:#b45309;">${name}</div></div><div style="height:3px;background:#fef3c7;border-radius:2px;"></div></div>`,
        atlas: `<div style="padding:16px;background:#fff;font-family:Georgia,serif;"><div style="text-align:center;border-bottom:1px solid #ddd;padding-bottom:6px;"><div style="font-size:0.65rem;font-family:Georgia,serif;">${name}</div></div><div style="height:3px;background:#f5f5f0;border-radius:2px;margin-top:8px;"></div></div>`,
    };
    return previews[preview] || previews.aurelius;
}

function getAgentColor(agent) {
    const colors = { Aurelius: '#d4af37', Nova: '#e8a0bf', Cipher: '#22d3ee', Luna: '#c0c0c0', Phoenix: '#f59e0b', Atlas: '#818cf8' };
    return colors[agent] || '#d4af37';
}

function formatNumber(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n;
}

function openTemplateModal(id) {
    const t = allTemplates.find(x => x.id === id);
    if (!t) return;
    selectedTemplate = t;

    document.getElementById('tmName').textContent = t.name;
    document.getElementById('tmAgent').textContent = t.agent;
    document.getElementById('tmAgent').style.color = getAgentColor(t.agent);
    document.getElementById('tmDesc').textContent = t.desc;
    document.getElementById('tmPrice').textContent = t.price === 0 ? 'Free' : '$' + t.price;
    document.getElementById('tmPriceNote').textContent = t.isPremium ? 'Or included with Pro subscription' : '';
    document.getElementById('tmDownloads').textContent = formatNumber(t.downloads);
    document.getElementById('tmRating').textContent = t.rating;
    document.getElementById('tmPreview').innerHTML = getPreviewHTML(t.preview, t.name);
    document.getElementById('tmFeatures').innerHTML = t.features.map(f => `<span class="tm-feature"><i class="fas fa-check"></i> ${f}</span>`).join('');

    const buyBtn = document.getElementById('tmBuyBtn');
    if (t.price === 0) {
        buyBtn.innerHTML = '<i class="fas fa-download"></i> Download Free';
    } else {
        buyBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Get This Template';
    }

    document.getElementById('templateModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeTemplateModal() {
    document.getElementById('templateModal').style.display = 'none';
    document.body.style.overflow = '';
}

function purchaseTemplate() {
    if (!selectedTemplate) return;
    if (selectedTemplate.price === 0) {
        alert(`Downloading ${selectedTemplate.name}...`);
        return;
    }
    closeTemplateModal();
    document.getElementById('purchaseModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'none';
    document.body.style.overflow = '';
}

function previewTemplateLive() {
    if (selectedTemplate) {
        window.location.href = `app.html?template=${selectedTemplate.slug}`;
    }
}

// Category tabs
document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.dataset.filter;
        renderTemplates();
    });
});

// Search
document.getElementById('templateSearch')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTemplates();
});

// Sort
document.getElementById('sortTemplates')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTemplates();
});

// Init
document.addEventListener('DOMContentLoaded', renderTemplates);
