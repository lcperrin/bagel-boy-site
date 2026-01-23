(()=>{
  const y=document.getElementById("year");
  if(y) y.textContent=new Date().getFullYear();

  // Drop CTA logic
  const dropBtn = document.getElementById('dropBtn');
  const dropStatus = document.getElementById('dropStatus');
  const memeDisplay = document.getElementById('memeDisplay');

  // Fetch meme config
  let memeConfig = {
    memes: {
      yes: 'celebrate',
      no: 'sad',
      today: 'excite'
    },
    activeOption: 'no'
  };
  async function updateDrop() {
    // Try to fetch activeOption from environment endpoint
    let envOption = null;
    try {
      const envRes = await fetch('/env.json?' + Date.now());
      const envData = await envRes.json();
      if(envData && envData.activeOption) envOption = envData.activeOption;
    } catch {}
    const option = envOption || memeConfig.activeOption;
    let statusText = '';
    let memeType = '';
    switch (option) {
      case 'now':
        statusText = 'Drop is now';
        memeType = memeConfig.memes['now'] || 'excite';
        break;
      case 'no':
        statusText = 'No drop today';
        memeType = memeConfig.memes['no'] || 'sad';
        break;
      case 'yes':
        statusText = 'Drop is today!';
        memeType = memeConfig.memes['yes'] || 'celebrate';
        break;
      default:
        statusText = 'No drop today';
        memeType = memeConfig.memes['no'] || 'sad';
    }
    let memeUrl = '';
    try {
      const res = await fetch(`https://api.imgflip.com/get_memes`);
      const data = await res.json();
      if(data.success && data.data && data.data.memes) {
        // Find all memes whose name includes the memeType
        const matches = data.data.memes.filter(m => m.name.toLowerCase().includes(memeType));
        if(matches.length > 0) {
          const randomIdx = Math.floor(Math.random() * matches.length);
          memeUrl = matches[randomIdx].url;
        } else {
          memeUrl = data.data.memes[Math.floor(Math.random() * data.data.memes.length)].url;
        }
      }
    } catch(e) {}

    // Open new page with menu bar, H1 status, and meme
    const menuBar = document.querySelector('.site-nav')?.outerHTML || '';
    const win = window.open('', '_blank');
    if(win) {
      win.document.write(`<!DOCTYPE html><html lang="en"><head><title>Drop Status</title><link rel="stylesheet" href="/assets/styles.css"></head><body>`);
      win.document.write(`<header class="site-header" role="banner"><div class="topbar wrap"><a href="/" class="brand">Big Boy Bread</a>${menuBar}</div></header>`);
  win.document.write(`<main style="text-align:center;"><h1>${statusText}</h1>${memeUrl ? `<img src="${memeUrl}" alt="${memeType} meme" style="max-width:400px;">` : '<span>No meme found</span>'}<p style="font-size:0.9em;color:#888;margin-top:1em;">Memes are randomly selected from the search term: <strong>${memeType}</strong></p></main>`);
      win.document.write(`</body></html>`);
      win.document.close();
    }
  }
  fetch('/drop-config.json')
    .then(r => r.ok ? r.json() : memeConfig)
    .then(cfg => { memeConfig = cfg; })
    .catch(() => {});

  if(dropBtn) {
    dropBtn.addEventListener('click', async () => {
      // Always fetch the latest config before generating meme
      try {
        const r = await fetch('/drop-config.json?' + Date.now());
        memeConfig = await r.json();
      } catch {}
      await updateDrop();
    });
  }
})();

// Map links: move page-specific map-link behavior here so it's available globally
(function(){
  function initMapLinks(){
    var links = document.querySelectorAll('.map-link');
    var iframe = document.getElementById('mapFrame');
    if(!links || links.length === 0 || !iframe) return;
    links.forEach(function(link){
      link.addEventListener('click', function(e){
        e.preventDefault();
        var q = this.getAttribute('data-q') || this.textContent;
        iframe.src = 'https://www.google.com/maps?q=' + encodeURIComponent(q) + '&output=embed';
        links.forEach(function(l){ l.style.fontWeight = ''; });
        this.style.fontWeight = '700';
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initMapLinks);
  } else {
    initMapLinks();
  }
})();