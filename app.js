const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const views = ["homeView","createView","shareView","quizView","resultView"];
let questionCount = 0, currentQuiz = null, latestResult = null, shareUrl = "";
const defaults = [
  {q:"আমার প্রিয় রং কোনটি?",a:"বেগুনি",options:["বেগুনি","নীল","কালো","সবুজ"]},
  {q:"আমি অবসরে কী করতে পছন্দ করি?",a:"গান শোনা",options:["বই পড়া","গান শোনা","খেলা","ঘুমানো"]},
  {q:"আমার পছন্দের খাবার কোনটি?",a:"পিজ্জা",options:["পিজ্জা","বিরিয়ানি","নুডলস","আইসক্রিম"]}
];
function showView(id){views.forEach(v=>$("#"+v).classList.toggle("hidden",v!==id));window.scrollTo({top:0,behavior:"smooth"});}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2400);}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function addQuestion(data={q:"",a:"",options:["","","",""]}){
  if(questionCount>=10){toast("সর্বোচ্চ ১০টি প্রশ্ন যোগ করা যাবে।");return;}
  questionCount++;
  const n=questionCount, card=document.createElement("div");card.className="question-card";card.dataset.question=n;
  card.innerHTML=`<div class="q-top"><span>QUESTION ${String(n).padStart(2,"0")}</span><button type="button" class="back-btn remove-q">মুছুন ×</button></div>
  <input class="question-text" maxlength="120" placeholder="প্রশ্ন লিখো..." value="${escapeHtml(data.q)}" required>
  <div class="answer-label">৪টি অপশন দাও (একটি সঠিক উত্তর বেছে নাও)</div>
  ${[0,1,2,3].map((i)=>`<input class="option-text" maxlength="60" placeholder="Option ${i+1}" value="${escapeHtml(data.options[i]||"")}" required>`).join("")}
  <label class="answer-label">সঠিক উত্তর</label><select class="correct-answer">${[0,1,2,3].map(i=>`<option value="${i}" ${data.a===data.options[i]&&data.a!==""?"selected":""}>Option ${i+1}</option>`).join("")}</select>`;
  // Select has matching dark styling via inline CSS class.
  $("#questionEditor").appendChild(card);
  card.querySelector(".remove-q").addEventListener("click",()=>{card.remove();renumberQuestions();});
}
function renumberQuestions(){const cards=$$(".question-card",$("#questionEditor"));questionCount=cards.length;cards.forEach((c,i)=>c.querySelector(".q-top span").textContent=`QUESTION ${String(i+1).padStart(2,"0")}`);}
function encodeQuiz(quiz){const bytes=new TextEncoder().encode(JSON.stringify(quiz));let binary="";bytes.forEach(b=>binary+=String.fromCharCode(b));return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");}
function decodeQuiz(token){try{let b64=token.replace(/-/g,"+").replace(/_/g,"/");b64+="=".repeat((4-b64.length%4)%4);const bin=atob(b64);const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));const obj=JSON.parse(new TextDecoder().decode(bytes));if(!obj.name||!Array.isArray(obj.questions)||obj.questions.length<1||obj.questions.length>10) return null;return obj;}catch(e){return null;}}
function createShareUrl(quiz){const url=new URL(window.location.href);url.search="";url.hash="";url.searchParams.set("quiz",encodeQuiz(quiz));return url.toString();}
function renderQuiz(quiz){
 currentQuiz=quiz;$("#quizHeading").textContent=`${quiz.name} এর Quiz`;$("#quizSub").textContent=`${quiz.name} তোমাকে কতটা চেনে দেখাও!`;
 $("#playerName").value="";
 $("#quizQuestions").innerHTML=quiz.questions.map((q,i)=>`<div class="question-block"><h3>${i+1}. ${escapeHtml(q.q)}</h3>${q.options.map((o,j)=>`<label class="option"><input type="radio" name="q${i}" value="${j}" required><span>${escapeHtml(o)}</span></label>`).join("")}</div>`).join("");
 showView("quizView");
}
$("#startCreate").addEventListener("click",()=>{showView("createView");if(!questionCount){defaults.forEach(q=>addQuestion(q));}});
$("#addQuestion").addEventListener("click",()=>addQuestion());
$$("[data-back]").forEach(b=>b.addEventListener("click",()=>showView("homeView")));
$$("[data-home]").forEach(b=>b.addEventListener("click",()=>{history.replaceState({}, "", location.pathname);showView("homeView");}));
$("#createForm").addEventListener("submit",e=>{
 e.preventDefault();
 const name=$("#creatorName").value.trim();const cards=$$(".question-card",$("#questionEditor"));
 if(!name){toast("তোমার নাম লিখো।");return;}if(cards.length<3){toast("কমপক্ষে ৩টি প্রশ্ন যোগ করো।");return;}
 const questions=[];
 for(const card of cards){const q=card.querySelector(".question-text").value.trim();const options=$$(".option-text",card).map(x=>x.value.trim());const answer=Number(card.querySelector(".correct-answer").value);if(!q||options.some(x=>!x)||new Set(options).size!==4){toast("প্রতিটি প্রশ্নে ৪টি আলাদা অপশন দাও।");return;}questions.push({q,options,answer});}
 const quiz={name,questions};shareUrl=createShareUrl(quiz);currentQuiz=quiz;
 $("#shareTitle").textContent=`${name}-এর Quiz`;$("#shareUrl").value=shareUrl;showView("shareView");
});
$("#copyLink").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(shareUrl);toast("লিংক কপি হয়েছে!");}catch(e){$("#shareUrl").select();document.execCommand("copy");toast("লিংক কপি করার চেষ্টা করা হয়েছে।");}});
$("#openQuiz").addEventListener("click",()=>{history.pushState({}, "", shareUrl);renderQuiz(currentQuiz);});
$("#newQuiz").addEventListener("click",()=>{questionCount=0;$("#questionEditor").innerHTML="";$("#creatorName").value="";defaults.forEach(q=>addQuestion(q));showView("createView");});
$("#answerForm").addEventListener("submit",e=>{
 e.preventDefault();if(!currentQuiz)return;
 let correct=0;currentQuiz.questions.forEach((q,i)=>{const picked=$(`input[name="q${i}"]:checked`);if(picked&&Number(picked.value)===q.answer)correct++;});
 const total=currentQuiz.questions.length,pct=Math.round(correct/total*100);latestResult={correct,total,pct,name:$("#playerName").value.trim(),quizName:currentQuiz.name};
 $("#score").textContent=`${pct}%`;$(".score-ring").style.setProperty("--score",`${pct}%`);$("#correctCount").textContent=correct;$("#totalCount").textContent=total;
 let title,msg;if(pct===100){title="একদম Bestie! 🏆";msg="ওয়াও! সব উত্তর সঠিক। তুমি এই মানুষটিকে বেশ ভালো চেনো!";}else if(pct>=65){title="দারুণ করেছো! 💜";msg="তুমি অনেক কিছু জানো—আরও কিছু গল্প জানার বাকি আছে!";}else if(pct>=35){title="আরও গল্প করা দরকার! ✨";msg="কিছু উত্তর মিলেছে। একসঙ্গে আরও সময় কাটাও!";}else{title="আবার চেষ্টা করো! 🌱";msg="এটা শুধু মজার quiz—আরও কথা বললেই একে অপরকে ভালো জানা যাবে।";}
 $("#resultTitle").textContent=title;$("#resultMessage").textContent=msg;showView("resultView");
});
$("#shareResult").addEventListener("click",async()=>{const r=latestResult;if(!r)return;const txt=`আমি ${r.quizName}-এর quiz-এ ${r.pct}% পেয়েছি! 💜 FriendVibe-এ তোমারটাও চেষ্টা করো: ${shareUrl}`;
 try{if(navigator.share)await navigator.share({title:"আমার FriendVibe ফলাফল",text:txt,url:shareUrl});else{await navigator.clipboard.writeText(txt);toast("ফলাফলের লেখা কপি হয়েছে!");}}catch(e){}});
function boot(){
 const params=new URLSearchParams(location.search),token=params.get("quiz");
 if(token){const quiz=decodeQuiz(token);if(quiz){renderQuiz(quiz);}else{showView("homeView");toast("এই quiz লিংকটি সঠিক নয়।");}}
 else showView("homeView");
}
boot();
