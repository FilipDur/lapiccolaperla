document.addEventListener('DOMContentLoaded', () => {
    // Selectors
    const header = document.querySelector('.main-header');
    const menuButtons = document.querySelectorAll('.menu-category-btn');
    const menuItems = document.querySelectorAll('.menu-items');
    const heroSlides = document.querySelectorAll('.hero-slide');
    const nav = document.querySelector('.main-nav');
    const bar = document.querySelector('#bar');
    const close = document.querySelector('#close');
    const themeToggle = document.querySelector('#theme-toggle');
    const body = document.body;
    
    // 1. Hero Slideshow with smoother transitions
    let currentSlide = 0;
    function showSlide(index) {
        heroSlides.forEach((slide, i) => {
            slide.style.opacity = i === index ? 1 : 0;
            slide.style.visibility = i === index ? 'visible' : 'hidden';
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % heroSlides.length;
        showSlide(currentSlide);
    }

    if (heroSlides.length > 0) {
        showSlide(currentSlide);
        setInterval(nextSlide, 6000); // 6 seconds for a more relaxed feel
    }

    // 2. Sticky Header Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 3. Scroll Reveal Animation using Intersection Observer
    const revealOptions = {
        threshold: 0.1,
        rootMargin: "0px"
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Reveal only once
            }
        });
    }, revealOptions);

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 4. Menu Category Switching with smooth fade
    menuButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            menuButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            menuItems.forEach(item => {
                if (item.id === `${category}-items`) {
                    item.style.display = 'block';
                    // Trigger reflow for animation
                    item.offsetHeight; 
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                    item.style.display = 'none';
                }
            });
            
            // Center active category in the scrollable bar
            const container = document.querySelector('.menu-categories');
            const scrollLeft = button.offsetLeft - (container.offsetWidth / 2) + (button.offsetWidth / 2);
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        });
    });

    // Activate the first category by default
    if (menuButtons.length > 0) {
        // Find the "soups" button or click the first one
        const initialBtn = Array.from(menuButtons).find(btn => btn.dataset.category === 'soups') || menuButtons[0];
        initialBtn.click();
    }

    // 5. Custom Lightbox with smooth transitions
    const galleryLinks = document.querySelectorAll('[data-lightbox="gallery"]');
    if (galleryLinks.length > 0) {
        const lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        document.body.appendChild(lightbox);

        const lightboxImage = document.createElement('img');
        lightbox.appendChild(lightboxImage);

        const lightboxClose = document.createElement('span');
        lightboxClose.id = 'lightbox-close';
        lightboxClose.innerHTML = '&times;';
        lightbox.appendChild(lightboxClose);

        galleryLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                lightboxImage.src = ''; // Reset
                lightbox.classList.add('active');
                lightboxImage.src = link.href;
            });
        });

        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });

        lightbox.addEventListener('click', e => {
            if (e.target !== lightboxImage && e.target !== lightboxClose) {
                lightbox.classList.remove('active');
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') lightbox.classList.remove('active');
        });
    }

    // 6. Mobile Navigation
    if (bar) {
        bar.addEventListener('click', (e) => {
            e.preventDefault();
            nav.classList.add('active');
            body.style.overflow = 'hidden'; // Prevent scroll
        });
    }

    if (close) {
        close.addEventListener('click', (e) => {
            e.preventDefault();
            nav.classList.remove('active');
            body.style.overflow = 'auto';
        });
    }
    
    // Close nav on link click
    document.querySelectorAll('.main-nav__link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
    
    // 7. Theme Toggle
    function setTheme(theme) {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeToggleIcon(theme);
    }

    function updateThemeToggleIcon(theme) {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (theme === 'light') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            setTheme(newTheme);
        });
    }

    // Close nav on backdrop click
    nav.addEventListener('click', (e) => {
        if (e.target === nav) {
            nav.classList.remove('active');
            body.style.overflow = 'auto';
        }
    });
});