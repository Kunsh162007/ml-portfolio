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

    // Add "View Details" click handler (mockup logic)
    document.querySelectorAll('.btn-text').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const projectTitle = e.target.closest('.card-content').querySelector('h3').innerText;
            console.log(`Navigating to research details for: ${projectTitle}`);
            alert(`Feature Coming Soon: In-depth research analysis for ${projectTitle}.\n\nThis will include detailed metrics, code walkthroughs, and interactive visualizations.`);
        });
    });
});
