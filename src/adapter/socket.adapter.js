class SocketAdapter {
  static roomToEmitJoinEvent(room) {
    if (!room?.id || !room?.user1_id || !room?.user2_id) {
      throw new Error('Invalid room to emit join event', { cause: room });
    }
    return {
      id: room.id,
      user1_id: room.user1_id,
      user2_id: room.user2_id,
      open: 'open',
    };
  }
  static openedChatWebToEmitEvent(room) {
    if (!room?.id) {
      throw new Error('Invalid Session ID', { cause: room });
    }
    return {
      session_id: room.id,
      username: room.user1_id,
    };
  }
  static roomToEmitSyncSessionEvent(room) {
    if (!room?.user1_id || !room?.user2_id) {
      throw new Error('Invalid room to emit sync session event', { cause: room });
    }
    return {
      id: room.id,
      user: room.user1_id,
      driver: room.user2_id,
      trip: room.trip,
    };
  }
  static syncSessionResponseToRoom(response) {
    if (!response?.id || !response?.user1_id || !response?.user2_id) {
      throw new Error('Invalid response to emit sync session response to room', {
        cause: response,
      });
    }
    return {
      id: response.id,
      user1_id: response.user1_id,
      user2_id: response.user2_id,
      open: 'open',
    };
  }
}

export default SocketAdapter;
