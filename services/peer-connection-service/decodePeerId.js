/**
 * Peer id format: channelType:channel:peerSession:instance
 * The channel segment may contain ':' — only the first segment is channelType and
 * the last two are peerSession and instance; everything between is the channel.
 */
export function decodePeerId(peer) {
  const parts = peer.split(':')
  if (parts.length < 4) {
    throw new Error(`invalid peer id: expected at least 4 colon-separated segments, got ${parts.length}`)
  }
  return {
    channelType: parts[0],
    channel: parts.slice(1, -2).join(':'),
    peerSession: parts[parts.length - 2],
    instance: parts[parts.length - 1]
  }
}
