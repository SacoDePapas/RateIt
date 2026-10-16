import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth, useClerk, useUser } from '@clerk/react';
import './styles.css';
import './profile.css';
import './room.css';
import './tv.css';
import './library.css';
import './bookshelves.css';

const categories = [
  { id: 'books', label: 'Library', singular: 'book or manga', icon: '▤', color: '#d98961' },
  { id: 'movies', label: 'Movies', singular: 'movie', icon: '▣', color: '#8d719f' },
  { id: 'anime', label: 'Anime', singular: 'anime', icon: '✦', color: '#6e9c88' },
  { id: 'music', label: 'Music', singular: 'album', icon: '◉', color: '#c86e78' },
  { id: 'tv', label: 'TV shows', singular: 'show', icon: '▤', color: '#657ea8' },
];

const starterItems = [
  { id: 1, category: 'books', type: 'Novel', title: 'The Night Circus', author: 'Erin Morgenstern', rating: 5, status: 'Finished', color: '#24213c', accent: '#d98961', coverText: 'the\nnight\ncircus', description: 'A mysterious, atmospheric story about two young magicians bound to a lifelong competition inside a traveling circus that only appears at night.', opinion: 'A beautiful, slow-burning dream. Every page felt like walking through a new tent.', favorite: ['Celia Bowen', 'Marco Alisdair'], disliked: ['The contessa'] },
  { id: 2, category: 'books', type: 'Novel', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', rating: 4, status: 'Finished', color: '#d8a35d', accent: '#3a5577', coverText: 'tomorrow\nand tomorrow', description: 'Two friends—often in love, but never lovers—come together as creative partners in the world of video game design.', opinion: 'Tender, bittersweet, and full of the kind of friendship that changes your life.', favorite: ['Sam Masur', 'Sadie Green'], disliked: [] },
  { id: 3, category: 'books', type: 'Novel', title: 'Piranesi', author: 'Susanna Clarke', rating: 5, status: 'Finished', color: '#87a9b0', accent: '#e8d9b4', coverText: 'PIRANESI', description: 'A house with endless halls, an ocean inside, and a solitary explorer keeping careful journals of the world around him.', opinion: 'Short, strange, and unforgettable.', favorite: ['Piranesi'], disliked: [] },
  { id: 4, category: 'movies', title: 'Past Lives', author: 'Celine Song', rating: 5, status: 'Finished', color: '#d0b18a', accent: '#31536b', coverText: 'PAST\nLIVES', description: 'Two childhood friends are separated and reunited across two decades, confronting the idea of destiny.', opinion: 'The quietest movie I have ever cried through.', favorite: [], disliked: [] },
  { id: 5, category: 'anime', title: 'Frieren', author: 'Kanehito Yamada', rating: 5, status: 'Watching', color: '#5d897d', accent: '#e7c46e', coverText: 'FRIEREN', description: 'An elf mage begins a new journey after the adventure is over, learning what it means to know someone.', opinion: 'A calm, beautiful meditation on time and memory.', favorite: ['Fern', 'Stark'], disliked: [] },
  { id: 6, category: 'tv', title: 'Severance', author: 'Dan Erickson', rating: 5, status: 'Watching', color: '#d8d4b7', accent: '#274c63', coverText: 'SEVERANCE', description: 'Employees whose memories are surgically divided between their work and personal lives begin to question the system around them.', opinion: 'Strange, precise, and impossible to stop watching.', favorite: ['Helly R.'], disliked: [] },
];

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }
function Stars({ value = 0, interactive = false, onChange }) {
  return <span className={'stars ' + (interactive ? 'interactive' : '')} aria-label={`${value} out of 5 stars`}>
    {[1,2,3,4,5].map(n => <button type="button" key={n} className={n <= value ? 'star on' : 'star'} onClick={() => interactive && onChange?.(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}>★</button>)}
  </span>;
}

function Cover({ item, size = 'normal', onClick }) {
  return <button className={`cover ${size} ${item.image ? 'has-image' : ''}`} style={{ '--cover': item.color, '--accent': item.accent }} onClick={onClick} aria-label={`Open ${item.title}`}>
    {item.image && <img src={item.image} alt="" className="cover-image" />}<span className="cover-shine" /><span className="cover-title">{item.coverText.split('\n').map((line, i) => <React.Fragment key={line + i}>{line}{i < item.coverText.split('\n').length - 1 && <br />}</React.Fragment>)}</span><span className="cover-author">{item.author}</span>
  </button>;
}

function App() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const user = clerkUser?.firstName || clerkUser?.username || clerkUser?.primaryEmailAddress?.emailAddress || 'reader';
  const [view, setView] = useState('home');
  const [category, setCategory] = useState('books');
  const [selected, setSelected] = useState(null);
  const [items, setItems] = useState(starterItems);
  const [showProfile, setShowProfile] = useState(false);
  const [bookTypes, setBookTypes] = useState(() => { try { return JSON.parse(localStorage.getItem('rateit-book-types')) || ['Novel', 'Manga', 'Graphic novel', 'Other']; } catch { return ['Novel', 'Manga', 'Graphic novel', 'Other']; } });
  const [menuOpen, setMenuOpen] = useState(false);

  const recent = items.slice(0, 3);
  const currentCategory = categories.find(c => c.id === category) || categories[0];
  const filtered = useMemo(() => items.filter(item => item.category === category), [items, category]);

  function openLibrary(id = category) { setCategory(id); setView('library'); setSelected(null); setMenuOpen(false); }
  function openItem(item) { setSelected(item); setView('detail'); setMenuOpen(false); }
  function addEntry(categoryOverride = category) { const entryCategory = categoryOverride === 'manga' ? 'books' : categoryOverride; setSelected({ id: Date.now(), category: entryCategory, type: entryCategory === 'books' ? 'Novel' : undefined, title: 'Untitled entry', author: 'Add creator', rating: 0, status: 'Want to explore', color: '#c9c5bc', accent: '#314c42', coverText: 'YOUR\nPHOTO', description: '', opinion: '', favorite: [], disliked: [], isNew: true }); setView('detail'); }
  function saveItem(updated) { setItems(prev => [updated, ...prev.filter(i => i.id !== updated.id)]); setSelected(updated); }
  function addBookType(type) { const clean = type.trim(); if (!clean || bookTypes.includes(clean)) return; setBookTypes(current => { const next = [...current, clean]; localStorage.setItem('rateit-book-types', JSON.stringify(next)); return next; }); }

  if (!isLoaded) return <div className="auth-screen"><div className="auth-panel"><div className="auth-panel-inner"><p className="eyebrow">RATE.IT</p><h2>Opening your room…</h2></div></div></div>;
  if (!isSignedIn) return <Auth />;
  return <div className="app-shell">
    <main>
      {view === 'home' && <Home user={user} items={items} recent={recent} onLibrary={openLibrary} onOpen={openItem} onAdd={() => addEntry('movies')} onProfile={() => setShowProfile(true)} />}
      {view === 'library' && <Library category={currentCategory} items={filtered} onCategory={openLibrary} onHome={() => setView('home')} onOpen={openItem} onAdd={() => addEntry('books')} />}
      {view === 'detail' && selected && <Detail item={selected} onBack={() => setView('home')} onSave={saveItem} availableTypes={bookTypes} onAddType={addBookType} />}
    </main>
    {showProfile && <ProfilePanel user={user} onClose={() => setShowProfile(false)} onSignOut={signOut} onChangeUser={() => {}} />}
  </div>;
}

function Home({ user, items, recent, onLibrary, onOpen, onAdd, onProfile }) {
  const [frames, setFrames] = useState([null, null]);
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [tvCategory, setTvCategory] = useState(null);
  const [tvIndex, setTvIndex] = useState(0);
  const [iconPicker, setIconPicker] = useState(null);
  const [remoteIcons, setRemoteIcons] = useState(() => { try { return JSON.parse(localStorage.getItem('rateit-remote-icons')) || { movies: '▣', tv: '▤', anime: '✦' }; } catch { return { movies: '▣', tv: '▤', anime: '✦' }; } });
  const uploadFrame = (index, event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setFrames(current => current.map((frame, i) => i === index ? reader.result : frame)); reader.readAsDataURL(file); };
  function changeRemoteIcon(section, icon) { setRemoteIcons(current => { const next = { ...current, [section]: icon }; localStorage.setItem('rateit-remote-icons', JSON.stringify(next)); return next; }); setIconPicker(null); }
  function uploadRemoteIcon(section, event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setRemoteIcons(current => { const next = { ...current, [section]: reader.result }; localStorage.setItem('rateit-remote-icons', JSON.stringify(next)); return next; }); reader.readAsDataURL(file); }
  const tvItems = tvCategory ? items.filter(item => item.category === tvCategory) : [];
  const activeTvItem = tvItems[tvIndex] || null;
  const addSelected = Boolean(tvCategory) && tvIndex === tvItems.length;
  function selectTvCategory(category) { setTvCategory(category); setTvIndex(0); setRemoteOpen(false); setIconPicker(null); }
  function moveTv(direction) { if (!tvCategory) return; const carouselLength = tvItems.length + 1; setTvIndex(index => (index + direction + carouselLength) % carouselLength); }
  return <div className="room-page">
    <section className="living-room" aria-label="Interactive media room">
      <div className="room-wall">
        <div className="wall-tv" onClick={() => addSelected ? onAdd() : activeTvItem ? onOpen(activeTvItem) : selectTvCategory('movies')} role="button" tabIndex="0" aria-label={addSelected ? 'Add entry' : activeTvItem ? `Open ${activeTvItem.title}` : 'Open movie carousel'}><span className="tv-glow"/><span className="tv-screen">{tvCategory ? <div className="tv-carousel"><span className="tv-carousel-label">{categories.find(category => category.id === tvCategory)?.label}</span><div className="tv-dvd-row">{tvItems.map((item, index) => <div className={index === tvIndex ? 'tv-dvd active' : 'tv-dvd'} key={item.id} style={{ '--cover': item.color, '--accent': item.accent }}><span>{item.coverText.split('\n')[0]}</span></div>)}<button className={addSelected ? 'tv-dvd add-dvd active' : 'tv-dvd add-dvd'} onClick={event => { event.stopPropagation(); onAdd(); }} aria-label="Add entry"><span>＋</span><small>Add entry</small></button></div>{addSelected ? <><strong>Add a new entry</strong><small>Use the remote · OK to add</small></> : <><strong>{activeTvItem?.title}</strong><small>Use the remote to browse · OK to open</small></>}</div> : <div className="tv-idle"><span>YOUR COLLECTION</span><strong>Choose a channel</strong><small>Open the remote below</small></div>}</span><span className="tv-bezel"/></div>
        <div className="wall-shelves" aria-label="Books and manga shelf"><button onClick={() => onLibrary('books')} aria-label="Open books and manga shelf"><span className="books-row"><i/><i/><i/><i/><i/><i/><i/></span><span className="shelf-board"/><span className="shelf-bracket left"/><span className="shelf-bracket right"/></button><button onClick={() => onLibrary('books')} aria-label="Open books and manga shelf"><span className="books-row lower"><i/><i/><i/><i/><i/><i/></span><span className="shelf-board"/><span className="shelf-bracket left"/><span className="shelf-bracket right"/></button></div>
        <div className="wall-frames"><label className="picture-frame frame-one" aria-label="Upload image to frame one"><span className="frame-mat">{frames[0] ? <img src={frames[0]} alt="User uploaded frame one" /> : <span>+</span>}</span><input type="file" accept="image/*" onChange={e => uploadFrame(0, e)} /></label><label className="picture-frame frame-two" aria-label="Upload image to frame two"><span className="frame-mat">{frames[1] ? <img src={frames[1]} alt="User uploaded frame two" /> : <span>+</span>}</span><input type="file" accept="image/*" onChange={e => uploadFrame(1, e)} /></label></div>
      </div>
      <div className="console-table"><span className="console-top"/><span className="console-front"/><span className="console-leg leg-left"/><span className="console-leg leg-right"/></div>
      <div className="floor"/><div className="coffee-table"><span className="coffee-top"/><span className="coffee-edge"/><span className="coffee-leg left"/><span className="coffee-leg right"/><button className="remote" onClick={() => setRemoteOpen(true)} aria-label="Open TV remote menu"><span/><i/><i/><i/><i/><i/></button><button className="coffee-phone" onClick={onProfile} aria-label="Open profile"><span>◉</span></button></div>
      <div className="room-hint">CLICK THE OBJECTS TO EXPLORE <span>✦</span></div>
      {remoteOpen && <div className="remote-menu controller" role="dialog" aria-label="TV remote menu"><div className="controller-top"><span className="controller-brand">rate<span>.</span>it</span><button className="controller-power" onClick={() => setRemoteOpen(false)} aria-label="Close remote menu">⏻</button></div><div className="controller-display">SELECT A CHANNEL</div><div className="controller-number-pad">{['1','2','3','4','5','6','7','8','9','*','0','#'].map(number => <button key={number}>{number}</button>)}</div><div className="controller-controls"><span className="controller-dpad"><i/><b/><em/><strong/><button className="dpad-left" onClick={() => moveTv(-1)} aria-label="Previous DVD">‹</button><button className="dpad-center" onClick={() => addSelected ? onAdd() : activeTvItem && onOpen(activeTvItem)} aria-label="Open selected DVD or add entry">OK</button><button className="dpad-right" onClick={() => moveTv(1)} aria-label="Next DVD">›</button></span><span className="controller-round-buttons"><i/><i/></span></div><div className="controller-dedicated"><button>VOL <b>＋</b></button><button onClick={() => setTvCategory(null)}>HOME</button><button>CH <b>＋</b></button><button>MUTE</button><button>BACK</button><button>GUIDE</button></div><p className="controller-label">OPEN A SECTION</p><div className="controller-buttons">{[['movies','Movies'],['tv','TV shows'],['anime','Anime']].map(([id, label]) => <div className="controller-key" key={id}><button className="controller-icon" onClick={() => setIconPicker(iconPicker === id ? null : id)} aria-label={`Change ${label} icon`}>{remoteIcons[id]?.startsWith?.('data:') ? <img src={remoteIcons[id]} alt="" /> : remoteIcons[id]}</button><button className="controller-section" onClick={() => selectTvCategory(id)}>{label}<span>→</span></button>{iconPicker === id && <div className="icon-picker"><label className="icon-upload">＋ Photo<input type="file" accept="image/*" onChange={e => uploadRemoteIcon(id, e)} /></label>{['▣','▤','✦','◉','◆','●','★','♬'].map(icon => <button key={icon} onClick={() => changeRemoteIcon(id, icon)}>{icon}</button>)}</div>}</div>)}</div><div className="controller-home-bar"/></div>}
    </section>
  </div>;
}

function Library({ category, items, onHome, onOpen, onAdd }) {
  const bookItems = items.filter(item => item.category === 'books');
  const groups = [...new Set(bookItems.map(item => item.type || 'Novel'))];
  return <div className="library-page page-wrap bookshelf-library"><div className="library-head"><div><button className="back-link" onClick={onHome}>← Back to living room</button><p className="eyebrow">YOUR BOOKSHELF</p><h1>Library<span className="heading-count">{bookItems.length}</span></h1><p className="muted">Every kind of story has a place here.</p></div><button className="button primary" onClick={onAdd}>＋ Add to library</button></div>{bookItems.length ? <div className="book-type-shelves">{groups.map(type => <section className="book-type-shelf" key={type}><div className="book-type-heading"><h2>{type}</h2><span>{bookItems.filter(item => (item.type || 'Novel') === type).length} {bookItems.filter(item => (item.type || 'Novel') === type).length === 1 ? 'book' : 'books'}</span></div><div className="book-type-row">{bookItems.filter(item => (item.type || 'Novel') === type).map(item => <article className="library-card" key={item.id} onClick={() => onOpen(item)}><Cover item={item} /><div className="library-card-body"><span className="status">{item.status}</span><h3>{item.title}</h3><p>{item.author}</p><Stars value={item.rating} /></div></article>)}</div></section>)}</div> : <div className="empty-state"><div className="empty-icon">▤</div><h2>This shelf is waiting for a story.</h2><p>Add something you love, then make it yours with a rating and a note.</p><button className="button primary" onClick={onAdd}>Add your first book</button></div>}</div>;
}

function Detail({ item, onBack, onSave, availableTypes = [], onAddType }) {
  const [draft, setDraft] = useState(item);
  const [showFavorites, setShowFavorites] = useState(Boolean(item.favorite?.length));
  const [showDisliked, setShowDisliked] = useState(Boolean(item.disliked?.length));
  const update = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  function handleCoverChange(event) { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => update('image', reader.result); reader.readAsDataURL(file); }
  function handleTypeChange(event) { if (event.target.value === '__new__') { const newType = window.prompt('Name this type'); if (newType?.trim()) { onAddType?.(newType); update('type', newType.trim()); } return; } update('type', event.target.value); }
  const tvStyled = ['movies', 'anime', 'tv'].includes(draft.category);
  return <div className={`detail-page page-wrap ${tvStyled ? 'entry-screen' : ''}`}><button className="back-link" onClick={onBack}>← Back to living room</button><div className="detail-layout"><aside className="detail-cover"><Cover item={draft} size="large" /><label className="upload-button">↥ Change cover<input type="file" accept="image/*" onChange={handleCoverChange} /></label><div className="rating-block"><span className="field-label">YOUR RATING</span><Stars value={draft.rating} interactive onChange={v => update('rating', v)} /></div></aside><section className="detail-content"><div className="detail-title-row"><div><span className="mini-label">{categories.find(c => c.id === draft.category)?.label}</span><input className="title-input" value={draft.title} onChange={e => update('title', e.target.value)} aria-label="Title" /><input className="author-input" value={draft.author} onChange={e => update('author', e.target.value)} aria-label="Author or creator" /></div><div className="detail-selects">{draft.category === 'books' && <label className="type-select-label">TYPE<select value={draft.type || availableTypes[0]} onChange={handleTypeChange}>{availableTypes.map(type => <option key={type}>{type}</option>)}<option value="__new__">＋ Create new type…</option></select></label>}<label className="type-select-label">STATUS<select value={draft.status} onChange={e => update('status', e.target.value)}><option>Finished</option><option>Watching</option><option>Reading</option><option>Want to explore</option><option>On hold</option></select></label></div></div><label className="field-label">DESCRIPTION<textarea value={draft.description} onChange={e => update('description', e.target.value)} placeholder="What is this one about?" /></label><label className="field-label opinion-field">YOUR PERSONAL OPINION<textarea value={draft.opinion} onChange={e => update('opinion', e.target.value)} placeholder="How did it make you feel?" /></label><div className="optional-heading"><div><span className="field-label">OPTIONAL SECTIONS</span><p>Add the details you want to remember.</p></div><div className="optional-toggles"><button className={showFavorites ? 'toggle on' : 'toggle'} onClick={() => setShowFavorites(!showFavorites)}><span /> Favorite characters</button><button className={showDisliked ? 'toggle on' : 'toggle'} onClick={() => setShowDisliked(!showDisliked)}><span /> Characters I disliked</button></div></div>{showFavorites && <CharacterList title="Personajes favoritos" value={draft.favorite} onChange={v => update('favorite', v)} tone="favorite" />}{showDisliked && <CharacterList title="Personajes odiados" value={draft.disliked} onChange={v => update('disliked', v)} tone="disliked" />}<div className="save-row"><button className="button primary" onClick={() => onSave(draft)}>Save entry</button><button className="text-button" onClick={onBack}>Cancel</button></div></section></div></div>;
}

function CharacterList({ title, value, onChange, tone }) { const [text, setText] = useState(''); function add() { if (text.trim()) { onChange([...value, text.trim()]); setText(''); } } return <div className={`character-section ${tone}`}><div className="character-heading"><h3>{title}</h3><span>OPTIONAL</span></div><div className="chips">{value.map((name, i) => <span className="chip" key={name + i}>{name}<button onClick={() => onChange(value.filter((_, index) => index !== i))}>×</button></span>)}</div><div className="add-character"><input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} placeholder="Add a character" /><button onClick={add}>＋</button></div></div>; }

function ProfilePanel({ user, onClose, onSignOut, onChangeUser }) {
  const [name, setName] = useState(user);
  const [roomName, setRoomName] = useState('My media room');
  const [accent, setAccent] = useState('Sage & coral');
  const [saved, setSaved] = useState(false);
  return <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="Profile settings"><button className="profile-backdrop" onClick={onClose} aria-label="Close profile" /><section className="profile-panel phone-profile"><div className="phone-status"><span>9:41</span><span>◔ ◒ ▰</span></div><div className="phone-notch" /><button className="profile-close" onClick={onClose}>×</button><div className="phone-header"><span className="eyebrow">PROFILE</span><h2>{name}</h2><p>Customize your room.</p></div><div className="profile-apps"><div className="profile-app"><div className="app-icon identity">R</div><label>Identity<input value={name} onChange={e => setName(e.target.value)} aria-label="Display name" /></label></div><div className="profile-app"><div className="app-icon room">⌂</div><label>Room name<input value={roomName} onChange={e => setRoomName(e.target.value)} aria-label="Room name" /></label></div><div className="profile-app"><div className="app-icon palette">✦</div><label>Room style<select value={accent} onChange={e => setAccent(e.target.value)} aria-label="Room style"><option>Sage & coral</option><option>Walnut & amber</option><option>Night library</option></select></label></div><div className="profile-app"><div className="app-icon privacy">◎</div><label>Account<input value="Protected profile" readOnly aria-label="Account status" /></label></div></div><button className="button primary full profile-save" onClick={() => { onChangeUser?.(name || user); setSaved(true); }}>{saved ? 'Changes saved ✓' : 'Save changes'}<span>→</span></button><button className="power-button" onClick={onSignOut} aria-label="Turn off and sign out"><span>⏻</span> Turn off</button><div className="phone-home-bar" /></section></div>;
}

function Auth() { const { openSignIn, openSignUp } = useClerk(); return <div className="auth-screen"><div className="auth-art"><div className="brand light"><span className="brand-mark">R</span><span>rate<span className="brand-dot">.</span>it</span></div><div className="auth-art-copy"><p className="eyebrow">A HOME FOR THE STORIES YOU LOVE</p><h1>Make room for<br /><em>what moves you.</em></h1><div className="tiny-shelf"><i/><i/><i/><i/><i/></div></div><p className="auth-quote">“Every story is a room you can return to.”</p></div><div className="auth-panel"><div className="auth-panel-inner"><p className="eyebrow">WELCOME BACK</p><h2>Come on in.</h2><p className="auth-sub">Your shelves have been waiting.</p><button className="button primary full" type="button" onClick={() => openSignIn()}>Enter my room <span>→</span></button><div className="auth-divider"><span>or</span></div><button className="auth0-button" type="button" onClick={() => openSignUp()}><span className="auth0-mark">◎</span> Create an account</button><p className="auth-note">Secure sign-in, password recovery, and supported social providers are handled by Clerk.</p></div></div></div>; }
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')).render(<ClerkProvider publishableKey={clerkPublishableKey}><App /></ClerkProvider>);
