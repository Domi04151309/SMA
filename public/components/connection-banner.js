const connectionBanner = document.getElementById('connection');
let connection = true;

export const ConnectionBanner = {
  connected() {
    if (connection === false) {
      if (connectionBanner !== null) connectionBanner.style.display = '';
      connection = true;
    }
  },
  disconnected() {
    connection = false;
    if (connectionBanner !== null) connectionBanner.style.display = 'block';
  }
};
