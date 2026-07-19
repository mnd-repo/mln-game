import { nanoid } from 'nanoid';
import { parseMessage } from './messages.js';
import { GameRoom } from '../game/roundManager.js';

export function createWsHandlers({ db, q, jobPool, config }) {
  // gameId -> GameRoom
  const rooms = new Map();

  function getOrCreateRoom(gameId, roundsTotal) {
    if (!rooms.has(gameId)) {
      const room = new GameRoom({
        gameId,
        queries: q,
        jobPool,
        roundsTotal: roundsTotal ?? config.roundsTotal,
        broadcast: () => {},
        writingSeconds: config.writingSeconds,
        votingSeconds: config.votingSeconds
      });
      rooms.set(gameId, room);
    }
    return rooms.get(gameId);
  }

  function handleConnection(socket) {
    let context = { gameId: null, playerId: null, isHost: false };

    socket.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return send(socket, 'error', { message: 'Invalid JSON' });
      }
      const { type, payload } = msg;
      const parsed = parseMessage(type, payload);
      if (!parsed.ok) return send(socket, 'error', { message: parsed.error });

      try {
        switch (type) {
          case 'join_game':
            return handleJoinGame(socket, context, parsed.data);
          case 'rejoin_game':
            return handleRejoinGame(socket, context, parsed.data);
          case 'host_connect':
            return handleHostConnect(socket, context, parsed.data);
          case 'start_game':
            return handleStartGame(socket, context);
          case 'submit_resume':
            return handleSubmitResume(context, parsed.data);
          case 'submit_vote':
            return handleSubmitVote(context, parsed.data);
        }
      } catch (err) {
        send(socket, 'error', { message: err.message });
      }
    });

    socket.on('close', () => {
      if (context.gameId && context.playerId && !context.isHost) {
        const room = rooms.get(context.gameId);
        room?.removePlayer(context.playerId);
        q.setPlayerConnected.run(0, context.playerId);
      }
    });

    function handleJoinGame(socket, context, { code, name }) {
      const game = q.getGameByCode.get(code);
      if (!game) return send(socket, 'error', { message: 'Game not found' });

      const playerId = nanoid();
      q.insertPlayer.run(playerId, game.id, name, Date.now());

      const room = getOrCreateRoom(game.id, game.rounds_total);
      room.addPlayer(playerId, name, socket);

      context.gameId = game.id;
      context.playerId = playerId;
      context.isHost = false;

      send(socket, 'joined', { playerId, gameId: game.id, name });
    }

    function handleRejoinGame(socket, context, { code, playerId }) {
      const game = q.getGameByCode.get(code);
      if (!game) return send(socket, 'error', { message: 'Game not found' });
      const player = q.getPlayer.get(playerId);
      if (!player || player.game_id !== game.id) {
        return send(socket, 'error', { message: 'Player not found in this game' });
      }
      q.setPlayerConnected.run(1, playerId);
      const room = getOrCreateRoom(game.id, game.rounds_total);
      room.reconnectPlayer(playerId, socket);
      if (!room.players.has(playerId)) room.addPlayer(playerId, player.name, socket);

      context.gameId = game.id;
      context.playerId = playerId;
      context.isHost = false;

      send(socket, 'joined', { playerId, gameId: game.id, name: player.name });
    }

    function handleHostConnect(socket, context, { gameId, hostToken }) {
      const game = q.getGameById.get(gameId);
      if (!game || game.host_token !== hostToken) {
        return send(socket, 'error', { message: 'Invalid host credentials' });
      }
      const room = getOrCreateRoom(game.id, game.rounds_total);
      room.attachHost(socket);
      context.gameId = game.id;
      context.isHost = true;
      send(socket, 'host_connected', { gameId: game.id, code: game.code });
    }

    function handleStartGame(socket, context) {
      if (!context.isHost) return send(socket, 'error', { message: 'Only the host can start the game' });
      const room = rooms.get(context.gameId);
      if (!room) return send(socket, 'error', { message: 'Game not found' });
      room.startGame();
    }

    function handleSubmitResume(context, { text }) {
      const room = rooms.get(context.gameId);
      room?.submitResume(context.playerId, text);
    }

    function handleSubmitVote(context, { decision }) {
      const room = rooms.get(context.gameId);
      room?.submitVote(context.playerId, decision);
    }
  }

  function send(socket, type, payload) {
    if (socket.readyState === 1) socket.send(JSON.stringify({ type, payload }));
  }

  return { handleConnection, rooms };
}
