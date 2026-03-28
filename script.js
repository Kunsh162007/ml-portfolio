document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-visible');
            }
        });
    }, observerOptions);

    // Apply observer to project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.classList.add('fade-in');
        observer.observe(card);
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
    function rewriteMarkdownPaths(markdown, githubUrl) {
        if (!githubUrl || !githubUrl.includes('github.com')) return markdown;

        // Extract repo parts (e.g., Kunsh162007/CNN)
        const repoPath = githubUrl.replace('https://github.com/', '').replace(/\/$/, '');
        const rawBaseUrl = `https://raw.githubusercontent.com/${repoPath}/main/`;

        // Replace relative image paths: ![alt](path/to/img)
        // This regex looks for ][ (path) and ensures it doesn't start with http/https
        let updatedMarkdown = markdown.replace(/!\[([^\]]*)\]\((?!http|https)([^\)]+)\)/g, (match, alt, path) => {
            // Handle cases where the path might start with ./ 
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return `![${alt}](${rawBaseUrl}${cleanPath})`;
        });

        // Replace relative links: [text](path/to/file)
        updatedMarkdown = updatedMarkdown.replace(/\[([^\]]*)\]\((?!http|https|#)([^\)]+)\)/g, (match, text, path) => {
            const cleanPath = path.startsWith('./') ? path.substring(2) : path;
            return `[${text}](${githubUrl}/blob/main/${cleanPath})`;
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
                markdownText = rewriteMarkdownPaths(markdownText, githubUrl);
                
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
