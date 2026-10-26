'use strict';

const manifest = window.MIRAGE_MANIFEST;
if (!manifest) throw new Error('manifest.js failed to load');

const METHODS = manifest.config.methods || ['glaze','mist','antidb','mirage','metacloak','styleguard'];
const ATTACKS = manifest.config.attacks || ['diffpure','impress++','noisy_upscaling'];
const ARTIST_BACKGROUNDS = new Set(['Art student','Part-time/freelance artist','Full-time/professional artist']);
const $ = id => document.getElementById(id);
const content = $('content');
const nextButton = $('nextButton');
const backButton = $('backButton');
const safe = s => String(s ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

const PRACTICE = [
  {
    kind:'Visual quality',
    instruction:'Choose the image with better overall visual quality.',
    a:'./data/practice/quality/A.png', b:'./data/practice/quality/B.png', right:'A',
    why:'Image A is clearer and has fewer visible degradations.'
  },
  {
    kind:'Artistic style similarity',
    instruction:'Using the reference artworks, choose the image that more closely matches the artistic style. Focus on color, texture, brushwork, shapes, and composition.',
    a:'./data/practice/style/A.png', b:'./data/practice/style/B.png',
    references:['./data/practice/style/references/01.png','./data/practice/style/references/02.png','./data/practice/style/references/03.png'],
    right:'B', why:'Image B more closely follows the visual characteristics shown in the reference artworks.'
  },
  {
    kind:'Generation prompt matching',
    instruction:'Generation prompt: “A painting of a house in jungle.” Choose the image that better follows the prompt.',
    a:'./data/practice/prompt/A.png', b:'./data/practice/prompt/B.png', right:'B',
    why:'Image B better matches the generation prompt.'
  },
  {
    kind:'Robustness judgment',
    instruction:'Using the reference artworks, choose the image that LEAST resembles the artistic style.',
    a:'./data/practice/style/A.png', b:'./data/practice/style/B.png',
    references:['./data/practice/style/references/01.png','./data/practice/style/references/02.png','./data/practice/style/references/03.png'],
    right:'A', why:'Image A carries fewer of the visual characteristics shown in the reference artworks.'
  }
];

function hashSeed(){ return crypto.randomUUID().replaceAll('-',''); }
function shuffle(items){ const out=[...items]; for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out; }
function assignmentKey(){ return 'art_style_protection_session_v9'; }
function save(){ localStorage.setItem(assignmentKey(), JSON.stringify(session)); }
function img(artist,key){ return manifest.artists?.[artist]?.images?.[key] || null; }
function letters(n){ return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0,n).split(''); }

function qualityOriginal(artist,id){
  return img(artist,'artwork_quality/original/'+id) || img(artist,'references/'+id);
}
function qualityProtected(artist,method,id){
  return img(artist,'artwork_quality/protected/'+method+'/'+id);
}

function makeAssignment(){
  const names = shuffle(Object.keys(manifest.artists || {}).filter(n => (manifest.config.artists || []).includes(n)));
  const problems=[];
  for(const name of names){
    const a=manifest.artists[name];
    if(!a || (a.references||[]).length < Number(manifest.config.reference_count||6)){
      problems.push(name+' does not have enough reference artworks');
      continue;
    }

    // Protected-artwork quality trials. The original can come from
    // artwork_quality/original/pXX or, if omitted, references/pXX.
    const qualityIds = [];
    for(const key of Object.keys(a.images||{})){
      const m=key.match(/^artwork_quality\/protected\/[^/]+\/(p\d+)$/i);
      if(m && !qualityIds.includes(m[1].toLowerCase())) qualityIds.push(m[1].toLowerCase());
    }
    const qualityEligible = shuffle(qualityIds.filter(id =>
      qualityOriginal(name,id) && METHODS.every(m => qualityProtected(name,m,id))
    ));
    const qualityCount = Number(manifest.config.protected_artwork_trials||2);
    if(qualityEligible.length < qualityCount){
      problems.push(name+' needs '+qualityCount+' complete artwork_quality sets');
      continue;
    }
    const quality = qualityEligible.slice(0,qualityCount).map((id,k)=>{
      const raw=METHODS.map(method=>({method,url:qualityProtected(name,method,id)}));
      const choices=shuffle(raw).map((c,i)=>({...c,label:letters(raw.length)[i]}));
      return {id:'quality_'+(k+1),artwork_id:id,original:qualityOriginal(name,id),choices};
    });

    // Protection effectiveness: clean + six protection methods, same prompt.
    const effEligible = shuffle((a.prompts||[]).filter(p =>
      img(name,'clean/'+p.id) && METHODS.every(m => img(name,'protected/'+m+'/'+p.id))
    ));
    const effCount = Number(manifest.config.effectiveness_prompt_count||4);
    if(effEligible.length < effCount){
      problems.push(name+' has only '+effEligible.length+' complete protection-effectiveness prompts; needs '+effCount);
      continue;
    }
    const effectiveness = effEligible.slice(0,effCount).map((p,k)=>{
      const raw=[{method:'clean',url:img(name,'clean/'+p.id)},...METHODS.map(method=>({method,url:img(name,'protected/'+method+'/'+p.id)}))];
      const choices=shuffle(raw).map((c,i)=>({...c,label:letters(raw.length)[i]}));
      return {id:'effectiveness_'+(k+1),prompt_id:p.id,prompt:p.text,choices};
    });

    // Robustness: one no-removal baseline + the three configured attacks.
    // Every page shows only the six protected-method outputs. Attack identity is hidden in the UI.
    const conditions=['no_attack',...ATTACKS];
    const usedPromptIds=new Set();
    const robustness=[];
    let robustProblem=false;
    for(const condition of shuffle(conditions)){
      const eligible=shuffle((a.prompts||[]).filter(p=>{
        if(condition==='no_attack') return METHODS.every(m=>img(name,'protected/'+m+'/'+p.id));
        return METHODS.every(m=>img(name,'removed/'+condition+'/'+m+'/'+p.id));
      }));
      if(!eligible.length){ problems.push(name+' has no complete robustness prompt for '+condition); robustProblem=true; break; }
      const p=eligible.find(x=>!usedPromptIds.has(x.id)) || eligible[0];
      usedPromptIds.add(p.id);
      const raw=METHODS.map(method=>({method,url:condition==='no_attack'?img(name,'protected/'+method+'/'+p.id):img(name,'removed/'+condition+'/'+method+'/'+p.id)}));
      const choices=shuffle(raw).map((c,i)=>({...c,label:letters(raw.length)[i]}));
      robustness.push({id:'robustness_'+robustness.length,condition,prompt_id:p.id,prompt:p.text,choices});
    }
    if(robustProblem || robustness.length!==conditions.length) continue;

    return {
      pid:'p_'+hashSeed(), created_at:new Date().toISOString(), version:'github-pages-v9',
      artist:name, artist_display:a.display_name,
      references:shuffle(a.references).slice(0,Number(manifest.config.reference_count||6)),
      quality, effectiveness, robustness:shuffle(robustness),
      progress:{stage:'consent',practice:0,quality:0,effectiveness:0,robustness:0},
      consent:null, verified:false, participant_profile:null, background:null, artist_background:null, answers:[], completed_at:null
    };
  }
  throw new Error(problems.join('; ') || 'No suitable artists configured.');
}

let session;
try{
  session=JSON.parse(localStorage.getItem(assignmentKey())||'null');
  if(!session) session=makeAssignment();
  save();
}catch(e){
  content.innerHTML=`<div class="error"><h2>Dataset configuration problem</h2><p>${safe(e.message)}</p><p>Run <code>python3 scripts/check_dataset.py</code> and <code>python3 scripts/build_manifest.py</code> after adding your data.</p></div>`;
  setButton(false); throw e;
}

let stage=session.progress.stage||'consent';
let practiceIndex=session.progress.practice||0;
let qualityIndex=session.progress.quality||0;
let effectivenessIndex=session.progress.effectiveness||0;
let robustnessIndex=session.progress.robustness||0;
let startTick=Date.now();

function setHeader(label,pct,foot='Art Style Protection Study'){
  $('stepLabel').textContent=label;
  $('loadFill').style.width=Math.max(0,Math.min(100,pct))+'%';
  $('loadFill').parentElement.setAttribute('aria-valuenow',Math.round(pct));
  $('footerText').textContent=foot;
  const names={consent:'Consent',verify:'Human verification',profile:'Participant profile',background:'Background',artist_followup:'Artist experience',intro:'Familiarization',practice:'Practice',quality:'Artwork quality',effectiveness:'Protection effectiveness',robustness:'Robustness evaluation',finish:'Completed',declined:'Study closed'};
  $('stageCount').textContent=names[stage]||'Study';
  document.querySelector('footer.bottom').hidden=false;
}
function setButton(enabled,fn){ nextButton.textContent='Next'; nextButton.disabled=!enabled; nextButton.onclick=enabled?fn:null; }
function setBackButton(show,fn){ backButton.hidden=!show; backButton.onclick=show?fn:null; }
function goTop(){ window.scrollTo({top:0,behavior:'instant'}); }
function references(urls=session.references){ return `<div class="refgrid">${urls.map((u,i)=>`<img src="${safe(u)}" alt="Reference artwork ${i+1}">`).join('')}</div>`; }
function referenceDropdown(){ return `<details class="smallref"><summary>View reference artworks for this artist</summary>${references()}</details>`; }
function imagePanel(c){ return `<div class="imagepanel"><h3>Image ${safe(c.label)}</h3><img src="${safe(c.url)}" alt="Image ${safe(c.label)}"></div>`; }
function record(section,trial,answers){
  const item={section,trial_id:trial.id,prompt_id:trial.prompt_id||null,condition:trial.condition||null,artwork_id:trial.artwork_id||null,displayed_choices:(trial.choices||[]).map(c=>({label:c.label,method:c.method,url:c.url})),answers,time_ms:Date.now()-startTick,submitted_at:new Date().toISOString()};
  const idx=session.answers.findIndex(x=>x.section===section&&x.trial_id===trial.id);
  if(idx>=0) session.answers[idx]=item; else session.answers.push(item);
  save(); autosaveOnline();
}
function existing(section,id){ return session.answers.find(x=>x.section===section&&x.trial_id===id)?.answers||{}; }

function renderConsent(){
  stage='consent';session.progress.stage=stage;save();setHeader('Consent to participate',2);setBackButton(false);setButton(false);
  content.innerHTML=`<section class="consent-simple"><p class="kicker">Research participation</p><h1>Art Style Protection Study</h1><p class="sub">You are invited to take part in a research study about how people perceive original, protected, and AI-generated artwork.</p><div class="consent-box"><h2>What you will do</h2><p>You will view artworks and AI-generated images, compare their visual quality and artistic style, and answer short visual-evaluation questions. The study is designed for desktop or laptop use.</p><h2>Time and risks</h2><p>The study is expected to take approximately 15–25 minutes. Risks are minimal and similar to ordinary computer use.</p><h2>Privacy</h2><p>Your responses are linked to a randomly generated participant ID and submitted to the study's research collection service. You may optionally provide a name and profile image; these are not required to participate. Background questions about art and generative AI are collected to help interpret the study results. Results may be reported in aggregate.</p><h2>Voluntary participation</h2><p>Participation is voluntary. You may stop at any time before completing the study.</p><div class="consent-actions"><button id="consentYes">I consent and wish to continue</button><button id="consentNo" class="quiet-button">I do not consent</button></div></div></section>`;
  $('consentYes').onclick=()=>{session.consent={consented:true,at:new Date().toISOString()};session.progress.stage='verify';save();renderVerify();goTop();};
  $('consentNo').onclick=()=>{session.consent={consented:false,at:new Date().toISOString()};session.progress.stage='declined';save();renderDeclined();};
}
function renderDeclined(){stage='declined';setHeader('Study closed',0);document.querySelector('footer.bottom').hidden=true;content.innerHTML=`<div class="center" style="padding:80px 10px"><h1>Participation declined</h1><p class="sub" style="margin:0 auto">No study evaluation will be collected.</p></div>`;}

function renderVerify(){
  stage='verify';session.progress.stage=stage;save();setHeader('Human verification',5);setBackButton(true,()=>{renderConsent();goTop();});setButton(false);
  const siteKey=manifest.config.turnstile_site_key||'1x00000000000000000000AA';
  content.innerHTML=`<section class="verify-card"><span class="pill">Human verification</span><h1>One quick check before you begin</h1><p>Please complete the verification below. This helps prevent automated or duplicate study submissions.</p><div id="turnstileMount" class="cf-turnstile" data-sitekey="${safe(siteKey)}" data-callback="mirageTurnstilePassed" data-expired-callback="mirageTurnstileExpired"></div><p id="verifyStatus" class="tiny"></p></section>`;
  window.mirageTurnstilePassed=async token=>{
    $('verifyStatus').textContent='Verification received.';
    const endpoint=manifest.config.turnstile_verify_endpoint||'';
    if(endpoint){
      try{
        const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({type:'turnstile_verify',token,pid:session.pid})});
        if(!res.ok) throw new Error('HTTP '+res.status);
        const data=await res.json().catch(()=>({success:true}));
        if(data.success===false) throw new Error('Verification rejected');
      }catch(e){ $('verifyStatus').textContent='Verification could not be confirmed. Please try again.'; setButton(false); return; }
    }
    session.verified=true;session.verified_at=new Date().toISOString();save();setButton(true,()=>{renderProfile();goTop();});
  };
  window.mirageTurnstileExpired=()=>{session.verified=false;save();$('verifyStatus').textContent='Verification expired. Please complete it again.';setButton(false);};
  // In case Turnstile loaded before this screen was rendered, explicitly render it.
  setTimeout(()=>{if(window.turnstile && $('turnstileMount') && !$('turnstileMount').querySelector('iframe')){try{turnstile.render('#turnstileMount',{sitekey:siteKey,callback:window.mirageTurnstilePassed,'expired-callback':window.mirageTurnstileExpired});}catch(_){}}},250);
}

function renderProfile(){
  stage='profile'; session.progress.stage=stage; save(); setHeader('Participant profile',7);
  setBackButton(true,()=>{renderVerify();goTop();});
  const p=session.participant_profile||{};

  content.innerHTML=`<div class="background-layout">
    <div class="background-heading">
      <span class="background-kicker">PARTICIPANT INFORMATION</span>
      <h1>A little about you</h1>
      <p class="sub">Both fields on this page are optional. You may leave them blank and continue.</p>
    </div>
    <form id="profileForm" class="background-card profile-card" novalidate>
      <div class="participant-fields">
        <div class="participant-field">
          <label for="participantName">Name <span class="optional-label">(optional)</span></label>
          <input id="participantName" type="text" maxlength="150" autocomplete="name" placeholder="Your name" value="${safe(p.name||'')}">
        </div>
        <div class="participant-field">
          <label for="participantEmail">Email <span class="optional-label">(optional)</span></label>
          <input id="participantEmail" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com" value="${safe(p.email||'')}">
        </div>
        <div class="profile-note">
          <strong>Optional information</strong>
          <p>You can participate without providing your name or email. These fields are not used to score your study responses.</p>
        </div>
      </div>
    </form>
  </div>`;

  setButton(true,()=>{
    session.participant_profile={
      name:$('participantName').value.trim()||null,
      email:$('participantEmail').value.trim()||null,
      collected_at:new Date().toISOString()
    };
    session.progress.stage='background'; save(); renderBackground(); goTop();
  });
}
function renderBackground(){
  stage='background';session.progress.stage=stage;save();setHeader('Participant background',9);setBackButton(true,()=>{renderProfile();goTop();});
  const prev=session.background||{};const artOptions=['No experience','Casual/hobby experience','Art student','Part-time/freelance artist','Full-time/professional artist','Other'];const familiarityOptions=['Not at all familiar','Slightly familiar','Moderately familiar','Very familiar','Extremely familiar'];const frequencyOptions=['Never','Once or twice','Occasionally','Frequently','Very frequently'];
  const radioList=(name,items,selectedValue)=>items.map(v=>`<label class="background-option"><input type="radio" name="${name}" value="${safe(v)}" ${selectedValue===v?'checked':''}><span>${safe(v)}</span></label>`).join('');
  content.innerHTML=`<div class="background-layout"><div class="background-heading"><span class="background-kicker">PARTICIPANT BACKGROUND</span><h1>Your experience with art and generative AI</h1><p class="sub">Please answer five short questions. These responses help us understand the background of the people making the visual judgments.</p></div><form id="backgroundForm" class="background-card" novalidate><fieldset class="background-question"><legend><span class="background-number">01</span>Art background</legend><p>Which best describes your experience with creating visual art?</p><div class="background-options">${radioList('art_background',artOptions,prev.art_background)}</div><div id="otherArtWrap" class="background-other" ${prev.art_background==='Other'?'':'hidden'}><label for="otherArt">Please specify</label><input id="otherArt" type="text" maxlength="200" value="${safe(prev.art_background_other||'')}" placeholder="Describe your experience"></div></fieldset><fieldset class="background-question"><legend><span class="background-number">02</span>Familiarity with visual art</legend><p>How familiar are you with evaluating differences in visual-art style, composition, color, texture, and technique?</p><div class="background-options background-scale">${radioList('art_familiarity',familiarityOptions,prev.art_familiarity_label)}</div></fieldset><fieldset class="background-question"><legend><span class="background-number">03</span>Familiarity with generative AI</legend><p>How familiar are you with AI image-generation tools such as Stable Diffusion, Midjourney, or DALL·E?</p><div class="background-options background-scale">${radioList('ai_familiarity',familiarityOptions,prev.ai_familiarity_label)}</div></fieldset><fieldset class="background-question"><legend><span class="background-number">04</span>Experience using generative AI</legend><p>How often have you used AI image-generation tools?</p><div class="background-options">${radioList('ai_usage',frequencyOptions,prev.ai_usage)}</div></fieldset><fieldset class="background-question"><legend><span class="background-number">05</span>Familiarity with AI style mimicry</legend><p>Before this study, how familiar were you with using generative AI to imitate or reproduce an artist's visual style?</p><div class="background-options background-scale">${radioList('style_mimicry_familiarity',familiarityOptions,prev.style_mimicry_familiarity_label)}</div></fieldset><p id="backgroundError" class="background-error" role="alert" aria-live="polite"></p></form></div>`;
  const form=$('backgroundForm'),selected=name=>form.querySelector(`input[name="${name}"]:checked`)?.value||null;const valid=()=>Boolean(selected('art_background')&&selected('art_familiarity')&&selected('ai_familiarity')&&selected('ai_usage')&&selected('style_mimicry_familiarity')&&(selected('art_background')!=='Other'||$('otherArt').value.trim()));
  const submit=()=>{if(!valid()){$('backgroundError').textContent='Please answer all five questions.';return;}session.background={art_background:selected('art_background'),art_background_other:selected('art_background')==='Other'?$('otherArt').value.trim():null,art_familiarity:familiarityOptions.indexOf(selected('art_familiarity'))+1,art_familiarity_label:selected('art_familiarity'),ai_familiarity:familiarityOptions.indexOf(selected('ai_familiarity'))+1,ai_familiarity_label:selected('ai_familiarity'),ai_usage:selected('ai_usage'),style_mimicry_familiarity:familiarityOptions.indexOf(selected('style_mimicry_familiarity'))+1,style_mimicry_familiarity_label:selected('style_mimicry_familiarity'),submitted_at:new Date().toISOString()};save();if(ARTIST_BACKGROUNDS.has(session.background.art_background))renderArtistFollowup();else renderIntro();goTop();};
  const update=()=>{$('otherArtWrap').hidden=selected('art_background')!=='Other';$('backgroundError').textContent='';setButton(valid(),submit);};form.querySelectorAll('input[type="radio"]').forEach(el=>el.onchange=update);$('otherArt').oninput=update;update();
}
function renderArtistFollowup(){
  stage='artist_followup';session.progress.stage=stage;save();setHeader('Artist experience',10);setBackButton(true,()=>{renderBackground();goTop();});
  const prev=session.artist_background||{};const years=['Less than 1 year','1–5 years','6–10 years','More than 10 years'];const media=['Digital illustration','Painting','Drawing','Photography','Graphic design','3D art','Mixed media','Other'];const sharing=['Never','Rarely','Sometimes','Often','Very often'];const importance=['Not important at all','Slightly important','Moderately important','Very important','Extremely important'];const awareness=['Yes','No','Unsure','Prefer not to say'];
  const radios=(name,vals,selected)=>vals.map(v=>`<label class="background-option"><input type="radio" name="${name}" value="${safe(v)}" ${selected===v?'checked':''}><span>${safe(v)}</span></label>`).join('');const checks=media.map(v=>`<label class="background-option"><input type="checkbox" name="art_medium" value="${safe(v)}" ${(prev.primary_artistic_media||[]).includes(v)?'checked':''}><span>${safe(v)}</span></label>`).join('');
  content.innerHTML=`<div class="background-layout"><div class="background-heading"><span class="background-kicker">ARTIST EXPERIENCE</span><h1>Your artistic practice</h1><p class="sub">Because you indicated an art background, please answer a few additional questions about your experience.</p></div><form id="artistForm" class="background-card" novalidate><fieldset class="background-question"><legend><span class="background-number">01</span>Years of artistic experience</legend><p>How many years have you been creating visual artwork?</p><div class="background-options">${radios('artist_years',years,prev.years_of_experience)}</div></fieldset><fieldset class="background-question"><legend><span class="background-number">02</span>Primary artistic medium</legend><p>What type(s) of visual art do you primarily create? <span class="tiny">Select all that apply.</span></p><div class="background-options">${checks}</div><div id="artistOtherWrap" class="background-other" ${(prev.primary_artistic_media||[]).includes('Other')?'':'hidden'}><label for="artistOther">Please specify</label><input id="artistOther" type="text" maxlength="200" value="${safe(prev.primary_artistic_medium_other||'')}" placeholder="Describe your medium"></div></fieldset><fieldset class="background-question"><legend><span class="background-number">03</span>Online sharing of artwork</legend><p>How often do you share or publish your artwork online?</p><div class="background-options">${radios('artist_sharing',sharing,prev.online_sharing_frequency)}</div></fieldset><fieldset class="background-question"><legend><span class="background-number">04</span>Importance of online publication</legend><p>How important is sharing your artwork online to your artistic practice or career?</p><div class="background-options background-scale">${radios('artist_importance',importance,prev.online_publication_importance_label)}</div></fieldset><fieldset class="background-question"><legend><span class="background-number">05</span>Personal experience with AI style mimicry</legend><p>Are you aware of your artwork or artistic style having been used or imitated by generative AI?</p><div class="background-options">${radios('artist_mimicry',awareness,prev.ai_style_mimicry_awareness)}</div></fieldset><p id="artistError" class="background-error" role="alert" aria-live="polite"></p></form></div>`;
  const form=$('artistForm'),selected=name=>form.querySelector(`input[name="${name}"]:checked`)?.value||null,selectedMedia=()=>[...form.querySelectorAll('input[name="art_medium"]:checked')].map(el=>el.value);const valid=()=>Boolean(selected('artist_years')&&selectedMedia().length&&(!selectedMedia().includes('Other')||$('artistOther').value.trim())&&selected('artist_sharing')&&selected('artist_importance')&&selected('artist_mimicry'));
  const submit=()=>{if(!valid()){$('artistError').textContent='Please answer all five questions.';return;}session.artist_background={years_of_experience:selected('artist_years'),primary_artistic_media:selectedMedia(),primary_artistic_medium_other:selectedMedia().includes('Other')?$('artistOther').value.trim():null,online_sharing_frequency:selected('artist_sharing'),online_publication_importance:importance.indexOf(selected('artist_importance'))+1,online_publication_importance_label:selected('artist_importance'),ai_style_mimicry_awareness:selected('artist_mimicry'),submitted_at:new Date().toISOString()};save();renderIntro();goTop();};
  const update=()=>{$('artistOtherWrap').hidden=!selectedMedia().includes('Other');$('artistError').textContent='';setButton(valid(),submit);};form.querySelectorAll('input').forEach(el=>el.addEventListener(el.type==='text'?'input':'change',update));update();
}

function renderIntro(){
  stage='intro';session.progress.stage=stage;save();setHeader('Artist familiarization',10);setBackButton(false);setButton(false);
  content.innerHTML=`<div class="center"><span class="pill">Assigned artist · Study reference</span><h1>Familiarize yourself with this artistic style</h1><p class="sub" style="margin:0 auto">The six artworks below are examples of the same artist's work. You will evaluate only this artist's style throughout the study.</p><div class="notice">Observe the colors, shapes, textures, brushwork and overall visual character. Focus on style rather than the subjects depicted.</div></div>${references()}<div class="center"><div class="chips"><span class="chip">Color palette</span><span class="chip">Shapes and forms</span><span class="chip">Texture and brushwork</span><span class="chip">Composition</span></div><p id="timer" class="tiny" style="margin-top:20px"></p></div>`;
  const sec=Number(manifest.config.minimum_familiarization_seconds||15);let left=sec;$('timer').textContent=`Please review the artworks for ${left} seconds.`;
  const timer=setInterval(()=>{left--;if(left>0){$('timer').textContent=`Please review the artworks for ${left} seconds.`;}else{clearInterval(timer);$('timer').textContent='You may continue when ready.';setButton(true,()=>{practiceIndex=0;renderPractice();goTop();});}},1000);
}

function renderPractice(){
  stage='practice';session.progress.stage=stage;session.progress.practice=practiceIndex;save();setHeader('Practice',14+(practiceIndex/PRACTICE.length)*12);setBackButton(practiceIndex>0,()=>{practiceIndex--;renderPractice();goTop();});
  const x=PRACTICE[practiceIndex];
  const refs=x.references?`<details class="smallref" open><summary>Practice reference artworks</summary>${references(x.references)}</details>`:'';
  content.innerHTML=`<div class="practice-layout"><div class="practice-meta">Practice ${practiceIndex+1} of ${PRACTICE.length}</div><h1>${safe(x.kind)}</h1><p class="sub">${safe(x.instruction)}</p>${refs}<div class="gallery2">${imagePanel({label:'A',url:x.a})}${imagePanel({label:'B',url:x.b})}</div><div class="question"><strong>Your answer</strong><div class="options"><label class="option"><input type="radio" name="train" value="A">Image A</label><label class="option"><input type="radio" name="train" value="B">Image B</label></div></div><div id="feedback"></div></div>`;
  setButton(false);
  content.querySelectorAll('input[name="train"]').forEach(el=>el.onchange=()=>{
    const a=content.querySelector('input[name="train"]:checked')?.value;
    const ok=a===x.right;
    $('feedback').innerHTML=`<div class="result ${ok?'':'wrong'}"><strong>${ok?'Correct!':'Not quite.'}</strong> ${safe(x.why)}</div>`;
    content.querySelectorAll('input[name="train"]').forEach(r=>r.disabled=true);
    setButton(true,()=>{practiceIndex++;if(practiceIndex===PRACTICE.length){qualityIndex=0;renderQuality();}else renderPractice();goTop();});
  });
}

function zoomable(url,alt){ return `<div class="zoom-wrap" data-zoom="${safe(url)}"><img src="${safe(url)}" alt="${safe(alt)}"><div class="zoom-lens"></div></div>`; }
function bindMagnifiers(){
  content.querySelectorAll('.zoom-wrap').forEach(w=>{
    const lens=w.querySelector('.zoom-lens'), imgEl=w.querySelector('img'), src=w.dataset.zoom;
    const setup=()=>{lens.style.backgroundImage=`url("${src}")`;}; if(imgEl.complete) setup(); else imgEl.onload=setup;
    w.addEventListener('mousemove',e=>{const r=w.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;const size=150,half=size/2;lens.style.left=Math.max(0,Math.min(r.width-size,x-half))+'px';lens.style.top=Math.max(0,Math.min(r.height-size,y-half))+'px';const px=(x/r.width)*100,py=(y/r.height)*100;lens.style.backgroundSize=(r.width*2.5)+'px '+(r.height*2.5)+'px';lens.style.backgroundPosition=`${px}% ${py}%`;});
    w.addEventListener('click',()=>openModal(src));
  });
}
function openModal(src){$('modalImage').src=src;$('imageModal').hidden=false;}
$('closeModal').onclick=()=>{$('imageModal').hidden=true;$('modalImage').src='';};$('imageModal').addEventListener('click',e=>{if(e.target===$('imageModal'))$('closeModal').click();});

function renderQuality(){
  stage='quality';session.progress.stage=stage;session.progress.quality=qualityIndex;save();startTick=Date.now();setHeader('Protected artwork quality',28+(qualityIndex/session.quality.length)*16);setBackButton(qualityIndex>0,()=>{qualityIndex--;renderQuality();goTop();});
  const t=session.quality[qualityIndex], prior=existing('quality',t.id);
  const cards=t.choices.map(c=>`<div class="quality-card"><div class="label">Image ${safe(c.label)}</div>${zoomable(c.url,'Protected artwork '+c.label)}<div class="quality-rating"><strong>Visual quality compared with the original</strong><div class="scale-options">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="quality_${c.label}" value="${n}" ${Number(prior[c.label])===n?'checked':''}><span>${n}</span></label>`).join('')}</div><div class="scale-help"><span>Much worse</span><span>Same quality</span></div></div></div>`).join('');
  content.innerHTML=`<h1>Protected artwork quality</h1><div class="instruction-card"><strong>Use the original artwork above as the direct visual reference.</strong> Compare each protected image with the original image and rate its visual quality.</div><p class="quality-note">Protection methods modify artwork before it is shared, so it is important that the protected version preserves the visual quality of the original.</p>${referenceDropdown()}<div class="quality-original"><div class="imagepanel"><h3>Original artwork</h3>${zoomable(t.original,'Original artwork')}</div></div><h2>Compare with the original</h2><p class="tiny">Hover over an image to magnify fine details. Click an image to open a larger view.</p><div class="quality-grid">${cards}</div>`;
  bindMagnifiers();
  const collect=()=>{const out={};for(const c of t.choices){const e=content.querySelector(`[name="quality_${c.label}"]:checked`);if(!e)return null;out[c.label]=Number(e.value);}return out;};
  const update=()=>setButton(Boolean(collect()),()=>{const a=collect();if(!a)return;record('quality',t,a);qualityIndex++;if(qualityIndex===session.quality.length){effectivenessIndex=0;renderEffectiveness();}else renderQuality();goTop();});
  content.querySelectorAll('input[type=radio]').forEach(e=>e.onchange=update);update();
}

function ratingCell(trialId,label,key,prior){ return `<div class="scale-options">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="r_${trialId}_${label}_${key}" value="${n}" ${Number(prior?.[label]?.[key])===n?'checked':''}><span>${n}</span></label>`).join('')}</div>`; }
function renderEffectiveness(){
  stage='effectiveness';session.progress.stage=stage;session.progress.effectiveness=effectivenessIndex;save();startTick=Date.now();setHeader('Protection effectiveness',46+(effectivenessIndex/session.effectiveness.length)*24);setBackButton(effectivenessIndex>0,()=>{effectivenessIndex--;renderEffectiveness();goTop();});
  const t=session.effectiveness[effectivenessIndex],prior=existing('effectiveness',t.id);
  content.innerHTML=`<h1>Protection effectiveness</h1><div class="instruction-card">Use the reference artworks and the generation prompt to evaluate each image. Give each image a score from 1 to 5 for the three questions below.</div>${referenceDropdown()}<div class="prompt"><span>Generation prompt:</span> ${safe(t.prompt)}</div><div class="gallery7">${t.choices.map(imagePanel).join('')}</div><div class="rating-wrap"><table class="rating-table"><thead><tr><th>Image</th><th>How closely does this image match the artistic style of the reference artworks?<br><span class="tiny">1 = Not at all · 5 = Extremely closely</span></th><th>How would you rate the overall visual quality of this image?<br><span class="tiny">1 = Very poor · 5 = Excellent</span></th><th>How well does this image match the generation prompt?<br><span class="tiny">1 = Not at all · 5 = Extremely well</span></th></tr></thead><tbody>${t.choices.map(c=>`<tr><td>Image ${c.label}</td><td>${ratingCell(t.id,c.label,'style',prior)}</td><td>${ratingCell(t.id,c.label,'quality',prior)}</td><td>${ratingCell(t.id,c.label,'prompt',prior)}</td></tr>`).join('')}</tbody></table></div>`;
  const collect=()=>{const out={};for(const c of t.choices){out[c.label]={};for(const key of ['style','quality','prompt']){const e=content.querySelector(`[name="r_${t.id}_${c.label}_${key}"]:checked`);if(!e)return null;out[c.label][key]=Number(e.value);}}return out;};
  const update=()=>setButton(Boolean(collect()),()=>{const a=collect();if(!a)return;record('effectiveness',t,a);effectivenessIndex++;if(effectivenessIndex===session.effectiveness.length){robustnessIndex=0;renderRobustness();}else renderEffectiveness();goTop();});
  content.querySelectorAll('input[type=radio]').forEach(e=>e.onchange=update);update();
}

function renderRobustness(){
  stage='robustness';session.progress.stage=stage;session.progress.robustness=robustnessIndex;save();startTick=Date.now();setHeader('Robustness evaluation',72+(robustnessIndex/session.robustness.length)*23);setBackButton(robustnessIndex>0,()=>{robustnessIndex--;renderRobustness();goTop();});
  const t=session.robustness[robustnessIndex],prior=existing('robustness',t.id);
  content.innerHTML=`<h1>Robustness evaluation</h1><div class="instruction-card">Use the reference artworks to judge the artistic style of the generated images. Select the image that <strong>least resembles the artistic style shown in the reference artworks</strong>.</div>${referenceDropdown()}<div class="prompt"><span>Generation prompt:</span> ${safe(t.prompt)}</div><div class="robust-gallery">${t.choices.map(imagePanel).join('')}</div><div class="robust-question"><h2>Which image least resembles the reference artist's style?</h2><div class="options">${t.choices.map(c=>`<label class="option"><input type="radio" name="robust" value="${c.label}" ${prior.choice===c.label?'checked':''}>Image ${c.label}</label>`).join('')}</div></div>`;
  const update=()=>{const e=content.querySelector('input[name="robust"]:checked');setButton(Boolean(e),()=>{const chosen=content.querySelector('input[name="robust"]:checked')?.value;if(!chosen)return;record('robustness',t,{choice:chosen});robustnessIndex++;if(robustnessIndex===session.robustness.length){session.completed_at=new Date().toISOString();session.progress.stage='finish';save();renderFinish();}else renderRobustness();goTop();});};
  content.querySelectorAll('input[name="robust"]').forEach(e=>e.onchange=update);update();
}

function getResponsePayload(){
  return {format_version:'art-style-protection-github-pages-v9',study_title:manifest.config.study_title,participant_id:session.pid,artist:session.artist,created_at:session.created_at,completed_at:session.completed_at,consent:session.consent,verified_at:session.verified_at||null,participant_profile:session.participant_profile||null,background:session.background||null,artist_background:session.artist_background||null,study_mode:manifest.config.study_mode,assignments:{quality:session.quality,effectiveness:session.effectiveness,robustness:session.robustness},responses:session.answers};
}
async function autosaveOnline(){
  const endpoint=manifest.config.response_endpoint;if(!endpoint)return false;
  try{const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({pid:session.pid,...getResponsePayload()})});if(!res.ok)throw new Error('HTTP '+res.status);session.last_autosaved_at=new Date().toISOString();delete session.last_autosave_error;save();return true;}catch(e){session.last_autosave_error=String(e?.message||e);save();console.warn('Autosave failed:',e);return false;}
}
async function submitOnline(){
  const endpoint=manifest.config.response_endpoint;
  if(!endpoint){session.last_autosave_error='No response endpoint configured';save();return false;}
  try{
    const res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({pid:session.pid,...getResponsePayload()})});
    const responseText=await res.text().catch(()=> '');
    if(!res.ok)throw new Error(`HTTP ${res.status}${responseText?`: ${responseText.slice(0,240)}`:''}`);
    session.uploaded_at=new Date().toISOString();delete session.last_autosave_error;save();return true;
  }catch(e){
    session.last_autosave_error=String(e?.message||e);save();console.error('Final submission failed:',e);return false;
  }
}
function renderFinish(){
  stage='finish';session.progress.stage=stage;save();setHeader('Study completed',100);setBackButton(false);document.querySelector('footer.bottom').hidden=true;
  content.innerHTML=`<section class="finish-simple"><div class="finish-simple-icon">✓</div><h1>Thank you for participating!</h1><p class="finish-simple-lead">You have completed the study.</p><p id="submissionStatus" class="finish-simple-status">Submitting your responses…</p><p class="finish-simple-reference">Participant ID: <code>${safe(session.pid)}</code></p><button id="retrySubmission" hidden>Retry submission</button></section>`;
  const status=$('submissionStatus'),retry=$('retrySubmission');
  const send=async()=>{retry.hidden=true;status.textContent='Submitting your responses…';const ok=await submitOnline();if(ok){status.textContent='Responses submitted successfully.';}else{status.textContent=`We could not submit your responses. ${session.last_autosave_error||'Please try again.'}`;retry.hidden=false;}};
  retry.onclick=send;send();
}

function start(){
  const s=session.progress.stage;
  if(s==='declined')return renderDeclined();
  if(!session.consent?.consented)return renderConsent();
  if(!session.verified)return renderVerify();
  if(s==='profile')return renderProfile();
  if(s==='background')return renderBackground();
  if(s==='artist_followup')return renderArtistFollowup();
  if(s==='finish')return renderFinish();
  if(s==='practice')return renderPractice();
  if(s==='quality')return renderQuality();
  if(s==='effectiveness')return renderEffectiveness();
  if(s==='robustness')return renderRobustness();
  if(!session.participant_profile)return renderProfile();
  if(!session.background)return renderBackground();
  if(ARTIST_BACKGROUNDS.has(session.background.art_background) && !session.artist_background)return renderArtistFollowup();
  renderIntro();
}
start();
