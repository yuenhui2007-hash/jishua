/**
 * AI Pro Hub — Main JavaScript
 * Interactive features for the resume template
 */

// ==========================================
// THEME TOGGLE
// ==========================================
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const themeIcon = themeToggle.querySelector('i');

// Check for saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

// ==========================================
// TYPING EFFECT
// ==========================================
const typingText = document.getElementById('typingText');
const phrases = [
    'AI Engineer',
    'Full-Stack Developer',
    'Creative Technologist',
    'Problem Solver',
    'Open Source Contributor'
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 100;

function typeEffect() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
        typingText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 50;
    } else {
        typingText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 100;
    }
    
    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typingSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingSpeed = 500; // Pause before typing
    }
    
    setTimeout(typeEffect, typingSpeed);
}

typeEffect();

// ==========================================
// ANIMATED COUNTERS
// ==========================================
const counters = document.querySelectorAll('.stat-number');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseInt(counter.getAttribute('data-count'));
            animateCounter(counter, target);
            counterObserver.unobserve(counter);
        }
    });
}, { threshold: 0.5 });

counters.forEach(counter => counterObserver.observe(counter));

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// ==========================================
// ANIMATED SKILL BARS
// ==========================================
const skillBars = document.querySelectorAll('.skill-fill');
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.getAttribute('data-width');
            setTimeout(() => {
                bar.style.width = width + '%';
            }, 200);
            skillObserver.unobserve(bar);
        }
    });
}, { threshold: 0.5 });

skillBars.forEach(bar => skillObserver.observe(bar));

// ==========================================
// SCROLL ANIMATIONS
// ==========================================
const fadeElements = document.querySelectorAll('.skill-category, .project-card, .info-card, .contact-method');
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in', 'visible');
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

fadeElements.forEach(el => {
    el.classList.add('fade-in');
    fadeObserver.observe(el);
});

// ==========================================
// NAVBAR SCROLL EFFECT
// ==========================================
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.1)';
    } else {
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ==========================================
// ACTIVE NAV LINK
// ==========================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// ==========================================
// AI CHAT WIDGET
// ==========================================
const aiToggle = document.getElementById('aiToggle');
const aiChat = document.getElementById('aiChat');
const aiClose = document.getElementById('aiClose');
const aiInput = document.getElementById('aiInput');
const aiSend = document.getElementById('aiSend');
const aiMessages = document.getElementById('aiMessages');

aiToggle.addEventListener('click', () => aiChat.classList.toggle('active'));
aiClose.addEventListener('click', () => aiChat.classList.remove('active'));

// Simple AI responses (replace with real API integration)
const aiResponses = {
    'skills': 'Yuen Hui specializes in AI/ML (Python, PyTorch, OpenAI APIs), full-stack development (React, Node.js), and cloud architecture (AWS, Docker).',
    'experience': 'Yuen Hui has 5+ years of experience building AI-powered applications, automating workflows, and creating scalable web solutions.',
    'projects': 'Key projects include an AI Assistant Framework, Insight Analytics Dashboard, and Workflow Automation Engine. Check the Projects section!',
    'contact': 'You can reach Yuen Hui via email at hello@yuenhui.dev or through the contact form on this page.',
    'hire': 'Yuen Hui is currently available for freelance projects and full-time opportunities. Send a message to discuss!',
    'default': 'That\'s an interesting question! Yuen Hui would love to discuss this further. Feel free to reach out via the contact form.'
};

function getAIResponse(input) {
    const lower = input.toLowerCase();
    for (const [key, response] of Object.entries(aiResponses)) {
        if (lower.includes(key)) return response;
    }
    return aiResponses.default;
}

function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${isUser ? 'ai-user' : 'ai-bot'}`;
    messageDiv.innerHTML = `
        <div class="ai-avatar"><i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i></div>
        <div class="ai-bubble">${text}</div>
    `;
    aiMessages.appendChild(messageDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

function sendMessage() {
    const text = aiInput.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    aiInput.value = '';
    
    // Simulate typing delay
    setTimeout(() => {
        const response = getAIResponse(text);
        addMessage(response);
    }, 1000);
}

aiSend.addEventListener('click', sendMessage);
aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ==========================================
// MOBILE MENU
// ==========================================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

mobileMenuBtn.addEventListener('click', () => {
    // Create mobile menu overlay if not exists
    let mobileMenu = document.querySelector('.mobile-menu');
    if (!mobileMenu) {
        mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        mobileMenu.innerHTML = `
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#skills">Skills</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>
            <button class="btn btn-outline" onclick="this.parentElement.classList.remove('active')">Close</button>
        `;
        document.body.appendChild(mobileMenu);
    }
    mobileMenu.classList.toggle('active');
    
    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
        });
    });
});

// ==========================================
// FORM HANDLING
// ==========================================
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        // Formspree handles the actual submission
        // This is just for UX enhancement
        const btn = contactForm.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
            btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        }, 2000);
    });
}

// ==========================================
// PARALLAX EFFECT
// ==========================================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const orbs = document.querySelectorAll('.gradient-orb');
    orbs.forEach((orb, index) => {
        const speed = 0.3 + (index * 0.1);
        orb.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ==========================================
// SMOOTH REVEAL ON LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});
