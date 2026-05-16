/*
 * VOID AURORA — three-effects.js
 * Fullscreen Sweeping Ribbon (Mobile + Parallax + Synchronized Startup Hook)
 */
(function () {
    'use strict';
    
    // Safety check
    if (typeof THREE === 'undefined') {
        console.warn('Three.js is missing. Shader background cannot load.');
        return;
    }

    var canvas = document.getElementById('particles-canvas');
    if (!canvas) return;

    // ─── SHADER SOURCE ────────────────────────────────────────────────────────
    var vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
        }
    `;
    
    var fragmentShader = `
        precision highp float;
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 mouse;
        uniform float scrollOffset; 
        uniform float launchFlash;
        varying vec2 vUv;

        void main() {
            vec2 p = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
            
            if (resolution.x < resolution.y) {
                p.x *= 0.85; 
                p.y *= 0.45; 
            } else {
                p *= 1.0; 
            }

            vec2 m = mouse * 2.0;
            m.y += scrollOffset;

            // --- LIQUID LAVA LAMP MATH ---
            vec2 q = p;
            float tScale = time * 0.15;

            for(int i = 1; i < 4; i++){
                float fi = float(i); 
                q.x += 0.6 / fi * sin(fi * 1.2 * q.y + tScale + m.x);
                q.y += 0.6 / fi * cos(fi * 1.8 * q.x - tScale + m.y);
            }

         // Safe Range Palette - Pure Dark Reduction
vec3 color1 = vec3(0.00, 0.00, 0.02); 
vec3 color2 = vec3(0.13, 0.23, 0.40); // 33% brightness blue
vec3 color3 = vec3(0.20, 0.15, 0.35); // 33% brightness purple
vec3 color4 = vec3(0.26, 0.33, 0.20); // 33% brightness green 

            float r = 0.5 + 0.5 * sin(q.x * 1.2 + q.y * 0.8 + time * 0.2);
            float g = 0.5 + 0.5 * sin(q.x * 0.9 - q.y * 1.3 + time * 0.3 + 2.0);
            float b = 0.5 + 0.5 * cos(q.x * 1.4 + q.y * 1.1 + time * 0.4 + 4.0);

            vec3 base = mix(color1, color2, r);
            base = mix(base, color3, g * 0.8);
            base = mix(base, color4, b * 0.4);

            vec3 flashColor = vec3(0.2, 0.6, 0.9);
            base += flashColor * launchFlash;

            float vignette = 1.0 - length(vUv - 0.5) * 0.5;
            gl_FragColor = vec4(base * vignette, 1.0);
        }
    `;

    // ─── THREE.JS INITIALIZATION ──────────────────────────────────────────────
    var scene = new THREE.Scene();
    var camera = new THREE.Camera(); 
    var renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: false, 
        powerPreference: 'high-performance' 
    });

    // Cap resolution based on device type for optimal performance
    var isMobile = window.innerWidth < 768;
    var maxPixelRatio = isMobile ? 1.25 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));

    function resize() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        renderer.setSize(w, h);
        material.uniforms.resolution.value.set(w, h);
    }

    var material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            resolution: { value: new THREE.Vector2() },
            mouse: { value: new THREE.Vector2(0, 0) },
            scrollOffset: { value: 0 },
            launchFlash: { value: 0.0 } // Starts at 0 (dormant)
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // ─── TRACKING VARIABLES ───────────────────────────────────────────────────
    var targetMouse = new THREE.Vector2(0, 0);
    var currentMouse = new THREE.Vector2(0, 0);
    var mouseEase = 0.03; 
    
    var targetScroll = 0;
    var currentScroll = 0;

    // Startup Animation Variables
    var shaderTime = 0;
    var lastTime = performance.now();
    var launchSpeed = 1.0;  // Starts dormant (normal speed)
    var launchFlash = 0.0;  // Starts dormant (no flash)
    var hasLaunched = false;

    // ─── SYNCHRONIZE WITH PRELOADER ───────────────────────────────────────────
    window.addEventListener('load', function() {
        // Wait 300ms so it perfectly aligns with the preloader fading out
        setTimeout(function() {
            if (!hasLaunched) {
                launchSpeed = 40.0; // Blast off!
                launchFlash = 1.0;  // Maximum glow!
                hasLaunched = true;
            }
        }, 300);
    });

    // ─── EVENT LISTENERS ──────────────────────────────────────────────────────
    window.addEventListener('resize', resize);
    
    window.addEventListener('mousemove', function (e) {
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('touchmove', function (e) {
        if (e.touches.length > 0) {
            targetMouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
            targetMouse.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1;
        }
    }, { passive: true });

    // ─── LENIS & ANIMATION LOOP ──────────────────────────────────────────────
    var lenis = typeof Lenis !== 'undefined' ? new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true
    }) : null;

    function raf(time) {
        if (lenis) lenis.raf(time);
        
        // Calculate delta time for smooth frame-independent animation
        var delta = time - lastTime;
        lastTime = time;
        if (delta > 50) delta = 16; // Prevent huge jumps if tab is inactive
        
        // 1. Decay the Startup Launch Effects
        launchSpeed += (1.0 - launchSpeed) * 0.03; // Smoothly drops back to 1.0
        launchFlash += (0.0 - launchFlash) * 0.03; // Smoothly drops back to 0.0

        // 2. Smooth Mouse/Touch & Scroll Parallax
        currentMouse.x += (targetMouse.x - currentMouse.x) * mouseEase;
        currentMouse.y += (targetMouse.y - currentMouse.y) * mouseEase;
        material.uniforms.mouse.value.copy(currentMouse);
        
        targetScroll = window.scrollY * 0.002; 
        currentScroll += (targetScroll - currentScroll) * 0.05; 
        material.uniforms.scrollOffset.value = currentScroll;
        
        // 3. Update Shader Time & Rendering
        shaderTime += delta * 0.001 * launchSpeed; // Applies the speed burst

        // --- THE FIX: Perfectly Seamless Loop Math ---
        // 40 * PI is the absolute lowest common multiple for the frequencies:
        // 0.15 (6 full cycles), 0.2 (8 cycles), 0.3 (12 cycles), 0.4 (16 cycles).
        // This stops the uniform from growing infinitely (preventing rough shapes)
        // while ensuring the time resets with ZERO visual lag or jumping.
        var maxTime = 40.0 * Math.PI;
        if (shaderTime >= maxTime) {
            shaderTime -= maxTime;
        }

        material.uniforms.time.value = shaderTime;
        material.uniforms.launchFlash.value = Math.max(0.0, launchFlash);

        renderer.render(scene, camera);
        requestAnimationFrame(raf);
    }

    // Start everything up
    requestAnimationFrame(raf);
    resize();

    // ─── REVEAL ANIMATIONS ───────────────────────────────────────────────────
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(function(el) {
        observer.observe(el);
    });

})();