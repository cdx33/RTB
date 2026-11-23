fetch('./public/question-bank.json').then(r=>{if(!r.ok)throw new Error('Question bank unavailable');return r.json();}).then(BANK=>{
(() => {
  'use strict';
  const STORE = 'rtb-ready-v1';
  const TOPICS = [
    {id:'adtech', label:'Adtech basics', description:'How programmatic advertising and real-time bidding fit together.'},
    {id:'campaigns', label:'Campaigns', description:'Retargeting, branding, the funnel and campaign goals.'},
    {id:'metrics', label:'Metrics', description:'Read performance numbers with the right units and denominator.'},
    {id:'tracking', label:'Tracking & measurement', description:'Tags, events, consent and data moving between systems.'},
    {id:'javascript', label:'JavaScript essentials', description:'Read small integration snippets and understand what they do.'},
    {id:'cases', label:'Client cases', description:'Investigate campaign, tracking and measurement issues in order.'},
    {id:'recruiter', label:'Recruiter interview', description:'Practise concise answers about your experience and motivation.'},
    {id:'behavioural', label:'Behavioural answers', description:'Structure a real example, your actions and the verified outcome.'}
  ];
  const SOURCES = BANK.sources;
  const LEARN_GUIDANCE = {
    adtech:{definition:'Programmatic advertising uses software to buy and sell digital ad opportunities. A DSP is the advertiser side: it evaluates an opportunity and can bid automatically.',example:'Fictional example: a shop sets a campaign goal and budget; its DSP evaluates an available ad opportunity and decides whether to bid.',misconception:'A DSP buys on the advertiser side. A publisher generally uses an SSP to offer inventory.'},
    campaigns:{definition:'A campaign is a set of advertising choices made to reach a goal, such as bringing interested shoppers back to a product.',example:'Fictional example: someone views a pair of trainers, then later sees a relevant ad for that product.',misconception:'A visit alone does not mean a person will always see an ad. Eligibility, consent, inventory and campaign settings matter.'},
    metrics:{definition:'A metric describes one part of performance. Always say the numerator, denominator, time period and unit before comparing results.',example:'Fictional example: 40 purchases from 800 sessions is a 5% purchase conversion rate when sessions are the agreed denominator.',misconception:'The same label can use different denominators. A conversion rate based on sessions is not automatically the same as one based on clicks or users.'},
    tracking:{definition:'Tracking carries events and useful values from a website or app into measurement and advertising systems.',example:'Fictional example: after an authorised test purchase, follow the purchase event from the page through the tag and outgoing request to the receiving platform.',misconception:'Seeing an event in a page tool does not by itself prove the receiving platform recorded and attributed it.'},
    javascript:{definition:'JavaScript is often used on a website to read values, react to events and pass structured data to other tools.',example:'For example, in JavaScript `3 + 2 + "7"` evaluates to the string `"57"`: addition is evaluated left to right, and a string changes the operation to concatenation.',misconception:'`==` allows type conversion in comparisons; `===` checks value and type without that conversion.'},
    cases:{definition:'A client case is a structured investigation: agree the metric and scope, trace where the issue starts, collect evidence, then explain findings and next actions.',example:'Fictional example: if an ad platform reports 10,000 clicks and analytics reports 6,500 sessions, first align dates, time zones, campaign scope and metric definitions.',misconception:'A difference between clicks and sessions does not prove that the difference is lost people or a single tracking fault.'},
    recruiter:{definition:'A recruiter answer should be clear, concise and grounded in your real experience. Connect what you have done to what the role asks for.',example:'For a “why this role?” answer, describe a real client problem you enjoy solving, connect it to implementation and communication work, and name an area you want to learn.',misconception:'A prepared example is a cue to remember your own experience, not a script to recite.'},
    behavioural:{definition:'A strong behavioural answer makes the situation, your own actions and the verified outcome easy to follow.',example:'Choose one real event. Explain what the client needed, what you did, who you coordinated with, what changed, and how you know.',misconception:'Do not claim an outcome or metric you cannot verify, and make your contribution distinct from the team’s.'}
  };
  let app = load();
  let session = null;
  let timerInterval = null;
  let learnTopic = TOPICS[0].id;
  let learnQuestion = null;

  function freshState(){return {progress:{},profile:null,interviewDate:'2026-11-25'};}
  function load(){try{const x=JSON.parse(localStorage.getItem(STORE)||'null');return x&&x.progress?{...freshState(),...x,progress:x.progress||{}}:freshState();}catch{return freshState();}}
  function save(){try{localStorage.setItem(STORE,JSON.stringify(app));}catch{announce('Could not save in this browser. Check available storage.');}}
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function announce(s){document.getElementById('liveRegion').textContent=s;}
  function fmtDate(d){return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'));}
  function topicFor(q){if(q.category==='measurement')return 'tracking'; return q.category;}
  function getProgress(id){return app.progress[id]||{attempts:0,lastResult:null,lastReviewed:null,nextDue:null,successStreak:0};}
  function allBy(topic){return BANK.questions.filter(q=>!topic||topicFor(q)===topic);}
  function scoreFor(topic){const qs=allBy(topic).map(q=>getProgress(q.id));const done=qs.filter(p=>p.attempts).length;const avg=qs.filter(p=>p.attempts).reduce((a,p)=>a+(p.lastResult==='got_it'?1:p.lastResult==='partial'?.5:0),0);return {done,total:qs.length,score:done?Math.round(avg/done*100):0};}
  function setView(name){document.querySelectorAll('.view').forEach(e=>e.hidden=true);document.querySelectorAll('.nav-link').forEach(e=>e.classList.toggle('active',e.dataset.view===name));document.getElementById(`view-${name}`).hidden=false; if(name==='home')renderHome(); if(name==='learn')renderLearn(); if(name==='settings')renderSettings(); if(name==='practice'&&!session)renderPracticeStart(); window.scrollTo(0,0);}
  function startDateText(){if(!app.interviewDate)return 'Set a date';const days=Math.ceil((new Date(app.interviewDate+'T00:00:00')-new Date(new Date().toDateString()))/86400000);if(days>0)return `${days} days to go`;if(days===0)return 'Today';return 'Date passed';}

  function renderHome(){
    const due=BANK.questions.filter(q=>{const p=getProgress(q.id);return p.nextDue&&new Date(p.nextDue)<=new Date();}).length;
    const weak=TOPICS.map(t=>({...t,...scoreFor(t.id)})).filter(t=>t.done).sort((a,b)=>a.score-b.score).slice(0,3);
    const topicRows=(weak.length?weak:TOPICS.slice(0,3).map(t=>({...t,done:0,score:0}))).map(t=>`<div class="topic-line"><span>${escapeHtml(t.label)}</span><div class="meter" role="progressbar" aria-label="${escapeHtml(t.label)} confidence" aria-valuenow="${t.score}" aria-valuemin="0" aria-valuemax="100"><span style="width:${t.score}%"></span></div><em>${t.done?`${t.score}%`:'New'}</em></div>`).join('');
    const ready=Math.min(5,Math.max(0,due))||5;
    document.getElementById('view-home').innerHTML=`
      <div class="hero"><div><div class="eyebrow">A little practice goes a long way</div><h1>Feel ready for the<br>conversation.</h1><p>Short, focused practice for your RTB House Technical Account Manager interview. Start with what you remember, then see what to revisit.</p><div class="stat-row"><div class="stat"><strong>${ready} questions</strong><span>ready for a quick round</span></div><div class="stat"><strong>~5 min</strong><span>one calm practice session</span></div></div></div><div class="hero-art" aria-hidden="true"><div class="orbit">✳</div><small>Recall · reflect · return</small></div></div>
      <div class="section-head"><div><h2>Choose your next step</h2><p>Go at your own pace. Your progress saves in this browser.</p></div></div>
      <div class="action-grid">
        <article class="action-card"><div class="card-icon">↻</div><h3>Quick 5</h3><p>Five mixed questions. Answer from memory and find your next practice target.</p><button class="text-button" data-start="quick">Start a round</button></article>
        <article class="action-card"><div class="card-icon">◉</div><h3>Practise interview</h3><p>Choose a focus, take a moment to answer, then self-check with a simple rubric.</p><button class="text-button" data-start="interview">Choose a focus</button></article>
        <article class="action-card"><div class="card-icon">⌁</div><h3>Learn a topic</h3><p>Get a plain-language explanation, a worked example and a recall prompt.</p><button class="text-button" data-goto="learn">Explore topics</button></article>
      </div>
      <div class="home-lower"><section class="panel"><h3>Your practice map</h3><p class="sub">A gentle guide to where another look may help.</p><div class="topic-list">${topicRows}</div><button class="text-button" style="margin-top:16px" data-goto="learn">Browse all topics</button></section>
      <section class="panel"><div class="date-row"><div><h3>Interview date</h3><p class="sub" style="margin:5px 0 0">Editable any time</p></div><span class="countdown">${escapeHtml(startDateText())}</span></div><div style="margin-top:15px"><input class="date-pill" id="homeDate" type="date" aria-label="Interview date" value="${escapeHtml(app.interviewDate||'')}"></div><p class="date-card-note">Keep practising after the date passes. This app is a practice aid, not a prediction of interview results.</p><p class="source-note">Role topics follow the <a href="${escapeHtml(SOURCES.job)}" target="_blank" rel="noreferrer">official vacancy</a>.</p></section></div>`;
    document.querySelectorAll('[data-start]').forEach(b=>b.addEventListener('click',()=>b.dataset.start==='quick'?startQuick():renderPracticeStart(true)));
    document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.goto)));
    document.getElementById('homeDate').addEventListener('change',e=>{app.interviewDate=e.target.value;save();renderHome();});
  }
  function filterFor(mode){if(mode==='recruiter')return q=>q.category==='recruiter';if(mode==='behavioural')return q=>q.category==='behavioural';if(mode==='technical')return q=>['adtech','campaigns','measurement','tracking','javascript'].includes(q.category);if(mode==='metrics')return q=>['metrics','cases'].includes(q.category);return ()=>true;}
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function startQuick(){
    const now=new Date();const due=BANK.questions.filter(q=>{const p=getProgress(q.id);return p.nextDue&&new Date(p.nextDue)<=now;});
    const dueRank=shuffle(due).sort((a,b)=>{const rank=q=>getProgress(q.id).lastResult==='missed'?0:getProgress(q.id).lastResult==='partial'?1:2;return rank(a)-rank(b);});
    const weak=shuffle(BANK.questions.filter(q=>getProgress(q.id).attempts&&getProgress(q.id).lastResult!=='got_it'&&!due.some(d=>d.id===q.id)));
    const fresh=shuffle(BANK.questions.filter(q=>!getProgress(q.id).attempts));
    const picked=[...dueRank.slice(0,4),...weak,...fresh].slice(0,5);
    if(picked.length<5){picked.push(...shuffle(BANK.questions.filter(q=>!picked.some(x=>x.id===q.id))).slice(0,5-picked.length));}
    beginSession(picked,'Quick 5');
  }
  function renderPracticeStart(opened=false){
    if(session){renderQuestion();return;}
    document.getElementById('view-practice').innerHTML=`<div class="page-heading"><div class="eyebrow">Practice out loud or in writing</div><h1>A little like the real thing.</h1><p>Choose a focus. Speak your answer or type a few notes, then check your thinking against the key points.</p></div><div class="settings-grid"><section class="settings-card"><h2>Pick a round</h2><p>One question at a time. Your answer stays on this device.</p><label for="roundType" class="sr-only">Choose practice focus</label><select id="roundType" class="select" style="width:100%"><option value="mixed">Mixed questions</option><option value="recruiter">Recruiter</option><option value="behavioural">Behavioural</option><option value="technical">Technical</option><option value="metrics">Metrics & cases</option></select><div style="margin-top:15px"><button class="btn primary" id="beginRound">Start practice</button></div></section><section class="settings-card"><h2>How it works</h2><p>Try to recall before revealing. For interview questions, use the prompt as a speaking cue and check your answer against the rubric.</p><p class="privacy">No microphone recording or audio upload. You can practise aloud without typing anything.</p></section></div>`;
    document.getElementById('beginRound').addEventListener('click',()=>startInterview(document.getElementById('roundType').value));
    if(opened)setView('practice');
  }
  function startInterview(mode){const candidates=shuffle(BANK.questions.filter(filterFor(mode)));let chosen=candidates.filter(q=>!getProgress(q.id).nextDue||new Date(getProgress(q.id).nextDue)<=new Date()).slice(0,5);if(chosen.length<5)chosen=chosen.concat(candidates.filter(q=>!chosen.some(x=>x.id===q.id)).slice(0,5-chosen.length));beginSession(chosen,`${mode==='metrics'?'Metrics & cases':mode[0].toUpperCase()+mode.slice(1)} practice`);}
  function beginSession(questions,title){session={questions:questions.map(q=>q.id),title,index:0,answers:{},revealed:false,started:false,seconds:0,seen:new Set()};setView('practice');renderQuestion();}
  function current(){return BANK.questions.find(q=>q.id===session.questions[session.index]);}
  function renderQuestion(){
    clearInterval(timerInterval); if(!session)return;
    if(session.index>=session.questions.length){renderComplete();return;}
    const q=current();session.revealed=false;session.started=false;session.seconds=0;session.seen.add(q.id);
    const p=Math.round(session.index/session.questions.length*100);
    let response='';
    if(q.type==='choice')response=`<div class="choice-list" role="radiogroup" aria-label="Answer choices">${q.options.map((o,i)=>`<button class="choice-option" role="radio" aria-checked="false" data-choice="${i}"><span>${String.fromCharCode(65+i)}</span><span>${escapeHtml(o)}</span></button>`).join('')}</div>`;
    else if(q.type==='interview')response=`<div class="timer-row"><span>Take a breath. Your answer is yours.</span><span class="timer" id="timerText">${Math.floor(q.seconds/60)}:${String(q.seconds%60).padStart(2,'0')}</span></div><button class="btn secondary" id="timerButton">Start a quiet timer</button><p class="hint">Speak aloud or jot down a few notes. Nothing is recorded.</p><textarea class="answer-box" id="answerInput" placeholder="Optional notes for yourself…" aria-label="Optional answer notes"></textarea>`;
    else response=`<textarea class="answer-box" id="answerInput" placeholder="Write what you remember…" aria-label="Your answer"></textarea><p class="hint">A few words are enough. You’ll decide how confident you feel.</p>`;
    const btnLabel=q.type==='choice'?'Check my answer':'Show answer';
    document.getElementById('view-practice').innerHTML=`<div class="practice-layout"><div class="practice-top"><button class="btn ghost" id="exitSession">← Exit round</button><span>${escapeHtml(session.title)} · ${session.index+1} of ${session.questions.length}</span></div><div class="progressbar" role="progressbar" aria-label="Round progress" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p}%"></span></div><article class="question-card"><div class="question-meta"><span class="tag">${escapeHtml((q.category==='measurement'?'tracking':q.category).replace(/-/g,' '))}</span><span class="tag muted">${q.seconds} sec</span>${q.label?`<span class="tag muted">Fictional data</span>`:''}</div><h2>${escapeHtml(q.prompt)}</h2>${response}<div id="feedbackMount"></div><div class="action-row" id="questionActions"><button class="btn primary" id="revealButton">${btnLabel}</button><span class="spacer"></span><button class="btn ghost" id="backButton" ${session.index===0?'disabled':''}>Back</button></div></article></div>`;
    document.getElementById('exitSession').addEventListener('click',()=>{clearInterval(timerInterval);session=null;renderPracticeStart();});
    document.getElementById('revealButton').addEventListener('click',()=>reveal());
    document.getElementById('backButton').addEventListener('click',()=>{if(session.index>0){session.index--;renderQuestion();}});
    document.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-choice]').forEach(x=>{x.classList.remove('selected');x.setAttribute('aria-checked','false')});b.classList.add('selected');b.setAttribute('aria-checked','true');}));
    const timerButton=document.getElementById('timerButton');if(timerButton)timerButton.addEventListener('click',startTimer);
  }
  function startTimer(){if(session.started)return;session.started=true;const q=current(),el=document.getElementById('timerText'),button=document.getElementById('timerButton');button.disabled=true;button.textContent='Timer running';timerInterval=setInterval(()=>{session.seconds++;const left=Math.max(0,q.seconds-session.seconds);el.textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;if(left<=0){clearInterval(timerInterval);el.textContent='Time';button.textContent='Time is up';announce('Practice timer finished. Reveal the answer when you are ready.');}},1000);}
  function profileValue(ref){if(!ref||!app.profile)return null;const pointer=ref.split('#/')[1];if(!pointer)return null;let v=app.profile;for(const part of pointer.split('/').map(s=>s.replace(/~1/g,'/').replace(/~0/g,'~'))){if(v===null||typeof v!=='object'||!(part in v))return null;v=v[part];}return v;}
  function formatProfile(v){if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')return escapeHtml(String(v));if(Array.isArray(v))return `<ul>${v.map(x=>`<li>${formatProfile(x)}</li>`).join('')}</ul>`;if(v&&typeof v==='object')return `<dl>${Object.entries(v).map(([k,x])=>`<dt>${escapeHtml(k.replace(/([A-Z])/g,' $1'))}</dt><dd>${formatProfile(x)}</dd>`).join('')}</dl>`;return '';}
  function reveal(){const q=current();if(q.type==='choice'&&!document.querySelector('[data-choice].selected')){announce('Choose an option first.');return;}
    session.revealed=true;clearInterval(timerInterval);
    const selected=document.querySelector('[data-choice].selected');const correct=selected?Number(selected.dataset.choice)===q.correctIndex:null;
    if(selected){document.querySelectorAll('[data-choice]').forEach((b,i)=>{if(i===q.correctIndex)b.classList.add('correct');else if(b.classList.contains('selected'))b.classList.add('incorrect');b.disabled=true;});}
    const stored=q.modelAnswerRef?profileValue(q.modelAnswerRef):null;
    let answer=q.answer||'';
    if(q.modelAnswerRef){if(q.modelAnswerRef.endsWith('/salary'))answer='Personal compensation details are hidden in this app. Prepare a truthful response that fits your circumstances and the employer’s range.';else if(stored)answer=formatProfile(stored);else answer='Import your private profile in Settings to see your personal example. You can still practise using the checklist below.';}
    const checklist=q.checklist||q.rubric||[];
    const answerHtml=`<p>${escapeHtml(answer)}</p>${q.misconception?`<p class="next-step"><b>Common mix-up:</b> ${escapeHtml(q.misconception)}</p>`:''}${checklist.length?`<h3>${q.rubric?'Self-check':'Key points'}</h3><ul class="checklist">${checklist.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:''}${q.sourceIds?.length?`<div class="source-list">${q.sourceIds.map(id=>SOURCES[id]?`<a href="${escapeHtml(SOURCES[id])}" target="_blank" rel="noreferrer">Source ↗</a>`:'').join('')}</div>`:''}${q.type==='scenario'||q.category==='metrics'?'<button class="btn secondary" data-retry style="margin-top:12px">Try this one again</button>':''}`;
    document.getElementById('feedbackMount').innerHTML=`<section class="feedback"><h3>${correct===null?'A useful answer to compare with':correct?'That’s right':'Here’s the key idea'}</h3>${answerHtml}<p class="next-step">${q.type==='interview'?'A model example is a starting point. Adapt it to your own words and experience.':'What matters is the idea and the reasoning, not matching these words.'}</p><div class="rating-row" aria-label="How did that feel?"><button data-rate="got_it">Got it</button><button data-rate="partial">Partly</button><button data-rate="missed">Missed it</button></div></section>`;
    document.getElementById('revealButton').remove();
    document.querySelectorAll('[data-rate]').forEach(b=>b.addEventListener('click',()=>rate(b.dataset.rate)));
    const retry=document.querySelector('[data-retry]');if(retry)retry.addEventListener('click',renderQuestion);
    announce('Answer revealed. Rate how that felt to schedule a review.');
  }
  function rate(result){const q=current();const prev=getProgress(q.id);let streak=result==='got_it'?prev.successStreak+1:0;let days=result==='missed'?1:result==='partial'?1:streak===1?2:streak===2?4:7;const now=new Date();const next=new Date(now.getTime()+days*86400000);app.progress[q.id]={attempts:prev.attempts+1,lastResult:result,lastReviewed:now.toISOString(),nextDue:next.toISOString(),successStreak:streak};save();
    if(result==='missed'&&session.title==='Quick 5'&&!session.questions.includes(`${q.id}-again`)&&session.questions.length<7){session.questions.push(q.id);}
    session.index++;renderQuestion();
  }
  function renderComplete(){clearInterval(timerInterval);const seen=session.seen.size, title=session.title;session=null;document.getElementById('view-practice').innerHTML=`<div class="complete-card"><div class="complete-mark">✳</div><div class="eyebrow">Round complete</div><h2>Good work showing up.</h2><p>You practised ${seen} ${seen===1?'question':'questions'}. Missed and uncertain questions return sooner; confident recall gets more space.</p><p class="badge">Next up: return to your weakest topic</p><div class="action-row" style="justify-content:center"><button class="btn primary" id="finishHome">Back home</button><button class="btn secondary" id="finishAgain">Another round</button></div><p class="source-note">Your practice is saved locally in this browser.</p></div>`;document.getElementById('finishHome').addEventListener('click',()=>setView('home'));document.getElementById('finishAgain').addEventListener('click',startQuick);announce(`${title} complete.`);}

  function renderLearn(){
    const qs=allBy(learnTopic);if(learnQuestion&&!qs.some(q=>q.id===learnQuestion))learnQuestion=null;
    const q=learnQuestion?BANK.questions.find(x=>x.id===learnQuestion):qs[0];
    const nav=TOPICS.map(t=>`<button class="${t.id===learnTopic?'active':''}" data-topic="${t.id}">${escapeHtml(t.label)}</button>`).join('');
    const guide=LEARN_GUIDANCE[learnTopic];
    const answer=q?.answer||guide.definition;
    document.getElementById('view-learn').innerHTML=`<div class="page-heading"><div class="eyebrow">Learn a topic</div><h1>Make the idea clear.</h1><p>Every topic has a plain-language starting point and a short prompt to retrieve it.</p></div><div class="learn-layout"><nav class="topic-nav" aria-label="Choose a topic">${nav}</nav><article class="panel learn-content"><div class="eyebrow">${escapeHtml(TOPICS.find(t=>t.id===learnTopic).label)}</div><h2>${escapeHtml(q?.prompt||TOPICS.find(t=>t.id===learnTopic).label)}</h2><p class="definition">${escapeHtml(answer)}</p><div class="example-box"><b>${q?.label?'Fictional worked example':'Everyday example'}</b><p>${escapeHtml(guide.example)}</p></div><div class="misconception"><b>Common mix-up</b>${escapeHtml(q?.misconception||guide.misconception)}</div><div class="learn-question"><h3>Recall prompt</h3><p>${escapeHtml(q?.prompt||'What part of this topic would you explain to a client?')}</p><button class="btn secondary" id="learnPractice">Practise this question</button></div>${q?.sourceIds?.length?`<div class="source-list">${q.sourceIds.map(id=>`<a href="${escapeHtml(SOURCES[id]||'#')}" target="_blank" rel="noreferrer">Read source ↗</a>`).join('')}</div>`:''}<p class="source-note">Public source facts are linked in context. Sources checked ${escapeHtml(fmtDate(BANK.checkedAt))}. Research on practice supports recall and feedback mechanisms; it does not predict interview outcomes.</p></article></div>`;
    document.querySelectorAll('[data-topic]').forEach(b=>b.addEventListener('click',()=>{learnTopic=b.dataset.topic;learnQuestion=null;renderLearn();}));
    document.getElementById('learnPractice').addEventListener('click',()=>beginSession([q],'Learn a topic'));
  }
  function renderSettings(){
    document.getElementById('view-settings').innerHTML=`<div class="page-heading"><div class="eyebrow">Your data, your choice</div><h1>Settings & privacy</h1><p>This app keeps practice history and any imported profile in this browser.</p></div><div class="settings-grid"><section class="settings-card"><h2>Private experience profile</h2><p>Import the JSON file you received using this file picker. It is read directly in the browser and never uploaded.</p><label class="btn secondary file-label" for="profileFile">Choose profile JSON</label><input class="hidden-input" id="profileFile" type="file" accept="application/json,.json"><p id="profileStatus" class="privacy">${app.profile?'A profile is stored in this browser.':'No profile imported.'}</p><button class="btn ghost" id="removeProfile" ${app.profile?'':'disabled'}>Remove imported profile</button></section><section class="settings-card"><h2>Practice data backup</h2><p>Export your review schedule, interview date and locally imported profile for a personal backup. Keep the downloaded file private.</p><button class="btn secondary" id="exportData">Export backup JSON</button><div style="margin-top:12px"><label class="btn secondary file-label" for="backupFile">Import backup</label><input class="hidden-input" id="backupFile" type="file" accept="application/json,.json"></div></section><section class="settings-card full"><h2>Local by design</h2><p class="privacy">No account, database, AI model, analytics, microphone access or external persistence. Imported profile and progress use this browser’s local storage. The profile does not sync to another device. Interview examples are private starting points for practice, not scripts. Salary-linked values are never displayed.</p><button class="btn ghost danger" id="resetAll">Reset all app data</button></section></div>`;
    document.getElementById('profileFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Expected a JSON object');app.profile=data;save();renderSettings();announce('Private profile imported into this browser.');}catch{document.getElementById('profileStatus').textContent='Could not read this JSON file. Choose a valid profile JSON.';}e.target.value='';});
    document.getElementById('removeProfile').addEventListener('click',()=>{app.profile=null;save();renderSettings();});
    document.getElementById('exportData').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({format:'rtb-ready-backup-v1',...app},null,2)],{type:'application/json'});download(blob,'rtb-ready-backup.json');});
    document.getElementById('backupFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(data.format!=='rtb-ready-backup-v1'||!data.progress||typeof data.progress!=='object')throw new Error();app={...freshState(),progress:data.progress,profile:data.profile||null,interviewDate:data.interviewDate||freshState().interviewDate};save();renderSettings();announce('Backup imported.');}catch{announce('That backup file could not be imported.');}e.target.value='';});
    document.getElementById('resetAll').addEventListener('click',()=>{if(!window.confirm('Remove all RTB Ready progress, date settings and imported profile from this browser?'))return;localStorage.removeItem(STORE);app=freshState();renderSettings();announce('All local app data was reset.');});
  }
  function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
  document.querySelectorAll('.nav-link').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.getElementById('settingsButton').addEventListener('click',()=>setView('settings'));
  renderHome();
})();
}).catch(()=>{document.getElementById('view-home').innerHTML='<section class="complete-card"><h2>Practice content could not load.</h2><p>Start a local web server from this folder and refresh.</p></section>';});
