document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for Staggered Reveal
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add a small delay based on the element's position for organic feel
                setTimeout(() => {
                    entry.target.classList.add('fade-in-visible');
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Magnetic Card Effect
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)`;
        });
    });

    // Sticky Navigation
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Modal Elements
    const modal = document.getElementById('readme-modal');
    const modalContent = document.getElementById('markdown-container');
    const closeBtn = document.querySelector('.close-btn');
    const githubLink = document.getElementById('modal-github-link');

    // Function to rewrite relative paths in Markdown
    function rewriteMarkdownPaths(markdown, githubUrl, subfolder = '') {
        if (!githubUrl || !githubUrl.includes('github.com')) return markdown;

        // Extract repo parts (e.g., Kunsh162007/CNN)
        const repoPath = githubUrl.replace('https://github.com/', '').replace(/\/$/, '');
        const cleanSubfolder = subfolder ? (subfolder.endsWith('/') ? subfolder : subfolder + '/') : '';
        const rawBaseUrl = `https://raw.githubusercontent.com/${repoPath}/main/${cleanSubfolder}`;

        // Replace relative image paths: ![alt](path/to/img)
        let updatedMarkdown = markdown.replace(/!\[([^\]]*)\]\((?!http|https)([^\)]+)\)/g, (match, alt, path) => {
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return `![${alt}](${rawBaseUrl}${cleanPath})`;
        });

        // Replace relative links: [text](path/to/file)
        updatedMarkdown = updatedMarkdown.replace(/\[([^\]]*)\]\((?!http|https|#)([^\)]+)\)/g, (match, text, path) => {
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return `[${text}](${githubUrl}/blob/main/${cleanSubfolder}${cleanPath})`;
        });

        return updatedMarkdown;
    }

    // "View Details" click handler
    document.querySelectorAll('.btn-text').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const button = e.currentTarget;
            const readmePath = button.getAttribute('data-readme');
            const githubUrl = button.getAttribute('data-github');
            
            // Set github link
            githubLink.href = githubUrl || '#';
            
            // Show modal and loading state
            document.body.style.overflow = 'hidden'; // Prevent scroll
            modalContent.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Fetching technical documentation...</p>
                </div>
            `;
            modal.style.display = 'block';
            setTimeout(() => modal.classList.add('show'), 10);

            try {
                const response = await fetch(readmePath);
                if (!response.ok) throw new Error('Failed to load README');
                
                let markdownText = await response.text();
                
                // Rewrite relative paths
                const subfolder = button.getAttribute('data-repo-subfolder') || '';
                markdownText = rewriteMarkdownPaths(markdownText, githubUrl, subfolder);
                
                // Parse markdown to HTML using marked.js
                // Configure marked for security and features if needed
                modalContent.innerHTML = marked.parse(markdownText);
                
                // Highlight code blocks (if a highlighter is available, otherwise browser default)
                // modalContent.querySelectorAll('pre code').forEach((block) => { ... });
                
            } catch (err) {
                console.error(err);
                modalContent.innerHTML = `
                    <div class="error-state">
                        <p>Unable to load the README file directly.</p>
                        <a href="${githubUrl}" target="_blank" class="btn btn-primary">View on GitHub Instead</a>
                    </div>
                `;
            }
        });
    });

    // Close Modal Function
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restore scroll
        setTimeout(() => {
            modal.style.display = 'none';
            modalContent.innerHTML = '';
        }, 300);
    }

    closeBtn.addEventListener('click', closeModal);

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });
});
