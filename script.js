function updateTime(){
  const el = document.querySelector('#local-time span');
  const now = new Date();
  el.textContent = now.toLocaleString('en-KE', {hour12:true});
}
document.querySelector('#refresh').addEventListener('click', updateTime);
updateTime();
