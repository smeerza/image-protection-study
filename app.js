const POST_STUDY_QUESTIONS=[["training_without_consent", "AI training without consent", "I am concerned that artists’ original artwork could be used to train generative AI models without their knowledge or consent."], ["unauthorized_style_imitation", "Unauthorized style imitation", "I am concerned that generative AI could replicate or imitate an artist’s distinctive style without their permission."], ["commercial_compensation", "Commercial use and compensation", "Artists should receive appropriate compensation when their artwork or distinctive artistic style is commercially used to develop or produce generative AI content."], ["attribution", "Attribution and recognition", "Artists should receive appropriate attribution when AI-generated content closely imitates their distinctive artistic style"], ["artist_control", "Artist control", "Artists should have control over whether their artwork is used to train generative AI models."], ["copying_vs_inspiration", "Copying vs. inspiration", "When generative AI closely imitates an artist’s distinctive style, I consider it more like copying the artist’s work than taking inspiration from it."], ["livelihoods", "Impact on artists’ livelihoods", "Over the next 5–10 years, generative AI will substantially disrupt traditional careers in visual art and illustration."], ["creative_diversity", "Impact on creative diversity", "Widespread use of generative AI could reduce diversity in the visual-art ecosystem by encouraging similar or highly reproducible styles."], ["safeguards", "Need for safeguards", "Ethical or technical safeguards are needed to protect artists from unauthorized use of their work by generative AI systems."], ["visual_changes", "Acceptance of protection-related visual changes", "Small visual changes to an artwork are acceptable if they help prevent unauthorized AI-based imitation of the artist’s style."]];
'use strict';
const manifest = window.MIRAGE_MANIFEST;
if (!manifest) throw new Error('manifest.js failed to load');
const ARTIST_BACKGROUNDS=['Art student','Part-time/freelance artist','Full-time/professional artist'];
const PAIR_QUESTIONS=[
 ['style','Ignoring overall image quality, which image more closely matches the reference artist’s style?'],
 ['prompt','Which image better matches the generation prompt?'],
 ['quality','Which image has better overall visual quality?'],
 ['artifacts','Which image contains more visible artifacts or distortions?']
];
const ATTACK_BASE_QUESTIONS=[
 ['noise','Which image contains the most visible noise?'],
 ['artifacts','Which image contains the most visible artifacts or distortions?'],
 ['details','Which image has the least clear visual details?'],
 ['prompt','Which image matches the generation prompt the least?'],
 ['quality','Which image has the lowest overall visual quality?'],
 ['style','Ignoring overall image quality, which image least resembles the reference artist’s style?']
];
const CAPTION_QUESTION=['caption','Which image best matches the AI-generated caption?'];
function trialQuestions(trial,isAttack=false){
 if(!isAttack)return PAIR_QUESTIONS;
 return ATTACK_BASE_QUESTIONS;
}
const $=id=>document.getElementById(id), content=$('content'), button=$('nextButton'), backButton=$('backButton');
const safe=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const TRAIN=[
 {kind:'Overall image quality',desc:'Focus on the image that looks clearer and more coherent.',a:'scene_clean',b:'scene_noise',right:'A',why:'Image A is clearer and has less corruption.'},
 {kind:'Artistic style similarity',desc:'Focus on the reference artist’s brushwork, color and composition; ignore quality.',a:'flat_style',b:'brush_style',right:'B',why:'Image B uses more expressive brushwork and colors reminiscent of the reference samples.'},
 {kind:'Image noise',desc:'Select the image with less random visual noise.',a:'scene_noise',b:'scene_clean',right:'B',why:'Image A has deliberately added speckles.'},
 {kind:'Visual artifacts',desc:'Find the image with fewer unintended distortions.',a:'object_artifacts',b:'object_clean',right:'B',why:'Image A has obvious blocks and distortions.'},
 {kind:'Image detail',desc:'Select the image with clearer and sharper detail.',a:'object_clean',b:'object_blur',right:'A',why:'Image B is deliberately blurred.'},
 {kind:'Generation prompt matching',desc:'Text prompt: “A snowy mountain.” Choose the image that better follows it.',a:'sunset',b:'scene_clean',right:'B',why:'Image B shows a snow-capped mountain.'},
 {kind:'AI-generated caption matching',desc:'AI-generated caption: “A red apple on a wooden table.”',a:'object_clean',b:'mug',right:'A',why:'Image A shows a red apple on a table.'}
];
function svg(kind){const bg=`<rect width="500" height="300" fill="#c7e8fc"/>`;const mountain=`<circle cx="402" cy="68" r="37" fill="#ffe190"/><path d="M0 235 130 60 265 230 362 94 500 245V300H0Z" fill="#5e788c"/><path d="M95 105l35-45 42 55-44-19zM343 120l19-26 28 34-27-12z" fill="white"/><path d="M0 238Q150 211 270 244T500 233V300H0Z" fill="#408c5f"/>`;const apple=`<rect y="230" width="500" height="70" fill="#a16b4c"/><path d="M255 100c-62-39-105 22-88 86s65 99 88 81c41 23 86-33 88-86S310 65 255 100" fill="#d84143"/><path d="M256 112q-14-50 18-60" stroke="#54382c" stroke-width="10" fill="none"/><path d="M273 63q50-29 67 4-28 24-67-4" fill="#419763"/>`;let shapes=mountain;if(kind.startsWith('object'))shapes=apple;if(kind==='sunset')shapes=`<rect width="500" height="300" fill="#efaa91"/><circle cx="255" cy="135" r="61" fill="#ffe9a1"/><path d="M0 215q120-25 250 0t250 0v85H0Z" fill="#338ba7"/>`;if(kind==='mug')shapes=`<rect y="230" width="500" height="70" fill="#a16b4c"/><path d="M180 96h130l-15 170H195Z" fill="#468aba"/><path d="M305 120q70 0 57 70-15 32-60 16" fill="none" stroke="#468aba" stroke-width="20"/>`;if(kind==='flat_style')shapes=`<rect y="220" width="500" height="80" fill="#7dba87"/><circle cx="410" cy="65" r="43" fill="#fff1a0"/><rect x="70" y="130" width="125" height="130" fill="#ddae7e"/><path d="m45 135 90-86 90 86z" fill="#bb8065"/><rect x="260" y="145" width="150" height="115" fill="#cba07c"/><path d="m240 148 95-80 95 80z" fill="#a76f57"/>`;if(kind==='brush_style')shapes=`<rect width="500" height="300" fill="#223862"/><path d="M-20 70q130-115 265 8t280-18" fill="none" stroke="#f4bd61" stroke-width="21"/><path d="M-20 125q130-115 265 8t280-18" fill="none" stroke="#95bfd6" stroke-width="13"/><rect y="230" width="500" height="70" fill="#497c70"/><rect x="70" y="125" width="125" height="135" fill="#e5a375"/><path d="m45 125 90-85 90 85z" fill="#e9c66e"/><rect x="260" y="145" width="150" height="115" fill="#d58a65"/><path d="m240 148 95-80 95 80z" fill="#edc36b"/>`;if(kind==='scene_noise')shapes+=`<g opacity=".65">${Array.from({length:140},(_,i)=>{let x=(i*83)%500,y=(i*47)%300;return `<rect x="${x}" y="${y}" width="${(i%5)+3}" height="${(i%7)+3}" fill="${i%2?'#e64789':'#2c3756'}"/>`}).join('')}</g>`;if(kind==='object_artifacts')shapes+=`<rect x="120" y="78" width="115" height="35" fill="#9650dd"/><rect x="290" y="160" width="85" height="60" fill="#17cbaf"/>`;if(kind==='object_blur')shapes=`<defs><filter id="b"><feGaussianBlur stdDeviation="10"/></filter></defs><g filter="url(#b)">${shapes}</g>`;let raw=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300">${bg}${shapes}</svg>`;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(raw)}
function hashSeed(){return crypto.randomUUID().replaceAll('-','')}
function shuffle(items){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
function assignmentKey(){return 'mirage_study_session_v6'}
function save(){localStorage.setItem(assignmentKey(),JSON.stringify(session))}
function img(artist,key){return manifest.artists[artist].images[key]}
function makeAssignment(){
  const names=shuffle(Object.keys(manifest.artists).filter(n=>manifest.config.artists.includes(n)));
  const problems=[];
  for(const name of names){
    const a=manifest.artists[name];
    const methods=manifest.config.methods;
    const pairCount=Number(manifest.config.comparison_count_per_method||2);
    const pairs=[];
    let pairId=1;
    let pairProblem=false;

    // Build pairwise trials independently for each method. Prompts may be
    // reused across different methods; only the two prompts for a single
    // method must be distinct.
    for(const method of shuffle(methods)){
      const eligible=shuffle(a.prompts.filter(p=>img(name,'clean/'+p.id)&&img(name,'protected/'+method+'/'+p.id)));
      if(eligible.length<pairCount){
        problems.push(name+' has only '+eligible.length+' usable prompts for '+method+'; requires '+pairCount);
        pairProblem=true;
        break;
      }
      for(const p of eligible.slice(0,pairCount)){
        const choices=shuffle([
          {method:'clean',url:img(name,'clean/'+p.id)},
          {method,url:img(name,'protected/'+method+'/'+p.id)}
        ]).map((c,j)=>({...c,label:'AB'[j]}));
        pairs.push({id:'pair_'+pairId++,prompt_id:p.id,prompt:p.text,caption:p.caption||'',method,choices});
      }
    }
    if(pairProblem)continue;

    // Robustness: show only the six protected methods after each removal attack.
    // No clean baseline is included in Section 4.
    const attacks=[];
    for(const attack of manifest.config.attacks){
      const eligible=shuffle(a.prompts.filter(p=>
        methods.every(m=>img(name,'removed/'+attack+'/'+m+'/'+p.id))
      ));
      if(!eligible.length){
        problems.push(name+' is missing a complete robustness set for '+attack);
        continue;
      }
      const p=eligible[0];
      const rawChoices=methods.map(method=>({
        method,
        url:img(name,'removed/'+attack+'/'+method+'/'+p.id)
      }));
      const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const choices=shuffle(rawChoices).map((c,i)=>({...c,label:letters[i]}));
      attacks.push({id:'attack_'+attack,attack,prompt_id:p.id,prompt:p.text,caption:p.caption||'',choices});
    }
    if(attacks.length!==manifest.config.attacks.length)continue;

    return {
      pid:'p_'+hashSeed(),created_at:new Date().toISOString(),version:'github-pages-v6',
      artist:name,artist_display:a.display_name,
      references:shuffle(a.references).slice(0,manifest.config.reference_count),
      pairs:shuffle(pairs),attacks:shuffle(attacks),
      progress:{stage:'consent',practice:0,pair:0,attack:0},answers:[],completed_at:null
    };
  }
  throw Error(problems.join('; ')||'No suitable artists configured');
}
let session;
try{session=JSON.parse(localStorage.getItem(assignmentKey())||'null');if(!session)session=makeAssignment();save()}catch(e){content.innerHTML=`<div class="error"><h2>Dataset configuration problem</h2>${safe(e.message)}<p>Fill the required image directories and run <code>python3 scripts/build_manifest.py</code>.</p></div>`;setButton('Configuration required',false);throw e}
const study={references:session.references,artist_display:session.artist_display,config:{familiarization_seconds:manifest.config.minimum_familiarization_seconds},pairs:session.pairs,attacks:session.attacks};
let pid=session.pid,stage='consent',practiceIndex=session.progress.practice||0,trialIndex=session.progress.pair||0,attackIndex=session.progress.attack||0,startTick=Date.now();
function setHeader(text,pct,foot){document.querySelector('footer.bottom').hidden=false;setBackButton(false);
 $('stepLabel').textContent=text;
 $('loadFill').style.width=Math.max(0,Math.min(100,pct))+'%';
 $('loadFill').parentElement.setAttribute('aria-valuenow',Math.round(pct));
 $('footerText').textContent=foot||'Mirage art style evaluation';
 const steps={consent:'Consent',participant_information:'Contact details',background:'Background',artist_followup:'Artist experience',intro:'Familiarization',practice:'Training',pairs:'Protection evaluation',attacks:'Robustness evaluation',post_study:'Final questionnaire',finish:'Completed',declined:'Study closed'};
 $('stageCount').textContent=steps[stage]?'CURRENT SECTION · '+steps[stage]:'MIRAGE STUDY';
}
function setButton(text,enabled,fn){button.textContent=text;button.disabled=!enabled;button.onclick=fn||null}
function setBackButton(show,fn){if(!backButton)return;backButton.hidden=!show;backButton.disabled=!show;backButton.onclick=show?(fn||null):null}
function references(){return `<div class="refgrid">${study.references.map((u,i)=>`<img loading="lazy" src="${safe(u)}" alt="Reference artwork ${i+1}">`).join('')}</div>`}
function imagePanel(url,label){return `<div class="imagepanel"><h3>Image ${label}</h3><img loading="lazy" src="${safe(url)}" alt="Image ${safe(label)}"></div>`}

function timerGate(seconds,callback){let n=seconds;const tick=()=>{if(stage!=='intro')return;if(n<=0){$('timer').textContent='You may continue when ready.';setButton('Start practice →',true,callback);return}$('timer').textContent=`Please review the artworks for ${n} more seconds.`;setTimeout(()=>{n--;tick()},1000)};tick()}
function renderConsent(){
 stage='consent';session.progress.stage='consent';save();setHeader('Research participation and consent',0,'Participation is voluntary');
 const email=manifest.config.student_email||'';const pairScreens=manifest.config.methods.length*Number(manifest.config.comparison_count_per_method||2);const robustnessScreens=manifest.config.attacks.length;const mainScreens=pairScreens+robustnessScreens;const evalQuestionText='four questions for each clean-vs-protected pair and six questions for each robustness set';
 content.innerHTML=`<div class="consent-layout">
 <aside class="consent-hero"><p class="kicker">MIRAGE · RESEARCH STUDY</p><h1>Research participation<br>and consent</h1><p class="hero-subtitle">Human Evaluation of Artistic Style Similarity in AI-Generated Images</p><div class="hero-rule"></div><p class="hero-note">Your perspective helps researchers understand how AI-generated images reflect artistic styles.</p></aside>
 <div class="consent-main"><div class="consent-card"><p class="consent-card-eyebrow">PLEASE READ BEFORE CONTINUING</p>
 <div class="consent-item"><span class="consent-icon blue" aria-hidden="true">♙</span><div><h2>Invitation to participate</h2><p>You are invited to participate in a research study investigating how people perceive artistic-style similarity in images generated by artificial intelligence (AI). Please read the following information carefully before deciding whether to participate.</p></div></div>
 <div class="consent-item"><span class="consent-icon amber" aria-hidden="true">▤</span><div><h2>Purpose of the research</h2><p>Modern generative AI systems can create images resembling the visual styles of existing artworks. Researchers have proposed methods that modify digital artwork to reduce the ability of AI models to imitate an artist's style.</p><p>MIRAGE investigates protection techniques for artistic styles. This study compares the visual results of different protection methods using human judgments, including conditions where attempts have been made to remove protections.</p></div></div>
 <div class="consent-item"><span class="consent-icon violet" aria-hidden="true">▧</span><div><h2>What will you be asked to do?</h2><p>You will first review six reference artworks by an assigned artist and complete seven guided practice comparisons. You will then evaluate ${pairScreens} pairs of AI-generated images and ${robustnessScreens} robustness sets. You will answer ${evalQuestionText}. In the robustness section, you will compare only the six protected methods after a removal attack; no clean baseline is shown.</p><p>Artistic style may include color palette, brushwork, line quality, texture, shading, composition, and overall appearance. Protection method identities are hidden, and image order is randomized. Your judgments in the main evaluation have no predetermined correct or incorrect answers.</p></div></div>
 <div class="consent-duo"><div class="consent-item"><span class="consent-icon green" aria-hidden="true">◷</span><div><h2>Study duration and format</h2><p>The study contains <strong>${mainScreens} main evaluation screens</strong>, following seven practice exercises. Completion time varies depending on how long you inspect the images. A laptop or desktop with a sufficiently large screen is recommended. You may take short breaks and should avoid discussing your judgments with others while completing the study.</p></div></div><div class="consent-item"><span class="consent-icon rose" aria-hidden="true">◇</span><div><h2>Possible risks or discomforts</h2><p>Viewing images and making repeated comparisons may cause temporary eye strain, fatigue, or boredom. You may stop at any time.</p></div></div></div>
 <div class="consent-trio"><div class="consent-item"><span class="consent-icon blue" aria-hidden="true">▥</span><div><h2>Benefits</h2><p>You may not receive any direct personal benefit. Your responses may help researchers evaluate techniques intended to protect artistic work from unauthorized imitation by generative AI.</p></div></div><div class="consent-item"><span class="consent-icon amber" aria-hidden="true">♙</span><div><h2>Privacy and confidentiality</h2><p>After consent, you will be asked for your name and email address for research administration. These details will not be published or included in publicly shared research results. They are stored separately from evaluation responses and linked through a participant identifier. Your responses are associated with a randomly generated session identifier and may include image selections, experimental conditions, and time spent on individual comparisons. Findings may be reported in aggregate in academic publications or presentations.</p><p>${manifest.config.response_endpoint?'During the main evaluation, your study responses are securely autosaved to the configured research collection service. A final complete response is submitted when you finish the study; you can also download a backup copy.':'Responses are saved in this browser, not automatically transmitted. At completion, download your response file and send it through the researcher’s approved channel.'}</p></div></div><div class="consent-item"><span class="consent-icon violet" aria-hidden="true">◎</span><div><h2>Voluntary participation</h2><p>Participation is voluntary. You may decline or stop before submission without giving a reason. Your decision will not affect your relationship with the researchers or their institution.</p></div></div></div>
 <div class="consent-item"><span class="consent-icon blue" aria-hidden="true">✓</span><div><h2>Consent to participate</h2><p>By selecting “I agree to participate,” you confirm that you have read this information, understand the study procedures and voluntary nature of participation, understand how responses will be used, and agree to participate.</p></div></div>
 </div><div class="decision-panel"><button id="consentNo" type="button" class="quiet-button">I do not agree</button><button id="consentYes" type="button">I agree to participate →</button></div><p id="consentMessage" class="tiny" aria-live="polite"></p></div></div>`;
 setButton('Please choose above',false);
 $('consentYes').onclick=()=>{session.consent={consented:true,consent_version:'mirage-consent-v1',timestamp:new Date().toISOString()};save();renderParticipantInformation();window.scrollTo(0,0)};
 $('consentNo').onclick=()=>{session.consent={consented:false,consent_version:'mirage-consent-v1',timestamp:new Date().toISOString()};session.progress.stage='declined';save();renderDeclined()};
}
function renderDeclined(){stage='declined';setHeader('Participation declined',0);content.innerHTML='<div class="center"><h1>Thank you for considering this study.</h1><p>You chose not to participate. No evaluation responses have been submitted.</p></div>';setButton('Study closed',false)}
function renderParticipantInformation(){
 stage='participant_information';session.progress.stage=stage;save();
 setHeader('Participant information',2,'Contact details · Confidential research information');
 setButton('Continue',true,()=>document.getElementById('participantForm').requestSubmit());
 const existing=JSON.parse(localStorage.getItem('mirage_contact_'+session.pid)||'null')||{};
 content.innerHTML=`<div class="background-layout"><div class="background-heading"><span class="background-kicker">MIRAGE · PARTICIPANT INFORMATION</span><h1>Your contact information</h1><p class="sub">Please provide your details before beginning the study.</p></div><form id="participantForm" class="background-card participant-card"><div class="participant-privacy"><h2>Privacy and confidentiality</h2><p>Your name and email address are collected for research administration only. They will not be published or included in publicly shared research results. Study findings will be reported without identifying individual participants.</p><p>Your name, email address, and study answers will be included together in one confidential JSON response file. Please return this file only through the secure submission method provided by the researcher.</p></div><div class="participant-field"><label for="participantName">Full name <span aria-hidden="true">*</span></label><input id="participantName" name="full_name" type="text" autocomplete="name" maxlength="150" required placeholder="Enter your full name" value="${safe(existing.full_name||'')}"></div><div class="participant-field"><label for="participantEmail">Email address <span aria-hidden="true">*</span></label><input id="participantEmail" name="email" type="email" autocomplete="email" maxlength="254" required placeholder="Enter your email address" value="${safe(existing.email||'')}"></div><p id="participantError" class="background-error" role="alert" aria-live="polite"></p></form></div>`;
 $('participantForm').onsubmit=e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const full_name=$('participantName').value.trim(),email=$('participantEmail').value.trim();if(!full_name||!email){$('participantError').textContent='Please enter your name and email address.';return;}localStorage.setItem('mirage_contact_'+session.pid,JSON.stringify({participant_id:session.pid,full_name,email,collected_at:new Date().toISOString()}));session.contact_collected=true;save();renderBackground();window.scrollTo(0,0)};
}
function renderBackground(){
 stage='background';session.progress.stage=stage;save();setHeader('Participant background questionnaire',3,'');
 const artOptions=['No experience','Casual/hobby experience','Art student','Part-time/freelance artist','Full-time/professional artist','Other'];
 const frequencyOptions=['Never','Once or twice','Occasionally','Frequently','Very frequently'];
 const familiarityOptions=['Not at all familiar','Slightly familiar','Moderately familiar','Very familiar','Extremely familiar'];
 const choices=(name,items,numbered=false)=>items.map((value,i)=>`<label class="background-option"><input type="radio" name="${name}" value="${safe(value)}"><span>${numbered?`${i+1} - `:''}${safe(value)}</span></label>`).join('');
 content.innerHTML=`<div class="background-layout"><div class="background-heading"><span class="background-kicker">MIRAGE · PARTICIPANT QUESTIONNAIRE</span><h1>A little about your experience</h1><p class="sub">Before viewing the artwork, please answer four short questions about your experience with visual art and generative AI.</p></div>
 <form id="backgroundForm" class="background-card" novalidate>
 <fieldset class="background-question"><legend><span class="background-number">01</span>Art background</legend><p>Which best describes your experience with creating visual art?</p><div class="background-options">${choices('art_background',artOptions)}</div><div id="otherArtWrap" class="background-other" hidden><label for="otherArt">Please specify</label><input id="otherArt" type="text" maxlength="200" placeholder="Describe your experience"></div></fieldset>
 <fieldset class="background-question"><legend><span class="background-number">02</span>Familiarity with generative AI</legend><p>How familiar are you with AI image-generation tools such as Stable Diffusion, Midjourney, or DALL·E?</p><div class="background-options background-scale">${choices('ai_familiarity',familiarityOptions,true)}</div></fieldset>
 <fieldset class="background-question"><legend><span class="background-number">03</span>Experience using generative AI</legend><p>How often have you used AI image-generation tools?</p><div class="background-options">${choices('ai_usage',frequencyOptions)}</div></fieldset>
 <fieldset class="background-question"><legend><span class="background-number">04</span>Familiarity with AI style mimicry</legend><p>Before participating in this study, how familiar were you with the use of generative AI to imitate or reproduce an artist's visual style?</p><div class="background-options background-scale">${choices('style_mimicry_familiarity',familiarityOptions,true)}</div></fieldset>
 <p class="background-footnote">Your answers will be stored with your study responses under your randomly generated participant identifier.</p><p id="backgroundError" class="background-error" role="alert" aria-live="polite"></p></form></div>`;
 const form=$('backgroundForm');
 const selected=name=>form.querySelector(`input[name="${name}"]:checked`)?.value||null;
 const valid=()=>!!(selected('art_background')&&selected('ai_familiarity')&&selected('ai_usage')&&selected('style_mimicry_familiarity')&&(selected('art_background')!=='Other'||$('otherArt').value.trim()));
 const update=()=>{$('otherArtWrap').hidden=selected('art_background')!=='Other';$('backgroundError').textContent='';setButton(ARTIST_BACKGROUNDS.includes(selected('art_background'))?'Continue →':'Continue →',valid(),submit)};
 const submit=()=>{if(!valid()){ $('backgroundError').textContent='Please answer all four questions.';return;}
  session.background={art_background:selected('art_background'),art_background_other:selected('art_background')==='Other'?$('otherArt').value.trim():null,ai_familiarity:Number(familiarityOptions.indexOf(selected('ai_familiarity'))+1),ai_usage:selected('ai_usage'),style_mimicry_familiarity:Number(familiarityOptions.indexOf(selected('style_mimicry_familiarity'))+1),submitted_at:new Date().toISOString()};
  save();if(ARTIST_BACKGROUNDS.includes(session.background.art_background))renderArtistFollowup();else renderIntro();window.scrollTo(0,0);
 };
 form.querySelectorAll('input[type="radio"]').forEach(el=>el.addEventListener('change',update));$('otherArt').addEventListener('input',update);
 form.addEventListener('submit',e=>{e.preventDefault();submit()});setButton('Continue to artist familiarization →',false,submit);
}
function renderArtistFollowup(){
 stage='artist_followup';session.progress.stage=stage;save();setHeader('Artist experience questionnaire',4,'Five questions · For participants with an art background');
 const years=['Less than 1 year','1-5 years','6-10 years','More than 10 years'];
 const media=['Digital illustration','Painting','Drawing','Photography','Graphic design','3D art','Mixed media','Other'];
 const sharing=['Never','Rarely','Sometimes','Often','Very often'];
 const importance=['Not important at all','Slightly important','Moderately important','Very important','Extremely important'];
 const awareness=['Yes','No','Unsure','Prefer not to say'];
 const radios=(name,values,numbered=false)=>values.map((v,i)=>`<label class="background-option"><input type="radio" name="${name}" value="${safe(v)}"><span>${numbered?`${i+1} - `:''}${safe(v)}</span></label>`).join('');
 const checks=media.map(v=>`<label class="background-option"><input type="checkbox" name="art_medium" value="${safe(v)}"><span>${safe(v)}</span></label>`).join('');
 content.innerHTML=`<div class="background-layout"><div class="background-heading"><span class="background-kicker">MIRAGE · ARTIST QUESTIONNAIRE</span><h1>Your artistic practice</h1><p class="sub">Please tell us a little more about your experience creating and sharing visual artwork.</p></div>
 <form id="artistForm" class="background-card" novalidate>
 <fieldset class="background-question"><legend><span class="background-number">01</span>Years of artistic experience</legend><p>How many years have you been creating visual artwork?</p><div class="background-options">${radios('artist_years',years)}</div></fieldset>
 <fieldset class="background-question"><legend><span class="background-number">02</span>Primary artistic medium</legend><p>What type(s) of visual art do you primarily create? <span class="tiny">Select all that apply.</span></p><div class="background-options">${checks}</div><div id="artistOtherWrap" class="background-other" hidden><label for="artistOther">Please specify</label><input id="artistOther" type="text" maxlength="200" placeholder="Describe your medium"></div></fieldset>
 <fieldset class="background-question"><legend><span class="background-number">03</span>Online sharing of artwork</legend><p>How often do you share or publish your artwork online?</p><div class="background-options">${radios('artist_sharing',sharing)}</div></fieldset>
 <fieldset class="background-question"><legend><span class="background-number">04</span>Importance of online publication</legend><p>How important is sharing your artwork online to your artistic practice or career?</p><div class="background-options background-scale">${radios('artist_importance',importance,true)}</div></fieldset>
 <fieldset class="background-question"><legend><span class="background-number">05</span>Personal experience with AI style mimicry</legend><p>Are you aware of your artwork or artistic style having been used or imitated by generative AI?</p><div class="background-options">${radios('artist_mimicry',awareness)}</div></fieldset>
 <p class="background-footnote">Your answers will be stored with your study responses under your randomly generated participant identifier.</p><p id="artistError" class="background-error" role="alert" aria-live="polite"></p></form></div>`;
 const form=$('artistForm');
 const selected=name=>form.querySelector(`input[name="${name}"]:checked`)?.value||null;
 const selectedMedia=()=>[...form.querySelectorAll('input[name="art_medium"]:checked')].map(el=>el.value);
 const valid=()=>!!(selected('artist_years')&&selectedMedia().length&&(!selectedMedia().includes('Other')||$('artistOther').value.trim())&&selected('artist_sharing')&&selected('artist_importance')&&selected('artist_mimicry'));
 const submit=()=>{if(!valid()){$('artistError').textContent='Please answer all five questions.';return;}
 session.artist_background={years_of_experience:selected('artist_years'),primary_artistic_media:selectedMedia(),primary_artistic_medium_other:selectedMedia().includes('Other')?$('artistOther').value.trim():null,online_sharing_frequency:selected('artist_sharing'),online_publication_importance:importance.indexOf(selected('artist_importance'))+1,ai_style_mimicry_awareness:selected('artist_mimicry'),submitted_at:new Date().toISOString()};
 save();renderIntro();window.scrollTo(0,0);
 };
 const update=()=>{$('artistOtherWrap').hidden=!selectedMedia().includes('Other');$('artistError').textContent='';setButton('Continue to artist familiarization →',valid(),submit)};
 form.querySelectorAll('input').forEach(el=>el.addEventListener(el.type==='text'?'input':'change',update));
 form.addEventListener('submit',e=>{e.preventDefault();submit()});update();
}
function renderIntro(){stage='intro';session.progress.stage=stage;save();setHeader('Step 1 / 5 · Artist familiarization',5);content.innerHTML=`<div class="center"><span class="pill">Assigned artist · Study reference</span><h1>Familiarize yourself with this artistic style</h1><p class="sub" style="margin:0 auto">The six artworks below are examples of the same artist's work. You will evaluate only this artist's style throughout the study.</p><div class="notice">Observe the colors, shapes, textures, brushwork and overall visual character. Focus on style rather than the subjects depicted.</div></div>${references()}<div class="center"><div class="chips"><span class="chip">Color palette</span><span class="chip">Shapes and forms</span><span class="chip">Texture and brushwork</span><span class="chip">Composition</span></div><p id="timer" class="tiny" style="margin-top:20px"></p></div>`;setButton('Please review…',false);timerGate(study.config.familiarization_seconds,()=>{practiceIndex=0;renderPractice()})}
function renderPractice(){stage='practice';session.progress.stage=stage;session.progress.practice=practiceIndex;save();const x=TRAIN[practiceIndex];setHeader(`Step 2 / 5 · Training ${practiceIndex+1}/7`,12+practiceIndex*3,'Illustrative practice images — not Mirage research outputs');content.innerHTML=`<span class="pill">Guided training · Practice ${practiceIndex+1} of 7</span><h1>${safe(x.kind)}</h1><p class="sub">${safe(x.desc)}</p><div class="gallery2">${imagePanel(svg(x.a),'A')}${imagePanel(svg(x.b),'B')}</div><div class="question"><strong>Choose your answer</strong><div class="options"><label class="option"><input type="radio" name="train" value="A">Image A</label><label class="option"><input type="radio" name="train" value="B">Image B</label></div></div><div id="feedback"></div>`;
  const check=()=>{const a=content.querySelector('input[name="train"]:checked')?.value;if(!a)return;const ok=a===x.right;$('feedback').innerHTML=`<div class="result ${ok?'':'wrong'}"><strong>${ok?'Correct!':'Not quite.'}</strong> ${safe(x.why)}</div>`;content.querySelectorAll('input[name="train"]').forEach(el=>el.disabled=true);setButton(practiceIndex===6?'Begin main evaluation →':'Next practice →',true,()=>{practiceIndex++;if(practiceIndex===7){trialIndex=0;renderPair()}else renderPractice()})};
  setButton('Check answer',false,check);content.querySelectorAll('input[name="train"]').forEach(el=>el.onchange=()=>setButton('Check answer',true,check))}
function existingAnswers(section,trial){return session.answers.find(a=>a.section===section&&a.trial_id===trial.id)?.answers||{}}
function questionForm(trial,labels,isAttack=false){
 const qs=trialQuestions(trial,isAttack),section=isAttack?'attacks':'pairs',prior=existingAnswers(section,trial);
 return qs.map(([key,q],i)=>{
   const imageOptions=labels.map(label=>`<label class="option"><input type="radio" name="q_${key}" value="${label}" ${prior[key]===label?'checked':''}>Image ${label}</label>`).join('');
   const sameOption=!isAttack?`<label class="option same-option"><input type="radio" name="q_${key}" value="same" ${prior[key]==='same'?'checked':''}>About the same</label>`:'';
   return `<div class="question"><strong>${i+1}. ${safe(q)}</strong><div class="options">${imageOptions}${sameOption}</div></div>`;
 }).join('')
}
function answers(trial,isAttack=false){const out={};for(const [key] of trialQuestions(trial,isAttack)){const el=content.querySelector(`[name="q_${key}"]:checked`);if(!el)return null;out[key]=el.value}return out}
function bindAnswers(trial,isAttack,fn){const n=trialQuestions(trial,isAttack).length;const update=()=>setButton(`Submit ${n} answers →`,!!answers(trial,isAttack),fn);content.querySelectorAll('input[type=radio]').forEach(el=>el.onchange=update);update()}
function evaluationBlock(trial,isAttack,index,total){const labels=trial.choices.map(c=>c.label);const n=trialQuestions(trial,isAttack).length;const caption=!isAttack&&trial.caption&&String(trial.caption).trim()?`<div class="prompt"><span>AI-generated caption:</span> ${safe(trial.caption)}</div>`:'';const guidance=isAttack?`All six images were generated after the same removal attack and correspond to the same target artist and generation prompt. Method names are hidden and image positions are randomized. For each question, select the image that best matches the criterion being asked.`:`One image was generated from a model trained on clean artwork and the other from a model trained on protected artwork. Their positions are randomized and method names are hidden. Please answer all ${n} questions.`;return `<span class="pill">${isAttack?'Robustness evaluation':'Protection evaluation'} · ${index+1} of ${total}</span><h1>${isAttack?'Compare six protected outputs after removal':'Compare two AI-generated images'}</h1><p class="sub">${guidance}</p><details class="smallref"><summary>View reference artworks for this artist</summary>${references()}</details><div class="prompt"><span>Generation prompt:</span> ${safe(trial.prompt)}</div>${caption}<div class="${isAttack?'attack-gallery':'gallery2 pair-gallery'}">${trial.choices.map(c=>imagePanel(c.url,c.label)).join('')}</div><h2>Your evaluations</h2>${questionForm(trial,labels,isAttack)}`}
function recordAnswer(section,trial,chosen){
 const item={section,trial_id:trial.id,prompt_id:trial.prompt_id,attack:trial.attack||null,displayed_choices:trial.choices.map(c=>({label:c.label,method:c.method,url:c.url})),answers:chosen,time_ms:Date.now()-startTick,submitted_at:new Date().toISOString()};
 const i=session.answers.findIndex(a=>a.section===section&&a.trial_id===trial.id);
 if(i>=0)session.answers[i]=item;else session.answers.push(item);
 save();
 autosaveOnline();
}
function renderPair(){stage='pairs';session.progress={stage,practice:7,pair:trialIndex,attack:attackIndex};save();startTick=Date.now();const trial=study.pairs[trialIndex];setHeader(`Step 3 / 5 · Protection evaluation ${trialIndex+1} of ${study.pairs.length}`,34+(trialIndex/study.pairs.length)*36);if(trialIndex>0)setBackButton(true,()=>{trialIndex--;renderPair();window.scrollTo(0,0)});content.innerHTML=evaluationBlock(trial,false,trialIndex,study.pairs.length);const submit=()=>{const a=answers(trial,false);if(!a)return;recordAnswer('pairs',trial,a);trialIndex++;if(trialIndex===study.pairs.length){attackIndex=0;renderAttack()}else renderPair();window.scrollTo(0,0)};bindAnswers(trial,false,submit)}
function renderAttack(){stage='attacks';session.progress={stage,practice:7,pair:study.pairs.length,attack:attackIndex};save();startTick=Date.now();const trial=study.attacks[attackIndex];setHeader(`Step 4 / 5 · Robustness evaluation ${attackIndex+1} of ${study.attacks.length}`,72+(attackIndex/study.attacks.length)*25);setBackButton(true,()=>{if(attackIndex>0){attackIndex--;renderAttack()}else{trialIndex=study.pairs.length-1;renderPair()}window.scrollTo(0,0)});content.innerHTML=evaluationBlock(trial,true,attackIndex,study.attacks.length);const submit=()=>{const a=answers(trial,true);if(!a)return;recordAnswer('attacks',trial,a);attackIndex++;if(attackIndex===study.attacks.length){renderPostStudy()}else renderAttack();window.scrollTo(0,0)};bindAnswers(trial,true,submit)}
function renderPostStudy(){
 stage='post_study';session.progress.stage=stage;save();setHeader('Step 5 / 5 · Post-study questionnaire',98,'Please share your views about AI and artistic styles');setBackButton(true,()=>{attackIndex=study.attacks.length-1;renderAttack();window.scrollTo(0,0)});
 const labels=['Strongly disagree','Disagree','Neither agree nor disagree','Agree','Strongly agree'];
 const previous=session.post_study_draft||{};
 const items=POST_STUDY_QUESTIONS.map(([key,title,statement],i)=>`<fieldset class="background-question poststudy-question"><legend><span class="background-number">${String(i+1).padStart(2,'0')}</span>${safe(title)}</legend><p>${safe(statement)}</p><div class="background-options background-scale">${labels.map((label,j)=>`<label class="background-option"><input type="radio" name="post_${key}" value="${j+1}" ${previous[key]===j+1?'checked':''}><span>${j+1}</span></label>`).join('')}</div></fieldset>`).join('');
 content.innerHTML=`<div class="background-layout poststudy-layout"><div class="background-heading"><span class="background-kicker">MIRAGE · FINAL QUESTIONNAIRE</span><h1>Your views on AI and artistic work</h1><p class="sub">You have finished all image comparisons. Please indicate how much you agree or disagree with each statement.</p></div><form id="postStudyForm" class="background-card" novalidate><div class="likert-guide" aria-label="Rating scale explanation"><h2>Rating scale</h2><p>For each of the following ten statements, select a number from 1 to 5 based on how much you agree or disagree.</p><div class="likert-guide-grid">${labels.map((label,i)=>`<div class="likert-guide-item"><span class="likert-guide-number">${i+1}</span><span>${safe(label)}</span></div>`).join('')}</div></div>${items}<div class="poststudy-open"><h2>Concerns About Artists’ Work in Generative AI</h2><label for="postStudyConcern">What is your main concern, if any, about the use of artists’ work by generative AI systems? Please explain briefly.</label><textarea id="postStudyConcern" rows="5" maxlength="3000" placeholder="Share your thoughts (optional)">${safe(previous.main_concern||'')}</textarea><p class="tiny">You may leave this blank if you have no concern.</p></div><p id="postStudyError" class="background-error" role="alert" aria-live="polite"></p></form></div>`;
 const form=$('postStudyForm');
 const collect=()=>{const result={};for(const [key] of POST_STUDY_QUESTIONS){const selected=form.querySelector(`[name="post_${key}"]:checked`);if(selected)result[key]=Number(selected.value)}result.main_concern=$('postStudyConcern').value.trim();return result};
 const valid=()=>POST_STUDY_QUESTIONS.every(([key])=>!!form.querySelector(`[name="post_${key}"]:checked`));
 const saveDraft=()=>{session.post_study_draft=collect();save();setButton('Complete study →',valid(),submit)};
 const submit=()=>{if(!valid()){$('postStudyError').textContent='Please respond to all ten statements.';return}session.post_study={...collect(),submitted_at:new Date().toISOString()};delete session.post_study_draft;session.completed_at=new Date().toISOString();session.progress.stage='finish';save();renderFinish();window.scrollTo(0,0)};
 form.addEventListener('change',saveDraft);$('postStudyConcern').addEventListener('input',saveDraft);form.addEventListener('submit',e=>{e.preventDefault();submit()});setButton('Complete study →',valid(),submit);
}
function getResponsePayload(){
 const contact=JSON.parse(localStorage.getItem('mirage_contact_'+session.pid)||'null');
 return {
  participant_information:contact?{full_name:contact.full_name,email:contact.email,collected_at:contact.collected_at}:null,
  format_version:'mirage-github-pages-v6',
  study_title:manifest.config.study_title,
  participant_id:session.pid,
  artist:session.artist,
  created_at:session.created_at,
  completed_at:session.completed_at,
  consent:session.consent||null,
  background:session.background||null,
  artist_background:session.artist_background||null,
  post_study:session.post_study||null,
  study_mode:manifest.config.study_mode,
  assignments:{pairs:session.pairs,attacks:session.attacks},
  responses:session.answers
 };
}

function getServerPayload(){
 return {
  pid:session.pid,
  ...getResponsePayload()
 };
}

function downloadResponses(){
 const result=getResponsePayload();
 const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');
 a.href=url;
 a.download=`mirage_${session.pid}.json`;
 document.body.appendChild(a);
 a.click();
 a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}

async function autosaveOnline(){
 const endpoint=manifest.config.response_endpoint;
 if(!endpoint)return false;
 try{
  const res=await fetch(endpoint,{
   method:'POST',
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(getServerPayload()),
   keepalive:true
  });
  if(!res.ok)throw Error('HTTP '+res.status);
  session.last_autosaved_at=new Date().toISOString();
  delete session.last_autosave_error;
  save();
  return true;
 }catch(e){
  session.last_autosave_error=String(e&&e.message?e.message:e);
  save();
  console.warn('Autosave failed:',e);
  return false;
 }
}

async function submitOnline(){
 const endpoint=manifest.config.response_endpoint;
 const status=$('submissionStatus');
 if(!endpoint){
  if(status)status.textContent='No collection endpoint configured. Please download and return your JSON file to the study administrator.';
  return;
 }
 if(status)status.textContent='Sending final responses to the study collector…';
 try{
  const res=await fetch(endpoint,{
   method:'POST',
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(getServerPayload()),
   keepalive:true
  });
  if(!res.ok)throw Error('HTTP '+res.status);
  session.uploaded_at=new Date().toISOString();
  delete session.last_autosave_error;
  save();
  if(status)status.textContent='Responses submitted successfully. You may also download a backup.';
 }catch(e){
  if(status)status.textContent='Online submission did not succeed ('+e.message+'). Please download the JSON file and contact the study administrator.';
 }
}
function renderFinish(){
 stage='finish';setHeader('Study completed',100,'Thank you for contributing to this research');
 const online=Boolean(manifest.config.response_endpoint);
 const status=session.uploaded_at?'Your responses were submitted successfully.':'Online submission is available but has not yet been confirmed.';
 content.innerHTML=`<section class="finish-simple" aria-labelledby="finishTitle">
  <div class="finish-simple-icon" aria-hidden="true">✓</div>
  <span class="finish-simple-eyebrow">MIRAGE ART STYLE EVALUATION</span>
  <h1 id="finishTitle">Thank you for participating!</h1>
  <p class="finish-simple-lead">You have completed the study. Your contribution helps researchers understand how people perceive AI-generated art and artistic-style protection.</p>
  <div class="finish-simple-rule"></div>
  <h2>Save your study responses</h2>
  <p>Your download contains your name, email address, consent, questionnaire answers, and evaluation responses in <strong>one JSON file</strong>.</p>
  <button id="downloadResult" type="button" class="finish-simple-download">↓ Download complete response JSON</button>
  <p class="finish-simple-note">${online?'You may keep this file as a backup.':'Downloading does not submit your responses. Please send the file using the researcher’s approved secure submission method.'} Because it contains personal information, do not share it publicly.</p>
  ${online?`<p id="submissionStatus" role="status" aria-live="polite" class="finish-simple-status">${safe(status)}</p>`:''}
  <p class="finish-simple-reference">Participant ID: <code>${safe(session.pid)}</code></p>
 </section>`;
 $('downloadResult').onclick=downloadResponses;
 if(!session.uploaded_at&&online)submitOnline();
 $('nextButton').disabled=true;
 $('nextButton').onclick=null;
 document.querySelector('footer.bottom').hidden=true;
}

function start(){const s=session.progress.stage;if(s==='declined')return renderDeclined();if(!session.consent?.consented)return renderConsent();if(!session.contact_collected||s==='participant_information')return renderParticipantInformation();if(!session.background||s==='background')return renderBackground();if(ARTIST_BACKGROUNDS.includes(session.background.art_background)&&(!session.artist_background||s==='artist_followup'))return renderArtistFollowup();if(s==='finish')return renderFinish();if(s==='post_study'||(s==='attacks'&&attackIndex>=study.attacks.length))return renderPostStudy();if(s==='practice')return renderPractice();if(s==='pairs')return renderPair();if(s==='attacks')return renderAttack();renderIntro()}
start();
