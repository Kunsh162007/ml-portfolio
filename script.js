document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Apply observer to project cards
    document.querySelectorAll('.project-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        observer.observe(card);
    });

    // Add sticky nav logic (optional refinement)
    const nav = document.querySelector('.glass-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.padding = '5px 0';
            nav.style.background = 'rgba(1, 14, 36, 0.95)';
        } else {
            nav.style.padding = '0';
            nav.style.background = 'rgba(16, 38, 69, 0.4)';
        }
    });

    // Modal Elements
    const modal = document.getElementById('readme-modal');
    const modalContent = document.getElementById('markdown-container');
    const closeBtn = document.querySelector('.close-btn');
    const githubLink = document.getElementById('modal-github-link');

    // Add "View Details" click handler
    document.querySelectorAll('.btn-text').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const readmePath = e.target.getAttribute('data-readme');
            const githubUrl = e.target.getAttribute('data-github');
            
            // Set github link
            githubLink.href = githubUrl || '#';
            
            // Show loading state
            modalContent.innerHTML = '<p>Loading project details...</p>';
            modal.classList.add('show');
            modal.style.display = 'block';

            try {
                const response = await fetch(readmePath);
                if (!response.ok) throw new Error('Failed to load README');
                
                const markdownText = await response.text();
                // Parse markdown to HTML using marked.js
                modalContent.innerHTML = marked.parse(markdownText);
            } catch (err) {
                console.error(err);
                modalContent.innerHTML = '<p>Error loading project details. Please try the GitHub link above.</p>';
            }
        });
    });

    // Close Modal Event Listeners
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300);
        }
    });
});
