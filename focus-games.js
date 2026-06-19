/* ============================================
   FOCUS MODE GAME REWARD SYSTEM
   ============================================ */

// ─── QUESTIONS (exact copy from param branch) ───
const duelQuestions = [
  { id:1, prompt:"What is the spell for unlocking doors?", options:["Expelliarmus","Lumos","Alohomora","Avada Kedavra"], answer:2 },
  { id:2, prompt:"What is the core of Harry's wand?", options:["Dragon heartstring","Phoenix feather","Unicorn hair","Thestral tail"], answer:1 },
  { id:3, prompt:"What house is Hermione in?", options:["Slytherin","Gryffindor","Hufflepuff","Ravenclaw"], answer:1 },
  { id:4, prompt:"What is the Petrificus Totalus spell used for?", options:["Stun","Full body-bind","Levitation","Fireball"], answer:1 },
  { id:5, prompt:"Which potion makes you lucky?", options:["Polyjuice","Felix Felicis","Amortentia","Veritaserum"], answer:1 },
];
const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ"];
const OPT_COLORS = ["#f59e0b","#8b5cf6","#ef4444","#3b82f6"];

// ─── DUEL STATE ───
let duel = { harryXP:100, voldemortXP:100, currentIndex:0, feedback:"", isGameOver:false, winner:"", attack:"none", boltProgress:0, showBolt:false, hitTarget:"none", screenShake:false, selectedOption:null, isCorrect:null, comboCount:0, showCombo:false, roundFlash:false };

// ─── REWARD CHOICE ───
function showRewardChoice() {
  document.getElementById('rewardChoiceOverlay').classList.add('active');
}
function hideRewardChoice() {
  document.getElementById('rewardChoiceOverlay').classList.remove('active');
}
function startBreakFromReward() {
  hideRewardChoice();
  // Original break logic from focus.html
  isBreakTime = true;
  timeLeft = 5 * 60;
  sessionEndTs = Date.now() + (timeLeft * 1000);
  updateTimeDisplay();
  timeSubtext.textContent = "Break time! Relax...";
  timerInterval = setInterval(timerTick, 1000);
  isRunning = true;
  timerCircle.classList.add('active');
  updatePlayBtnUI();
  if (typeof syncFocusSessionState === 'function') syncFocusSessionState();
}
function skipTimerForDemo() {
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isBreakTime = false;
  sessionEndTs = null;
  timerCircle.classList.remove('active');
  updatePlayBtnUI();
  timeLeft = 0;
  updateTimeDisplay();
  timeSubtext.textContent = "Session complete!";
  showMascotMessage("Great job! You earned a reward! 🎉", 5050);
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Focus Session Complete!", { body: "Choose your reward." });
  }
  if (typeof syncFocusSessionState === 'function') syncFocusSessionState();
  setTimeout(() => showRewardChoice(), 800);
}
function returnToFocusMode() {
  hideRewardChoice();
  document.getElementById('wizardDuelOverlay').classList.remove('active');
  document.getElementById('flappyBirdOverlay').classList.remove('active');
  document.getElementById('spiderVenomOverlay').classList.remove('active');
  cleanupFlappy();
  cleanupSpiderVenomGame();
  // Reset focus timer
  clearInterval(timerInterval);
  timerInterval = null;
  isRunning = false;
  isBreakTime = false;
  sessionEndTs = null;
  setDuration(currentDuration);
  timerCircle.classList.remove('active');
  updatePlayBtnUI();
  timeSubtext.textContent = "Ready to focus?";
  showMascotMessage("Let's go! 💪", 2000);
  if (typeof syncFocusSessionState === 'function') syncFocusSessionState();
}

// ─── WIZARD DUEL: BUILD UI ───
function buildDuelUI() {
  const ov = document.getElementById('wizardDuelOverlay');
  ov.innerHTML = `
  <button class="duel-return-btn" onclick="returnToFocusMode()">← Return to Focus</button>
  <div id="duelRoot" style="min-height:100vh;padding-bottom:9rem;position:relative;overflow:hidden">
    <div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 30%,rgba(0,0,0,0) 40%,rgba(0,0,0,0.5) 100%)"></div>
    <div id="duelRunes" style="position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0"></div>
    <div id="duelFlash" style="display:none;position:fixed;inset:0;z-index:50;pointer-events:none"></div>
    <div style="max-width:72rem;margin:0 auto;padding:16px 16px 0;position:relative;z-index:10">
      <div style="text-align:center;margin-bottom:24px">
        <h1 style="font-size:2.5rem;font-weight:900;background-image:linear-gradient(90deg,#fbbf24,#f59e0b,#fff,#f59e0b,#fbbf24);background-size:200% auto;animation:duel-title-shimmer 4s linear infinite;-webkit-background-clip:text;background-clip:text;color:transparent;display:inline-block;filter:drop-shadow(0 2px 8px rgba(245,158,11,0.4))">⚡ Wizard Duel ⚡</h1>
        <p style="font-size:12px;color:rgba(245,158,11,0.4);font-weight:600;letter-spacing:.3em;text-transform:uppercase;margin-top:4px">Answer correctly to cast spells</p>
      </div>
      <div class="duel-arena" id="duelArena">
        <div style="position:absolute;left:50%;top:45%;transform:translate(-50%,-50%);z-index:40;pointer-events:none">
          <div class="duel-vs-ring-anim" style="position:absolute;inset:0;border-radius:50%;border:2px solid rgba(245,158,11,0.3)"></div>
          <div class="duel-vs-pulse" style="width:64px;height:64px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f59e0b,#d97706,#b45309);border:3px solid rgba(251,191,36,0.6);position:relative">
            <div style="position:absolute;inset:3px;border-radius:50%;background:linear-gradient(180deg,rgba(255,255,255,0.15),transparent 50%)"></div>
            <span style="font-size:1.25rem;font-weight:900;color:rgba(0,0,0,0.9);position:relative;z-index:10">VS</span>
          </div>
        </div>
        <div id="duelBolt" style="display:none;position:absolute;inset:0;z-index:30;pointer-events:none"></div>
        <div class="duel-char-grid">
          <div id="harryCard" style="position:relative">
            <div class="duel-pulse-aura" style="position:absolute;inset:-16px;border-radius:24px;pointer-events:none;background:radial-gradient(ellipse at 50% 60%,rgba(52,211,153,0.15),transparent 70%)"></div>
            <div id="harryHitEl" style="display:none"></div>
            <div id="harryCardInner" class="duel-char-card" style="background:linear-gradient(180deg,rgba(52,211,153,0.08),rgba(0,0,0,0.7));border:1px solid rgba(52,211,153,0.2)">
              <div id="harryImgWrap" class="duel-char-img-wrap duel-float">
                <img src="harry.png" alt="Harry Potter" id="harryImg" class="duel-char-img" style="filter:drop-shadow(0 0 12px rgba(52,211,153,0.3))">
                <div id="harryParticles" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>
              </div>
              <div style="padding:8px 16px 16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <h2 style="font-size:1rem;font-weight:900;color:#6ee7b7;text-shadow:0 0 12px rgba(52,211,153,0.4)">Harry Potter</h2>
                  <div id="harryHPLabel" style="font-size:10px;font-weight:900;padding:4px 10px;border-radius:9999px;background:rgba(52,211,153,0.2);color:#6ee7b7;border:1px solid rgba(52,211,153,0.3)">100 HP</div>
                </div>
                <div class="duel-hp-track"><div id="harryHPBar" class="duel-hp-fill" style="width:100%;background:linear-gradient(90deg,#059669,#34d399,#6ee7b7);box-shadow:0 0 10px rgba(52,211,153,0.5)"><div class="duel-hp-shine"></div></div></div>
              </div>
            </div>
          </div>
          <div id="voldCard" style="position:relative">
            <div class="duel-pulse-aura" style="position:absolute;inset:-16px;border-radius:24px;pointer-events:none;background:radial-gradient(ellipse at 50% 60%,rgba(239,68,68,0.15),transparent 70%);animation-delay:1.5s"></div>
            <div id="voldHitEl" style="display:none"></div>
            <div id="voldCardInner" class="duel-char-card" style="background:linear-gradient(180deg,rgba(239,68,68,0.08),rgba(0,0,0,0.7));border:1px solid rgba(239,68,68,0.2)">
              <div id="voldImgWrap" class="duel-char-img-wrap duel-float" style="animation-delay:1.5s">
                <img src="voldemort.png" alt="Voldemort" id="voldImg" class="duel-char-img" style="filter:drop-shadow(0 0 12px rgba(239,68,68,0.3))">
                <div id="voldParticles" style="position:absolute;inset:0;pointer-events:none;overflow:hidden"></div>
              </div>
              <div style="padding:8px 16px 16px">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                  <h2 style="font-size:1rem;font-weight:900;color:#fca5a5;text-shadow:0 0 12px rgba(239,68,68,0.4)">Voldemort</h2>
                  <div id="voldHPLabel" style="font-size:10px;font-weight:900;padding:4px 10px;border-radius:9999px;background:rgba(239,68,68,0.2);color:#fca5a5;border:1px solid rgba(239,68,68,0.3)">100 HP</div>
                </div>
                <div class="duel-hp-track"><div id="voldHPBar" class="duel-hp-fill" style="width:100%;background:linear-gradient(90deg,#dc2626,#ef4444,#fca5a5);box-shadow:0 0 10px rgba(239,68,68,0.5)"><div class="duel-hp-shine"></div></div></div>
              </div>
            </div>
          </div>
        </div>
        <div id="duelCombo" style="display:none;position:absolute;top:16px;left:50%;transform:translateX(-50%);z-index:50;pointer-events:none"></div>
      </div>
      <div id="duelFeedback" class="duel-feedback" style="background:rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.06)">
        <p id="duelFeedbackText" style="font-size:14px;font-weight:700;color:#6B7280">🪄 Choose wisely to cast your spell...</p>
      </div>
      <div class="duel-q-card">
        <div style="padding:14px 20px;display:flex;align-items:center;gap:12px;background:linear-gradient(90deg,rgba(245,158,11,0.08),transparent);border-bottom:1px solid rgba(245,158,11,0.08)">
          <div style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 2px 8px rgba(245,158,11,0.3)"><span style="font-size:14px;font-weight:900;color:#000">?</span></div>
          <h3 style="font-size:14px;font-weight:700;color:rgba(245,158,11,0.8)">Cast Your Spell</h3>
          <span id="duelRound" style="margin-left:auto;font-size:10px;font-weight:900;color:#4B5563;letter-spacing:.15em;text-transform:uppercase">Round 1/5</span>
        </div>
        <div style="padding:16px 20px">
          <p id="duelQuestion" style="font-size:1rem;color:rgba(255,255,255,0.9);font-weight:600;line-height:1.6;margin-bottom:20px"></p>
          <div id="duelOptions" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>
        </div>
      </div>
      <div id="duelGameOver" style="display:none"></div>
    </div>
  </div>`;
  generateRunes();
  generateParticles('harryParticles','#34d399');
  generateParticles('voldParticles','#ef4444');
}

function generateRunes(){
  const c=document.getElementById('duelRunes'); if(!c) return; c.innerHTML='';
  for(let i=0;i<12;i++){
    const s=document.createElement('span');
    s.className='duel-rune-float';
    s.textContent=RUNES[Math.floor(Math.random()*RUNES.length)];
    const x=Math.random()*100,y=Math.random()*100,sz=Math.random()*14+10,del=Math.random()*6,dur=Math.random()*8+6,op=Math.random()*0.15+0.05;
    Object.assign(s.style,{position:'absolute',left:x+'%',top:y+'%',fontSize:sz+'px',opacity:op,color:'#f59e0b',textShadow:'0 0 8px rgba(245,158,11,0.4)',animationDelay:del+'s','--dur':dur+'s'});
    c.appendChild(s);
  }
}
function generateParticles(containerId,color){
  const c=document.getElementById(containerId); if(!c) return; c.innerHTML='';
  for(let i=0;i<10;i++){
    const d=document.createElement('div');
    d.className='duel-sparkle';
    const x=Math.random()*80-40,y=Math.random()*80-40,sz=Math.random()*4+2,del=Math.random()*3,dur=Math.random()*2+1.5;
    Object.assign(d.style,{position:'absolute',borderRadius:'50%',width:sz+'px',height:sz+'px',background:color,boxShadow:`0 0 ${sz*3}px ${color}`,left:`calc(50% + ${x}px)`,top:`calc(40% + ${y}px)`,animationDelay:del+'s','--dur':dur+'s'});
    c.appendChild(d);
  }
}

// ─── DUEL: RENDER ───
function renderDuelQuestion(){
  const q=duelQuestions[duel.currentIndex];
  document.getElementById('duelQuestion').textContent=q.prompt;
  document.getElementById('duelRound').textContent=`Round ${(duel.currentIndex%duelQuestions.length)+1}/${duelQuestions.length}`;
  const optC=document.getElementById('duelOptions');
  optC.innerHTML='';
  q.options.forEach((opt,idx)=>{
    const btn=document.createElement('button');
    btn.className='duel-opt-btn duel-option-enter';
    btn.style.animationDelay=`${idx*0.05}s`;
    btn.disabled=duel.showBolt||duel.isGameOver;
    btn.innerHTML=`<span class="duel-opt-letter" style="background:rgba(255,255,255,0.06);color:${OPT_COLORS[idx]}">${String.fromCharCode(65+idx)}</span><span>${opt}</span>`;
    btn.onclick=()=>handleDuelAnswer(idx);
    btn.onmouseenter=()=>{ if(duel.selectedOption===null){btn.style.borderColor=OPT_COLORS[idx]+'40';btn.style.background=OPT_COLORS[idx]+'08';}};
    btn.onmouseleave=()=>{ if(duel.selectedOption===null){btn.style.borderColor='rgba(255,255,255,0.06)';btn.style.background='rgba(255,255,255,0.03)';}};
    optC.appendChild(btn);
  });
}

function updateDuelHP(){
  const hBar=document.getElementById('harryHPBar'),vBar=document.getElementById('voldHPBar');
  const hLbl=document.getElementById('harryHPLabel'),vLbl=document.getElementById('voldHPLabel');
  const hp=duel.harryXP,vp=duel.voldemortXP;
  hBar.style.width=hp+'%';
  hBar.style.background=hp>50?'linear-gradient(90deg,#059669,#34d399,#6ee7b7)':hp>25?'linear-gradient(90deg,#d97706,#f59e0b,#fcd34d)':'linear-gradient(90deg,#dc2626,#ef4444,#fca5a5)';
  hBar.style.boxShadow=`0 0 10px ${hp>50?'rgba(52,211,153,0.5)':hp>25?'rgba(245,158,11,0.5)':'rgba(239,68,68,0.5)'}`;
  hLbl.textContent=hp+' HP';
  hLbl.style.background=hp>50?'rgba(52,211,153,0.2)':hp>25?'rgba(251,191,36,0.2)':'rgba(239,68,68,0.2)';
  hLbl.style.color=hp>50?'#6ee7b7':hp>25?'#fcd34d':'#fca5a5';
  hLbl.style.borderColor=hp>50?'rgba(52,211,153,0.3)':hp>25?'rgba(251,191,36,0.3)':'rgba(239,68,68,0.3)';

  vBar.style.width=vp+'%';
  vBar.style.background=vp>50?'linear-gradient(90deg,#dc2626,#ef4444,#fca5a5)':vp>25?'linear-gradient(90deg,#d97706,#f59e0b,#fcd34d)':'linear-gradient(90deg,#059669,#34d399,#6ee7b7)';
  vBar.style.boxShadow=`0 0 10px ${vp>50?'rgba(239,68,68,0.5)':vp>25?'rgba(245,158,11,0.5)':'rgba(52,211,153,0.5)'}`;
  vLbl.textContent=vp+' HP';
  vLbl.style.background=vp>50?'rgba(239,68,68,0.2)':vp>25?'rgba(251,191,36,0.2)':'rgba(52,211,153,0.2)';
  vLbl.style.color=vp>50?'#fca5a5':vp>25?'#fcd34d':'#6ee7b7';
  vLbl.style.borderColor=vp>50?'rgba(239,68,68,0.3)':vp>25?'rgba(251,191,36,0.3)':'rgba(52,211,153,0.3)';
}

function updateDuelFeedback(){
  const el=document.getElementById('duelFeedback'),txt=document.getElementById('duelFeedbackText');
  const f=duel.feedback;
  if(f.includes('Expelliarmus')){
    el.style.background='linear-gradient(90deg,rgba(52,211,153,0.15),rgba(0,0,0,0.6))';
    el.style.borderColor='rgba(52,211,153,0.2)'; txt.style.color='#6ee7b7';
  } else if(f.includes('Voldemort')){
    el.style.background='linear-gradient(90deg,rgba(239,68,68,0.15),rgba(0,0,0,0.6))';
    el.style.borderColor='rgba(239,68,68,0.2)'; txt.style.color='#fca5a5';
  } else {
    el.style.background='rgba(0,0,0,0.5)'; el.style.borderColor='rgba(255,255,255,0.06)'; txt.style.color='#6B7280';
  }
  txt.textContent=f||'🪄 Choose wisely to cast your spell...';
}

// ─── DUEL: BOLT ANIMATION ───
function animateDuelBolt(attacker){
  duel.attack=attacker; duel.showBolt=true; duel.boltProgress=0;
  const boltC=document.getElementById('duelBolt'); boltC.style.display='block';
  const isH=attacker==='harry';
  let start=null; const duration=450;
  function animate(ts){
    if(!start) start=ts;
    const elapsed=ts-start, progress=Math.min(elapsed/duration,1), eased=1-Math.pow(1-progress,3);
    duel.boltProgress=eased*100;
    // Build bolt HTML
    const leftPos=isH? (8+(duel.boltProgress/100)*84)+'%' : (92-(duel.boltProgress/100)*84)+'%';
    const coreColor=isH?'radial-gradient(circle,#fff 20%,#facc15 50%,#ef4444)':'radial-gradient(circle,#fff 20%,#86efac 50%,#22c55e)';
    const coreShadow=isH?'0 0 15px #fff,0 0 30px #ef4444,0 0 50px #f97316':'0 0 15px #fff,0 0 30px #22c55e,0 0 50px #10b981';
    const glowBg=isH?'radial-gradient(circle,rgba(239,68,68,0.6),rgba(249,115,22,0.3),transparent 70%)':'radial-gradient(circle,rgba(34,197,94,0.6),rgba(16,185,129,0.3),transparent 70%)';
    let trail='';
    for(let i=0;i<6;i++){
      const tl=isH?(-6-i*7)+'px':(18+i*7)+'px';
      const tc=isH?'#f97316':'#10b981';const ts2=isH?'#ef4444':'#22c55e';
      trail+=`<div style="position:absolute;top:50%;transform:translateY(-50%);left:${tl};width:${6-i*.8}px;height:${6-i*.8}px;border-radius:50%;background:${tc};opacity:${.9-i*.15};box-shadow:0 0 ${8-i}px ${ts2};filter:blur(${i*.3}px)"></div>`;
    }
    boltC.innerHTML=`<div style="position:absolute;top:45%;transform:translateY(-50%);left:${leftPos}"><div style="position:absolute;width:80px;height:80px;left:-40px;top:-40px;border-radius:50%;background:${glowBg};filter:blur(8px)"></div><div style="width:24px;height:24px;border-radius:50%;position:relative;background:${coreColor};box-shadow:${coreShadow}">${trail}</div></div>`;
    if(progress<1){ requestAnimationFrame(animate); }
    else {
      duel.hitTarget=isH?'voldemort':'harry';
      duel.screenShake=true; duel.roundFlash=true;
      applyDuelHit();
      setTimeout(()=>{
        boltC.style.display='none'; boltC.innerHTML='';
        duel.showBolt=false; duel.attack='none'; duel.hitTarget='none';
        duel.screenShake=false; duel.selectedOption=null; duel.isCorrect=null;
        duel.roundFlash=false;
        clearDuelHit();
        renderDuelQuestion();
        updateDuelHP();
      },600);
    }
  }
  requestAnimationFrame(animate);
}

function applyDuelHit(){
  const root=document.getElementById('duelRoot');
  if(duel.screenShake) root.classList.add('duel-screen-shake');
  if(duel.roundFlash){
    const fl=document.getElementById('duelFlash');
    fl.style.display='block';
    fl.className='duel-round-flash-anim';
    fl.style.background=duel.attack==='harry'?'radial-gradient(circle at 70% 40%,rgba(239,68,68,0.3),transparent 60%)':'radial-gradient(circle at 30% 40%,rgba(34,197,94,0.3),transparent 60%)';
  }
  const hitEl=duel.hitTarget==='harry'?document.getElementById('harryHitEl'):document.getElementById('voldHitEl');
  if(hitEl){
    hitEl.style.display='block';
    const flashColor=duel.hitTarget==='harry'?'rgba(239,68,68,0.5)':'rgba(52,211,153,0.5)';
    const burstColor=duel.hitTarget==='harry'?'#ef4444':'#34d399';
    hitEl.innerHTML=`<div class="duel-hit-flash" style="position:absolute;inset:0;border-radius:1rem;background:${flashColor};z-index:20;pointer-events:none"></div>`;
    // Impact burst
    let burst='';
    for(let i=0;i<8;i++){
      burst+=`<div class="duel-impact-particle" style="position:absolute;width:4px;height:4px;border-radius:50%;background:${burstColor};box-shadow:0 0 8px ${burstColor};--a:${i*45}deg"></div>`;
    }
    hitEl.innerHTML+=`<div style="position:absolute;inset:0;pointer-events:none;z-index:30;display:flex;align-items:center;justify-content:center">${burst}</div>`;
  }
  const card=duel.hitTarget==='harry'?document.getElementById('harryCard'):document.getElementById('voldCard');
  if(card) card.classList.add('duel-hp-drain');
  const ci=duel.hitTarget==='harry'?document.getElementById('harryCardInner'):document.getElementById('voldCardInner');
  if(ci) ci.style.borderColor=duel.hitTarget==='harry'?'rgba(239,68,68,0.6)':'rgba(52,211,153,0.6)';
  // img attack effect
  const img=duel.attack==='harry'?document.getElementById('harryImg'):document.getElementById('voldImg');
  if(img){img.style.transform='scale(1.1)';img.style.filter=duel.attack==='harry'?'brightness(1.5) drop-shadow(0 0 30px rgba(239,68,68,0.6))':'brightness(1.5) drop-shadow(0 0 30px rgba(34,197,94,0.6))';}
  const wrap=duel.attack==='harry'?document.getElementById('harryImgWrap'):document.getElementById('voldImgWrap');
  if(wrap) wrap.classList.remove('duel-float');
}
function clearDuelHit(){
  const root=document.getElementById('duelRoot');
  root.classList.remove('duel-screen-shake');
  const fl=document.getElementById('duelFlash'); fl.style.display='none'; fl.className='';
  document.getElementById('harryHitEl').style.display='none'; document.getElementById('harryHitEl').innerHTML='';
  document.getElementById('voldHitEl').style.display='none'; document.getElementById('voldHitEl').innerHTML='';
  document.getElementById('harryCard').classList.remove('duel-hp-drain');
  document.getElementById('voldCard').classList.remove('duel-hp-drain');
  document.getElementById('harryCardInner').style.borderColor='rgba(52,211,153,0.2)';
  document.getElementById('voldCardInner').style.borderColor='rgba(239,68,68,0.2)';
  document.getElementById('harryImg').style.transform=''; document.getElementById('harryImg').style.filter='drop-shadow(0 0 12px rgba(52,211,153,0.3))';
  document.getElementById('voldImg').style.transform=''; document.getElementById('voldImg').style.filter='drop-shadow(0 0 12px rgba(239,68,68,0.3))';
  document.getElementById('harryImgWrap').classList.add('duel-float');
  document.getElementById('voldImgWrap').classList.add('duel-float');
}

// ─── DUEL: COMBO ───
function showDuelCombo(){
  if(duel.comboCount<=1) return;
  const el=document.getElementById('duelCombo'); el.style.display='block';
  el.innerHTML=`<div class="duel-combo-pop" style="padding:8px 20px;border-radius:9999px;font-weight:900;font-size:18px;background:linear-gradient(135deg,rgba(245,158,11,0.9),rgba(217,119,6,0.9));color:#000;box-shadow:0 0 30px rgba(245,158,11,0.5);border:2px solid rgba(251,191,36,0.6)">🔥 ${duel.comboCount}x Combo!</div>`;
  setTimeout(()=>{el.style.display='none';},1200);
}

// ─── DUEL: ANSWER ───
function handleDuelAnswer(idx){
  if(duel.isGameOver||duel.showBolt) return;
  duel.selectedOption=idx;
  const q=duelQuestions[duel.currentIndex];
  // Highlight selected option
  const opts=document.getElementById('duelOptions').children;
  if(idx===q.answer){
    duel.isCorrect=true; duel.comboCount++;
    opts[idx].style.borderColor='rgba(52,211,153,0.5)'; opts[idx].style.background='rgba(52,211,153,0.12)';
    opts[idx].querySelector('.duel-opt-letter').style.background='rgba(52,211,153,0.2)';
    opts[idx].querySelector('.duel-opt-letter').style.color='#6ee7b7';
    duel.showCombo=true; showDuelCombo();
    setTimeout(()=>{
      animateDuelBolt('harry');
      const dmg=20+Math.min(duel.comboCount*5,20);
      duel.voldemortXP=Math.max(0,duel.voldemortXP-dmg);
      duel.feedback=`⚡ Expelliarmus! ${dmg} damage!`;
      updateDuelFeedback(); updateDuelHP();
      if(duel.voldemortXP<=0){ setTimeout(()=>showDuelGameOver('Harry'),800); }
    },300);
  } else {
    duel.isCorrect=false; duel.comboCount=0;
    opts[idx].style.borderColor='rgba(239,68,68,0.5)'; opts[idx].style.background='rgba(239,68,68,0.12)';
    opts[idx].querySelector('.duel-opt-letter').style.background='rgba(239,68,68,0.2)';
    opts[idx].querySelector('.duel-opt-letter').style.color='#fca5a5';
    setTimeout(()=>{
      animateDuelBolt('voldemort');
      duel.harryXP=Math.max(0,duel.harryXP-25);
      duel.feedback='💀 Avada Kedavra! Voldemort retaliates!';
      updateDuelFeedback(); updateDuelHP();
      if(duel.harryXP<=0){ setTimeout(()=>showDuelGameOver('Voldemort'),800); }
    },300);
  }
  duel.currentIndex=(duel.currentIndex+1)%duelQuestions.length;
  // Disable all options
  Array.from(opts).forEach(b=>b.disabled=true);
}

function showDuelGameOver(winner){
  duel.isGameOver=true; duel.winner=winner;
  const el=document.getElementById('duelGameOver'); el.style.display='block';
  const isW=winner==='Harry';
  el.innerHTML=`<div class="duel-gameover" style="background:${isW?'linear-gradient(180deg,rgba(245,158,11,0.15),rgba(0,0,0,0.4))':'linear-gradient(180deg,rgba(239,68,68,0.15),rgba(0,0,0,0.4))'};border:1px solid ${isW?'rgba(245,158,11,0.25)':'rgba(239,68,68,0.25)'};box-shadow:${isW?'0 0 60px rgba(245,158,11,0.15)':'0 0 60px rgba(239,68,68,0.15)'}">
    <div style="font-size:3.5rem;margin-bottom:12px">${isW?'🏆':'💀'}</div>
    <h2 style="font-size:2.25rem;font-weight:900;background-image:${isW?'linear-gradient(135deg,#fbbf24,#f59e0b,#fef3c7)':'linear-gradient(135deg,#fca5a5,#ef4444,#fecaca)'};-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:8px">${isW?'Victory!':'Defeat...'}</h2>
    <p style="color:#9CA3AF;font-weight:500;font-size:14px;margin-bottom:20px">${isW?"The Boy Who Lived triumphs once more!":"The Dark Lord prevails... but you can try again."}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <button class="duel-gameover-btn primary" onclick="resetDuelGame()">Duel Again ⚡</button>
      <button class="duel-gameover-btn secondary" onclick="returnToFocusMode()">Return to Focus</button>
    </div>
  </div>`;
}

function resetDuelGame(){
  duel={harryXP:100,voldemortXP:100,currentIndex:0,feedback:'',isGameOver:false,winner:'',attack:'none',boltProgress:0,showBolt:false,hitTarget:'none',screenShake:false,selectedOption:null,isCorrect:null,comboCount:0,showCombo:false,roundFlash:false};
  document.getElementById('duelGameOver').style.display='none';
  document.getElementById('duelGameOver').innerHTML='';
  updateDuelHP(); updateDuelFeedback(); renderDuelQuestion();
}

function showWizardDuel(){
  hideRewardChoice();
  const ov=document.getElementById('wizardDuelOverlay');
  buildDuelUI();
  ov.classList.add('active');
  resetDuelGame();
}

/* ============================================
   FLAPPY BIRD GAME (ported from param branch)
   ============================================ */
const FG={W:340,H:520,PX:90,PS:52,OW:64,OG:160};
let flappy={playerY:0,velocity:0,obstacles:[],score:0,bestScore:0,isPlaying:false,isGameOver:false,lastSpawn:0,raf:null,mounted:false};
let flappyListeners={keydown:null,mousedown:null,touchstart:null};

function buildFlappyUI(){
  const ov=document.getElementById('flappyBirdOverlay');
  ov.innerHTML=`
  <div class="flappy-container" id="flappyGame">
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 20% 20%,rgba(91,119,255,0.25),transparent 40%),radial-gradient(circle at 70% 40%,rgba(248,213,87,0.15),transparent 45%)"></div>
    <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,12,36,0.98),rgba(7,12,36,0.99) 60%,rgba(7,12,36,1))"></div>
    <div style="position:relative;height:100%;width:100%">
      <div class="flappy-score"><span id="fScore" style="color:#FCD34D">✨ 0</span><span id="fBest" style="color:#CBD5E1">Best: 0</span></div>
      <div id="fObstacles"></div>
      <div id="fPlayer" class="flappy-player"></div>
      <div style="position:absolute;inset:0 0 auto;height:25px;background:linear-gradient(to bottom,rgba(0,0,0,0.95),transparent);z-index:3"></div>
      <div style="position:absolute;inset:auto 0 0;height:25px;background:linear-gradient(to top,rgba(0,0,0,0.95),transparent);z-index:3"></div>
      <div id="fStartMsg" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;z-index:4">Tap/click or press space to fly</div>
      <div id="fGameOver" class="flappy-go">
        <div class="flappy-go-card">
          <h2 style="font-size:1.75rem;font-weight:900;color:#FCD34D;margin-bottom:16px">Game Over 🔥</h2>
          <p style="color:white;font-size:18px;margin-bottom:8px">Score: <span id="fFinalScore" style="color:#FDE68A">0</span></p>
          <p style="color:#CBD5E1;margin-bottom:24px">Best: <span id="fFinalBest" style="color:#6ee7b7">0</span></p>
          <div style="display:flex;gap:12px;justify-content:center">
            <button class="flappy-go-btn" onclick="resetFlappyGame()" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#FDE68A">Play Again</button>
            <button class="flappy-go-btn" onclick="returnToFocusMode()" style="background:rgba(100,116,139,0.9);border:1px solid rgba(148,163,184,0.4);color:white">Return to Focus</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <button class="flappy-close" onclick="returnToFocusMode()">Close</button>`;
  renderFlappyPlayer();
}

const FLAPPY_SVG=`<svg viewBox="0 0 40 40" style="filter:drop-shadow(0 0 8px rgba(251,191,36,0.6))"><rect x="8" y="22" width="24" height="3" fill="#8B4513" rx="1"/><g fill="#A0522D"><ellipse cx="10" cy="26" rx="3" ry="4"/><ellipse cx="14" cy="27" rx="2.5" ry="3.5"/><ellipse cx="18" cy="27" rx="2" ry="3"/></g><path d="M 12 12 Q 12 16 14 20 L 26 20 Q 28 16 28 12 Q 28 10 20 10 Q 12 10 12 12 Z" fill="#1a1a1a"/><rect x="5" y="14" width="7" height="3" fill="#E8B4A3" rx="1.5"/><rect x="28" y="14" width="7" height="3" fill="#E8B4A3" rx="1.5"/><circle cx="20" cy="8" r="5" fill="#E8B4A3"/><path d="M 15 4 Q 15 2 20 2 Q 25 2 25 4 L 25 7 Q 20 6 15 7 Z" fill="#5C3D1F"/><path d="M 15 5 Q 14 6 14.5 8 L 25.5 8 Q 26 6 25 5 Z" fill="#5C3D1F"/><circle cx="17" cy="7.5" r="2" fill="white"/><circle cx="17" cy="7.5" r="1.2" fill="black"/><circle cx="17" cy="7.5" r=".5" fill="white"/><circle cx="23" cy="7.5" r="2" fill="white"/><circle cx="23" cy="7.5" r="1.2" fill="black"/><circle cx="23" cy="7.5" r=".5" fill="white"/><line x1="19" y1="7.5" x2="21" y2="7.5" stroke="black" stroke-width=".8"/><path d="M 20 3.5 L 21 4.5 L 20.5 5 L 21.5 5.5" stroke="#FF6B35" stroke-width=".6" fill="none" stroke-linecap="round"/><path d="M 18 10 Q 20 11 22 10" stroke="#666" stroke-width=".6" fill="none" stroke-linecap="round"/></svg>`;

function renderFlappyPlayer(){
  const el=document.getElementById('fPlayer'); if(!el) return;
  const angle=Math.max(-30,Math.min(30,(flappy.velocity/10)*30));
  el.style.left=FG.PX+'px'; el.style.top=flappy.playerY+'px';
  el.style.width=FG.PS+'px'; el.style.height=FG.PS+'px';
  el.style.transform=`rotate(${angle}deg)`;
  el.innerHTML=FLAPPY_SVG;
}

function renderFlappyObstacles(){
  const c=document.getElementById('fObstacles'); if(!c) return;
  c.innerHTML='';
  flappy.obstacles.forEach(o=>{
    const topH=Math.max(36,o.gapY-FG.OG/2);
    const botTop=o.gapY+FG.OG/2;
    const botH=Math.max(36,FG.H-botTop);
    c.innerHTML+=`<div class="flappy-obstacle" style="width:${FG.OW}px;left:${o.x}px;top:0;height:${topH}px"></div><div class="flappy-obstacle" style="width:${FG.OW}px;left:${o.x}px;top:${botTop}px;height:${botH}px"></div>`;
  });
}

function flapBird(){
  if(flappy.isGameOver) return;
  flappy.isPlaying=true;
  flappy.velocity=-10.2;
  document.getElementById('fStartMsg').style.display='none';
}

function endFlappyGame(){
  flappy.isGameOver=true; flappy.isPlaying=false;
  if(flappy.score>flappy.bestScore){ flappy.bestScore=flappy.score; try{localStorage.setItem('flappy-harry-best',String(flappy.bestScore));}catch(e){} }
  if(flappy.raf){cancelAnimationFrame(flappy.raf);flappy.raf=null;}
  document.getElementById('fFinalScore').textContent=flappy.score;
  document.getElementById('fFinalBest').textContent=flappy.bestScore;
  document.getElementById('fGameOver').classList.add('active');
}

function flappyLoop(time){
  if(!flappy.isPlaying||flappy.isGameOver){flappy.raf=null;return;}
  if(!flappy._lastTime) flappy._lastTime=time;
  const frameTime=time-flappy._lastTime; flappy._lastTime=time;
  const delta=Math.min(frameTime/16.66,2);
  // Physics
  flappy.velocity+=0.6*delta;
  flappy.playerY=Math.min(FG.H-FG.PS,Math.max(0,flappy.playerY+flappy.velocity*delta));
  if(flappy.playerY<=0||flappy.playerY>=FG.H-FG.PS){endFlappyGame();return;}
  // Spawn
  flappy.lastSpawn+=frameTime;
  if(flappy.lastSpawn>1500){
    flappy.lastSpawn=0;
    const gapY=120+Math.random()*(FG.H-240);
    flappy.obstacles.push({id:Date.now()+Math.random(),x:FG.W+20,gapY,passed:false});
  }
  // Move & score
  const speed=2.5+flappy.score*0.05;
  flappy.obstacles=flappy.obstacles.map(o=>({...o,x:o.x-speed*delta})).filter(o=>o.x>-FG.OW-20);
  flappy.obstacles.forEach(o=>{
    if(!o.passed&&o.x+FG.OW<FG.PX){o.passed=true;flappy.score++;}
  });
  // Collision
  const pT=flappy.playerY, pB=flappy.playerY+FG.PS;
  for(const o of flappy.obstacles){
    if(o.x<FG.PX+FG.PS&&o.x+FG.OW>FG.PX){
      if(pT<o.gapY-FG.OG/2||pB>o.gapY+FG.OG/2){endFlappyGame();return;}
    }
  }
  // Render
  document.getElementById('fScore').textContent='✨ '+flappy.score;
  document.getElementById('fBest').textContent='Best: '+flappy.bestScore;
  renderFlappyPlayer(); renderFlappyObstacles();
  flappy.raf=requestAnimationFrame(flappyLoop);
}

function resetFlappyGame(){
  flappy.playerY=FG.H/2-FG.PS/2; flappy.velocity=0; flappy.obstacles=[];
  flappy.score=0; flappy.isPlaying=false; flappy.isGameOver=false; flappy.lastSpawn=0; flappy._lastTime=0;
  document.getElementById('fGameOver').classList.remove('active');
  document.getElementById('fStartMsg').style.display='flex';
  document.getElementById('fScore').textContent='✨ 0';
  document.getElementById('fBest').textContent='Best: '+flappy.bestScore;
  renderFlappyPlayer(); renderFlappyObstacles();
  // Re-start loop on next flap
}

function showFlappyBird(){
  hideRewardChoice();
  try{const raw=localStorage.getItem('flappy-harry-best');if(raw)flappy.bestScore=Number(raw);}catch(e){}
  buildFlappyUI();
  flappy.playerY=FG.H/2-FG.PS/2; flappy.velocity=0; flappy.obstacles=[]; flappy.score=0;
  flappy.isPlaying=false; flappy.isGameOver=false; flappy.lastSpawn=0; flappy._lastTime=0;
  renderFlappyPlayer();
  const ov=document.getElementById('flappyBirdOverlay'); ov.classList.add('active');
  // Attach listeners
  flappyListeners.keydown=e=>{if(e.code==='Space'){e.preventDefault();flapBird();if(!flappy.raf&&!flappy.isGameOver){flappy.raf=requestAnimationFrame(flappyLoop);}}};
  flappyListeners.mousedown=e=>{if(!e.target.closest('button')){flapBird();if(!flappy.raf&&!flappy.isGameOver){flappy.raf=requestAnimationFrame(flappyLoop);}}};
  flappyListeners.touchstart=e=>{if(!e.target.closest('button')){flapBird();if(!flappy.raf&&!flappy.isGameOver){flappy.raf=requestAnimationFrame(flappyLoop);}}};
  window.addEventListener('keydown',flappyListeners.keydown);
  document.getElementById('flappyBirdOverlay').addEventListener('mousedown',flappyListeners.mousedown);
  document.getElementById('flappyBirdOverlay').addEventListener('touchstart',flappyListeners.touchstart);
}

function cleanupFlappy(){
  if(flappy.raf){cancelAnimationFrame(flappy.raf);flappy.raf=null;}
  if(flappyListeners.keydown) window.removeEventListener('keydown',flappyListeners.keydown);
  if(flappyListeners.mousedown){const ov=document.getElementById('flappyBirdOverlay');if(ov)ov.removeEventListener('mousedown',flappyListeners.mousedown);}
  if(flappyListeners.touchstart){const ov=document.getElementById('flappyBirdOverlay');if(ov)ov.removeEventListener('touchstart',flappyListeners.touchstart);}
  flappyListeners={keydown:null,mousedown:null,touchstart:null};
}

/* ============================================
   SPIDER-MAN VS GREEN GOBLIN (Pomodoro Mini Game #3)
   ============================================ */
const SV={W:960,H:540,GROUND_Y:470,SPIDER_X:150,GOBLIN_X:810};
let svState=null;
let svRefs={};
let svListeners={keydown:null,keyup:null,pointerdown:null,pointerup:null,pointerleave:null};
const svDefeatMotion={
  rafId:null,
  lastTs:0,
  time:0,
  pos:0,
  vel:0,
  target:0,
  active:false,
};
const svVictoryRain={
  active:false,
  rafId:null,
  lastTs:0,
  width:0,
  height:0,
  dpr:1,
  drops:[],
  frameCount:0,
  wind:-36,
  gustPhase:0,
};
const SV_ASSET_PATHS={
  spider:'spider_custom.png',
  goblin:'green_goblin_custom.png',
  gwen:'gwen_defeat.png',
  victory:'victory_spidey_gwen.png',
};
const SV_MOON_CRATERS=[
  {x:-16,y:-10,r:6.2,a:0.2},
  {x:12,y:-4,r:8.4,a:0.24},
  {x:-6,y:14,r:5.6,a:0.18},
  {x:18,y:17,r:4.2,a:0.2},
  {x:2,y:-19,r:3.8,a:0.16},
];
const svAssets={
  spider:{img:null,loaded:false,failed:false},
  goblin:{img:null,loaded:false,failed:false},
  gwen:{img:null,loaded:false,failed:false},
  victory:{img:null,loaded:false,failed:false},
  preloadPromise:null,
};

function buildSpiderVenomUI(){
  const ov=document.getElementById('spiderVenomOverlay');
  ov.innerHTML=`
  <div class="sv-panel">
    <div class="sv-header">
      <div class="sv-title-wrap">
        <h2>Spider-Man vs Green Goblin</h2>
        <p>Hold and release to launch webs. Misses trigger Goblin fireball counters.</p>
      </div>
      <button class="sv-close-btn" onclick="returnToFocusMode()">Return to Focus</button>
    </div>

    <div class="sv-content">
      <div class="sv-hud">
        <div class="sv-fighter">
          <div class="sv-fighter-label">Spider-Man</div>
          <div class="sv-fighter-hp" id="svSpiderHPText">100 HP</div>
          <div class="sv-hp-track"><div class="sv-hp-fill spider" id="svSpiderHP"></div></div>
        </div>
        <div class="sv-vs">VS</div>
        <div class="sv-fighter right">
          <div class="sv-fighter-label">Green Goblin</div>
          <div class="sv-fighter-hp" id="svGoblinHPText">100 HP</div>
          <div class="sv-hp-track"><div class="sv-hp-fill goblin" id="svGoblinHP"></div></div>
        </div>
      </div>

      <div class="sv-canvas-wrap" id="svCanvasWrap">
        <canvas id="svCanvas" width="960" height="540"></canvas>
        <div class="sv-flash" id="svFlash"></div>
        <div class="sv-overlay-message" id="svEndMessage" style="display:none">
          <div class="card">
            <h3 id="svEndTitle">Victory!</h3>
            <p id="svEndSub">You defeated Green Goblin. Manhattan can breathe tonight.</p>
          </div>
        </div>
      </div>

      <div class="sv-footer">
        <div class="sv-controls">
          <p><strong>Controls:</strong> Hold <strong>SPACE</strong> (or hold mouse/finger on arena), release to fire a web shot.</p>
          <div class="sv-power-wrap">
            <span class="sv-power-label">Power</span>
            <div class="sv-power-track">
              <div class="sv-power-fill" id="svPowerFill"></div>
              <div class="sv-power-zone good"></div>
              <div class="sv-power-zone perfect"></div>
            </div>
          </div>
          <div class="sv-status" id="svStatus">Release in the yellow zone for accurate web hits on Green Goblin.</div>
          <div class="hint">Perfect timing gives critical web damage. Misses trigger delayed fireball counters.</div>
        </div>
        <div class="sv-actions">
          <button class="sv-btn restart" onclick="resetSpiderVenomGame()">Restart Match</button>
          <button class="sv-btn return" onclick="returnToFocusMode()">Back</button>
        </div>
      </div>
    </div>
  </div>`;

  ov.innerHTML+=`
  <div class="sv-defeat-overlay" id="svDefeatOverlay" aria-hidden="true">
    <div class="sv-defeat-card">
      <div class="sv-defeat-art" id="svDefeatArt">
        <img id="svDefeatImage" alt="Gwen Stacy" class="sv-defeat-image" src="gwen_defeat.png">
      </div>
      <h3 id="svDefeatTitle">You couldn't save her...</h3>
      <p id="svDefeatSub">With great power came a painful loss.</p>
      <button class="sv-btn restart" onclick="returnToFocusMode()">Return to Focus Mode</button>
    </div>
  </div>`;

  ov.innerHTML+=`
  <div class="sv-victory-overlay" id="svVictoryOverlay" aria-hidden="true">
    <canvas id="svVictoryRainCanvas" class="sv-victory-rain-canvas" aria-hidden="true"></canvas>
    <div class="sv-victory-card">
      <div class="sv-victory-art">
        <img id="svVictoryImage" alt="Spider-Man and Gwen Stacy" class="sv-victory-image" src="victory_spidey_gwen.png">
      </div>
      <h3 id="svVictoryTitle">You saved her! 🕸️❤️</h3>
      <p id="svVictorySub">A hero's story ends in hope.</p>
      <button class="sv-btn restart" onclick="returnToFocusMode()">Return to Focus Mode</button>
    </div>
  </div>`;

  svRefs={
    overlay:ov,
    canvas:document.getElementById('svCanvas'),
    canvasWrap:document.getElementById('svCanvasWrap'),
    spiderHP:document.getElementById('svSpiderHP'),
    goblinHP:document.getElementById('svGoblinHP'),
    spiderHPText:document.getElementById('svSpiderHPText'),
    goblinHPText:document.getElementById('svGoblinHPText'),
    powerFill:document.getElementById('svPowerFill'),
    status:document.getElementById('svStatus'),
    flash:document.getElementById('svFlash'),
    defeatOverlay:document.getElementById('svDefeatOverlay'),
    defeatArt:document.getElementById('svDefeatArt'),
    defeatImage:document.getElementById('svDefeatImage'),
    defeatTitle:document.getElementById('svDefeatTitle'),
    defeatSub:document.getElementById('svDefeatSub'),
    victoryOverlay:document.getElementById('svVictoryOverlay'),
    victoryRainCanvas:document.getElementById('svVictoryRainCanvas'),
    victoryImage:document.getElementById('svVictoryImage'),
    victoryTitle:document.getElementById('svVictoryTitle'),
    victorySub:document.getElementById('svVictorySub'),
    endMessage:document.getElementById('svEndMessage'),
    endTitle:document.getElementById('svEndTitle'),
    endSub:document.getElementById('svEndSub'),
  };
}

function createSpiderVenomState(){
  return {
    hp:{spider:100,goblin:100},
    power:{charging:false,value:0,display:0,direction:1,speed:95},
    canShoot:true,
    running:true,
    ended:false,
    winner:'',
    status:'Release in the yellow zone for accurate web hits on Green Goblin.',
    lastTs:0,
    projectiles:[],
    impactBursts:[],
    webMarks:[],
    burnMarks:[],
    flashes:{spider:0,goblin:0},
    pose:{spiderX:SV.SPIDER_X,spiderY:SV.GROUND_Y,goblinX:SV.GOBLIN_X,goblinY:SV.GROUND_Y-24},
    screenFlash:{alpha:0,rgb:'255,255,255'},
    stars:makeSVStars(),
    clouds:makeSVClouds(),
    skyline:makeSVSkyline(),
    // ── Enhanced ambient particles ──
    embers:makeSVEmbers(),
    dustMotes:makeSVDust(),
    shootingStar:null,
    shootingStarTimer:4+Math.random()*6,
    sparks:[],
    speedLines:[],
    chargeSparks:[],
    ambientHum:null,
    lightningTimer:12+Math.random()*15,
    lightningFlash:0,
    aiTimeoutId:null,
    shakeTimeoutId:null,
    rafId:null,
  };
}

/* ── Ambient Ember Particles ── */
function makeSVEmbers(){
  const out=[];
  for(let i=0;i<35;i++){
    out.push({
      x:Math.random()*SV.W,
      y:SV.GROUND_Y+Math.random()*(SV.H-SV.GROUND_Y),
      vx:(Math.random()-0.5)*12,
      vy:-(18+Math.random()*40),
      size:1+Math.random()*2.5,
      life:Math.random()*4,
      maxLife:3+Math.random()*4,
      alpha:0.3+Math.random()*0.5,
      hue:15+Math.random()*30,
    });
  }
  return out;
}

function resetEmber(e){
  e.x=Math.random()*SV.W;
  e.y=SV.GROUND_Y+Math.random()*30;
  e.vx=(Math.random()-0.5)*14;
  e.vy=-(20+Math.random()*45);
  e.size=1+Math.random()*2.5;
  e.life=0;
  e.maxLife=3+Math.random()*4;
  e.alpha=0.3+Math.random()*0.5;
  e.hue=15+Math.random()*30;
}

/* ── Ground Dust Motes ── */
function makeSVDust(){
  const out=[];
  for(let i=0;i<20;i++){
    out.push({
      x:Math.random()*SV.W,
      y:SV.GROUND_Y-6+Math.random()*20,
      vx:4+Math.random()*8,
      size:0.6+Math.random()*1.4,
      alpha:0.08+Math.random()*0.12,
      phase:Math.random()*Math.PI*2,
    });
  }
  return out;
}

function makeSVStars(){
  const out=[];
  for(let i=0;i<52;i++){
    out.push({
      x:Math.random()*SV.W,
      y:16+Math.random()*230,
      r:0.7+Math.random()*1.9,
      p:Math.random()*Math.PI*2,
      s:0.5+Math.random()*1.5
    });
  }
  return out;
}

function makeSVClouds(){
  const clouds=[];
  for(let i=0;i<9;i++){
    const layer=Math.random()>0.5?1:0;
    const w=(layer?150:210)+Math.random()*(layer?120:160);
    clouds.push({
      x:Math.random()*(SV.W+260)-130,
      y:40+Math.random()*190,
      w,
      h:w*(0.22+Math.random()*0.12),
      alpha:(layer?0.11:0.17)+(Math.random()*0.06),
      speed:(layer?14:9)+Math.random()*6,
      puffSeed:Math.random()*100,
      layer,
    });
  }
  return clouds;
}

function buildSkylineLayer(opts){
  const buildings=[];
  let x=opts.startX;
  while(x<SV.W+opts.tail){
    const width=opts.minW+Math.random()*(opts.maxW-opts.minW);
    const height=opts.minH+Math.random()*(opts.maxH-opts.minH);
    const topType=Math.random()>0.72?'spire':'flat';
    buildings.push({x,width,height,topType,seed:Math.random()*700});
    x+=width+opts.gapMin+Math.random()*(opts.gapMax-opts.gapMin);
  }
  return buildings;
}

function makeSVSkyline(){
  const iconic=[
    {x:610,width:62,height:270,spire:52},
    {x:700,width:58,height:305,spire:75},
    {x:774,width:46,height:256,spire:68}
  ];
  return {
    far:buildSkylineLayer({startX:-40,tail:80,minW:40,maxW:96,minH:90,maxH:190,gapMin:6,gapMax:14}),
    near:buildSkylineLayer({startX:-30,tail:120,minW:56,maxW:118,minH:140,maxH:285,gapMin:5,gapMax:10}),
    iconic,
  };
}

function svLoadImage(path){
  return new Promise((resolve)=>{
    const img=new Image();
    img.decoding='async';
    img.onload=()=>resolve({ok:true,img});
    img.onerror=()=>resolve({ok:false,img:null});
    img.src=path;
  });
}

async function preloadSVAssets(){
  if(svAssets.preloadPromise) return svAssets.preloadPromise;
  svAssets.preloadPromise=(async()=>{
    const [spider,goblin,gwen,victory]=await Promise.all([
      svLoadImage(SV_ASSET_PATHS.spider),
      svLoadImage(SV_ASSET_PATHS.goblin),
      svLoadImage(SV_ASSET_PATHS.gwen),
      svLoadImage(SV_ASSET_PATHS.victory),
    ]);
    svAssets.spider.loaded=spider.ok;
    svAssets.spider.failed=!spider.ok;
    svAssets.spider.img=spider.img;
    svAssets.goblin.loaded=goblin.ok;
    svAssets.goblin.failed=!goblin.ok;
    svAssets.goblin.img=goblin.img;
    svAssets.gwen.loaded=gwen.ok;
    svAssets.gwen.failed=!gwen.ok;
    svAssets.gwen.img=gwen.img;
    svAssets.victory.loaded=victory.ok;
    svAssets.victory.failed=!victory.ok;
    svAssets.victory.img=victory.img;
  })();
  return svAssets.preloadPromise;
}

async function showSpiderVenomGame(){
  hideRewardChoice();
  cleanupSpiderVenomGame();
  buildSpiderVenomUI();
  document.getElementById('spiderVenomOverlay').classList.add('active');
  svRefs.status.textContent='Loading Spider-Man and Green Goblin assets...';
  await preloadSVAssets();
  attachSpiderVenomInput();
  resetSpiderVenomGame();
}

function resetSpiderVenomGame(){
  if(!svRefs.canvas) return;
  if(svState?.aiTimeoutId) clearTimeout(svState.aiTimeoutId);
  if(svState?.shakeTimeoutId) clearTimeout(svState.shakeTimeoutId);
  if(svState?.rafId) cancelAnimationFrame(svState.rafId);

  svState=createSpiderVenomState();
  svRefs.endMessage.style.display='none';
  svRefs.flash.style.opacity='0';
  svRefs.canvasWrap.classList.remove('shake');
  hideSVDefeatOverlay();
  hideSVVictoryOverlay();
  setSpiderStatus(svState.status,'#93c5fd');
  updateSpiderVenomHUD();
  renderSpiderVenomFrame(0);
  svState.rafId=requestAnimationFrame(spiderVenomLoop);
}

function attachSpiderVenomInput(){
  if(!svRefs.canvas) return;
  svListeners.keydown=(e)=>{
    if(e.code==='Space'){
      e.preventDefault();
      startSpiderCharge();
    }
  };
  svListeners.keyup=(e)=>{
    if(e.code==='Space'){
      e.preventDefault();
      releaseSpiderCharge();
    }
  };
  svListeners.pointerdown=(e)=>{
    if(e.button!==0) return;
    startSpiderCharge();
  };
  svListeners.pointerup=()=>releaseSpiderCharge();
  svListeners.pointerleave=()=>releaseSpiderCharge();

  window.addEventListener('keydown',svListeners.keydown);
  window.addEventListener('keyup',svListeners.keyup);
  svRefs.canvas.addEventListener('pointerdown',svListeners.pointerdown);
  window.addEventListener('pointerup',svListeners.pointerup);
  svRefs.canvas.addEventListener('pointerleave',svListeners.pointerleave);
}

function spiderVenomLoop(ts){
  if(!svState||!svState.running) return;
  if(!svState.lastTs) svState.lastTs=ts;
  const dt=Math.min((ts-svState.lastTs)/1000,0.033);
  svState.lastTs=ts;

  updateSpiderVenom(dt,ts);
  renderSpiderVenomFrame(ts);
  updateSpiderVenomHUD();

  if(svState.running) svState.rafId=requestAnimationFrame(spiderVenomLoop);
}

function updateSpiderVenom(dt,ts){
  if(svState.power.charging&&!svState.ended){
    svState.power.value+=svState.power.direction*svState.power.speed*dt;
    if(svState.power.value>=100){
      svState.power.value=100;
      svState.power.direction=-1;
    }else if(svState.power.value<=12&&svState.power.direction===-1){
      svState.power.value=12;
      svState.power.direction=1;
    }
    // Charging sparks from Spider-Man's wrist
    if(Math.random()<0.6){
      const sx=svState.pose.spiderX+48+(Math.random()-0.5)*8;
      const sy=355+(Math.random()-0.5)*6;
      svState.chargeSparks.push({
        x:sx,y:sy,
        vx:30+Math.random()*60,vy:-(20+Math.random()*40),
        life:0,maxLife:0.15+Math.random()*0.12,
        size:0.8+Math.random()*1.5,
      });
    }
  }
  const powerBlend=Math.min(1,dt*16);
  svState.power.display+=(svState.power.value-svState.power.display)*powerBlend;

  svState.flashes.spider=Math.max(0,svState.flashes.spider-dt);
  svState.flashes.goblin=Math.max(0,svState.flashes.goblin-dt);
  svState.screenFlash.alpha=Math.max(0,svState.screenFlash.alpha-dt*2.8);
  svRefs.flash.style.opacity=String(svState.screenFlash.alpha);

  svState.stars.forEach((star)=>{ star.p+=dt*star.s; });
  svState.clouds.forEach((cloud)=>{
    cloud.x+=cloud.speed*dt;
    if(cloud.x-cloud.w>SV.W+80){
      cloud.x=-cloud.w-140;
      cloud.y=36+Math.random()*200;
    }
  });

  // ── Ambient embers ──
  svState.embers.forEach(e=>{
    e.life+=dt;
    e.x+=e.vx*dt;
    e.y+=e.vy*dt;
    e.vx+=Math.sin(e.life*2.5)*4*dt;
    if(e.life>=e.maxLife||e.y<-10||e.x<-10||e.x>SV.W+10){
      resetEmber(e);
    }
  });

  // ── Ground dust ──
  svState.dustMotes.forEach(d=>{
    d.x+=d.vx*dt;
    d.phase+=dt*1.2;
    d.y=SV.GROUND_Y-6+Math.sin(d.phase)*8;
    if(d.x>SV.W+10){ d.x=-10; d.y=SV.GROUND_Y-6+Math.random()*20; }
  });

  // ── Shooting star timer ──
  svState.shootingStarTimer-=dt;
  if(svState.shootingStarTimer<=0&&!svState.shootingStar){
    svState.shootingStar={
      x:-20,y:40+Math.random()*120,
      vx:600+Math.random()*400,
      vy:80+Math.random()*60,
      life:0,maxLife:0.6+Math.random()*0.4,
      len:30+Math.random()*20,
    };
    svState.shootingStarTimer=6+Math.random()*10;
  }
  if(svState.shootingStar){
    const ss=svState.shootingStar;
    ss.life+=dt;
    ss.x+=ss.vx*dt;
    ss.y+=ss.vy*dt;
    if(ss.life>=ss.maxLife||ss.x>SV.W+50){
      svState.shootingStar=null;
    }
  }

  // ── Lightning flash (occasional) ──
  svState.lightningTimer-=dt;
  if(svState.lightningTimer<=0){
    svState.lightningFlash=0.15+Math.random()*0.1;
    svState.lightningTimer=10+Math.random()*20;
  }
  svState.lightningFlash=Math.max(0,svState.lightningFlash-dt*3);

  // ── Impact sparks physics ──
  for(let i=svState.sparks.length-1;i>=0;i--){
    const s=svState.sparks[i];
    s.life+=dt;
    s.x+=s.vx*dt;
    s.y+=s.vy*dt;
    s.vy+=320*dt; // gravity
    if(s.life>=s.maxLife) svState.sparks.splice(i,1);
  }

  // ── Speed lines decay ──
  for(let i=svState.speedLines.length-1;i>=0;i--){
    svState.speedLines[i].life+=dt;
    if(svState.speedLines[i].life>=svState.speedLines[i].maxLife) svState.speedLines.splice(i,1);
  }

  // ── Charge sparks decay ──
  for(let i=svState.chargeSparks.length-1;i>=0;i--){
    const cs=svState.chargeSparks[i];
    cs.life+=dt;
    cs.x+=cs.vx*dt;
    cs.y+=cs.vy*dt;
    cs.vy+=180*dt;
    if(cs.life>=cs.maxLife) svState.chargeSparks.splice(i,1);
  }

  for(let i=svState.impactBursts.length-1;i>=0;i--){
    const burst=svState.impactBursts[i];
    burst.life+=dt;
    if(burst.life>=burst.maxLife) svState.impactBursts.splice(i,1);
  }

  for(let i=svState.projectiles.length-1;i>=0;i--){
    const p=svState.projectiles[i];
    p.x+=p.vx*dt;
    p.y+=p.vy*dt;
    p.life+=dt;
    p.trail.push({x:p.x,y:p.y,t:p.life});
    if(p.trail.length>14) p.trail.shift();

    if(p.kind==='web'){
      if(checkProjectileCollision(p,'goblin')){
        const dmg=computeSpiderDamage(p.power,p.quality,p.zone);
        applyDamage('goblin',dmg,p.quality,p.zone,p.x,p.y);
        addWebMarkToGoblin(p.zone,p.x,p.y);
        createImpactBurst(p.x,p.y,'220,240,255');
        svState.projectiles.splice(i,1);
        svState.canShoot=true;
        if(!svState.ended){
          setSpiderStatus(`Web connected on Goblin's ${p.zone}. Keep pressure.`,'#bfdbfe');
        }
        continue;
      }
      if(p.x>SV.W+40||p.y<-30||p.y>SV.H+30){
        svState.projectiles.splice(i,1);
        if(p.quality==='miss'&&!svState.ended){
          scheduleGoblinCounter();
        }else{
          svState.canShoot=true;
        }
      }
    }else if(p.kind==='goblinFire'){
      p.vy+=140*dt;
      if(checkProjectileCollision(p,'spider')){
        const dmg=computeGoblinDamage(p.zone,p.damageMultiplier||1);
        applyDamage('spider',dmg,'good',p.zone,p.x,p.y);
        addBurnMarkToSpider(p.zone,p.x,p.y);
        createImpactBurst(p.x,p.y,'255,130,50');
        svState.projectiles.splice(i,1);
        if(!svState.ended){
          svState.canShoot=true;
          setSpiderStatus('Fireball impact! Re-time your next web release.','#fca5a5');
        }
        continue;
      }
      if(p.x<-40||p.y<-30||p.y>SV.H+40){
        svState.projectiles.splice(i,1);
        if(!svState.ended) svState.canShoot=true;
      }
    }
  }

  if(svState.hp.spider<=0||svState.hp.goblin<=0){
    endSpiderVenomGame(svState.hp.goblin<=0?'Spider-Man':'Green Goblin');
  }
}

function startSpiderCharge(){
  if(!svState||svState.ended||!svState.canShoot||svState.power.charging) return;
  svState.power.charging=true;
  setSpiderStatus('Charging... release around the yellow strip for accurate impact.','#fcd34d');
  // Toggle CSS charging classes
  if(svRefs.canvasWrap) svRefs.canvasWrap.classList.add('charging');
  if(svRefs.status) svRefs.status.classList.add('charging');
  const powerLabel=document.querySelector('.sv-power-label');
  const powerTrack=document.querySelector('.sv-power-track');
  if(powerLabel) powerLabel.classList.add('active');
  if(powerTrack) powerTrack.classList.add('charging');
  playSVSound('charge');
  startSVAmbientHum();
}

function releaseSpiderCharge(){
  if(!svState||svState.ended||!svState.power.charging) return;
  svState.power.charging=false;
  fireSpiderWeb(svState.power.value);
  svState.power.value=0;
  svState.power.direction=1;
  // Remove CSS charging classes
  if(svRefs.canvasWrap) svRefs.canvasWrap.classList.remove('charging');
  if(svRefs.status) svRefs.status.classList.remove('charging');
  const powerLabel=document.querySelector('.sv-power-label');
  const powerTrack=document.querySelector('.sv-power-track');
  if(powerLabel) powerLabel.classList.remove('active');
  if(powerTrack) powerTrack.classList.remove('charging');
  stopSVAmbientHum();
}

function fireSpiderWeb(powerValue){
  if(!svState.canShoot||svState.ended) return;
  svState.canShoot=false;

  const quality=getPowerQuality(powerValue);
  const zone=pickBodyZone();
  const startX=SV.SPIDER_X+48;
  const startY=355;
  const targetX=SV.GOBLIN_X-48;
  const targetY=quality==='miss'?(Math.random()>0.5?220:485):getBodyZoneY(zone,'goblin');
  const speed=760;
  const travel=Math.max(0.42,(targetX-startX)/speed);
  const vy=(targetY-startY)/travel;

  svState.projectiles.push({
    kind:'web',
    x:startX,
    y:startY,
    vx:speed,
    vy,
    r:7,
    life:0,
    power:powerValue,
    quality,
    zone,
    trail:[],
  });

  if(quality==='perfect'){
    setSpiderStatus('Perfect release. Critical web shot inbound.','#fde047');
  }else if(quality==='good'){
    setSpiderStatus('Good release. Web on trajectory.','#86efac');
  }else{
    setSpiderStatus('Missed timing. Goblin is preparing a fireball.','#fca5a5');
  }
  playSVSound('web');
}

function scheduleGoblinCounter(){
  if(!svState||svState.ended) return;
  if(svState.aiTimeoutId) clearTimeout(svState.aiTimeoutId);
  const delay=700+Math.random()*700;
  svState.aiTimeoutId=setTimeout(()=>{
    svState.aiTimeoutId=null;
    launchGoblinCounter(3);
  },delay);
}

function launchGoblinCounter(multiplier=1){
  if(!svState||svState.ended) return;
  const zone=pickBodyZone();
  const startX=SV.GOBLIN_X-58;
  const startY=286;
  const targetX=SV.SPIDER_X+24;
  const targetY=getBodyZoneY(zone,'spider');
  const speed=560;
  const travel=Math.max(0.5,(startX-targetX)/speed);
  const vy=(targetY-startY)/travel;

  svState.projectiles.push({
    kind:'goblinFire',
    x:startX,
    y:startY,
    vx:-speed,
    vy,
    r:11,
    life:0,
    zone,
    damageMultiplier:multiplier,
    trail:[],
  });
  setSpiderStatus('Green Goblin launches a fireball!', '#fda4af');
  playSVSound('goblin');
}

function getPowerQuality(power){
  if(power>=58&&power<=68) return 'perfect';
  if(power>=45&&power<=80) return 'good';
  return 'miss';
}

function pickBodyZone(){
  const roll=Math.random();
  if(roll<0.24) return 'head';
  if(roll<0.74) return 'body';
  return 'legs';
}

function getBodyZoneRect(target){
  if(target==='goblin'){
    return {x:SV.GOBLIN_X-58,y:230,w:118,h:240};
  }
  return {x:SV.SPIDER_X-58,y:230,w:118,h:240};
}

function getBodyZoneY(zone,target){
  const base=target==='goblin' ? {head:268,body:340,legs:422} : {head:270,body:342,legs:425};
  return base[zone]||base.body;
}

function zoneMultiplier(zone){
  if(zone==='head') return 1.28;
  if(zone==='legs') return 0.84;
  return 1;
}

function checkProjectileCollision(projectile,target){
  const rect=getBodyZoneRect(target);
  return circleRectCollision(projectile.x,projectile.y,projectile.r,rect);
}

function circleRectCollision(cx,cy,r,rect){
  const nearestX=Math.max(rect.x,Math.min(cx,rect.x+rect.w));
  const nearestY=Math.max(rect.y,Math.min(cy,rect.y+rect.h));
  const dx=cx-nearestX;
  const dy=cy-nearestY;
  return dx*dx+dy*dy<=r*r;
}

function computeSpiderDamage(power,quality,zone){
  const base=quality==='perfect'?26:17;
  const powerFactor=0.78+(power/100)*0.95;
  const critBonus=quality==='perfect'?6:0;
  return Math.max(8,Math.round((base*powerFactor+critBonus)*zoneMultiplier(zone)));
}

function computeGoblinDamage(zone,multiplier=1){
  const base=10+Math.random()*8;
  const swing=0.9+Math.random()*0.25;
  return Math.max(8,Math.round(base*swing*zoneMultiplier(zone)*multiplier));
}

function applyDamage(target,damage,quality,zone,x,y){
  if(!svState||svState.ended) return;
  if(target==='goblin'){
    svState.hp.goblin=Math.max(0,svState.hp.goblin-damage);
    svState.flashes.goblin=0.24;
    showSVHitLabel(`-${damage} ${quality==='perfect'?'CRIT':''}`.trim(),x,y,quality==='perfect'?'perfect':'good');
    triggerSVFlash('215,235,255',0.26);
    // Spawn directional sparks on hit
    spawnImpactSparks(x,y,8+Math.floor(Math.random()*6),'200,220,255');
    if(quality==='perfect') spawnSpeedLines();
  }else{
    svState.hp.spider=Math.max(0,svState.hp.spider-damage);
    svState.flashes.spider=0.26;
    showSVHitLabel(`-${damage}`,x,y,'miss');
    triggerSVFlash('255,132,80',0.2);
    spawnImpactSparks(x,y,6+Math.floor(Math.random()*4),'255,160,80');
  }
  // HP damage pulse CSS animation
  if(target==='goblin'&&svRefs.goblinHPText){
    svRefs.goblinHPText.classList.remove('damaged');
    void svRefs.goblinHPText.offsetWidth;
    svRefs.goblinHPText.classList.add('damaged');
  }else if(target==='spider'&&svRefs.spiderHPText){
    svRefs.spiderHPText.classList.remove('damaged');
    void svRefs.spiderHPText.offsetWidth;
    svRefs.spiderHPText.classList.add('damaged');
  }
  triggerSVShake();
  playSVSound(quality==='perfect'?'crit':'hit');
}

/* ── Directional Impact Sparks ── */
function spawnImpactSparks(cx,cy,count,rgb){
  if(!svState) return;
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2;
    const speed=120+Math.random()*220;
    svState.sparks.push({
      x:cx,y:cy,
      vx:Math.cos(angle)*speed,
      vy:Math.sin(angle)*speed-60,
      life:0,maxLife:0.25+Math.random()*0.2,
      size:1.2+Math.random()*2,
      rgb,
    });
  }
}

/* ── Speed Lines on Crit ── */
function spawnSpeedLines(){
  if(!svState) return;
  for(let i=0;i<12;i++){
    const angle=(Math.PI*2/12)*i+(Math.random()-0.5)*0.3;
    svState.speedLines.push({
      angle,
      innerR:60+Math.random()*30,
      outerR:140+Math.random()*80,
      life:0,maxLife:0.3+Math.random()*0.15,
      width:1.5+Math.random()*2,
    });
  }
}

function triggerSVShake(){
  if(!svRefs.canvasWrap) return;
  svRefs.canvasWrap.classList.remove('shake');
  void svRefs.canvasWrap.offsetWidth;
  svRefs.canvasWrap.classList.add('shake');
  if(svState?.shakeTimeoutId) clearTimeout(svState.shakeTimeoutId);
  svState.shakeTimeoutId=setTimeout(()=>{
    if(svRefs.canvasWrap) svRefs.canvasWrap.classList.remove('shake');
    if(svState) svState.shakeTimeoutId=null;
  },360);
}

function triggerSVFlash(rgb,alpha){
  if(!svState||!svRefs.flash) return;
  svState.screenFlash.rgb=rgb;
  svState.screenFlash.alpha=Math.max(svState.screenFlash.alpha,alpha);
  svRefs.flash.style.background=`rgba(${rgb}, 1)`;
}

function createImpactBurst(x,y,rgb){
  if(!svState) return;
  svState.impactBursts.push({x,y,rgb,life:0,maxLife:0.38,radius:26+Math.random()*10});
}

function addWebMarkToGoblin(zone,x,y){
  if(!svState) return;
  const anchor={head:{x:2,y:-72},body:{x:0,y:-10},legs:{x:0,y:66}}[zone]||{x:0,y:-6};
  const jitterX=((x-SV.GOBLIN_X)*0.2)+(Math.random()-0.5)*8;
  const jitterY=((y-(SV.GROUND_Y-120))*0.2)+(Math.random()-0.5)*6;
  const spokes=6+Math.floor(Math.random()*3);
  const spread=[];
  for(let i=0;i<spokes;i++) spread.push(0.8+Math.random()*0.45);
  svState.webMarks.push({
    x:anchor.x+jitterX,
    y:anchor.y+jitterY,
    scale:0.75+Math.random()*0.5,
    rot:(Math.random()-0.5)*0.65,
    spokes,
    spread,
    radius:10+Math.random()*8,
    rings:2+Math.floor(Math.random()*2),
  });
  if(svState.webMarks.length>10) svState.webMarks.shift();
}

function addBurnMarkToSpider(zone,x,y){
  if(!svState) return;
  const anchor={head:{x:2,y:-72},body:{x:0,y:-10},legs:{x:0,y:66}}[zone]||{x:0,y:-6};
  const jitterX=((x-SV.SPIDER_X)*0.2)+(Math.random()-0.5)*10;
  const jitterY=((y-(SV.GROUND_Y-120))*0.2)+(Math.random()-0.5)*8;
  svState.burnMarks.push({x:anchor.x+jitterX,y:anchor.y+jitterY,r:6+Math.random()*8,alpha:0.45+Math.random()*0.3});
  if(svState.burnMarks.length>8) svState.burnMarks.shift();
}

function showSVHitLabel(text,x,y,type){
  if(!svRefs.canvasWrap) return;
  const tag=document.createElement('div');
  tag.className=`sv-hit-indicator ${type}`;
  tag.textContent=text;
  tag.style.left=`${(x/SV.W)*100}%`;
  tag.style.top=`${(y/SV.H)*100}%`;
  svRefs.canvasWrap.appendChild(tag);
  setTimeout(()=>tag.remove(),580);
}

function showSVDefeatOverlay(){
  if(!svRefs?.defeatOverlay) return;
  if(svAssets.gwen.loaded&&svAssets.gwen.img&&svRefs.defeatImage){
    svRefs.defeatImage.src=SV_ASSET_PATHS.gwen;
  }
  svRefs.defeatOverlay.classList.add('active');
  svRefs.defeatOverlay.setAttribute('aria-hidden','false');
  startSVDefeatMotion();
}

function hideSVDefeatOverlay(){
  if(!svRefs?.defeatOverlay) return;
  stopSVDefeatMotion();
  svRefs.defeatOverlay.classList.remove('active');
  svRefs.defeatOverlay.setAttribute('aria-hidden','true');
}

function createSVVictoryRainDrop(spawnFromTop=false){
  const w=Math.max(1,svVictoryRain.width);
  const h=Math.max(1,svVictoryRain.height);
  const near=Math.random()<0.45;
  const vy=near?(680+Math.random()*260):(460+Math.random()*180);
  const vx=near?(-22-Math.random()*20):(-12-Math.random()*14);
  const len=near?(24+Math.random()*14):(14+Math.random()*10);
  const alpha=near?(0.3+Math.random()*0.25):(0.16+Math.random()*0.2);
  const width=near?(1.1+Math.random()*0.65):(0.75+Math.random()*0.4);
  return {
    x:Math.random()*w,
    y:spawnFromTop?(-Math.random()*h*0.35):(Math.random()*h),
    vy,
    vx,
    len,
    alpha,
    width,
  };
}

function resizeSVVictoryRainCanvas(forceReset=false){
  if(!svRefs?.victoryRainCanvas) return;
  const canvas=svRefs.victoryRainCanvas;
  const rect=canvas.getBoundingClientRect();
  const w=Math.max(1,Math.floor(rect.width));
  const h=Math.max(1,Math.floor(rect.height));
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const sizeChanged=forceReset||w!==svVictoryRain.width||h!==svVictoryRain.height||dpr!==svVictoryRain.dpr;
  if(!sizeChanged) return;

  svVictoryRain.width=w;
  svVictoryRain.height=h;
  svVictoryRain.dpr=dpr;
  canvas.width=Math.max(1,Math.floor(w*dpr));
  canvas.height=Math.max(1,Math.floor(h*dpr));
  const ctx=canvas.getContext('2d');
  if(ctx) ctx.setTransform(dpr,0,0,dpr,0,0);

  const dropCount=Math.max(56,Math.min(120,Math.round((w*h)/9800)));
  svVictoryRain.drops=[];
  for(let i=0;i<dropCount;i++) svVictoryRain.drops.push(createSVVictoryRainDrop(false));
}

function stepSVVictoryRain(ts){
  if(!svVictoryRain.active) return;
  if(!svRefs?.victoryOverlay||!svRefs?.victoryRainCanvas){
    stopSVVictoryRain();
    return;
  }
  if(!svRefs.victoryOverlay.classList.contains('active')){
    stopSVVictoryRain();
    return;
  }

  if(!svVictoryRain.lastTs) svVictoryRain.lastTs=ts;
  const dt=Math.min((ts-svVictoryRain.lastTs)/1000,0.05);
  svVictoryRain.lastTs=ts;
  svVictoryRain.frameCount++;
  svVictoryRain.gustPhase+=dt*0.9;
  if(svVictoryRain.frameCount%20===0) resizeSVVictoryRainCanvas(false);

  const canvas=svRefs.victoryRainCanvas;
  const ctx=canvas.getContext('2d');
  if(!ctx){
    stopSVVictoryRain();
    return;
  }
  const w=svVictoryRain.width;
  const h=svVictoryRain.height;
  const wind=svVictoryRain.wind+Math.sin(svVictoryRain.gustPhase)*11;
  ctx.clearRect(0,0,w,h);

  for(let i=0;i<svVictoryRain.drops.length;i++){
    const d=svVictoryRain.drops[i];
    d.y+=d.vy*dt;
    d.x+=(d.vx+wind)*dt;

    if(d.y-d.len>h+20||d.x<-30||d.x>w+30){
      svVictoryRain.drops[i]=createSVVictoryRainDrop(true);
      continue;
    }

    const dx=((d.vx+wind)/d.vy)*d.len;
    const x0=d.x;
    const y0=d.y;
    const x1=d.x+dx;
    const y1=d.y+d.len;
    const g=ctx.createLinearGradient(x0,y0,x1,y1);
    g.addColorStop(0,`rgba(230,240,255,0)`);
    g.addColorStop(0.36,`rgba(218,232,252,${d.alpha})`);
    g.addColorStop(1,`rgba(218,232,252,0)`);
    ctx.strokeStyle=g;
    ctx.lineWidth=d.width;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    ctx.lineTo(x1,y1);
    ctx.stroke();
  }

  svVictoryRain.rafId=requestAnimationFrame(stepSVVictoryRain);
}

function startSVVictoryRain(){
  if(!svRefs?.victoryRainCanvas) return;
  stopSVVictoryRain();
  svVictoryRain.active=true;
  svVictoryRain.lastTs=0;
  svVictoryRain.frameCount=0;
  resizeSVVictoryRainCanvas(true);
  svVictoryRain.rafId=requestAnimationFrame(stepSVVictoryRain);
}

function stopSVVictoryRain(){
  svVictoryRain.active=false;
  if(svVictoryRain.rafId){
    cancelAnimationFrame(svVictoryRain.rafId);
    svVictoryRain.rafId=null;
  }
  svVictoryRain.lastTs=0;
  svVictoryRain.frameCount=0;
  if(svRefs?.victoryRainCanvas){
    const ctx=svRefs.victoryRainCanvas.getContext('2d');
    if(ctx) ctx.clearRect(0,0,svVictoryRain.width||0,svVictoryRain.height||0);
  }
}

function stepSVDefeatMotion(ts){
  if(!svDefeatMotion.active) return;
  if(!svRefs?.defeatArt||!svRefs?.defeatImage){
    stopSVDefeatMotion();
    return;
  }

  if(!svDefeatMotion.lastTs) svDefeatMotion.lastTs=ts;
  const frame=Math.min((ts-svDefeatMotion.lastTs)/16.6667,2);
  svDefeatMotion.lastTs=ts;
  svDefeatMotion.time+=frame/60;

  // Spring target oscillates to mimic web tension.
  svDefeatMotion.target=Math.sin(svDefeatMotion.time*2.25)*11;
  svDefeatMotion.vel+=(svDefeatMotion.target-svDefeatMotion.pos)*(0.16*frame);
  svDefeatMotion.vel*=Math.pow(0.86,frame);
  svDefeatMotion.pos+=svDefeatMotion.vel;

  const tilt=Math.sin(svDefeatMotion.time*1.75)*1.25+svDefeatMotion.vel*0.055;
  const hairSwing=Math.sin(svDefeatMotion.time*3.7)*0.85+Math.sin(svDefeatMotion.time*1.9)*0.35;

  svRefs.defeatArt.style.transform=`translateY(${svDefeatMotion.pos.toFixed(2)}px) rotate(${tilt.toFixed(2)}deg)`;
  svRefs.defeatImage.style.transform=`rotate(${hairSwing.toFixed(2)}deg) skewX(${(hairSwing*0.42).toFixed(2)}deg)`;

  svDefeatMotion.rafId=requestAnimationFrame(stepSVDefeatMotion);
}

function startSVDefeatMotion(){
  if(!svRefs?.defeatArt||!svRefs?.defeatImage) return;
  stopSVDefeatMotion();
  svDefeatMotion.active=true;
  svDefeatMotion.lastTs=0;
  svDefeatMotion.time=0;
  svDefeatMotion.pos=0;
  svDefeatMotion.vel=0;
  svDefeatMotion.target=0;
  svRefs.defeatArt.style.transform='translateY(0px) rotate(0deg)';
  svRefs.defeatImage.style.transform='rotate(0deg) skewX(0deg)';
  svDefeatMotion.rafId=requestAnimationFrame(stepSVDefeatMotion);
}

function stopSVDefeatMotion(){
  svDefeatMotion.active=false;
  if(svDefeatMotion.rafId){
    cancelAnimationFrame(svDefeatMotion.rafId);
    svDefeatMotion.rafId=null;
  }
  svDefeatMotion.lastTs=0;
  svDefeatMotion.pos=0;
  svDefeatMotion.vel=0;
  svDefeatMotion.target=0;
  if(svRefs?.defeatArt) svRefs.defeatArt.style.transform='translateY(0px) rotate(0deg)';
  if(svRefs?.defeatImage) svRefs.defeatImage.style.transform='rotate(0deg) skewX(0deg)';
}

function showSVVictoryOverlay(){
  if(!svRefs?.victoryOverlay) return;
  if(svAssets.victory.loaded&&svAssets.victory.img&&svRefs.victoryImage){
    svRefs.victoryImage.src=SV_ASSET_PATHS.victory;
  }
  svRefs.victoryOverlay.classList.add('active');
  svRefs.victoryOverlay.setAttribute('aria-hidden','false');
  startSVVictoryRain();
}

function hideSVVictoryOverlay(){
  if(!svRefs?.victoryOverlay) return;
  stopSVVictoryRain();
  svRefs.victoryOverlay.classList.remove('active');
  svRefs.victoryOverlay.setAttribute('aria-hidden','true');
}

function endSpiderVenomGame(winner){
  if(!svState||svState.ended) return;
  svState.ended=true;
  svState.running=false;
  svState.winner=winner;
  if(svState.aiTimeoutId) clearTimeout(svState.aiTimeoutId);
  svState.aiTimeoutId=null;
  if(svState.rafId) cancelAnimationFrame(svState.rafId);
  svState.rafId=null;

  const won=winner==='Spider-Man';
  if(won){
    svRefs.endMessage.style.display='none';
    hideSVDefeatOverlay();
    showSVVictoryOverlay();
    setSpiderStatus('A hero\'s story ends in hope. Return to Focus Mode.','#86efac');
  }else{
    svRefs.endMessage.style.display='none';
    hideSVVictoryOverlay();
    showSVDefeatOverlay();
    setSpiderStatus('With great power came a painful loss. Return to Focus Mode.','#fca5a5');
  }
}

function setSpiderStatus(text,color){
  if(!svState) return;
  svState.status=text;
  if(svRefs.status){
    svRefs.status.textContent=text;
    if(color) svRefs.status.style.color=color;
  }
}

function updateSpiderVenomHUD(){
  if(!svState||!svRefs.spiderHP) return;
  svRefs.spiderHP.style.width=`${svState.hp.spider}%`;
  svRefs.goblinHP.style.width=`${svState.hp.goblin}%`;
  // Critical HP pulsing class
  svRefs.spiderHP.classList.toggle('critical',svState.hp.spider<30&&svState.hp.spider>0);
  svRefs.goblinHP.classList.toggle('critical',svState.hp.goblin<30&&svState.hp.goblin>0);
  svRefs.spiderHP.style.filter=svState.hp.spider<30&&svState.hp.spider>0?'':'none';
  svRefs.goblinHP.style.filter=svState.hp.goblin<30&&svState.hp.goblin>0?'':'none';
  svRefs.spiderHPText.textContent=`${svState.hp.spider} HP`;
  svRefs.goblinHPText.textContent=`${svState.hp.goblin} HP`;
  svRefs.powerFill.style.width=`${Math.max(0,Math.min(100,svState.power.value))}%`;
}

function renderSpiderVenomFrame(ts){
  if(!svRefs.canvas) return;
  const ctx=svRefs.canvas.getContext('2d');
  ctx.clearRect(0,0,SV.W,SV.H);
  drawSVBackground(ctx,ts||0);
  drawSVGroundLighting(ctx,ts||0);
  drawSVGround(ctx);
  drawSVAmbientParticles(ctx,ts||0);
  drawSVChargeAura(ctx,ts||0);
  drawSVCharacters(ctx,ts||0);
  drawSVProjectiles(ctx);
  drawSVImpactBursts(ctx);
  drawSVSparksAndLines(ctx);
  drawSVChargeSparks(ctx);
  drawSVVignette(ctx);
}

function drawBuilding(ctx,b,yBase,color,windowColor,time){
  const y=yBase-b.height;
  ctx.fillStyle=color;
  ctx.fillRect(b.x,y,b.width,b.height);
  if(b.topType==='spire'){
    ctx.beginPath();
    ctx.moveTo(b.x+b.width*0.22,y);
    ctx.lineTo(b.x+b.width*0.5,y-(b.height*0.14));
    ctx.lineTo(b.x+b.width*0.78,y);
    ctx.closePath();
    ctx.fill();
  }

  for(let wx=b.x+6;wx<b.x+b.width-6;wx+=10){
    for(let wy=y+8;wy<yBase-6;wy+=14){
      const blink=Math.sin((wx+wy+b.seed+time*0.0015)*0.04);
      if(blink>0.38){
        ctx.fillStyle=windowColor;
        ctx.fillRect(wx,wy,3,6);
      }
    }
  }
}

function drawSVBackground(ctx,ts){
  const g=ctx.createLinearGradient(0,0,0,SV.H);
  g.addColorStop(0,'#040611');
  g.addColorStop(0.48,'#0c1228');
  g.addColorStop(1,'#111827');
  ctx.fillStyle=g;
  ctx.fillRect(0,0,SV.W,SV.H);

  svState.stars.forEach((s)=>{
    const a=0.25+Math.sin(s.p)*0.35;
    ctx.fillStyle=`rgba(238,242,255,${Math.max(0.06,a)})`;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fill();
  });

  drawSVMoon(ctx,788,92,53,ts);
  drawSVClouds(ctx,0,ts);

  const farOffset=((ts*0.004)%120)-120;
  const nearOffset=((ts*0.013)%180)-180;
  svState.skyline.far.forEach((b)=>{
    drawBuilding(ctx,{...b,x:b.x+farOffset},SV.GROUND_Y-14,'rgba(13,18,34,0.86)','rgba(252,211,77,0.26)',ts);
    drawBuilding(ctx,{...b,x:b.x+farOffset+120},SV.GROUND_Y-14,'rgba(13,18,34,0.86)','rgba(252,211,77,0.26)',ts);
  });
  svState.skyline.near.forEach((b)=>{
    drawBuilding(ctx,{...b,x:b.x+nearOffset},SV.GROUND_Y+6,'rgba(10,14,26,0.96)','rgba(251,191,36,0.44)',ts);
    drawBuilding(ctx,{...b,x:b.x+nearOffset+180},SV.GROUND_Y+6,'rgba(10,14,26,0.96)','rgba(251,191,36,0.44)',ts);
  });

  svState.skyline.iconic.forEach((tower)=>{
    const x=tower.x+(Math.sin(ts*0.0004+tower.x)*2);
    const y=SV.GROUND_Y+8-tower.height;
    ctx.fillStyle='rgba(22,29,47,0.98)';
    ctx.fillRect(x,y,tower.width,tower.height);
    ctx.beginPath();
    ctx.moveTo(x+tower.width*0.3,y);
    ctx.lineTo(x+tower.width*0.5,y-tower.spire);
    ctx.lineTo(x+tower.width*0.7,y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle='rgba(255,213,79,0.56)';
    for(let wy=y+14;wy<SV.GROUND_Y-12;wy+=16){
      ctx.fillRect(x+tower.width*0.23,wy,4,7);
      ctx.fillRect(x+tower.width*0.52,wy,4,7);
    }
  });

  drawSVClouds(ctx,1,ts);

  const atmosphere=ctx.createLinearGradient(0,0,0,SV.H);
  atmosphere.addColorStop(0,'rgba(56,80,125,0.12)');
  atmosphere.addColorStop(0.45,'rgba(18,30,54,0.08)');
  atmosphere.addColorStop(1,'rgba(0,0,0,0.26)');
  ctx.fillStyle=atmosphere;
  ctx.fillRect(0,0,SV.W,SV.H);
}

function drawSVMoon(ctx,cx,cy,r,ts){
  const halo=ctx.createRadialGradient(cx,cy,r*0.75,cx,cy,r*2.8);
  halo.addColorStop(0,'rgba(245,248,255,0.2)');
  halo.addColorStop(0.35,'rgba(225,235,255,0.12)');
  halo.addColorStop(1,'rgba(225,235,255,0)');
  ctx.fillStyle=halo;
  ctx.beginPath();
  ctx.arc(cx,cy,r*2.8,0,Math.PI*2);
  ctx.fill();

  const moonTex=ctx.createRadialGradient(cx-r*0.2,cy-r*0.28,r*0.2,cx,cy,r);
  moonTex.addColorStop(0,'rgba(251,253,255,0.97)');
  moonTex.addColorStop(0.55,'rgba(227,232,242,0.95)');
  moonTex.addColorStop(1,'rgba(187,197,214,0.96)');
  ctx.fillStyle=moonTex;
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fill();

  SV_MOON_CRATERS.forEach((cr)=>{
    const drift=Math.sin(ts*0.0005+cr.x)*0.8;
    ctx.fillStyle=`rgba(145,156,177,${cr.a})`;
    ctx.beginPath();
    ctx.arc(cx+cr.x+drift,cy+cr.y,cr.r,0,Math.PI*2);
    ctx.fill();
  });

  ctx.strokeStyle='rgba(244,247,255,0.35)';
  ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.arc(cx,cy,r-1.2,0,Math.PI*2);
  ctx.stroke();
}

function drawSVClouds(ctx,layer,ts){
  svState.clouds.forEach((cloud)=>{
    if(cloud.layer!==layer) return;
    const wobble=Math.sin(ts*0.0003+cloud.puffSeed)*3;
    const y=cloud.y+wobble;
    const grad=ctx.createLinearGradient(cloud.x,y,cloud.x,y+cloud.h);
    grad.addColorStop(0,`rgba(220,230,246,${cloud.alpha})`);
    grad.addColorStop(1,`rgba(181,197,223,${cloud.alpha*0.45})`);
    ctx.fillStyle=grad;

    ctx.beginPath();
    ctx.ellipse(cloud.x, y, cloud.w*0.32, cloud.h*0.65, 0, 0, Math.PI*2);
    ctx.ellipse(cloud.x+cloud.w*0.22, y-cloud.h*0.2, cloud.w*0.26, cloud.h*0.5, 0, 0, Math.PI*2);
    ctx.ellipse(cloud.x-cloud.w*0.2, y-cloud.h*0.12, cloud.w*0.24, cloud.h*0.45, 0, 0, Math.PI*2);
    ctx.ellipse(cloud.x+cloud.w*0.06, y+cloud.h*0.1, cloud.w*0.38, cloud.h*0.55, 0, 0, Math.PI*2);
    ctx.fill();
  });
}

function drawSVGround(ctx){
  const road=ctx.createLinearGradient(0,SV.GROUND_Y,0,SV.H);
  road.addColorStop(0,'#212c3b');
  road.addColorStop(1,'#090d18');
  ctx.fillStyle=road;
  ctx.fillRect(0,SV.GROUND_Y,SV.W,SV.H-SV.GROUND_Y);

  ctx.fillStyle='rgba(148,163,184,0.08)';
  for(let x=0;x<SV.W;x+=120){
    ctx.fillRect(x,SV.GROUND_Y+4,70,4);
  }

  ctx.strokeStyle='rgba(209,213,219,0.24)';
  ctx.lineWidth=2;
  ctx.setLineDash([16,14]);
  ctx.beginPath();
  ctx.moveTo(0,SV.GROUND_Y+38);
  ctx.lineTo(SV.W,SV.GROUND_Y+38);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSVPowerInWorld(ctx,ts){
  const spiderX=svState.pose?.spiderX ?? SV.SPIDER_X;
  const spiderY=svState.pose?.spiderY ?? SV.GROUND_Y;
  const w=150,h=14;
  const x=spiderX-(w*0.5);
  const y=spiderY-256;
  const shownPower=Math.max(0,Math.min(100,svState.power.display));

  ctx.save();
  ctx.shadowColor='rgba(96,165,250,0.36)';
  ctx.shadowBlur=16;
  ctx.fillStyle='rgba(3,7,18,0.86)';
  svRoundedRectPath(ctx,x-6,y-8,w+12,h+16,10);
  ctx.fill();
  ctx.restore();

  const pg=ctx.createLinearGradient(x,0,x+w,0);
  pg.addColorStop(0,'#22c55e');
  pg.addColorStop(0.5,'#facc15');
  pg.addColorStop(1,'#dc2626');
  ctx.fillStyle=pg;
  svRoundedRectPath(ctx,x,y,w,h,7);
  ctx.fill();

  const fillW=w*(shownPower/100);
  ctx.fillStyle='rgba(255,255,255,0.58)';
  svRoundedRectPath(ctx,x,y,Math.max(0,fillW),h,7);
  ctx.fill();

  const shineX=x+((ts*0.13)%(w+20))-20;
  const shine=ctx.createLinearGradient(shineX,0,shineX+16,0);
  shine.addColorStop(0,'rgba(255,255,255,0)');
  shine.addColorStop(0.5,'rgba(255,255,255,0.45)');
  shine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=shine;
  svRoundedRectPath(ctx,x,y,w,h,7);
  ctx.fill();

  ctx.strokeStyle='rgba(226,232,240,0.92)';
  ctx.lineWidth=1.2;
  svRoundedRectPath(ctx,x,y,w,h,7);
  ctx.stroke();

  ctx.strokeStyle='rgba(96,165,250,0.45)';
  ctx.lineWidth=1;
  svRoundedRectPath(ctx,x-2,y-2,w+4,h+4,8);
  ctx.stroke();

  ctx.strokeStyle='rgba(254,240,138,0.92)';
  ctx.lineWidth=2;
  svRoundedRectPath(ctx,x+w*0.58,y-1,w*0.1,h+2,6);
  ctx.stroke();

  ctx.fillStyle='rgba(226,232,240,0.9)';
  ctx.font='800 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('POWER',x+2,y-11);
}

function drawSVCharacters(ctx,ts){
  const t=(ts||0)*0.001;
  const spiderBreath=Math.sin(t*2.3)*2.8;
  const goblinHover=Math.sin(t*2.1+0.9)*6;
  const spiderDamageJitter=svState.flashes.spider>0?(Math.random()-0.5)*4:0;
  const goblinDamageJitter=svState.flashes.goblin>0?(Math.random()-0.5)*5:0;

  const spiderX=SV.SPIDER_X+spiderDamageJitter;
  const spiderY=SV.GROUND_Y+spiderBreath;
  const goblinX=SV.GOBLIN_X+goblinDamageJitter;
  const goblinY=SV.GROUND_Y-24+goblinHover;
  svState.pose.spiderX=spiderX;
  svState.pose.spiderY=spiderY;
  svState.pose.goblinX=goblinX;
  svState.pose.goblinY=goblinY;

  drawCharacterAura(ctx,spiderX,spiderY-110,'rgba(96,165,250,0.28)','rgba(244,63,94,0.2)',72,114);
  drawCharacterAura(ctx,goblinX,goblinY-114,'rgba(74,222,128,0.26)','rgba(34,197,94,0.19)',74,116);

  drawSpiderMan(ctx,spiderX,spiderY,svState.flashes.spider>0,t);
  drawGreenGoblin(ctx,goblinX,goblinY,svState.flashes.goblin>0,t);
}

function drawCharacterAura(ctx,x,y,coreColor,edgeColor,coreR,edgeR){
  const edge=ctx.createRadialGradient(x,y,coreR*0.35,x,y,edgeR);
  edge.addColorStop(0,coreColor);
  edge.addColorStop(0.7,edgeColor);
  edge.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=edge;
  ctx.beginPath();
  ctx.arc(x,y,edgeR,0,Math.PI*2);
  ctx.fill();
}

function svRoundedRectPath(ctx,x,y,w,h,r){
  const rr=Math.max(0,Math.min(r,Math.min(w,h)*0.5));
  ctx.beginPath();
  ctx.moveTo(x+rr,y);
  ctx.lineTo(x+w-rr,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+rr);
  ctx.lineTo(x+w,y+h-rr);
  ctx.quadraticCurveTo(x+w,y+h,x+w-rr,y+h);
  ctx.lineTo(x+rr,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-rr);
  ctx.lineTo(x,y+rr);
  ctx.quadraticCurveTo(x,y,x+rr,y);
  ctx.closePath();
}

function svDrawSpriteAnchored(ctx,img,anchorX,anchorY,maxW,maxH,ux,uy){
  const iw=img.naturalWidth||img.width;
  const ih=img.naturalHeight||img.height;
  if(!iw||!ih) return null;
  const scale=Math.min(maxW/iw,maxH/ih);
  const w=iw*scale;
  const h=ih*scale;
  const x=anchorX-w*ux;
  const y=anchorY-h*uy;
  ctx.drawImage(img,x,y,w,h);
  return {x,y,w,h};
}

function drawSpiderMan(ctx,x,groundY,isFlashing,t){
  ctx.save();
  ctx.shadowColor=isFlashing?'rgba(96,165,250,0.9)':'rgba(96,165,250,0.45)';
  ctx.shadowBlur=isFlashing?22:13;

  ctx.translate(x,groundY-108);
  ctx.rotate(Math.sin(t*3.4)*0.02);

  if(svAssets.spider.loaded&&svAssets.spider.img){
    ctx.filter=`brightness(${isFlashing?1.2:1.13}) contrast(${isFlashing?1.16:1.12}) saturate(${isFlashing?1.2:1.11})`;
    svDrawSpriteAnchored(ctx,svAssets.spider.img,0,126,322,258,0.5,0.82);
    ctx.filter='none';

    svState.burnMarks.forEach((mark)=>{
      ctx.fillStyle=`rgba(18,18,18,${mark.alpha})`;
      ctx.beginPath();
      ctx.ellipse(mark.x,mark.y,mark.r,mark.r*0.7,0,0,Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
    return;
  }

  const torso=ctx.createLinearGradient(0,-4,0,88);
  torso.addColorStop(0,'#f43f5e');
  torso.addColorStop(1,'#1d4ed8');
  ctx.fillStyle=torso;
  svRoundedRectPath(ctx,-24,12,48,76,16);
  ctx.fill();

  ctx.fillStyle='#1d4ed8';
  svRoundedRectPath(ctx,-37,26,15,56,9); ctx.fill();
  svRoundedRectPath(ctx,22,26,15,56,9); ctx.fill();
  svRoundedRectPath(ctx,-19,84,14,40,8); ctx.fill();
  svRoundedRectPath(ctx,5,84,14,40,8); ctx.fill();

  ctx.fillStyle='#ef4444';
  ctx.beginPath();
  ctx.arc(0,-1,24,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle='rgba(255,255,255,0.96)';
  ctx.beginPath(); ctx.ellipse(-8,-6,7,12,-0.1,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8,-6,7,12,0.1,0,Math.PI*2); ctx.fill();

  ctx.strokeStyle='rgba(230,230,230,0.28)';
  ctx.lineWidth=1;
  for(let i=-16;i<=16;i+=6){
    ctx.beginPath();
    ctx.moveTo(i,20);
    ctx.lineTo(i*0.6,86);
    ctx.stroke();
  }

  svState.burnMarks.forEach((mark)=>{
    ctx.fillStyle=`rgba(18,18,18,${mark.alpha})`;
    ctx.beginPath();
    ctx.ellipse(mark.x,mark.y,mark.r,mark.r*0.7,0,0,Math.PI*2);
    ctx.fill();
  });
  ctx.restore();
}

function drawGreenGoblin(ctx,x,groundY,isFlashing,t){
  ctx.save();
  ctx.shadowColor=isFlashing?'rgba(74,222,128,0.9)':'rgba(74,222,128,0.44)';
  ctx.shadowBlur=isFlashing?23:13;

  ctx.translate(x,groundY-108);
  ctx.rotate(Math.sin(t*2.8+1.4)*0.03);

  if(svAssets.goblin.loaded&&svAssets.goblin.img){
    ctx.filter=`brightness(${isFlashing?1.16:1.07}) contrast(${isFlashing?1.14:1.1}) saturate(${isFlashing?1.03:0.98})`;
    svDrawSpriteAnchored(ctx,svAssets.goblin.img,0,125,378,292,0.5,0.8);
    ctx.filter='none';
    svState.webMarks.forEach((mark)=> drawGoblinWebMark(ctx,mark));
    ctx.restore();
    return;
  }

  const boardGrad=ctx.createLinearGradient(-54,95,54,95);
  boardGrad.addColorStop(0,'#7c3aed');
  boardGrad.addColorStop(1,'#06b6d4');
  ctx.fillStyle=boardGrad;
  svRoundedRectPath(ctx,-56,94,112,14,8);
  ctx.fill();

  const armor=ctx.createLinearGradient(0,10,0,90);
  armor.addColorStop(0,'#22c55e');
  armor.addColorStop(1,'#14532d');
  ctx.fillStyle=armor;
  svRoundedRectPath(ctx,-24,14,48,72,16);
  ctx.fill();

  ctx.fillStyle='#15803d';
  svRoundedRectPath(ctx,-40,26,16,48,8); ctx.fill();
  svRoundedRectPath(ctx,24,26,16,48,8); ctx.fill();
  svRoundedRectPath(ctx,-18,84,14,28,8); ctx.fill();
  svRoundedRectPath(ctx,4,84,14,28,8); ctx.fill();

  ctx.fillStyle='#84cc16';
  ctx.beginPath();
  ctx.ellipse(0,-2,24,22,0,0,Math.PI*2);
  ctx.fill();

  ctx.fillStyle='rgba(17,24,39,0.9)';
  ctx.beginPath(); ctx.ellipse(-9,-7,7,9,-0.2,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9,-7,7,9,0.2,0,Math.PI*2); ctx.fill();

  ctx.fillStyle='rgba(250,250,210,0.95)';
  ctx.beginPath();
  ctx.moveTo(-5,8); ctx.lineTo(0,16); ctx.lineTo(5,8);
  ctx.closePath();
  ctx.fill();

  svState.webMarks.forEach((mark)=> drawGoblinWebMark(ctx,mark));
  ctx.restore();
}

function drawGoblinWebMark(ctx,mark){
  ctx.save();
  ctx.translate(mark.x,mark.y);
  ctx.rotate(mark.rot);
  ctx.scale(mark.scale,mark.scale);
  const spokes=mark.spokes||7;
  const radius=mark.radius||12;
  const rings=mark.rings||2;

  ctx.strokeStyle='rgba(243,248,255,0.9)';
  ctx.lineWidth=1.5;
  for(let r=1;r<=rings;r++){
    const rr=radius*(r/(rings+0.6));
    ctx.beginPath();
    for(let i=0;i<=spokes;i++){
      const a=(Math.PI*2/spokes)*i;
      const wobble=1+Math.sin(a*2.2+r*0.8)*0.08;
      const px=Math.cos(a)*rr*wobble;
      const py=Math.sin(a)*rr*(1-Math.sin(a*1.6)*0.05);
      if(i===0){
        ctx.moveTo(px,py);
      }else{
        ctx.lineTo(px,py);
      }
    }
    ctx.stroke();
  }

  ctx.strokeStyle='rgba(250,253,255,0.92)';
  ctx.lineWidth=1.7;
  for(let i=0;i<spokes;i++){
    const a=(Math.PI*2/spokes)*i;
    const len=radius*(mark.spread?.[i]||1);
    const sx=Math.cos(a)*2;
    const sy=Math.sin(a)*2;
    const ex=Math.cos(a)*len;
    const ey=Math.sin(a)*len;
    ctx.beginPath();
    ctx.moveTo(sx,sy);
    ctx.lineTo(ex,ey);
    ctx.stroke();

    ctx.fillStyle='rgba(250,253,255,0.9)';
    ctx.beginPath();
    ctx.arc(ex,ey,1.2,0,Math.PI*2);
    ctx.fill();
  }

  ctx.fillStyle='rgba(250,253,255,0.95)';
  ctx.beginPath();
  ctx.arc(0,0,2.2,0,Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function getSpiderWebOrigin(){
  const px=svState?.pose?.spiderX ?? SV.SPIDER_X;
  const py=svState?.pose?.spiderY ?? SV.GROUND_Y;
  return {x:px+96,y:py-166};
}

function drawWebStrand(ctx,originX,originY,tipX,tipY,life){
  const dx=tipX-originX;
  const dy=tipY-originY;
  const dist=Math.hypot(dx,dy);
  const nx=dist>0?(-dy/dist):0;
  const ny=dist>0?(dx/dist):0;
  const arc=Math.min(22,dist*0.05)+(Math.sin(life*20)*2.2);
  const cx=(originX+tipX)*0.5+nx*arc;
  const cy=(originY+tipY)*0.5+ny*(arc*0.7);

  ctx.save();
  ctx.shadowColor='rgba(248,250,252,0.45)';
  ctx.shadowBlur=8;
  ctx.strokeStyle='rgba(242,248,255,0.92)';
  ctx.lineWidth=2.1;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  ctx.beginPath();
  ctx.moveTo(originX,originY);
  ctx.quadraticCurveTo(cx,cy,tipX,tipY);
  ctx.stroke();

  ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,255,255,0.58)';
  ctx.lineWidth=0.9;
  ctx.beginPath();
  ctx.moveTo(originX+nx*0.7,originY+ny*0.7);
  ctx.quadraticCurveTo(cx+nx*0.8,cy+ny*0.8,tipX+nx*0.7,tipY+ny*0.7);
  ctx.stroke();

  const branchCount=Math.max(3,Math.min(8,Math.floor(dist/60)));
  ctx.strokeStyle='rgba(232,241,252,0.78)';
  ctx.lineWidth=1;
  for(let i=1;i<=branchCount;i++){
    const t=i/(branchCount+1);
    const inv=1-t;
    const bx=inv*inv*originX+2*inv*t*cx+t*t*tipX;
    const by=inv*inv*originY+2*inv*t*cy+t*t*tipY;
    const spread=(3+Math.sin(life*14+i*0.7)*1.4)*(1-t*0.45);
    ctx.beginPath();
    ctx.moveTo(bx,by);
    ctx.lineTo(bx+nx*spread,by+ny*spread);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx,by);
    ctx.lineTo(bx-nx*(spread*0.86),by-ny*(spread*0.86));
    ctx.stroke();
  }
  ctx.restore();
}

function drawSVProjectiles(ctx){
  svState.projectiles.forEach((p)=>{
    if(p.kind==='web'){
      const origin=getSpiderWebOrigin();
      const shootProgress=Math.min(1,p.life/0.08);
      const tipX=origin.x+(p.x-origin.x)*shootProgress;
      const tipY=origin.y+(p.y-origin.y)*shootProgress;

      drawWebStrand(ctx,origin.x,origin.y,tipX,tipY,p.life);

      ctx.save();
      ctx.shadowColor='rgba(250,250,255,0.52)';
      ctx.shadowBlur=7;
      ctx.fillStyle='rgba(243,248,255,0.95)';
      const tipR=Math.max(3.4,p.r-1.6+Math.sin(p.life*22)*0.45);
      ctx.beginPath();
      ctx.moveTo(tipX+tipR,tipY);
      for(let i=1;i<8;i++){
        const a=(Math.PI*2/8)*i;
        const rr=tipR*(0.78+Math.sin(i*1.9+p.life*8)*0.14);
        ctx.lineTo(tipX+Math.cos(a)*rr,tipY+Math.sin(a)*rr);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle='rgba(224,236,249,0.85)';
      ctx.lineWidth=0.9;
      ctx.beginPath();
      ctx.arc(tipX,tipY,tipR*0.82,0,Math.PI*2);
      ctx.stroke();
      ctx.restore();
    }else{
      p.trail.forEach((pt,idx)=>{
        const a=(idx+1)/p.trail.length;
        ctx.fillStyle=`rgba(251,146,60,${0.08+a*0.25})`;
        ctx.beginPath();
        ctx.arc(pt.x,pt.y,2+a*3,0,Math.PI*2);
        ctx.fill();
      });

      const grad=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,22);
      grad.addColorStop(0,'rgba(255,241,180,1)');
      grad.addColorStop(0.4,'rgba(251,146,60,0.95)');
      grad.addColorStop(1,'rgba(127,29,29,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(p.x,p.y,22,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle='rgba(249,115,22,0.95)';
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    }
  });
}

function drawSVImpactBursts(ctx){
  svState.impactBursts.forEach((burst)=>{
    const p=burst.life/burst.maxLife;
    const alpha=Math.max(0,1-p);
    // Multi-ring shockwave
    for(let ring=0;ring<3;ring++){
      const delay=ring*0.06;
      const ringP=Math.max(0,Math.min(1,(burst.life-delay)/(burst.maxLife-delay)));
      if(ringP<=0) continue;
      const ringAlpha=Math.max(0,(1-ringP)*(1-ring*0.3));
      const radius=burst.radius*(0.3+ringP*0.9)*(1+ring*0.25);
      ctx.strokeStyle=`rgba(${burst.rgb}, ${ringAlpha})`;
      ctx.lineWidth=3-ring*0.8;
      ctx.beginPath();
      ctx.arc(burst.x,burst.y,radius,0,Math.PI*2);
      ctx.stroke();
    }
    // Inner glow
    const glowR=burst.radius*(0.2+p*0.3);
    const glow=ctx.createRadialGradient(burst.x,burst.y,0,burst.x,burst.y,glowR);
    glow.addColorStop(0,`rgba(${burst.rgb}, ${alpha*0.6})`);
    glow.addColorStop(1,`rgba(${burst.rgb}, 0)`);
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.arc(burst.x,burst.y,glowR,0,Math.PI*2);
    ctx.fill();

    for(let i=0;i<8;i++){
      const a=(Math.PI*2/8)*i+(p*0.4);
      const radius2=burst.radius*(0.4+p);
      const px=burst.x+Math.cos(a)*radius2;
      const py=burst.y+Math.sin(a)*radius2;
      ctx.fillStyle=`rgba(${burst.rgb}, ${alpha*0.7})`;
      ctx.beginPath();
      ctx.arc(px,py,2.2,0,Math.PI*2);
      ctx.fill();
    }
  });
}

/* ══════════════════════════════════════════════
   NEW DRAWING FUNCTIONS — Ambient & Effects
   ══════════════════════════════════════════════ */

function drawSVAmbientParticles(ctx,ts){
  if(!svState) return;
  // Embers
  svState.embers.forEach(e=>{
    const fadeIn=Math.min(1,e.life*3);
    const fadeOut=Math.max(0,1-(e.life/e.maxLife));
    const a=e.alpha*fadeIn*fadeOut;
    if(a<=0.01) return;
    const glow=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.size*3);
    glow.addColorStop(0,`hsla(${e.hue},90%,65%,${a})`);
    glow.addColorStop(0.4,`hsla(${e.hue},80%,55%,${a*0.5})`);
    glow.addColorStop(1,`hsla(${e.hue},70%,40%,0)`);
    ctx.fillStyle=glow;
    ctx.beginPath();
    ctx.arc(e.x,e.y,e.size*3,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle=`hsla(${e.hue},95%,75%,${a})`;
    ctx.beginPath();
    ctx.arc(e.x,e.y,e.size*0.6,0,Math.PI*2);
    ctx.fill();
  });

  // Dust motes
  svState.dustMotes.forEach(d=>{
    ctx.fillStyle=`rgba(200,210,225,${d.alpha})`;
    ctx.beginPath();
    ctx.arc(d.x,d.y,d.size,0,Math.PI*2);
    ctx.fill();
  });

  // Shooting star
  if(svState.shootingStar){
    const ss=svState.shootingStar;
    const a=Math.max(0,1-(ss.life/ss.maxLife));
    const dx=ss.vx*0.03;
    const dy=ss.vy*0.03;
    const grad=ctx.createLinearGradient(ss.x-dx*ss.len*0.5,ss.y-dy*ss.len*0.5,ss.x,ss.y);
    grad.addColorStop(0,`rgba(255,255,255,0)`);
    grad.addColorStop(0.6,`rgba(240,248,255,${a*0.5})`);
    grad.addColorStop(1,`rgba(255,255,255,${a*0.9})`);
    ctx.strokeStyle=grad;
    ctx.lineWidth=2;
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(ss.x-dx*ss.len,ss.y-dy*ss.len);
    ctx.lineTo(ss.x,ss.y);
    ctx.stroke();
    // Bright head
    ctx.fillStyle=`rgba(255,255,255,${a})`;
    ctx.beginPath();
    ctx.arc(ss.x,ss.y,1.5,0,Math.PI*2);
    ctx.fill();
  }

  // Lightning flash overlay
  if(svState.lightningFlash>0){
    ctx.fillStyle=`rgba(200,210,240,${svState.lightningFlash})`;
    ctx.fillRect(0,0,SV.W,SV.H);
  }
}

function drawSVGroundLighting(ctx,ts){
  // Street light pools
  const lights=[
    {x:120,r:80},{x:380,r:70},{x:620,r:75},{x:850,r:65}
  ];
  lights.forEach(l=>{
    const flicker=0.85+Math.sin((ts||0)*0.002+l.x)*0.15;
    const grad=ctx.createRadialGradient(l.x,SV.GROUND_Y,0,l.x,SV.GROUND_Y,l.r);
    grad.addColorStop(0,`rgba(255,213,79,${0.12*flicker})`);
    grad.addColorStop(0.5,`rgba(255,180,40,${0.06*flicker})`);
    grad.addColorStop(1,'rgba(255,180,40,0)');
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.ellipse(l.x,SV.GROUND_Y+8,l.r,l.r*0.35,0,0,Math.PI*2);
    ctx.fill();
  });

  // Wet road reflections (subtle)
  ctx.fillStyle='rgba(148,180,220,0.04)';
  for(let x=20;x<SV.W;x+=160){
    const w=40+Math.random()*30;
    ctx.fillRect(x,SV.GROUND_Y+18,w,3);
    ctx.fillRect(x+10,SV.GROUND_Y+28,w*0.7,2);
  }
}

function drawSVChargeAura(ctx,ts){
  if(!svState||!svState.power.charging) return;
  const spX=svState.pose.spiderX;
  const spY=svState.pose.spiderY;
  const power=svState.power.display/100;
  const t=(ts||0)*0.001;
  const cx=spX;
  const cy=spY-110;

  // Pulsating energy ring
  const ringR=50+power*30+Math.sin(t*8)*5;
  const ringAlpha=0.15+power*0.2;

  // Inner aura
  const inner=ctx.createRadialGradient(cx,cy,10,cx,cy,ringR);
  inner.addColorStop(0,`rgba(96,165,250,${ringAlpha*0.5})`);
  inner.addColorStop(0.6,`rgba(59,130,246,${ringAlpha*0.3})`);
  inner.addColorStop(1,'rgba(59,130,246,0)');
  ctx.fillStyle=inner;
  ctx.beginPath();
  ctx.arc(cx,cy,ringR,0,Math.PI*2);
  ctx.fill();

  // Animated ring
  ctx.save();
  ctx.strokeStyle=`rgba(147,197,253,${ringAlpha})`;
  ctx.lineWidth=2+power*1.5;
  ctx.setLineDash([6+Math.sin(t*12)*3,8]);
  ctx.lineDashOffset=-t*80;
  ctx.beginPath();
  ctx.arc(cx,cy,ringR*0.85,0,Math.PI*2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Color shifts to red as power rises
  if(power>0.6){
    const redP=(power-0.6)/0.4;
    ctx.save();
    const outer=ctx.createRadialGradient(cx,cy,ringR*0.6,cx,cy,ringR*1.2);
    outer.addColorStop(0,`rgba(239,68,68,${redP*0.12})`);
    outer.addColorStop(1,'rgba(239,68,68,0)');
    ctx.fillStyle=outer;
    ctx.beginPath();
    ctx.arc(cx,cy,ringR*1.2,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

function drawSVSparksAndLines(ctx){
  if(!svState) return;

  // Impact sparks
  svState.sparks.forEach(s=>{
    const a=Math.max(0,1-s.life/s.maxLife);
    ctx.fillStyle=`rgba(${s.rgb},${a})`;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.size*a,0,Math.PI*2);
    ctx.fill();
    // Spark trail
    ctx.strokeStyle=`rgba(${s.rgb},${a*0.4})`;
    ctx.lineWidth=s.size*0.5;
    ctx.beginPath();
    ctx.moveTo(s.x,s.y);
    ctx.lineTo(s.x-s.vx*0.015,s.y-s.vy*0.015);
    ctx.stroke();
  });

  // Speed lines (from center of canvas on crit)
  svState.speedLines.forEach(sl=>{
    const a=Math.max(0,1-sl.life/sl.maxLife);
    const expand=sl.life/sl.maxLife;
    const cx=SV.W*0.5;
    const cy=SV.H*0.45;
    const from=sl.innerR+expand*40;
    const to=sl.outerR+expand*60;
    ctx.strokeStyle=`rgba(253,224,71,${a*0.6})`;
    ctx.lineWidth=sl.width*(1-expand*0.5);
    ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(sl.angle)*from,cy+Math.sin(sl.angle)*from);
    ctx.lineTo(cx+Math.cos(sl.angle)*to,cy+Math.sin(sl.angle)*to);
    ctx.stroke();
  });
}

function drawSVChargeSparks(ctx){
  if(!svState) return;
  svState.chargeSparks.forEach(cs=>{
    const a=Math.max(0,1-cs.life/cs.maxLife);
    ctx.fillStyle=`rgba(147,197,253,${a})`;
    ctx.beginPath();
    ctx.arc(cs.x,cs.y,cs.size*a,0,Math.PI*2);
    ctx.fill();
    // Small glow
    const g=ctx.createRadialGradient(cs.x,cs.y,0,cs.x,cs.y,cs.size*3);
    g.addColorStop(0,`rgba(147,197,253,${a*0.3})`);
    g.addColorStop(1,'rgba(147,197,253,0)');
    ctx.fillStyle=g;
    ctx.beginPath();
    ctx.arc(cs.x,cs.y,cs.size*3,0,Math.PI*2);
    ctx.fill();
  });
}

function drawSVVignette(ctx){
  if(!svState) return;
  // Subtle vignette always present, stronger when charging
  const intensity=svState.power.charging?0.4:0.18;
  const grad=ctx.createRadialGradient(SV.W*0.5,SV.H*0.45,SV.W*0.25,SV.W*0.5,SV.H*0.5,SV.W*0.65);
  grad.addColorStop(0,'rgba(0,0,0,0)');
  grad.addColorStop(1,`rgba(0,0,0,${intensity})`);
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,SV.W,SV.H);
}

/* ══════════════════════════════════════════════
   ENHANCED SOUND SYSTEM
   ══════════════════════════════════════════════ */

function playSVSound(type){
  if(typeof window==='undefined') return;
  try{
    if(!window.AudioContext&&!window.webkitAudioContext) return;
    if(!svState.audioCtx){
      const AC=window.AudioContext||window.webkitAudioContext;
      svState.audioCtx=new AC();
    }
    const ctx=svState.audioCtx;
    const now=ctx.currentTime;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if(type==='web'){
      osc.type='triangle';
      osc.frequency.setValueAtTime(860,now);
      osc.frequency.exponentialRampToValueAtTime(250,now+0.12);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.07,now+0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.15);
      osc.start(now); osc.stop(now+0.16);
    }else if(type==='hit'){
      osc.type='square';
      osc.frequency.setValueAtTime(150,now);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.08,now+0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.12);
      osc.start(now); osc.stop(now+0.13);
    }else if(type==='crit'){
      // Whoosh + impact layered
      osc.type='sawtooth';
      osc.frequency.setValueAtTime(1200,now);
      osc.frequency.exponentialRampToValueAtTime(180,now+0.18);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.1,now+0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.22);
      osc.start(now); osc.stop(now+0.23);
      // Second layer for bass thud
      const osc2=ctx.createOscillator();
      const gain2=ctx.createGain();
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc2.type='sine';
      osc2.frequency.setValueAtTime(80,now);
      gain2.gain.setValueAtTime(0.0001,now);
      gain2.gain.exponentialRampToValueAtTime(0.12,now+0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001,now+0.15);
      osc2.start(now); osc2.stop(now+0.16);
    }else if(type==='goblin'){
      // Sizzle fireball
      osc.type='sawtooth';
      osc.frequency.setValueAtTime(250,now);
      osc.frequency.exponentialRampToValueAtTime(95,now+0.24);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.08,now+0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.26);
      osc.start(now); osc.stop(now+0.27);
      // Sizzle layer
      const sizzle=ctx.createOscillator();
      const sGain=ctx.createGain();
      sizzle.connect(sGain); sGain.connect(ctx.destination);
      sizzle.type='square';
      sizzle.frequency.setValueAtTime(3200,now);
      sizzle.frequency.exponentialRampToValueAtTime(800,now+0.3);
      sGain.gain.setValueAtTime(0.0001,now+0.02);
      sGain.gain.exponentialRampToValueAtTime(0.015,now+0.06);
      sGain.gain.exponentialRampToValueAtTime(0.0001,now+0.32);
      sizzle.start(now+0.02); sizzle.stop(now+0.33);
    }else if(type==='charge'){
      osc.type='sine';
      osc.frequency.setValueAtTime(460,now);
      gain.gain.setValueAtTime(0.0001,now);
      gain.gain.exponentialRampToValueAtTime(0.035,now+0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+0.09);
      osc.start(now); osc.stop(now+0.1);
    }
  }catch(e){}
}

function startSVAmbientHum(){
  if(!svState) return;
  try{
    if(!svState.audioCtx){
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return;
      svState.audioCtx=new AC();
    }
    if(svState.ambientHum) return; // already playing
    const ctx=svState.audioCtx;
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type='sine';
    osc.frequency.setValueAtTime(55,ctx.currentTime);
    gain.gain.setValueAtTime(0.0001,ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.018,ctx.currentTime+0.3);
    osc.start(ctx.currentTime);
    svState.ambientHum={osc,gain};
  }catch(e){}
}

function stopSVAmbientHum(){
  if(!svState||!svState.ambientHum) return;
  try{
    const ctx=svState.audioCtx;
    const {osc,gain}=svState.ambientHum;
    gain.gain.linearRampToValueAtTime(0.0001,ctx.currentTime+0.15);
    osc.stop(ctx.currentTime+0.2);
    svState.ambientHum=null;
  }catch(e){
    svState.ambientHum=null;
  }
}

function cleanupSpiderVenomGame(){
  stopSVAmbientHum();
  if(svState?.aiTimeoutId) clearTimeout(svState.aiTimeoutId);
  if(svState?.shakeTimeoutId) clearTimeout(svState.shakeTimeoutId);
  if(svState?.rafId) cancelAnimationFrame(svState.rafId);
  stopSVDefeatMotion();
  stopSVVictoryRain();

  if(svListeners.keydown) window.removeEventListener('keydown',svListeners.keydown);
  if(svListeners.keyup) window.removeEventListener('keyup',svListeners.keyup);
  if(svListeners.pointerup) window.removeEventListener('pointerup',svListeners.pointerup);
  if(svRefs.canvas&&svListeners.pointerdown) svRefs.canvas.removeEventListener('pointerdown',svListeners.pointerdown);
  if(svRefs.canvas&&svListeners.pointerleave) svRefs.canvas.removeEventListener('pointerleave',svListeners.pointerleave);

  // Remove CSS charging classes
  const powerLabel=document.querySelector('.sv-power-label');
  const powerTrack=document.querySelector('.sv-power-track');
  if(powerLabel) powerLabel.classList.remove('active');
  if(powerTrack) powerTrack.classList.remove('charging');

  svListeners={keydown:null,keyup:null,pointerdown:null,pointerup:null,pointerleave:null};
  svState=null;
  svRefs={};
}
