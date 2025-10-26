export class EditorPanel {
  constructor(root) {
    this.root = root;
    this.body = root ? root.querySelector('.editor-panel-body') : null;
    this.toggle = root ? root.querySelector('.editor-panel-toggle') : null;
    this.title = root ? root.querySelector('.editor-panel-title') : null;
    this.collapsed = false;
    if (this.toggle) {
      this.toggle.addEventListener('click', () => {
        this.collapsed = !this.collapsed;
        this.applyCollapsedState();
      });
    }
  }

  setTitle(text = 'Level Editor') {
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

  setContent(html) {
    if (!this.root || !this.body) return;
    this.body.innerHTML = html;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.applyCollapsedState();
  }

  hide() {
    if (!this.root) return;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
  }
}
