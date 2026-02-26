---
layout: layouts/base.njk
title: Where To Find Us
description: Locations, hours, and a handy infographic to get you here.
seo_title: Where To Find Us — Find our pop-ups & events
 
---

<p class="lede">Come find us!</p>

<div style="display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap;">
  <div style="flex:1;min-width:260px;">
    <h2>Where we show up</h2>
    <ul>
      <li>
        <a href="#" onclick="showMap('Beals Old Port Portland Maine'); return false;" style="text-decoration:none; color:inherit;">
          <strong>Old Port Pop-Up:</strong>
        </a>
        <span>(Click for Map)</span>
        <ul>
          <li>Saturdays 10–1ish — Taking over Beals in the Old Port, this winter!.</li>
        </ul>
      </li>
      <li>
        <a href="#" onclick="showMap('Buzz Coffee Old Port Portland Maine'); return false;" style="text-decoration:none; color:inherit;">
          <strong>Buzz Coffee:</strong>
        </a>
        <span>(Click for Map)</span>
        <ul>
          <li>Bagels and bagel sandwiches as well as delicious coffee.</li>
        </ul>
      </li>
      <li>
        <a href="#" onclick="showMap('RattleShake South Portland Maine'); return false;" style="text-decoration:none; color:inherit;">
          <strong>South Portland Pop-Up:</strong>
        </a>
        <span>(Click for Map)</span>
        <ul>
          <li>Sundays 10–1ish — At RattleShake, in South Portland.</li>
        </ul>
      </li>
      <li>
        <strong>Special Events:</strong>
        <ul>
          <li>Follow us on Instagram for surprise drops.</li>
        </ul>
      </li>
    </ul>

    
  </div>

  <div style="flex:0 0 360px; text-align:center;">
    <h3>Latest Pop Up!</h3>
    <div id="visual-container" style="border:3px solid #000;box-shadow:0 6px 12px rgba(0,0,0,0.15); overflow:hidden; background:#eee;">
      <img id="static-infra" src="/assets/uploads/popup_infographic.png" alt="Map and times — where to find us" style="width:100%;height:auto;display:block;">
      <iframe id="map-frame" style="display:none; width:100%; height:450px; border:0;" frameborder="0" scrolling="no" marginheight="0" marginwidth="0"></iframe>
    </div>
  </div>
</div>

<script>
function showMap(address) {
  var img = document.getElementById('static-infra');
  var frame = document.getElementById('map-frame');
  // Use the older output=embed format which usually works without an API key for basic searches
  var url = "https://maps.google.com/maps?q=" + encodeURIComponent(address) + "&t=&z=15&ie=UTF8&iwloc=&output=embed";
  
  frame.src = url;
  img.style.display = 'none';
  frame.style.display = 'block';
}
</script>

<!-- map link behavior moved to `/src/assets/script.js` -->
