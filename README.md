# 🎵 Custom Music Quiz

**Custom Music Quiz** is a Discord bot that brings a fun and engaging music quiz game to your server! Players compete in a series of rounds to guess the title of a song, the movie/series/game it comes from, or the artist.

The bot ensures everyone has a fair chance by using a list of music that each player knows, or an optional global music list for added challenge.

---

## 🚀 Features

- **Custom Music Quiz**: Players join games with multiple rounds of music trivia.
- **Leaderboard**: Compare your score with the other users in the server.
- **Play Music**: You can play any music you want by giving it a link.

---

## 🎵 How to Play CMQ

1. **Start a Game**:
   - Use the `/cmq` command to begin a new game.

2. **Choose Options**:
   - `n_rounds`: Select number of rounds.
   - `round_time`: Select guessing time of each round.
   - `anime`: Enable songs from anime.
   - `game`: Enable songs from videogames.
   - `guess`: Choose to guess song title, movie/series/game the song comes from or the artist.
   - `watched`: Only choose songs from media that each player watched.
     
3. **Joining the Lobby**:
   -  Other players can join the game lobby by clicking the 👍 emoji.
   -  The lobby owner can click ⏩ to force the game to start and ❌ to end game prematurely.

4. **Guess the Music**:
   - Players have 30 seconds to guess the correct answer in each round.
   - Use `/guess [guess]` to make you guess. Choose from a list of autocomplete answers.
   - At the end of the round, the correct answer is revealed and all players who guessed correctly get a point.

5. **Win the Game**:
   - The player with the most points at the end of the game is crowned the winner!
     

**Leaderboard:**
Use the `/leaderboard [criteria]` command to check the top scores of all users in the server.
`[criteria]` can be:
- `Most Points`: Total points each player won.
- `Games Won`: Total games each player won.
- `Games Played`: Total games each player  played.

---

## 🎵 How to Play Music

1. **Play Music**:
   - Use `/play [query]` to play a song. If on is already playing, it is added to the queue instead.
   - `[query]` can be a link or a search query.
     
2. **Use Other Commands**:
   - `/pause` ; `/skip` ; `/stop`: Pause or skip the current song, or stop all songs in the queue.
   - `/nowplaying` ; `/queue`: Check the current song or queue.
   - `/volume`: Change the volume of the song.
   - `/shuffle`: Shuffles the queue.

