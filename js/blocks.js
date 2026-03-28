// js/blocks.js — Command block system: palette + sequence tray

const BlockSystem = (() => {

  // ── Block registry ────────────────────────────────────────────────────────
  // Extend COMMAND_REGISTRY to add new block types without touching other files
  const COMMAND_REGISTRY = {
    'move-forward': {
      label: 'Move Forward', icon: '⬆️', category: 'movement',
      description: 'Move one square in the direction Finn is facing',
    },
    'move-back': {
      label: 'Move Back', icon: '⬇️', category: 'movement',
      description: 'Move one square backwards',
    },
    'turn-left': {
      label: 'Turn Left', icon: '↺', category: 'movement',
      description: 'Rotate Finn 90° to the left',
    },
    'turn-right': {
      label: 'Turn Right', icon: '↻', category: 'movement',
      description: 'Rotate Finn 90° to the right',
    },
    'if-condition': {
      label: 'If Obstacle →', icon: '❓', category: 'condition',
      hasSlots: true, slots: ['then', 'else'],
      description: 'If there is an obstacle (or mud) ahead, do one thing; otherwise do another',
    },
    'repeat': {
      label: 'Repeat', icon: '🔁', category: 'loop',
      hasParam: true, paramDefault: 3, paramMin: 2, paramMax: 8,
      hasSlots: true, slots: ['body'],
      description: 'Repeat the commands inside a number of times',
    },
    'turn-around': {
      label: 'Turn Around', icon: '🔄', category: 'movement',
      description: 'Turn Finn 180° to face the other way',
    },
    'sprint': {
      label: 'Sprint!', icon: '💨', category: 'movement',
      description: 'Burst forward 2 squares in one move',
    },
    'while-clear': {
      label: 'While Clear →', icon: '♾️', category: 'loop',
      hasSlots: true, slots: ['body'],
      description: 'While the path ahead is clear, keep repeating the commands inside',
    },
    'score-try': {
      label: 'Score Try!', icon: '🏉', category: 'action',
      description: 'Ground the ball to score a try — only works when Finn is in the try zone!',
    },
    'jump': {
      label: 'Jump!', icon: '🦘', category: 'movement',
      description: 'Jump over a hurdle — skips one cell ahead and lands 2 squares forward',
    },
    'tackle': {
      label: 'Tackle!', icon: '💪', category: 'action',
      description: 'Tackle the opponent directly ahead to clear the path',
    },
  };

  const CATEGORY_CLASS = {
    movement:  'movement',
    condition: 'condition',
    loop:      'loop',
    action:    'action',
  };

  // ── DOM references ────────────────────────────────────────────────────────
  let _palette  = null;
  let _tray     = null;
  let _stepIndicator = null;

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    _palette       = document.getElementById('block-palette');
    _tray          = document.getElementById('sequence-tray');
    _stepIndicator = document.getElementById('step-indicator');

    // Re-render tray whenever sequence changes
    document.addEventListener('rugby:statechange', (e) => {
      if (e.detail.changed === 'sequence') renderTray();
    });
  }

  // ── Palette rendering ──────────────────────────────────────────────────────
  function renderPalette(availableCommands) {
    _palette.innerHTML = '';
    availableCommands.forEach(type => {
      const def = COMMAND_REGISTRY[type];
      if (!def) return;
      const el = _makeBlockEl(type, def, 'in-palette');
      el.addEventListener('click', () => _onPaletteBlockClick(type));
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('blockType', type);
        e.dataTransfer.setData('source', 'palette');
      });
      _palette.appendChild(el);
    });
  }

  // ── Tray rendering ────────────────────────────────────────────────────────
  function renderTray() {
    const seq = GameState.current.sequence;
    _tray.innerHTML = '';

    if (seq.length === 0) {
      _tray.innerHTML = `
        <div class="sequence-empty">
          <div class="sequence-empty-icon">📋</div>
          <div>Click blocks above to build Finn's program</div>
        </div>`;
      _updateStepIndicator(0);
      return;
    }

    seq.forEach((node, idx) => {
      const el = _renderNode(node, seq, idx, 0);
      _tray.appendChild(el);
    });

    _updateStepIndicator(seq.length);
    _setupTrayDrop();
  }

  function _updateStepIndicator(count) {
    if (!_stepIndicator) return;
    const levelDef = GameState.current.levelDef;
    const max = levelDef && levelDef.maxCommands;
    if (max) {
      _stepIndicator.textContent = `${count}/${max} blocks`;
      _stepIndicator.classList.toggle('max-cmd-warning', count > max);
    } else {
      _stepIndicator.textContent = `${count} block${count !== 1 ? 's' : ''}`;
      _stepIndicator.classList.remove('max-cmd-warning');
    }
  }

  function _renderNode(node, parentArr, idx, depth) {
    const def = COMMAND_REGISTRY[node.type];
    if (!def) return document.createElement('div');

    const wrapper = document.createElement('div');
    wrapper.className = 'block-wrapper';
    wrapper.dataset.nodeId = node.id;

    const blockEl = _makeBlockEl(node.type, def, 'in-sequence');
    blockEl.dataset.nodeId = node.id;

    // Step number for top-level blocks
    if (depth === 0) {
      const num = document.createElement('span');
      num.className = 'block-num';
      num.textContent = idx + 1;
      blockEl.insertBefore(num, blockEl.firstChild);
    }

    // Param input for repeat block
    if (def.hasParam) {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'block-param';
      input.value = node.param ?? def.paramDefault;
      input.min = def.paramMin || 2;
      input.max = def.paramMax || 8;
      input.addEventListener('click', e => e.stopPropagation());
      input.addEventListener('change', e => {
        const val = Math.max(def.paramMin, Math.min(def.paramMax, parseInt(e.target.value) || def.paramDefault));
        input.value = val;
        GameState.mutations.setParam(node.id, val);
      });
      blockEl.appendChild(input);
    }

    // Delete button
    const del = document.createElement('button');
    del.className = 'block-delete';
    del.textContent = '✕';
    del.addEventListener('click', e => {
      e.stopPropagation();
      GameState.mutations.removeCommand(node.id);
      AudioEngine.playBlockPlace();
    });
    blockEl.appendChild(del);

    wrapper.appendChild(blockEl);

    // Nested slots
    if (def.hasSlots) {
      def.slots.forEach(slot => {
        const slotContainer = _renderSlot(node, slot, def, depth + 1);
        wrapper.appendChild(slotContainer);
      });
    }

    // Drag to reorder in tray
    blockEl.setAttribute('draggable', 'true');
    blockEl.addEventListener('dragstart', e => {
      e.dataTransfer.setData('nodeId', node.id);
      e.dataTransfer.setData('source', 'tray');
      e.stopPropagation();
    });

    return wrapper;
  }

  function _renderSlot(parentNode, slot, def, depth) {
    const container = document.createElement('div');
    const catClass = CATEGORY_CLASS[def.category] || 'movement';
    container.className = `nested-block-container ${catClass}-nest`;

    const label = document.createElement('div');
    label.className = 'nested-slot-label';
    label.textContent = slot === 'body' ? 'Repeat:' : slot === 'then' ? 'Then:' : 'Else:';
    container.appendChild(label);

    const children = parentNode[slot] || [];
    children.forEach((child, idx) => {
      const childEl = _renderNode(child, children, idx, depth);
      container.appendChild(childEl);
    });

    // Add-block button inside slot
    if (depth <= 2) {
      const addBtn = document.createElement('div');
      addBtn.className = 'block in-palette movement';
      addBtn.style.cssText = 'opacity:0.6; font-size:0.75rem; padding:5px 8px; cursor:pointer;';
      addBtn.textContent = '+ Add block';
      addBtn.dataset.parentId = parentNode.id;
      addBtn.dataset.slot = slot;
      addBtn.addEventListener('click', e => {
        e.stopPropagation();
        _showSlotPicker(parentNode.id, slot, addBtn);
      });
      container.appendChild(addBtn);

      // Drop target for this slot
      container.addEventListener('dragover', e => {
        e.preventDefault();
        container.style.outline = '2px dashed var(--scotland-gold)';
      });
      container.addEventListener('dragleave', () => {
        container.style.outline = '';
      });
      container.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        container.style.outline = '';
        const blockType = e.dataTransfer.getData('blockType');
        if (blockType) {
          _addCommandToSlot(parentNode.id, slot, blockType);
        }
      });
    }

    return container;
  }

  function _showSlotPicker(parentId, slot, anchorEl) {
    // Remove existing picker
    const existing = document.querySelector('.slot-picker');
    if (existing) existing.remove();

    const levelDef = GameState.current.levelDef;
    if (!levelDef) return;

    const picker = document.createElement('div');
    picker.className = 'slot-picker';
    picker.style.cssText = `
      position: fixed; z-index: 500;
      background: var(--bg-mid); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 8px;
      display: flex; flex-direction: column; gap: 6px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
      min-width: 160px;
    `;

    const rect = anchorEl.getBoundingClientRect();
    picker.style.top  = `${rect.bottom + 6}px`;
    picker.style.left = `${rect.left}px`;

    // Show only movement commands in slots (no nested ifs/repeats for now)
    const simpleCommands = levelDef.availableCommands.filter(
      t => COMMAND_REGISTRY[t] && COMMAND_REGISTRY[t].category === 'movement'
    );

    simpleCommands.forEach(type => {
      const def = COMMAND_REGISTRY[type];
      const btn = _makeBlockEl(type, def, 'in-palette');
      btn.style.cssText += 'width:100%; margin:0;';
      btn.addEventListener('click', () => {
        _addCommandToSlot(parentId, slot, type);
        picker.remove();
      });
      picker.appendChild(btn);
    });

    document.body.appendChild(picker);

    // Click outside closes picker
    setTimeout(() => {
      document.addEventListener('click', function closePicker() {
        picker.remove();
        document.removeEventListener('click', closePicker);
      }, { once: true });
    }, 50);
  }

  function _addCommandToSlot(parentId, slot, type) {
    const node = _makeCommandNode(type);
    GameState.mutations.addCommandToNode(parentId, slot, node);
    AudioEngine.playBlockPlace();
  }

  // ── Palette click → add to end of sequence ─────────────────────────────
  function _onPaletteBlockClick(type) {
    // Check maxCommands
    const levelDef = GameState.current.levelDef;
    const seq = GameState.current.sequence;
    if (levelDef && levelDef.maxCommands && seq.length >= levelDef.maxCommands) {
      _showGameMessage(`Max ${levelDef.maxCommands} blocks!`, 'error');
      return;
    }

    const node = _makeCommandNode(type);
    GameState.mutations.addCommand(node);
    AudioEngine.playBlockPlace();

    // Mark the newly appended block as just-added for animation, then scroll into view
    setTimeout(() => {
      const el = _tray.querySelector(`[data-node-id="${node.id}"] .block`);
      if (el) {
        el.classList.add('just-added');
        setTimeout(() => el.classList.remove('just-added'), 300);
      }
      _tray.scrollTop = _tray.scrollHeight;
    }, 10);
  }

  // ── Tray drop (reorder) ──────────────────────────────────────────────────
  function _setupTrayDrop() {
    _tray.addEventListener('dragover', e => {
      e.preventDefault();
    });

    _tray.addEventListener('drop', e => {
      e.preventDefault();
      const blockType = e.dataTransfer.getData('blockType');
      const source    = e.dataTransfer.getData('source');

      if (source === 'palette' && blockType) {
        // Add to end
        const node = _makeCommandNode(blockType);
        GameState.mutations.addCommand(node);
        AudioEngine.playBlockPlace();
      }
      // Tray reordering not implemented to keep the UX simple for kids
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function _makeBlockEl(type, def, extraClass) {
    const el = document.createElement('div');
    el.className = `block ${CATEGORY_CLASS[def.category]} ${extraClass}`;

    const icon = document.createElement('span');
    icon.className = 'block-icon';
    icon.textContent = def.icon;
    el.appendChild(icon);

    const label = document.createElement('span');
    label.textContent = def.label;
    el.appendChild(label);

    el.title = def.description || def.label;
    return el;
  }

  function _makeCommandNode(type) {
    const def = COMMAND_REGISTRY[type];
    const node = { id: Utils.uuid(), type };
    if (def.hasParam) node.param = def.paramDefault;
    if (def.hasSlots) def.slots.forEach(s => { node[s] = []; });
    return node;
  }

  function _showGameMessage(text, kind) {
    const container = document.getElementById('game-message') || document.body;
    const msg = document.createElement('div');
    msg.className = kind === 'error' ? 'game-error-msg' : 'game-info-msg';
    msg.textContent = text;
    container.appendChild(msg);
    setTimeout(() => msg.remove(), 2800);
  }

  // ── Public ────────────────────────────────────────────────────────────────
  return {
    init,
    renderPalette,
    renderTray,
    COMMAND_REGISTRY,
    showGameMessage: _showGameMessage,
  };
})();
