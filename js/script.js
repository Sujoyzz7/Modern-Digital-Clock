// Lightweight clock logic: update DOM, handle format & theme, timezone
(function(){
  const $ = id => document.getElementById(id);
  const hoursEl = $('hours');
  const minutesEl = $('minutes');
  const secondsEl = $('seconds');
  const ampmEl = $('ampm');
  const dateEl = $('date');
  const tzEl = $('tz');
  const formatBtn = $('formatBtn');
  const themeBtn = $('themeBtn');

  let use24 = localStorage.getItem('clock-format') === '24';
  let theme = localStorage.getItem('clock-theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyTheme(t){
    if(t === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
    themeBtn.setAttribute('aria-pressed', t === 'light');
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    localStorage.setItem('clock-theme', t);
  }

  function toggleTheme(){
    theme = document.body.classList.contains('light') ? 'dark' : 'light';
    applyTheme(theme);
  }

  function applyFormat(f24){
    use24 = !!f24;
    // button text explains the current mode
    formatBtn.textContent = use24 ? '24-hour' : '12-hour';
    formatBtn.setAttribute('aria-pressed', use24);
    formatBtn.setAttribute('aria-label', use24 ? 'Switch to 12-hour format' : 'Switch to 24-hour format');
    localStorage.setItem('clock-format', use24 ? '24' : '12');
  }

  function pad(n){return n.toString().padStart(2,'0')}

  function getTZDisplay(d){
    try{
      const z = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const offset = -d.getTimezoneOffset();
      const sign = offset >= 0 ? '+' : '-';
      const hh = Math.floor(Math.abs(offset)/60);
      const mm = Math.abs(offset)%60;
      return `${z} (GMT${sign}${pad(hh)}:${pad(mm)})`;
    }catch(e){
      return 'UTC';
    }
  }

  function formatDate(d){
    return new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(d);
  }

  let intervalId = null;
  let timeoutId = null;

  function clearTimers(){
    if(timeoutId){ clearTimeout(timeoutId); timeoutId = null }
    if(intervalId){ clearInterval(intervalId); intervalId = null }
  }

  function updateTime(){
    const now = new Date();
    let hrs = now.getHours();
    const mins = now.getMinutes();
    const secs = now.getSeconds();

    if(!use24){
      ampmEl.style.display = 'inline-block';
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      ampmEl.textContent = ampm;
      hrs = hrs % 12 || 12;
    } else {
      ampmEl.style.display = 'none';
    }

    hoursEl.textContent = pad(hrs);
    minutesEl.textContent = pad(mins);
    secondsEl.textContent = pad(secs);
    dateEl.textContent = formatDate(now);
    tzEl.textContent = getTZDisplay(now);

    // update title for quick glance/tab
    document.title = `${pad(hrs)}:${pad(mins)}${!use24 ? ' ' + ampmEl.textContent : ''} — Modern Digital Clock`;

    // subtle pulse animation on seconds, skip if user prefers reduced motion
    if(!reduceMotion && secondsEl.animate){
      secondsEl.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:600,easing:'ease-out'});
    }
  }

  function scheduleTick(){
    clearTimers();
    updateTime();
    const now = Date.now();
    const delay = 1000 - (now % 1000) + 2; // small buffer
    timeoutId = setTimeout(function(){
      updateTime();
      intervalId = setInterval(updateTime,1000);
    }, delay);
  }

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      clearTimers();
    } else {
      scheduleTick();
    }
  });

  // keyboard activation for accessibility (Enter / Space)
  function makeKeyboardClickable(el){
    el.addEventListener('keydown', (e)=>{
      if(e.key === ' ' || e.key === 'Enter'){
        e.preventDefault();
        el.click();
      }
    });
  }

  formatBtn.addEventListener('click', ()=> applyFormat(!use24));
  themeBtn.addEventListener('click', toggleTheme);
  makeKeyboardClickable(formatBtn);
  makeKeyboardClickable(themeBtn);

  // init
  applyFormat(use24);
  applyTheme(theme);
  scheduleTick();
})();
