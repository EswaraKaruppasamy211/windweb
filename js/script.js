// Menu
const menu=document.getElementById('menu');
document.getElementById('menuBtn').onclick=()=>menu.classList.toggle('open');
menu.querySelectorAll('a').forEach(a=>a.onclick=()=>menu.classList.remove('open'));

// Tabs
document.querySelectorAll('.tabs').forEach(g=>{
  g.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    g.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
    g.parentElement.querySelectorAll(':scope > .pane').forEach(p=>p.classList.toggle('on',p.id===b.dataset.t));
  });
});

// Manufacturing steps
const steps=[["Raw Material Procurement","Steel, fiberglass, carbon fiber and resins received at storage."],
["CNC Cutting & Forming","Plasma, laser cutting, press braking and plate rolling."],
["Fabrication & Welding","Submerged arc and robotic welding for towers and structures."],
["Blade Moulding","FRP mould with vacuum infusion for optimised blades."],
["Surface Treatment","Shot blasting and painting booth for corrosion protection."],
["Assembly","EOT cranes, hydraulic presses and assembly line."],
["Quality Testing","WT-TEST validates structural integrity and performance."],
["Dispatch & Export","Hydraulic trailers to the port or client sites."]];
document.getElementById('steps').innerHTML=steps.map((s,i)=>`<div><b>0${i+1} ${s[0]}</b><br><small>${s[1]}</small></div>`).join('');

// Documents checklist
document.getElementById('docs').innerHTML=["Company Registration Certificate","PAN Card (Company & Directors)","GST Registration Certificate","Aadhaar Card of Directors","Last 3 Years Audited Balance Sheet","Bank Statements (Last 12 Months)","Detailed Project Report (DPR)","Land Documents / Sale Deed","Quotations for Machinery","Environmental Clearance Certificate","Memorandum & Articles of Association","Board Resolution for Loan"]
 .map(d=>`<label><input type="checkbox" value="Yes"> ${d}</label>`).join('');

// Blueprint zoom
let z=1;const bp=document.getElementById('bp'),zv=document.getElementById('zVal');
const setZ=v=>{z=Math.min(3,Math.max(.5,v));bp.style.transform=`scale(${z})`;zv.textContent=Math.round(z*100)+'%';};
zIn.onclick=()=>setZ(z+.25);zOut.onclick=()=>setZ(z-.25);zReset.onclick=()=>setZ(1);

// Illustrative reference imagery; the campus rendering is not a photograph of an operating plant.
const items=[
  {c:"campus",t:"Thoothukudi Campus Concept",d:"Project visualization of the planned manufacturing campus.",img:"images/facility-blueprint.jpg",alt:"Concept rendering of a wind turbine manufacturing campus with blade and tower production buildings."},
  {c:"turbine",t:"Wind Farm at Sunset",d:"Wind turbines generating power across an open agricultural landscape.",img:"images/gallery/wind-farm.jpg",alt:"Wind turbines across a field at sunset."},
  {c:"turbine",t:"Wind Farm Landscape",d:"Reference wind farm across open, green terrain.",img:"images/gallery/wind-farm-coast.jpg",alt:"Wind turbines on green rolling hills beneath a cloudy sky."},
  {c:"renewable",t:"Solar-Powered Operations",d:"Renewable energy reference for the project’s sustainability goals.",img:"images/gallery/solar-energy.jpg",alt:"Rows of solar panels under a bright, cloudy sky."}
];
const grid=document.getElementById('galleryGrid');
grid.innerHTML=items.map(i=>`<button class="gitem" type="button" data-c="${i.c}" aria-label="View ${i.t}">
  <img src="${i.img}" alt="${i.alt}" loading="lazy">
  <span class="gcaption"><strong>${i.t}</strong><small>${i.d}</small></span>
</button>`).join('');
const lb=document.getElementById('lightbox'),lbBody=document.getElementById('lbBody');
grid.querySelectorAll('.gitem').forEach((g,index)=>g.onclick=()=>{
  const item=items[index];
  lbBody.innerHTML=`<img src="${item.img}" alt="${item.alt}"><div class="lightbox-caption"><strong>${item.t}</strong><span>${item.d}</span></div>`;
  lb.hidden=false;
});
lbClose.onclick=()=>lb.hidden=true;lb.onclick=e=>{if(e.target===lb)lb.hidden=true;};
document.querySelectorAll('#filters button').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('#filters button').forEach(x=>x.classList.remove('on'));b.classList.add('on');
  grid.querySelectorAll('.gitem').forEach(g=>g.style.display=(b.dataset.f==='all'||g.dataset.c===b.dataset.f)?'':'none');
});

const loanForm=document.getElementById('loanForm');
const loanOk=document.getElementById('loanOk');
const loanError=document.getElementById('loanError');
const loanDownload=document.getElementById('loanDownload');
const loanSubmit=loanForm.querySelector('button[type="submit"]');
let submittedLoanApplication=[];

function getFieldLabel(control){
  const label=control.closest('label');
  if(!label)return control.name;
  const copy=label.cloneNode(true);
  copy.querySelectorAll('input,select,textarea').forEach(field=>field.remove());
  return copy.textContent.replace(/\s+/g,' ').trim().replace(/\s*\*$/,'');
}

function getLoanApplicationSnapshot(){
  return [...loanForm.querySelectorAll('input:not([type="hidden"]),select,textarea')].map(control=>{
    let value;
    if(control.type==='checkbox'){
      value=control.checked?'Yes':'No';
    }else if(control.tagName==='SELECT'){
      value=control.selectedOptions[0]?.textContent.trim()||'';
    }else{
      value=control.value.trim();
    }
    return {label:getFieldLabel(control),value:value||'—'};
  });
}

function escapeHtml(value){
  return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function openLoanApplicationPdf(){
  const printWindow=window.open('','_blank');
  if(!printWindow){
    loanError.textContent='Your browser blocked the print window. Allow pop-ups for this site, then try again.';
    loanError.hidden=false;
    return;
  }
  printWindow.opener=null;
  const rows=submittedLoanApplication.map(field=>`<tr><th>${escapeHtml(field.label)}</th><td>${escapeHtml(field.value)}</td></tr>`).join('');
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Completed Loan Application</title><style>
    body{font:14px Arial,sans-serif;color:#1b2d40;margin:32px}h1{color:#3976a8;margin-bottom:4px}p{color:#65768a;margin-top:0}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{padding:9px 10px;border:1px solid #d7e0e9;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{width:34%;background:#f1f6fa}@media print{body{margin:14mm}tr{break-inside:avoid}}
    </style></head><body><h1>Loan Application</h1><p>Windmill Manufacturing Company · Thoothukudi</p><p>Submitted application copy</p><table><tbody>${rows}</tbody></table><script>window.addEventListener('load',function(){window.focus();window.print();});<\/script></body></html>`);
  printWindow.document.close();
}

loanDownload.addEventListener('click',openLoanApplicationPdf);
loanForm.onsubmit=async event=>{
  event.preventDefault();
  loanOk.hidden=true;
  loanError.hidden=true;
  loanDownload.hidden=true;
  submittedLoanApplication=[];
  loanSubmit.disabled=true;
  loanSubmit.textContent='Submitting…';

  try{
    if(['localhost','127.0.0.1','::1'].includes(location.hostname)){
      throw new Error('Local preview cannot submit forms. Deploy the site to Netlify to send the application.');
    }
    loanForm.elements.documents_checklist.value=[...loanForm.querySelectorAll('#docs input:checked')]
      .map(control=>getFieldLabel(control))
      .join(', ');
    const response=await fetch(loanForm.action,{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams(new FormData(loanForm)).toString()
    });
    if(!response.ok){
      throw new Error(`Netlify Forms returned ${response.status}; confirm form detection is enabled and the latest site is deployed.`);
    }

    submittedLoanApplication=getLoanApplicationSnapshot();
    loanOk.textContent='Your application was submitted. Save a PDF copy using the button below.';
    loanOk.hidden=false;
    loanDownload.hidden=false;
    loanForm.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){
    console.error('Loan application submission failed:',error);
    loanError.textContent=error instanceof Error?error.message:'The application could not be submitted. Please try again.';
    loanError.hidden=false;
  }finally{
    loanSubmit.disabled=false;
    loanSubmit.textContent='✅ Submit Loan Application';
  }
};

// Netlify Forms stores submissions; configure an email notification in the Netlify site settings.
const contactForm=document.getElementById('contactForm');
const contactStatus=document.getElementById('contactStatus');
const contactSubmit=document.getElementById('contactSubmit');
const contactEmail='eswarakaruppasamy211@gmail.com';
const localPreview=['localhost','127.0.0.1','::1'].includes(location.hostname);

function showContactError(message){
  const subject=contactForm.elements['enquiry_subject'].value||'Website enquiry';
  const body=[
    `Name: ${contactForm.elements.name.value}`,
    `Email: ${contactForm.elements.email.value}`,
    `Phone: ${contactForm.elements.phone.value||'-'}`,
    `Subject: ${subject}`,
    '',
    contactForm.elements.message.value
  ].join('\n');
  const link=document.createElement('a');
  link.href=`mailto:${contactEmail}?${new URLSearchParams({subject:`Windmill website enquiry: ${subject}`,body})}`;
  link.textContent=`Email ${contactEmail}`;
  contactStatus.replaceChildren(document.createTextNode(`${message} `),link);
  contactStatus.classList.add('error');
}

contactForm.onsubmit=async event=>{
  event.preventDefault();
  if(contactForm.elements['bot-field'].value)return;

  contactStatus.hidden=true;
  contactStatus.className='form-status';
  contactSubmit.disabled=true;
  contactSubmit.textContent='Sending…';

  try{
    if(localPreview){
      showContactError('Local preview cannot submit forms. Open a prefilled message in your email app:');
      return;
    }

    const response=await fetch(contactForm.action,{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams(new FormData(contactForm)).toString()
    });
    if(!response.ok){
      if(response.status===404||response.status===405){
        throw new Error(`Netlify Forms returned ${response.status}; check form detection and deploy settings.`);
      }
      throw new Error(`Netlify Forms returned ${response.status}`);
    }

    contactStatus.textContent='Your message was submitted successfully. Thank you for contacting us.';
    contactStatus.classList.add('success');
    contactForm.reset();
  }catch(error){
    console.error('Contact form submission failed:',error);
    const reason=error instanceof Error?error.message:'Unknown submission error';
    showContactError(`Your message could not be submitted (${reason}). You can email us directly instead:`);
  }finally{
    contactStatus.hidden=false;
    contactSubmit.disabled=false;
    contactSubmit.textContent='Send Message →';
  }
};

// Active nav link
const secs=[...document.querySelectorAll('.page')];
addEventListener('scroll',()=>{let cur=secs[0].id;secs.forEach(s=>{if(s.getBoundingClientRect().top<120)cur=s.id;});
  menu.querySelectorAll('a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+cur));});
