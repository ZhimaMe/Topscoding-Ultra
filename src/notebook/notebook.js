class NoteManager {
	constructor() {
		this.notes = [];
		this.currentNoteId = null;
		this.init();
	}

	init() {
		this.loadNotes();
		this.bindEvents();
	}

	loadNotes() {
		chrome.storage.sync.get(['notes', 'note'], (result) => {
			// 处理旧数据格式
			if (result.note && (!result.notes || result.notes.length === 0)) {
				const oldNote = {
					id: Date.now().toString(),
					title: '默认笔记',
					content: result.note,
					createdAt: Date.now(),
					updatedAt: Date.now()
				};
				this.notes = [oldNote];
				this.currentNoteId = oldNote.id;
				this.saveNotes();
				// 清除旧数据
				chrome.storage.sync.remove('note');
			} else if (result.notes) {
				this.notes = result.notes;
				if (this.notes.length > 0) {
					this.currentNoteId = this.notes[0].id;
				} else {
					this.currentNoteId = null;
				}
			} else {
				this.notes = [];
				this.currentNoteId = null;
			}
			this.renderNoteList();
			this.updateEditorVisibility();
			this.loadCurrentNote();
		});
	}

	updateEditorVisibility() {
		const editorEl = document.getElementById('note-editor');
		const emptyStateEl = document.getElementById('empty-state');
		
		if (this.notes.length === 0) {
			editorEl.style.display = 'none';
			emptyStateEl.style.display = 'flex';
		} else {
			editorEl.style.display = 'flex';
			emptyStateEl.style.display = 'none';
		}
	}

	saveNotes() {
		chrome.storage.sync.set({ 'notes': this.notes });
	}

	bindEvents() {
		// 保存按钮
		document.getElementById('submit').addEventListener('click', () => {
			this.saveCurrentNote();
		});

		// 新建笔记按钮
		document.querySelector('.add-note-btn').addEventListener('click', () => {
			this.createNewNote();
		});

		// 标题输入事件
		document.getElementById('note-title').addEventListener('input', () => {
			this.saveCurrentNote();
		});

		// 内容输入事件
		document.getElementById('note').addEventListener('input', () => {
			this.saveCurrentNote();
		});
	}

	createNewNote() {
		// 生成递增的默认标题
		let noteNumber = 1;
		const noteTitles = this.notes.map(note => note.title);
		
		while (noteTitles.includes(`新笔记${noteNumber}`)) {
			noteNumber++;
		}

		const newNote = {
			id: Date.now().toString(),
			title: `新笔记${noteNumber}`,
			content: '',
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
		this.notes.unshift(newNote);
		this.currentNoteId = newNote.id;
		this.saveNotes();
		this.renderNoteList();
		this.updateEditorVisibility();
		this.loadCurrentNote();
	}

	saveCurrentNote() {
		if (!this.currentNoteId) return;

		let title = document.getElementById('note-title').value.trim();
		const content = document.getElementById('note').value;

		// 如果用户没有输入标题，使用默认的递增标题格式
		if (!title) {
			let noteNumber = 1;
			const noteTitles = this.notes
				.filter(note => note.id !== this.currentNoteId)
				.map(note => note.title);
			
			while (noteTitles.includes(`新笔记${noteNumber}`)) {
				noteNumber++;
			}
			title = `新笔记${noteNumber}`;
		}

		const noteIndex = this.notes.findIndex(note => note.id === this.currentNoteId);
		if (noteIndex !== -1) {
			this.notes[noteIndex] = {
				...this.notes[noteIndex],
				title,
				content,
				updatedAt: Date.now()
			};
			this.saveNotes();
			this.renderNoteList();
			
			// 更新输入框的占位符
			const titleInput = document.getElementById('note-title');
			if (!title.match(/^新笔记\d+$/)) {
				titleInput.placeholder = '新笔记1、新笔记2...';
			}
		}
	}

	loadCurrentNote() {
		const titleInput = document.getElementById('note-title');
		const contentInput = document.getElementById('note');
		
		if (!this.currentNoteId) {
			// 当没有笔记时，右侧显示为空白
			titleInput.value = '';
			titleInput.placeholder = '';
			contentInput.value = '';
			contentInput.placeholder = '';
			return;
		}

		const note = this.notes.find(note => note.id === this.currentNoteId);
		if (note) {
			// 对于新创建的笔记，如果标题是默认格式，显示占位符而不是实际值
			if (note.title.match(/^新笔记\d+$/)) {
				titleInput.value = '';
				titleInput.placeholder = note.title;
			} else {
				titleInput.value = note.title;
				titleInput.placeholder = '新笔记1、新笔记2...';
			}
			contentInput.value = note.content;
			contentInput.placeholder = '在此输入笔记内容...';
		}
	}

	deleteNote(noteId) {
		if (confirm('确定要删除这条笔记吗？')) {
			this.notes = this.notes.filter(note => note.id !== noteId);
			if (this.currentNoteId === noteId) {
				this.currentNoteId = this.notes.length > 0 ? this.notes[0].id : null;
			}
			this.saveNotes();
			this.renderNoteList();
			this.updateEditorVisibility();
			this.loadCurrentNote();
		}
	}

	selectNote(noteId) {
		this.currentNoteId = noteId;
		this.renderNoteList();
		this.loadCurrentNote();
	}

	renderNoteList() {
		const noteListEl = document.getElementById('note-list');
		noteListEl.innerHTML = '';

		this.notes.forEach(note => {
			const noteItem = document.createElement('div');
			noteItem.className = `note-item ${this.currentNoteId === note.id ? 'active' : ''}`;
			noteItem.innerHTML = `
				<div class="delete-btn" data-id="${note.id}">×</div>
				<div class="note-title">${note.title}</div>
				<div class="note-preview">${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</div>
			`;
			noteItem.addEventListener('click', (e) => {
				if (!e.target.classList.contains('delete-btn')) {
					this.selectNote(note.id);
				}
			});
			noteListEl.appendChild(noteItem);
		});

		// 绑定删除按钮事件
		document.querySelectorAll('.delete-btn').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.deleteNote(btn.dataset.id);
			});
		});
	}
}

// 初始化笔记管理器
new NoteManager();