import { Astronaut, Icon } from "./Icons";

export default function MainMenu({
  name,
  setName,
  joinCode,
  setJoinCode,
  onBots,
  onCreate,
  onJoin,
  busy,
  error,
}) {
  return (
    <main className="menu-layout page-enter">
      <section className="hero-panel">
        <div className="eyebrow">
          <span className="live-dot" /> YOUR MISSION STARTS HERE{" "}
          <span className="eyebrow-line" />
        </div>
        <h1>
          TRUST NO
          <br />
          <span>ONE.</span>
        </h1>
        <p className="hero-copy">
          A little space. A lot of suspicion.
          <br />
          Gather your crew or brave the ship alone.
        </p>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="art-star star-a">✦</span>
          <span className="art-star star-b">✧</span>
          <span className="art-star star-c">✦</span>
          <div className="planet" />
          <Astronaut size={205} color="#f8bc5d" className="hero-astro" />
          <Astronaut size={129} color="#68d6c9" className="hero-astro-small" />
          <div className="art-caption">
            SOMEWHERE IN DEEP SPACE <span>↗</span>
          </div>
        </div>
        <div className="hero-footer">
          <span>01 / 03</span>
          <div className="hero-progress">
            <i />
          </div>
          <span>THE ADVENTURE BEGINS</span>
        </div>
      </section>

      <section className="menu-panel">
        <div className="menu-top">
          <div className="edition">
            BROWSER EDITION <span>✳</span>
          </div>
          <span className="build-tag">NO DOWNLOAD REQUIRED</span>
        </div>
        <div className="menu-inner">
          <div className="section-index">
            01 <span>—</span> WELCOME ABOARD
          </div>
          <h2>
            Ready to <em>launch?</em>
          </h2>
          <p className="menu-description">
            Choose your mission. Your ship is waiting.
          </p>
          <label className="field-label" htmlFor="player-name">
            YOUR CREWMATE NAME
          </label>
          <div className="name-field">
            <span className="name-icon">
              <Icon name="users" size={18} />
            </span>
            <input
              id="player-name"
              maxLength={18}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              autoComplete="nickname"
            />
            <span className="field-counter">{name.length}/18</span>
          </div>
          <div className="mode-list">
            <button
              className="mode-card featured"
              onClick={onBots}
              disabled={busy}
            >
              <span className="mode-icon warm">
                <Icon name="bolt" size={23} />
              </span>
              <span className="mode-info">
                <strong>Play vs Bots</strong>
                <small>Jump right in · solo mission</small>
              </span>
              <span className="mode-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>
            <button className="mode-card" onClick={onCreate} disabled={busy}>
              <span className="mode-icon mint">
                <Icon name="plus" size={23} />
              </span>
              <span className="mode-info">
                <strong>Create Room</strong>
                <small>Host a game with your crew</small>
              </span>
              <span className="mode-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>
            <form
              className="join-card"
              onSubmit={(e) => {
                e.preventDefault();
                onJoin();
              }}
            >
              <div className="join-head">
                <span className="mode-icon purple">
                  <Icon name="users" size={22} />
                </span>
                <span className="mode-info">
                  <strong>Join Room</strong>
                  <small>Got an invite? Hop aboard</small>
                </span>
              </div>
              <div className="join-row">
                <input
                  aria-label="Six-character room code"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(
                      e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase(),
                    )
                  }
                  placeholder="ENTER CODE"
                  spellCheck="false"
                  autoCapitalize="characters"
                />
                <button
                  type="submit"
                  disabled={busy || joinCode.length !== 6}
                  aria-label="Join room"
                >
                  <Icon name="arrow" size={21} />
                </button>
              </div>
            </form>
          </div>
          {error && (
            <div role="alert" className="error-banner">
              <Icon name="alert" size={17} />
              {error}
            </div>
          )}
          {busy && (
            <p className="busy-message">
              <span className="spinner" /> Connecting to the stars...
            </p>
          )}
        </div>
        <div className="menu-bottom">
          <span>
            <Icon name="globe" size={15} /> BROWSER TO BROWSER
          </span>
          <span>
            MADE FOR MISCHIEF <span className="gold">✳</span>
          </span>
        </div>
      </section>
    </main>
  );
}
