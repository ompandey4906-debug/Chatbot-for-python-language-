import {useEffect,useRef,useState} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {Bot,BookOpen,Check,Code2,Copy,ExternalLink,Github,Menu,MessageCircle,Plus,Send,Sparkles,Trash2,X} from 'lucide-react';

const suggestions=[
 {icon:'⌘',title:'Python basics',prompt:'Explain Python variables and data types with simple examples.'},
 {icon:'▤',title:'Lists vs tuples',prompt:'What is the difference between a list and a tuple in Python?'},
 {icon:'{ }',title:'Understand code',prompt:'Explain Python list comprehensions with examples.'},
 {icon:'⚙',title:'Debug a problem',prompt:'How do try, except, else, and finally work in Python?'}
];
const base=(import.meta.env.VITE_API_URL||'').replace(/\/$/,'');
const endpoint=import.meta.env.VITE_CHAT_ENDPOINT||'/api/chat';
const answerOf=d=>typeof d==='string'?d:(d?.answer??d?.response??d?.message??d?.output??d?.result??d?.content??d?.ai_response??JSON.stringify(d,null,2));

export default function App(){
 const [messages,setMessages]=useState([]),[question,setQuestion]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[menu,setMenu]=useState(false),[status,setStatus]=useState('unknown'),[copied,setCopied]=useState('');
 const end=useRef(null),input=useRef(null);
 useEffect(()=>{end.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,loading]);
 const reset=()=>{setMessages([]);setQuestion('');setError('');setLoading(false);setMenu(false);input.current?.focus();};
 async function send(value=question){
  const q=value.trim();if(!q||loading)return;
  setMessages(m=>[...m,{id:crypto.randomUUID(),role:'user',content:q}]);setQuestion('');setError('');setLoading(true);setStatus('checking');
  try{
   const res=await fetch(base+(endpoint.startsWith('/')?endpoint:'/'+endpoint),{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({question:q,query:q,message:q})});
   const raw=await res.text();let data;try{data=raw?JSON.parse(raw):{};}catch{data=raw;}
   if(!res.ok)throw new Error(typeof data==='object'?(data.detail||data.error||data.message||'Request failed ('+res.status+')'):data);
   setStatus('online');setMessages(m=>[...m,{id:crypto.randomUUID(),role:'assistant',content:answerOf(data),sources:typeof data==='object'?(data.sources||data.source_documents||[]):[]}]);
  }catch(e){setStatus('offline');setError(e.message||'Could not connect to the chatbot API.');setMessages(m=>[...m,{id:crypto.randomUUID(),role:'assistant',failed:true,content:'I couldn’t reach the backend, so I don’t have an answer yet. Check that your Python API is running and that the API URL and endpoint in frontend/.env match your project.'}]);}
  finally{setLoading(false);input.current?.focus();}
 }
 async function copy(m){try{await navigator.clipboard.writeText(m.content);setCopied(m.id);setTimeout(()=>setCopied(''),1400);}catch{setError('Clipboard access was blocked by your browser.');}}
 return <div className="app-shell">
  <aside className={'sidebar '+(menu?'sidebar-open':'')}>
   <div className="brand-row"><div className="brand-mark"><Code2 size={22}/></div><div><div className="brand-name">PyMentor<span>.</span></div><div className="brand-subtitle">PYTHON Q&A ASSISTANT</div></div><button className="icon-button mobile-close" aria-label="Close menu" onClick={()=>setMenu(false)}><X size={18}/></button></div>
   <button className="new-chat-button" onClick={reset}><Plus size={17}/> New conversation <span>⌘ K</span></button>
   <div className="side-label">YOUR WORKSPACE</div>
   <button className="nav-item active" onClick={reset}><MessageCircle size={17}/> Python assistant</button>
   <a className="nav-item" href="https://docs.python.org/3/" target="_blank" rel="noreferrer"><BookOpen size={17}/> Python documentation <ExternalLink size={13} className="nav-external"/></a>
   <a className="nav-item" href="https://github.com/ompandey4906-debug/Chatbot-for-python-language-" target="_blank" rel="noreferrer"><Github size={17}/> Project repository <ExternalLink size={13} className="nav-external"/></a>
   <div className="sidebar-bottom"><div className="connection-card"><div className={'status-dot '+(status==='online'?'status-online':status==='offline'?'status-offline':'')}/><div><div className="connection-title">{status==='online'?'Backend connected':status==='offline'?'Backend unreachable':'API connection'}</div><div className="connection-caption">{status==='online'?'Ready for questions':'Uses your existing Python API'}</div></div></div><div className="profile-row"><div className="avatar">Py</div><div className="profile-copy"><strong>Python learner</strong><span>Keep building your skills</span></div><Sparkles size={16} className="profile-sparkle"/></div></div>
  </aside>
  {menu&&<button className="mobile-overlay" aria-label="Close navigation" onClick={()=>setMenu(false)}/>}
  <main className="main-panel"><header className="topbar"><div className="topbar-left"><button className="icon-button menu-toggle" aria-label="Open menu" onClick={()=>setMenu(true)}><Menu size={19}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>Python assistant</strong></div></div><div className="topbar-right"><span className="model-chip"><span className="tiny-green-dot"/> Knowledge assistant</span><button className="icon-button" aria-label="Start new chat" title="New conversation" onClick={reset}><Plus size={18}/></button></div></header>
   <section className={'conversation '+(messages.length?'conversation-active':'')}>
    {messages.length===0?<div className="welcome-screen"><div className="welcome-icon"><Code2 size={27}/></div><div className="eyebrow"><span/> YOUR PYTHON LEARNING COMPANION</div><h1>Hey there, <span>developer.</span><br/>What are we learning today?</h1><p className="welcome-description">Ask a Python question, understand a tricky concept, or work through code step by step. Let’s make it click.</p><div className="suggestion-grid">{suggestions.map(s=><button className="suggestion-card" key={s.title} onClick={()=>send(s.prompt)}><span className="suggestion-icon">{s.icon}</span><span className="suggestion-text"><strong>{s.title}</strong><small>{s.prompt}</small></span><span className="suggestion-arrow">↗</span></button>)}</div><div className="welcome-note"><Sparkles size={14}/> Clear explanations. Practical Python. One question at a time.</div></div>
    :<div className="message-list"><div className="conversation-heading"><div><div className="eyebrow">PYTHON Q&A SESSION</div><h2>Let’s figure it out.</h2></div><button className="clear-button" onClick={reset}><Trash2 size={14}/> Clear chat</button></div>{messages.map(m=><article className={'message-row '+(m.role==='user'?'user-row':'assistant-row')} key={m.id}><div className={'message-avatar '+(m.role==='user'?'user-avatar':'')}>{m.role==='user'?'You':<Bot size={18}/>}</div><div className="message-content-wrap"><div className="message-meta">{m.role==='user'?'YOU':'PYMENTOR'} {m.failed&&<span className="failed-label">CONNECTION ISSUE</span>}</div><div className="message-content"><ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown></div>{m.sources?.length>0&&<details className="sources-details"><summary><BookOpen size={14}/> Sources used ({m.sources.length})</summary><ul>{m.sources.map((s,i)=><li key={i}>{typeof s==='string'?s:(s.title||s.source||s.metadata?.source||JSON.stringify(s))}</li>)}</ul></details>}{m.role==='assistant'&&<button className="copy-button" onClick={()=>copy(m)}>{copied===m.id?<Check size={13}/>:<Copy size={13}/>} {copied===m.id?'Copied':'Copy answer'}</button>}</div></article>)}{loading&&<div className="message-row assistant-row"><div className="message-avatar"><Bot size={18}/></div><div className="message-content-wrap"><div className="message-meta">PYMENTOR IS THINKING</div><div className="typing-indicator"><span/><span/><span/></div></div></div>}<div ref={end}/></div>}
   </section>
   <div className="composer-area">{error&&<div className="error-banner"><span>{error}</span><button aria-label="Dismiss error" onClick={()=>setError('')}><X size={15}/></button></div>}<form className="composer" onSubmit={e=>{e.preventDefault();send();}}><textarea ref={input} value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Ask anything about Python..." rows={1} aria-label="Your Python question"/><div className="composer-footer"><div className="composer-hint"><span className="keyboard-key">↵</span> to send <span className="hint-divider">·</span><span className="keyboard-key">⇧ ↵</span> new line</div><button className="send-button" type="submit" disabled={!question.trim()||loading} aria-label="Send question">{loading?<span className="send-spinner"/>:<Send size={16}/>}<span>Send</span></button></div></form><p className="disclaimer">AI can make mistakes. Verify important details with the <a href="https://docs.python.org/3/" target="_blank" rel="noreferrer">official Python docs</a>.</p></div>
  </main>
 </div>;
}