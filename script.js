(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");
  root.classList.add("js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);

  const forceReadable = () => {
    document
      .querySelectorAll(
        ".intro-line, .sentence-stack > *, .ocean-copy > *, .fun-copy > *, .fun-token, .fun-reply, .final-copy > *",
      )
      .forEach((element) => {
        element.style.opacity = "1";
        element.style.transform = "none";
      });

    document.querySelectorAll(".letter-copy p").forEach((paragraph) => {
      paragraph.style.setProperty("--reveal", "1");
    });
  };

  const setupSound = () => {
    const button = document.querySelector(".sound-toggle");
    const audio = document.querySelector("#ambientAudio");

    if (!button || !audio) return;

    audio.muted = false;
    audio.volume = 0;
    audio.load();

    const setPressed = (pressed) => {
      button.setAttribute("aria-pressed", String(pressed));
      button.setAttribute("aria-label", pressed ? "Turn ambient sound off" : "Turn ambient sound on");
    };

    const fadeIn = () => {
      audio.volume = 0;
      const target = 0.78;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 900);
        audio.volume = target * progress;
        if (progress < 1 && !audio.paused) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const stopAudio = () => {
      audio.pause();
      audio.volume = 0;
      stopFallbackPad();
      setPressed(false);
    };

    let isStarting = false;
    let pointerStartedAudio = false;
    let fallbackContext;
    let fallbackGain;

    function stopFallbackPad() {
      if (!fallbackContext || !fallbackGain) return;

      const now = fallbackContext.currentTime;
      fallbackGain.gain.cancelScheduledValues(now);
      fallbackGain.gain.setValueAtTime(fallbackGain.gain.value, now);
      fallbackGain.gain.linearRampToValueAtTime(0, now + 0.22);
    }

    const startFallbackPad = async () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error("audio-context-unavailable");

      if (!fallbackContext) {
        fallbackContext = new AudioContext();
        fallbackGain = fallbackContext.createGain();
        const filter = fallbackContext.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 920;
        filter.Q.value = 0.7;

        fallbackGain.gain.value = 0;
        fallbackGain.connect(filter);
        filter.connect(fallbackContext.destination);

        [196, 246.94, 329.63].forEach((frequency, index) => {
          const oscillator = fallbackContext.createOscillator();
          const voiceGain = fallbackContext.createGain();
          oscillator.type = index === 1 ? "triangle" : "sine";
          oscillator.frequency.value = frequency;
          oscillator.detune.value = index === 2 ? -8 : 0;
          voiceGain.gain.value = index === 0 ? 0.12 : 0.07;
          oscillator.connect(voiceGain);
          voiceGain.connect(fallbackGain);
          oscillator.start();
        });
      }

      await fallbackContext.resume();

      const now = fallbackContext.currentTime;
      fallbackGain.gain.cancelScheduledValues(now);
      fallbackGain.gain.setValueAtTime(fallbackGain.gain.value, now);
      fallbackGain.gain.linearRampToValueAtTime(0.2, now + 0.8);
    };

    const startAudio = async () => {
      if (isStarting || button.getAttribute("aria-pressed") === "true") return;

      isStarting = true;
      button.removeAttribute("data-sound-error");

      try {
        audio.muted = false;
        audio.volume = 0;
        await audio.play();
        fadeIn();
        setPressed(true);
      } catch (error) {
        try {
          await startFallbackPad();
          setPressed(true);
          button.setAttribute("data-sound-error", `file-${error?.name || "play-failed"}`);
        } catch (fallbackError) {
          stopAudio();
          button.setAttribute(
            "data-sound-error",
            `${error?.name || "play-failed"}-${fallbackError?.name || fallbackError?.message || "fallback-failed"}`,
          );
        }
      } finally {
        isStarting = false;
      }
    };

    const handleStartGesture = () => {
      const isPlaying = button.getAttribute("aria-pressed") === "true";
      if (isPlaying) return;

      pointerStartedAudio = true;
      startAudio();
    };

    button.addEventListener("pointerdown", handleStartGesture);
    button.addEventListener("touchstart", handleStartGesture, { passive: true });

    button.addEventListener("click", () => {
      if (pointerStartedAudio) {
        pointerStartedAudio = false;
        return;
      }

      const isPlaying = button.getAttribute("aria-pressed") === "true";
      if (isPlaying) stopAudio();
      else startAudio();
    });
  };

  const setupStars = () => {
    const field = document.querySelector(".star-field");
    const scene = document.querySelector(".scene-stars");
    const button = document.querySelector(".missing-star-button");
    const burst = document.querySelector(".star-burst");

    if (!field || !scene || !button) return;

    let seed = 93;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 62; i += 1) {
      const x = 5 + random() * 90;
      const y = 5 + random() * 72;
      if (Math.abs(x - 54) < 8 && Math.abs(y - 38) < 8) {
        i -= 1;
        continue;
      }

      const star = document.createElement("span");
      star.className = "star";
      star.style.setProperty("--x", `${x.toFixed(2)}%`);
      star.style.setProperty("--y", `${y.toFixed(2)}%`);
      star.style.setProperty("--s", `${(1.5 + random() * 3.5).toFixed(2)}px`);
      star.style.setProperty("--d", `${(-random() * 4).toFixed(2)}s`);
      field.appendChild(star);
    }

    let burstTimer;

    const showJoyBurst = () => {
      if (!burst) return;

      const colors = ["#fff4a8", "#f9d7e4", "#bff3f8", "#dcd4ff", "#ffffff"];
      burst.innerHTML = "";

      for (let i = 0; i < 42; i += 1) {
        const angle = (Math.PI * 2 * i) / 42 + random() * 0.35;
        const distance = 74 + random() * 112;
        const particle = document.createElement("span");
        particle.className = i % 4 === 0 ? "joy-particle star-piece" : "joy-particle";
        particle.style.setProperty("--dx", `${(Math.cos(angle) * distance).toFixed(1)}px`);
        particle.style.setProperty("--dy", `${(Math.sin(angle) * distance).toFixed(1)}px`);
        particle.style.setProperty("--size", `${(6 + random() * 9).toFixed(1)}px`);
        particle.style.setProperty("--spin", `${(180 + random() * 360).toFixed(0)}deg`);
        particle.style.setProperty("--color", colors[i % colors.length]);
        particle.style.animationDelay = `${(random() * 120).toFixed(0)}ms`;
        burst.appendChild(particle);
      }

      scene.classList.remove("star-celebrating");
      void scene.offsetWidth;
      scene.classList.add("star-celebrating");
      clearTimeout(burstTimer);
      burstTimer = window.setTimeout(() => {
        scene.classList.remove("star-celebrating");
        burst.innerHTML = "";
      }, 1400);
    };

    const lightStar = () => {
      scene.classList.add("star-lit");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Celebrate Ummehani's star again");
      showJoyBurst();
    };

    button.addEventListener("click", lightStar);
  };

  const setupFun = () => {
    const board = document.querySelector(".fun-board");
    const reply = document.querySelector(".fun-reply");
    const tokens = [...document.querySelectorAll(".fun-token")];

    if (!board || !reply || tokens.length === 0) return;

    tokens.forEach((token) => {
      token.addEventListener("click", () => {
        tokens.forEach((item) => item.classList.remove("is-selected"));
        token.classList.add("is-selected");
        reply.textContent = token.dataset.reply || "";
        board.classList.remove("fun-pop");
        void board.offsetWidth;
        board.classList.add("fun-pop");
      });
    });
  };

  const setupAnimations = () => {
    if (!hasGsap || reducedMotion) {
      forceReadable();
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      const lenis = new Lenis({
        duration: 1.12,
        smoothWheel: true,
        smoothTouch: false,
        wheelMultiplier: 0.9,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      });

      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .to(".intro-line-first", { opacity: 1, y: 0, duration: 1.15, delay: 0.35 })
      .to(".intro-line-first", { opacity: 0.36, duration: 0.85, delay: 1.05 })
      .to(".intro-line-second", { opacity: 1, y: 0, duration: 1.1 }, "-=0.12")
      .fromTo(".swipe-cue", { opacity: 0 }, { opacity: 0.78, duration: 0.8 }, "-=0.2");

    gsap.fromTo(
      ".crack",
      { scaleY: 0, opacity: 0 },
      {
        scaleY: 1,
        opacity: 0.82,
        stagger: 0.16,
        duration: 1.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".scene-crack",
          start: "top 62%",
          end: "center 38%",
          scrub: 0.8,
        },
      },
    );

    gsap.to(".sentence-stack > *", {
      opacity: 1,
      y: 0,
      stagger: 0.24,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".sentence-stack",
        start: "top 74%",
      },
    });

    gsap.fromTo(
      ".scene-wrong h2",
      { opacity: 0, scale: 0.98 },
      {
        opacity: 1,
        scale: 1,
        duration: 1.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".scene-wrong",
          start: "top 64%",
        },
      },
    );

    document.querySelectorAll(".letter-copy p").forEach((paragraph) => {
      gsap.to(paragraph, {
        "--reveal": 1,
        ease: "none",
        scrollTrigger: {
          trigger: paragraph,
          start: "top 86%",
          end: "bottom 46%",
          scrub: true,
        },
      });
    });

    gsap.fromTo(
      ".missing-star-button",
      { opacity: 0, scale: 0.78 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".scene-stars",
          start: "top 55%",
        },
      },
    );

    gsap.to(".paper-boat", {
      x: "42vw",
      y: -12,
      rotate: 4,
      ease: "none",
      scrollTrigger: {
        trigger: ".scene-ocean",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(".ocean-copy > *", {
      opacity: 1,
      y: 0,
      stagger: 0.22,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".ocean-copy",
        start: "top 76%",
      },
    });

    gsap.to(".fun-copy > *, .fun-token, .fun-reply", {
      opacity: 1,
      y: 0,
      stagger: 0.14,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".scene-fun",
        start: "top 72%",
      },
    });

    gsap.to(".final-copy > *", {
      opacity: 1,
      y: 0,
      stagger: 0.75,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".scene-final",
        start: "top 68%",
      },
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  };

  setupSound();
  setupStars();
  setupFun();
  setupAnimations();
})();
