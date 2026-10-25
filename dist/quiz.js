'use strict';
function resultMessage(score,total){
 const ratio=score/total;
 if(ratio===1)return ['You nailed it.','A clean sweep. Nicely done! Keep that curiosity going and try applying one of these ideas to a real project.'];
 if(ratio>=0.75)return ['Looking sharp.','A strong round with a couple of useful details to revisit. Take a look at the explanations and keep building.'];
 if(ratio>=0.5)return ['Good foundations. Keep going.','You have something to build on. Pick one topic below, explore the docs, and come back for another round.'];
 return ['Not your round? No worries.','Some days the brain has too many tabs open. One quiz does not define your skills. You have a few clear starting points for your next learning session.'];
}
if(typeof module!=='undefined')module.exports={resultMessage};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);
 let index=0,answers=[],locked=false;
 function begin(){
  index=0;answers=[];locked=false;
  $('intro').hidden=true;$('results').hidden=true;$('question-panel').hidden=false;
  render();
 }
 function render(){
  locked=false;
  const q=QUESTIONS[index];
  $('topic').textContent=q.topic;$('progress-label').textContent='Question '+(index+1)+' of '+QUESTIONS.length;
  $('progress').max=QUESTIONS.length;$('progress').value=index;
  $('question').textContent=q.question;$('hint').textContent=q.hint;$('hint-box').open=false;
  $('answer-feedback').hidden=true;$('next').hidden=true;$('check').hidden=false;$('check').disabled=true;
  $('options').replaceChildren();
  q.options.forEach((option,i)=>{
   const label=document.createElement('label');label.className='option';
   const radio=document.createElement('input');radio.type='radio';radio.name='answer';radio.value=String(i);
   const text=document.createElement('span');text.textContent=String.fromCharCode(65+i)+'. '+option;
   label.append(radio,text);$('options').append(label);
   radio.addEventListener('change',()=>{$('check').disabled=false;});
  });
  $('question').focus();
 }
 function check(){
  if(locked)return;
  const selected=document.querySelector('input[name="answer"]:checked');
  if(!selected)return;
  locked=true;
  const choice=Number(selected.value),q=QUESTIONS[index],correct=choice===q.correct;
  answers.push(choice);
  $('options').querySelectorAll('input').forEach((radio,i)=>{
   radio.disabled=true;
   const label=radio.parentElement;
   if(i===q.correct){label.classList.add('correct');const mark=document.createElement('span');mark.className='option-mark';mark.textContent='Correct answer';label.append(mark);}
   else if(i===choice){label.classList.add('incorrect');const mark=document.createElement('span');mark.className='option-mark';mark.textContent='Your answer';label.append(mark);}
  });
  $('verdict').textContent=correct?'Exactly right.':'A useful detail to take away.';
  $('explanation').textContent=q.feedback[choice]+(correct?'':' '+q.feedback[q.correct]);
  $('correct-answer').textContent=correct?'':'The answer: '+q.options[q.correct];
  $('correct-answer').hidden=correct;
  $('source').href=q.url;
  $('answer-feedback').hidden=false;$('check').hidden=true;$('next').hidden=false;
  $('next').textContent=index===QUESTIONS.length-1?'See my results →':'Next question →';
  $('progress').value=index+1;
 }
 function finish(){
  const score=answers.reduce((sum,a,i)=>sum+(a===QUESTIONS[i].correct?1:0),0);
  const [title,copy]=resultMessage(score,QUESTIONS.length);
  $('question-panel').hidden=true;$('results').hidden=false;
  $('score').textContent=score+' / '+QUESTIONS.length;$('result-title').textContent=title;$('result-copy').textContent=copy;
  $('review').replaceChildren();
  const heading=document.createElement('h3');heading.textContent='Your round, explained';$('review').append(heading);
  QUESTIONS.forEach((q,i)=>{
   const details=document.createElement('details'),summary=document.createElement('summary');
   summary.textContent=(i+1)+'. '+q.topic+' - '+(answers[i]===q.correct?'Got it':'Worth revisiting');
   const prompt=document.createElement('p');prompt.textContent=q.question;
   const selected=document.createElement('p');selected.textContent='Your answer: '+q.options[answers[i]];
   const correct=document.createElement('p');correct.textContent='Correct answer: '+q.options[q.correct];
   const explanation=document.createElement('p');explanation.textContent=q.feedback[q.correct];
   const link=document.createElement('a');link.textContent='Official documentation ↗';link.className='textlink';link.href=q.url;link.target='_blank';link.rel='noopener noreferrer';
   details.append(summary,prompt,selected,correct,explanation,link);$('review').append(details);
  });
  $('result-title').focus();
 }
 $('start').addEventListener('click',begin);$('restart').addEventListener('click',begin);$('check').addEventListener('click',check);
 $('next').addEventListener('click',()=>{if(!locked)return;if(index===QUESTIONS.length-1)finish();else{index++;render();}});
}
