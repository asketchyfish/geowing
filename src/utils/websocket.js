let globalWs = null;

export const getWebSocket = () => globalWs;

export const setWebSocket = (ws) => {
  globalWs = ws;
};

export const closeWebSocket = () => {
  if (globalWs?.readyState === WebSocket.OPEN) {
    globalWs.close();
  }
  globalWs = null;
}; 