document.addEventListener('DOMContentLoaded', function () {

    // --- Background video and Hamburger menu logic ---
    const video = document.getElementById('bg-video');
    if (video) {
        video.addEventListener('error', (e) => console.error("Video error:", e));
        const adjustPlaybackSpeed = () => {
            video.playbackRate = window.innerWidth <= 768 ? 0.8 : 1.0;
        };
        adjustPlaybackSpeed();
        window.addEventListener('resize', adjustPlaybackSpeed);
    }

    const hamburger = document.querySelector('.hamburger');
    const navbar = document.querySelector('.navbar');
    if (hamburger && navbar) {
        hamburger.addEventListener('click', () => toggleMenu(navbar));
    }

    // --- Portfolio and Modal Logic ---
    const portfolioContainer = document.querySelector('.portfolio-container');
    const modal = document.getElementById('video-modal');
    const modalIframe = document.getElementById('modal-video-iframe');
    const closeModalBtn = document.querySelector('.close-modal');

    function openModal(videoId) {
        if (modal && modalIframe) {
            // より確実に再生するため、複数のパラメータを追加
            const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&enablejsapi=1&origin=${window.location.origin}`;
            modalIframe.src = embedUrl;
            modal.style.display = 'block';
        }
    }

    function closeModal() {
        if (modal && modalIframe) {
            modal.style.display = 'none';
            modalIframe.src = '';
        }
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal();
        }
    });

    if (portfolioContainer) {
        const portfolioItems = portfolioContainer.querySelectorAll('.portfolio-item');
        // Desktop: Grid layout - all items are clickable
        portfolioItems.forEach(item => {
            item.addEventListener('click', () => {
                openModal(item.dataset.videoId);
            });
        });
    }
});

function toggleMenu(navbar) {
    navbar.classList.toggle('nav-open');
    const navLinks = document.querySelector('.nav-links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

function onYouTubeIframeAPIReady() {
    // Not used in this implementation
}
