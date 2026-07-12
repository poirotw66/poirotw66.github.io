/**
 * Homepage #writing: tab panels for editorial lanes.
 */
(function () {
  var ROOT_ID = 'home-writing-tabs';
  var DEFAULT_LANE = 'starter';

  function isHomePath() {
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    return path === '/' || path === '/en' || path === '/index.html' || path === '/en/index.html';
  }

  function laneFromHash() {
    var hash = window.location.hash.replace('#', '');
    if (hash.indexOf('writing-') === 0) {
      return hash.slice('writing-'.length);
    }
    return null;
  }

  function activateLane(root, laneId) {
    var tabs = root.querySelectorAll('.home-writing-tab');
    var panels = root.querySelectorAll('.home-writing-panel');

    tabs.forEach(function (tab) {
      var isActive = tab.getAttribute('data-lane') === laneId;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach(function (panel) {
      var isActive = panel.id === 'writing-' + laneId;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  }

  function init() {
    if (!isHomePath()) return;

    var root = document.getElementById(ROOT_ID);
    if (!root) return;

    var initialLane = laneFromHash() || DEFAULT_LANE;
    var hasPanel = Boolean(root.querySelector('#writing-' + initialLane));
    activateLane(root, hasPanel ? initialLane : DEFAULT_LANE);

    root.querySelectorAll('.home-writing-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var laneId = tab.getAttribute('data-lane');
        if (!laneId) return;
        activateLane(root, laneId);
        history.replaceState(null, '', '#writing-' + laneId);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
