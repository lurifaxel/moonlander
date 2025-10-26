export class MenuOverlay {
  constructor(root) {
    this.root = root;
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
