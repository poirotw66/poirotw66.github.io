/**
 * Click-to-play YouTube: facade button, optional video iframe, or audio-style chrome (hidden player).
 */
(function () {
  'use strict';

  const CSS_HREF = '/css/youtube-facade.css';
  const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2 };

  let ytApiPromise = null;
  let facadeIdCounter = 0;

  function isEnglishUi() {
    return (document.documentElement.lang || '').toLowerCase().startsWith('en');
  }

  function ytCopy() {
    return isEnglishUi()
      ? { play: 'Play', pause: 'Pause', progress: 'Playback progress', playTitle: (title) => `Play: ${title}` }
      : { play: '播放', pause: '暫停', progress: '播放進度', playTitle: (title) => `播放：${title}` };
  }

  function ensureStyles() {
    if (document.querySelector(`link[href="${CSS_HREF}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    document.head.appendChild(link);
  }

  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }
    if (ytApiPromise) {
      return ytApiPromise;
    }
    ytApiPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') {
          previousReady();
        }
        resolve();
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    });
    return ytApiPromise;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '0:00';
    }
    const total = Math.floor(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function buildVideoIframe(videoId, title) {
    const iframe = document.createElement('iframe');
    iframe.className = 'youtube-facade-iframe';
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1`;
    iframe.title = title;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allowFullscreen = true;
    return iframe;
  }

  function createMediaIcon(state) {
    const icon = document.createElement('span');
    icon.className = 'youtube-media-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.dataset.state = state;
    return icon;
  }

  function setMediaIconState(icon, state) {
    icon.dataset.state = state;
  }

  function setTogglePlaying(toggle, icon, isPlaying) {
    const copy = ytCopy();
    toggle.classList.toggle('is-playing', isPlaying);
    toggle.setAttribute('aria-label', isPlaying ? copy.pause : copy.play);
    setMediaIconState(icon, isPlaying ? 'pause' : 'play');
  }

  function mountAudioPlayer(host, videoId, title) {
    const copy = ytCopy();
    host.classList.remove('youtube-facade--has-poster');
    host.classList.add('youtube-facade--audio');

    const shell = document.createElement('div');
    shell.className = 'youtube-audio-player';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'youtube-audio-toggle';
    toggle.setAttribute('aria-label', copy.play);
    const toggleIcon = createMediaIcon('play');
    toggle.appendChild(toggleIcon);

    const scrub = document.createElement('input');
    scrub.type = 'range';
    scrub.className = 'youtube-audio-scrub';
    scrub.min = '0';
    scrub.max = '1000';
    scrub.value = '0';
    scrub.setAttribute('aria-label', copy.progress);

    const time = document.createElement('span');
    time.className = 'youtube-audio-time';
    time.textContent = '0:00 / --:--';

    const label = document.createElement('span');
    label.className = 'youtube-audio-label';
    label.textContent = title;

    const hidden = document.createElement('div');
    hidden.className = 'youtube-audio-player-hidden';
    const mountId = `youtube-audio-mount-${++facadeIdCounter}`;
    const mount = document.createElement('div');
    mount.id = mountId;
    hidden.appendChild(mount);

    shell.append(toggle, scrub, time, label, hidden);
    host.replaceChildren(shell);

    let player = null;
    let tickId = null;
    let scrubbing = false;

    function stopTick() {
      if (tickId !== null) {
        clearInterval(tickId);
        tickId = null;
      }
    }

    function syncUi() {
      if (!player || typeof player.getCurrentTime !== 'function') {
        return;
      }
      const current = player.getCurrentTime();
      const duration = player.getDuration();
      if (!scrubbing && duration > 0) {
        scrub.value = String(Math.round((current / duration) * 1000));
      }
      time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
    }

    function startTick() {
      stopTick();
      tickId = window.setInterval(syncUi, 400);
    }

    toggle.addEventListener('click', () => {
      if (!player) {
        return;
      }
      const state = player.getPlayerState();
      if (state === YT_STATE.PLAYING) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    });

    scrub.addEventListener('pointerdown', () => {
      scrubbing = true;
    });
    scrub.addEventListener('pointerup', () => {
      scrubbing = false;
    });
    scrub.addEventListener('input', () => {
      if (!player) {
        return;
      }
      const duration = player.getDuration();
      if (duration > 0) {
        const next = (Number(scrub.value) / 1000) * duration;
        player.seekTo(next, true);
        syncUi();
      }
    });

    loadYouTubeApi().then(() => {
      player = new window.YT.Player(mountId, {
        videoId,
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            syncUi();
          },
          onStateChange: (event) => {
            const playing = event.data === YT_STATE.PLAYING;
            setTogglePlaying(toggle, toggleIcon, playing);
            if (playing) {
              startTick();
            } else {
              stopTick();
              syncUi();
            }
            if (event.data === YT_STATE.ENDED) {
              setTogglePlaying(toggle, toggleIcon, false);
            }
          },
        },
      });
    });
  }

  function initFacade(host) {
    if (host.dataset.youtubeFacadeReady === 'true') {
      return;
    }
    host.dataset.youtubeFacadeReady = 'true';

    const videoId = host.getAttribute('data-video-id');
    const title = host.getAttribute('data-title') || 'YouTube video';
    const poster = host.getAttribute('data-poster');
    const mode = host.getAttribute('data-mode') || 'audio';

    if (!videoId) {
      return;
    }

    host.classList.add('youtube-facade');
    if (poster) {
      host.style.setProperty('--yt-facade-poster', `url("${poster}")`);
      host.classList.add('youtube-facade--has-poster');
    }

    const copy = ytCopy();
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'youtube-facade-play';
    button.setAttribute('aria-label', copy.playTitle(title));

    const icon = createMediaIcon('play');
    icon.classList.add('youtube-media-icon--facade');

    const label = document.createElement('span');
    label.className = 'youtube-facade-play-label';
    label.textContent = host.getAttribute('data-play-label') || copy.play;

    button.append(icon, label);
    host.appendChild(button);

    button.addEventListener('click', () => {
      if (mode === 'video') {
        host.classList.remove('youtube-facade--has-poster');
        host.classList.add('youtube-facade--video');
        host.replaceChildren(buildVideoIframe(videoId, title));
        return;
      }
      mountAudioPlayer(host, videoId, title);
    });
  }

  function initAll() {
    const hosts = document.querySelectorAll('[data-youtube-facade]');
    if (hosts.length === 0) {
      return;
    }
    ensureStyles();
    hosts.forEach(initFacade);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
