document.addEventListener('DOMContentLoaded', () => {
    // Synthetic Void: Mouse-Follow Glow
    const mouseGlow = document.getElementById('mouse-glow');
    window.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        mouseGlow.style.opacity = '1';
        mouseGlow.style.left = `${x - window.innerWidth * 0.25}px`;
        mouseGlow.style.top = `${y - window.innerWidth * 0.25}px`;
    });

    // Intersection Observer for Staggered Reveal 2.0
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.classList.add('fade-in-visible');
                }, index * 150); // Increased delay for premium feel
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Scrollspy: highlight the active nav link
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinkEls = document.querySelectorAll('.nav-links a');
    const spy = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinkEls.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    // Sticky Navigation
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile Navigation Menu Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navLinksList = document.getElementById('nav-links');
    
    if (navToggle && navLinksList) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinksList.classList.toggle('active');
        });
        
        // Close menu when a link is clicked
        navLinksList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinksList.classList.remove('active');
            });
        });
    }

    // ===== Category Filter Bar =====
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active tab
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            const filter = btn.getAttribute('data-filter');

            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                const matches = filter === 'all' || category === filter;

                if (matches) {
                    card.classList.remove('filter-hidden');
                } else {
                    card.classList.add('filter-hidden');
                }
            });
        });
    });

    // ===== Scroll Indicator auto-hide =====
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '';
                scrollIndicator.style.pointerEvents = '';
            }
        }, { passive: true });
    }

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

        // Replace HTML img tags: <img src="path/to/img" ... />
        updatedMarkdown = updatedMarkdown.replace(/<img[^>]+src=["'](?!http|https)([^"']+)["'][^>]*>/g, (match, path) => {
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return match.replace(path, `${rawBaseUrl}${cleanPath}`);
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
