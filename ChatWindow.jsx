import { useEffect, useRef, useState } from 'react';
import { formatDay, formatTime } from '../time.js';

function typingLabel(names) {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} is typing...`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
  return 'Several people are typing...';
}

export default function ChatWindow({ room, user, chat, connected }) {
  const { messages, typing, loading, error, send, setTypingState } = chat;
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState('');
  const listRef = useRef(null);
  const stickToBottom = useRef(true);
  const typingTimer = useRef(null);

  // Follow new messages, unless the reader has scrolled up to look at older ones.
  useEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages, room?.id]);

  useEffect(() => {
    stickToBottom.current = true;
    setText('');
    setSendError('');
  }, [room?.id]);

  const onScroll = () => {
    const el = listRef.current;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const onChange = (e) => {
    setText(e.target.value);
    setTypingState(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTypingState(false), 1500);
  };

  const submit = async (e) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    clearTimeout(typingTimer.current);
    setTypingState(false);
    stickToBottom.current = true;
    const res = await send(value);
    if (res?.ok) {
      setText('');
      setSendError('');
    } else {
      setSendError(res?.error || 'Message not sent.');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) submit(e);
  };

  if (!room) return <div className="empty">Choose a room to start chatting.</div>;

  let lastDay = '';
  const typingNames = Object.values(typing);

  return (
    <div className="window">
      <div
        className="messages"
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-label={`Messages in ${room.name}`}
      >
        {loading && <p className="notice">Loading messages...</p>}
        {!loading && messages.length === 0 && (
          <p className="notice">No messages in #{room.name} yet. Say hello.</p>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        {messages.map((msg) => {
          const day = formatDay(msg.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          const mine = msg.senderId === user.id;
          return (
            <div key={msg.id}>
              {showDay && <div className="day">{day}</div>}
              <article className={`msg ${mine ? 'mine' : ''}`}>
                <header>
                  {!mine && <span className="author">{msg.senderName}</span>}
                  <time dateTime={new Date(msg.createdAt).toISOString()} title={new Date(msg.createdAt).toLocaleString()}>
                    {formatTime(msg.createdAt)}
                  </time>
                </header>
                <p>{msg.text}</p>
              </article>
            </div>
          );
        })}
      </div>

      <div className="typing" aria-live="polite">{typingLabel(typingNames)}</div>

      <form className="composer" onSubmit={submit}>
        <label htmlFor="composer" className="sr-only">Message #{room.name}</label>
        <textarea
          id="composer"
          rows={1}
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={connected ? `Message #${room.name}` : 'Reconnecting...'}
          maxLength={1000}
        />
        <button className="primary" disabled={!connected || !text.trim()}>Send</button>
      </form>
      {sendError && <p className="error composer-error" role="alert">{sendError}</p>}
    </div>
  );
}
