export class InfoPanel {
  constructor(root) {
    this.root = root;
    this.body = root ? root.querySelector('.info-body') : null;
    this.toggle = root ? root.querySelector('.info-toggle') : null;
    this.title = root ? root.querySelector('.info-title') : null;
    this.collapsed = false;
    if (this.toggle) {
      this.toggle.addEventListener('click', () => {
        this.collapsed = !this.collapsed;
        this.applyCollapsedState();
      });
    }
  }

  setTitle(text = 'Status') {
    if (this.title) {
      this.title.textContent = text;
    }
  }

  applyCollapsedState() {
    if (!this.root) return;
    this.root.classList.toggle('collapsed', this.collapsed);
    if (this.toggle) {
      this.toggle.setAttribute('aria-expanded', (!this.collapsed).toString());
      this.toggle.textContent = this.collapsed ? 'Show info' : 'Hide info';
    }
  }

  setMessage(text, title = null) {
    if (!this.root || !this.body) return;
    if (title !== null) {
      this.setTitle(title);
    }
    this.body.textContent = text || '';
    if (text) {
      this.root.classList.remove('hidden');
      this.root.setAttribute('aria-hidden', 'false');
      this.applyCollapsedState();
    } else {
      this.root.classList.add('hidden');
      this.root.setAttribute('aria-hidden', 'true');
    }
  }

  clear() {
    if (!this.root || !this.body) return;
    this.body.textContent = '';
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
  }
}
