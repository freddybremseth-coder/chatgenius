(function(){
  function initTour(root){
    var scenes=[].slice.call(root.querySelectorAll(".tour-scene"));
    var navs=[].slice.call(root.querySelectorAll(".tour-nav"));
    var progress=root.querySelector(".tour-progress");
    if(!scenes.length||!progress)return;
    var total=Number(root.dataset.duration||15000);
    var sceneMs=Math.max(1200,Math.floor(total/scenes.length));
    root.style.setProperty("--steps",scenes.length);
    root.style.setProperty("--scene-ms",sceneMs+"ms");
    var dots=scenes.map(function(_,i){var b=document.createElement("button");b.type="button";b.setAttribute("aria-label","Vis steg "+(i+1));b.addEventListener("click",function(){show(i,true)});progress.appendChild(b);return b});
    var index=0,timer=null,paused=false;
    var status=root.querySelector("[data-tour-status]");
    var toggle=root.querySelector("[data-tour-toggle]");
    var replay=root.querySelector("[data-tour-replay]");
    function clear(){if(timer){clearTimeout(timer);timer=null}}
    function schedule(){clear();if(paused||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;timer=setTimeout(function(){if(index<scenes.length-1){show(index+1,false)}else{paused=true;root.classList.add("paused");if(toggle)toggle.textContent="Spill av";if(status)status.textContent="15 sek · ferdig"}},sceneMs)}
    function show(i,manual){index=i;scenes.forEach(function(s,j){s.classList.toggle("active",j===i)});navs.forEach(function(n,j){n.classList.toggle("active",j===i)});dots.forEach(function(d,j){d.className=j<i?"done":j===i?"active":""});if(status)status.textContent="Steg "+(i+1)+" av "+scenes.length+" · "+Math.round(sceneMs/1000)+" sek";if(manual){paused=true;root.classList.add("paused");if(toggle)toggle.textContent="Fortsett"}else{root.classList.remove("paused")}schedule()}
    navs.forEach(function(n,i){n.addEventListener("click",function(){show(i,true)})});
    if(toggle)toggle.addEventListener("click",function(){paused=!paused;root.classList.toggle("paused",paused);toggle.textContent=paused?"Fortsett":"Pause";if(!paused){show(index,false)}else{clear()}});
    if(replay)replay.addEventListener("click",function(){paused=false;if(toggle)toggle.textContent="Pause";show(0,false)});
    show(0,false);
  }
  function initFeatures(){
    document.querySelectorAll("[data-feature-tabs]").forEach(function(wrap){
      var tabs=[].slice.call(wrap.querySelectorAll(".feature-tab"));
      var panels=[].slice.call(wrap.parentElement.querySelectorAll(".feature-panel"));
      tabs.forEach(function(tab){tab.addEventListener("click",function(){var id=tab.dataset.feature;tabs.forEach(function(t){t.classList.toggle("active",t===tab)});panels.forEach(function(p){p.classList.toggle("active",p.dataset.panel===id)})})});
    });
  }
  document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll(".tour").forEach(initTour);initFeatures()});
})();