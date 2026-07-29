/**
 * AI Tools Hub - Interactive Tool Modals
 */

const toolConfigs = {
    interview: {
        title: 'AI Interview Prep',
        desc: 'Paste a job description and get likely interview questions with model answers.',
        inputs: [
            { name: 'jobDescription', label: 'Job Description', type: 'textarea', placeholder: 'Paste the full job description here...', rows: 6 },
            { name: 'experience', label: 'Your Experience Level', type: 'select', options: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'] },
        ],
        outputLabel: 'Interview Questions & Answers',
    },
    coverletter: {
        title: 'Cover Letter Tailor',
        desc: 'Paste a job description and your current cover letter (or resume). AI will rewrite it to match.',
        inputs: [
            { name: 'jobDescription', label: 'Job Description', type: 'textarea', placeholder: 'Paste the job description...', rows: 5 },
            { name: 'currentLetter', label: 'Your Current Cover Letter (or Resume)', type: 'textarea', placeholder: 'Paste your cover letter or resume...', rows: 5 },
        ],
        outputLabel: 'Tailored Cover Letter',
    },
    linkedin: {
        title: 'LinkedIn Bio Generator',
        desc: 'Paste your resume or describe yourself. Get an optimized LinkedIn "About" section.',
        inputs: [
            { name: 'resume', label: 'Your Resume Content', type: 'textarea', placeholder: 'Paste your resume or describe your background...', rows: 6 },
        ],
        outputLabel: 'LinkedIn About Section',
    },
    ats: {
        title: 'ATS Score Checker',
        desc: 'Paste your resume and a job description. Get an ATS compatibility score and fixes.',
        inputs: [
            { name: 'resume', label: 'Your Resume', type: 'textarea', placeholder: 'Paste your resume content...', rows: 6 },
            { name: 'jobDescription', label: 'Job Description (Optional)', type: 'textarea', placeholder: 'Paste job description for targeted analysis...', rows: 4 },
        ],
        outputLabel: 'ATS Analysis Results',
    },
    salary: {
        title: 'Salary Negotiation Script',
        desc: 'Get personalized negotiation talking points based on your role, location, and experience.',
        inputs: [
            { name: 'role', label: 'Job Title', type: 'text', placeholder: 'e.g. Senior Software Engineer' },
            { name: 'currentSalary', label: 'Current Salary', type: 'text', placeholder: 'e.g. $120,000' },
            { name: 'offerSalary', label: 'Offered Salary', type: 'text', placeholder: 'e.g. $135,000' },
            { name: 'location', label: 'Location', type: 'text', placeholder: 'e.g. San Francisco, CA' },
        ],
        outputLabel: 'Negotiation Script',
    },
    skillsgap: {
        title: 'Skills Gap Analyzer',
        desc: 'Upload a job description and your current skills. See what you\'re missing.',
        inputs: [
            { name: 'jobDescription', label: 'Job Description', type: 'textarea', placeholder: 'Paste the job description...', rows: 6 },
            { name: 'currentSkills', label: 'Your Current Skills', type: 'textarea', placeholder: 'List your current skills (comma separated)...', rows: 3 },
        ],
        outputLabel: 'Skills Gap Analysis',
    },
    quantify: {
        title: 'Achievement Quantifier',
        desc: 'Paste vague bullet points. AI suggests metrics and numbers to make them powerful.',
        inputs: [
            { name: 'bullets', label: 'Your Bullet Points', type: 'textarea', placeholder: 'e.g.\n- Improved website performance\n- Managed a team\n- Increased sales', rows: 6 },
        ],
        outputLabel: 'Quantified Achievements',
    },
    translate: {
        title: 'Multi-Language Resume',
        desc: 'Translate your resume while maintaining professional tone.',
        inputs: [
            { name: 'resume', label: 'Your Resume', type: 'textarea', placeholder: 'Paste your resume content...', rows: 6 },
            { name: 'targetLanguage', label: 'Target Language', type: 'select', options: ['Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Portuguese', 'Italian', 'Dutch', 'Korean', 'Arabic'] },
        ],
        outputLabel: 'Translated Resume',
    },
    jobmatch: {
        title: 'Job Description Matcher',
        desc: 'See how well your resume matches a job posting.',
        inputs: [
            { name: 'resume', label: 'Your Resume', type: 'textarea', placeholder: 'Paste your resume...', rows: 5 },
            { name: 'jobDescription', label: 'Job Description', type: 'textarea', placeholder: 'Paste the job description...', rows: 5 },
        ],
        outputLabel: 'Match Analysis',
    },
    referral: {
        title: 'Referral Request Generator',
        desc: 'Generate personalized referral request messages.',
        inputs: [
            { name: 'connectionName', label: 'Connection Name', type: 'text', placeholder: 'e.g. Sarah Chen' },
            { name: 'company', label: 'Target Company', type: 'text', placeholder: 'e.g. Google' },
            { name: 'role', label: 'Role You Want', type: 'text', placeholder: 'e.g. Product Manager' },
            { name: 'relationship', label: 'Your Relationship', type: 'select', options: ['Former Colleague', 'Friend', 'Acquaintance', 'Mentor', 'Alumni'] },
        ],
        outputLabel: 'Referral Message',
    },
    networking: {
        title: 'Networking Icebreakers',
        desc: 'Generate conversation starters for events and meetings.',
        inputs: [
            { name: 'personName', label: 'Person Name (Optional)', type: 'text', placeholder: 'e.g. John Smith' },
            { name: 'context', label: 'Context', type: 'select', options: ['Conference', 'Coffee Chat', 'LinkedIn Message', 'Industry Event', 'Informational Interview'] },
            { name: 'theirRole', label: 'Their Role/Title', type: 'text', placeholder: 'e.g. VP of Engineering at Stripe' },
        ],
        outputLabel: 'Icebreaker Messages',
    },
    brand: {
        title: 'Personal Brand Statement',
        desc: 'Generate a one-sentence brand statement for your bio.',
        inputs: [
            { name: 'whatYouDo', label: 'What You Do', type: 'text', placeholder: 'e.g. I build AI-powered products' },
            { name: 'audience', label: 'Who You Help', type: 'text', placeholder: 'e.g. startups and enterprise companies' },
            { name: 'outcome', label: 'The Outcome', type: 'text', placeholder: 'e.g. scale their engineering teams' },
        ],
        outputLabel: 'Brand Statements',
    },
    summarize: {
        title: 'Resume Summarizer',
        desc: 'Generate a concise executive summary from your full resume.',
        inputs: [
            { name: 'resume', label: 'Your Resume', type: 'textarea', placeholder: 'Paste your full resume...', rows: 8 },
        ],
        outputLabel: 'Executive Summary',
    },
    signature: {
        title: 'Email Signature Generator',
        desc: 'Create a branded HTML email signature.',
        inputs: [
            { name: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Yuen Hui' },
            { name: 'title', label: 'Job Title', type: 'text', placeholder: 'AI Engineer' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { name: 'linkedin', label: 'LinkedIn URL', type: 'text', placeholder: 'linkedin.com/in/you' },
        ],
        outputLabel: 'Email Signature',
    },
    pitch: {
        title: 'Elevator Pitch Builder',
        desc: 'Build 30-second, 60-second, and 2-minute versions of your pitch.',
        inputs: [
            { name: 'background', label: 'Your Background', type: 'textarea', placeholder: 'Describe your background, skills, and what you do...', rows: 4 },
            { name: 'goal', label: 'Your Goal', type: 'select', options: ['Get a Job', 'Find Clients', 'Make a Connection', 'Raise Funding', 'Find a Co-founder'] },
        ],
        outputLabel: 'Elevator Pitches',
    },
};

let currentTool = null;

function openToolModal(toolKey) {
    currentTool = toolKey;
    const config = toolConfigs[toolKey];
    if (!config) return;

    document.getElementById('tlTitle').textContent = config.title;
    document.getElementById('tlDesc').textContent = config.desc;

    const inputSection = document.getElementById('tlInputSection');
    inputSection.innerHTML = config.inputs.map(input => {
        if (input.type === 'textarea') {
            return `
                <div class="tl-form-group">
                    <label>${input.label}</label>
                    <textarea id="tl_${input.name}" rows="${input.rows || 4}" placeholder="${input.placeholder || ''}"></textarea>
                </div>
            `;
        } else if (input.type === 'select') {
            return `
                <div class="tl-form-group">
                    <label>${input.label}</label>
                    <select id="tl_${input.name}">
                        ${input.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                </div>
            `;
        } else {
            return `
                <div class="tl-form-group">
                    <label>${input.label}</label>
                    <input type="${input.type}" id="tl_${input.name}" placeholder="${input.placeholder || ''}">
                </div>
            `;
        }
    }).join('');

    document.getElementById('tlOutput').style.display = 'none';
    document.getElementById('toolModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeToolModal() {
    document.getElementById('toolModal').style.display = 'none';
    document.body.style.overflow = '';
}

async function generateToolOutput() {
    const config = toolConfigs[currentTool];
    if (!config) return;

    const btn = document.getElementById('tlGenerateBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btn.disabled = true;

    // Collect inputs
    const inputs = {};
    config.inputs.forEach(input => {
        const el = document.getElementById(`tl_${input.name}`);
        inputs[input.name] = el ? el.value : '';
    });

    // Simulate AI generation (in production, this calls the API)
    await new Promise(r => setTimeout(r, 2000));

    const outputs = {
        interview: `## Top 5 Interview Questions\n\n### 1. Tell me about yourself.\n**Model Answer:** "I'm a results-driven professional with ${inputs.experience || 'several'} years of experience..."\n\n### 2. Why are you interested in this role?\n**Model Answer:** "I'm drawn to this position because..."\n\n### 3. Describe a challenging project you worked on.\n**Model Answer:** "At my previous company, I led..."\n\n### 4. How do you handle tight deadlines?\n**Model Answer:** "I prioritize by impact and communicate early..."\n\n### 5. Where do you see yourself in 5 years?\n**Model Answer:** "I aim to grow into a leadership role while..."`,

        coverletter: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the position. With my background and skills, I am confident I can contribute significantly to your team.\n\n[Your tailored content based on the job description would appear here, optimized with relevant keywords and aligned with company values.]\n\nThank you for considering my application.\n\nSincerely,\n[Your Name]`,

        linkedin: `Passionate professional with expertise in driving results and building innovative solutions. I specialize in translating complex challenges into actionable strategies that deliver measurable impact.\n\nWith a proven track record of leading cross-functional teams and delivering projects on time, I'm always looking to connect with like-minded professionals and explore new opportunities.\n\nLet's connect!`,

        ats: `## ATS Score: 78/100\n\n### ✅ Found Keywords\n- Project Management\n- Data Analysis\n- Team Leadership\n\n### ❌ Missing Keywords\n- Agile/Scrum\n- Stakeholder Management\n- Budget Planning\n\n### 💡 Suggestions\n1. Add "Agile" to your skills section\n2. Include budget sizes in experience bullets\n3. Mention specific tools by name`,

        salary: `## Negotiation Script\n\n**Opening:** "Thank you for the offer. I'm excited about the role and believe I can add significant value. Based on my research and experience, I was hoping we could discuss the compensation."\n\n**Anchor:** "Given my ${inputs.currentSalary ? 'current compensation of ' + inputs.currentSalary : 'experience level'} and the market rate for ${inputs.role || 'this position'} in ${inputs.location || 'this area'}, I was targeting a range of [X-Y]."\n\n**Justification:** "I bring [specific skills] that directly address [company need]. In my previous role, I [quantified achievement]."\n\n**Close:** "I'm confident we can find a number that works for both of us. What flexibility do we have?"`,

        skillsgap: `## Skills Gap Analysis\n\n### Skills You Have ✅\n- Python\n- SQL\n- Data Visualization\n\n### Skills to Acquire ⚠️\n1. **Machine Learning** - Take Coursera Andrew Ng course (4 weeks)\n2. **AWS/GCP** - Cloud Practitioner cert (2 weeks)\n3. **Docker** - FreeCodeCamp tutorial (1 week)\n\n### Quick Wins 🚀\n- Add "familiar with ML concepts" to resume\n- Complete 1 cloud certification\n- Build a portfolio project`,

        quantify: `## Quantified Achievements\n\n**Before:** Improved website performance\n**After:** Reduced page load time by 40% (from 5s to 3s), improving user retention by 15%\n\n**Before:** Managed a team\n**After:** Led a cross-functional team of 12 engineers, delivering 3 major releases on schedule\n\n**Before:** Increased sales\n**After:** Grew regional sales by $2.4M (35% YoY) through new partnership strategy`,

        translate: `## Translated Resume (${inputs.targetLanguage || 'Spanish'})\n\n[Your professionally translated resume content would appear here, maintaining professional tone and industry terminology.]`,

        jobmatch: `## Match Score: 72%\n\n### Strong Matches ✅\n- Technical skills alignment (90%)\n- Years of experience (85%)\n- Industry background (80%)\n\n### Gaps to Address ⚠️\n- Missing: "Kubernetes" experience\n- Missing: "Team leadership" evidence\n- Weak: "Cross-functional collaboration"\n\n### Recommendations\n1. Highlight any Kubernetes exposure\n2. Add team size to experience bullets\n3. Include cross-functional project examples`,

        referral: `Hi ${inputs.connectionName || 'there'},\n\nI hope you're doing well! I noticed ${inputs.company || 'your company'} has an opening for a ${inputs.role || 'great role'} and I would love to learn more about the team and culture there.\n\nGiven my background in [relevant experience], I think I could be a strong fit. Would you be open to making a referral or having a quick chat about the role?\n\nNo pressure at all — I really appreciate you considering it!\n\nBest,\n[Your Name]`,

        networking: `## Icebreakers for ${inputs.context || 'a Conference'}\n\n1. "I really enjoyed your talk on [topic]. How did you first get interested in that area?"\n2. "I'm curious about your transition from [X] to [Y]. What was the biggest surprise?"\n3. "Your company just launched [initiative]. What was the most challenging part?"\n\n## Follow-up Questions\n- "What trends are you seeing in the industry right now?"\n- "If you were starting your career today, what would you focus on?"`,

        brand: `## Personal Brand Statements\n\n**Short (Twitter bio):** ${inputs.whatYouDo || 'I build products'} for ${inputs.audience || 'startups'} to ${inputs.outcome || 'grow faster'}.\n\n**Medium (LinkedIn headline):** ${inputs.whatYouDo || 'Product leader'} helping ${inputs.audience || 'tech companies'} ${inputs.outcome || 'launch successful products'}.\n\n**Long (Conference intro):** "Hi, I'm [Name]. I ${inputs.whatYouDo || 'build AI products'} for ${inputs.audience || 'enterprise companies'} so they can ${inputs.outcome || 'automate workflows'}. Previously at [Company], where I [achievement]."`,

        summarize: `## Executive Summary\n\nResults-driven professional with extensive experience delivering impactful solutions. Proven ability to lead cross-functional teams, manage complex projects, and drive measurable business outcomes. Combines technical expertise with strategic vision to solve challenging problems and create value.`,

        signature: `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
<strong>${inputs.fullName || 'Your Name'}</strong><br>
${inputs.title || 'Your Title'}<br>
<a href="mailto:${inputs.email || ''}">${inputs.email || 'email@example.com'}</a><br>
${inputs.linkedin ? `<a href="https://${inputs.linkedin}">LinkedIn</a><br>` : ''}
<span style="color: #d4af37;">ResumeAI Pro</span>
</div>`,

        pitch: `## Elevator Pitches\n\n**30 seconds:**\n"I help ${inputs.goal === 'Get a Job' ? 'companies build scalable products' : 'clients achieve [outcome]'}. In my last role, I [specific result]. I'm looking for [next step]."\n\n**60 seconds:**\n"I specialize in [your expertise]. Over the past [X] years, I've [key achievement 1] and [key achievement 2]. What I'm most proud of is [specific impact]. Right now, I'm excited about [goal]."\n\n**2 minutes:**\n[Expanded version with story arc, specific examples, and clear ask.]`,
    };

    const output = outputs[currentTool] || 'AI-generated content would appear here. Connect to the backend API for live generation.';

    document.getElementById('tlOutputContent').innerHTML = output.replace(/\n/g, '<br>');
    document.getElementById('tlOutput').style.display = 'block';

    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    btn.disabled = false;
}

function copyToolOutput() {
    const content = document.getElementById('tlOutputContent').innerText;
    navigator.clipboard.writeText(content).then(() => {
        const btn = document.querySelector('.tl-copy-btn');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = original, 2000);
    });
}
