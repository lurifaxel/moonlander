export class PostLevelMenu {
  constructor(root) {
    this.root = root;
    this.title = root ? root.querySelector('h2') : null;
    this.message = root ? root.querySelector('p') : null;
  }

  setMessage(text, success) {
    if (this.title) {
      this.title.textContent = success ? 'Mission Update' : 'Mission Failure';
    }
    if (this.message) {
      this.message.textContent = text;
    }
  }

  show() {
    if (!this.root) return;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
  }

  hide() {
    if (!this.root) return;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
  }
}
