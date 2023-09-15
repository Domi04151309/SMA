/**
 * @param {string} message
 * @param {string|null} initialValue
 * @returns {Promise<string>}
 */
export async function openModal(message, initialValue) {
  return await new Promise((resolve, reject) => {
    const dialog = document.getElementById('input-dialog');
    if (!(dialog instanceof HTMLDialogElement)) {
      reject(new Error('invalid layout'));
      return;
    }
    const dialogText = dialog.querySelector('p');
    const dialogInput = dialog.querySelector('input');
    const cancel = dialog.querySelector('.cancel');
    const ok = dialog.querySelector('.ok');
    if (
      dialogText === null ||
      dialogInput === null ||
      cancel === null ||
      ok === null
    ) {
      reject(new Error('invalid layout'));
      return;
    }
    dialogText.textContent = message;
    dialogInput.value = initialValue ?? '';
    const closeListener = () => {
      dialog.close();
    };
    const okListener = () => {
      dialog.close();
      cancel.removeEventListener('click', closeListener);
      ok.removeEventListener('click', okListener);
      resolve(dialogInput.value);
    };
    cancel.addEventListener('click', closeListener);
    ok.addEventListener('click', okListener);
    dialog.showModal();
    dialogInput.focus();
  });
}
