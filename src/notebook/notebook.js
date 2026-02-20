class NoteManager {
	constructor() {
		this.notes = [];
		this.currentNoteId = null;
		this.isMultiSelectMode = false;
		this.selectedNoteIds = new Set();
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
		chrome.storage.sync.set({ 'notes': this.notes }, () => {
			if (chrome.runtime.lastError) {
				console.error('保存笔记失败:', chrome.runtime.lastError);
			} else {
				console.log('笔记保存成功:', this.notes.length, '条笔记');
			}
		});
	}

	bindEvents() {
		// 新建笔记按钮
		document.querySelector('.add-note-btn').addEventListener('click', () => {
			this.createNewNote();
		});

		// 多选按钮
		document.querySelector('.multi-select-btn').addEventListener('click', () => {
			this.toggleMultiSelectMode();
		});

		// 批量删除按钮
		document.getElementById('batch-delete-btn').addEventListener('click', () => {
			this.batchDeleteNotes();
		});

		// 取消多选按钮
		document.getElementById('cancel-select-btn').addEventListener('click', () => {
			this.exitMultiSelectMode();
		});

		// 标题输入事件
		document.getElementById('note-title').addEventListener('input', () => {
			this.saveCurrentNote();
		});

		// 双击标题复制笔记
		document.getElementById('note-title').addEventListener('dblclick', (e) => {
			e.preventDefault();
			e.stopPropagation();
			// 防止文本被选中
			window.getSelection().removeAllRanges();
			if (this.currentNoteId) {
				this.copyNoteToClipboard(this.currentNoteId);
			}
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
			const isSelected = this.selectedNoteIds.has(note.id);
			
			noteItem.className = `note-item ${this.currentNoteId === note.id ? 'active' : ''} ${isSelected ? 'selected' : ''}`;
			noteItem.dataset.id = note.id;
			
			// 根据是否为多选模式生成不同的HTML
			if (this.isMultiSelectMode) {
				noteItem.innerHTML = `
					<div class="note-title">${note.title}</div>
					<div class="note-preview">${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</div>
				`;
			} else {
				noteItem.innerHTML = `
					<div class="delete-btn" data-id="${note.id}" style="float: right;">×</div>
					<div class="note-title">${note.title}</div>
					<div class="note-preview">${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</div>
				`;
			}
			
			noteItem.addEventListener('click', (e) => {
				if (!e.target.classList.contains('delete-btn')) {
					if (this.isMultiSelectMode) {
						// 在多选模式下，点击笔记项的任何位置（除了删除按钮）都可以切换选择状态
						this.toggleNoteSelection(note.id);
					} else {
						// 非多选模式下，点击笔记项选择笔记
						this.selectNote(note.id);
					}
				}
			});
			
			// 绑定双击整个笔记选项卡复制笔记内容到剪贴板的事件
			noteItem.addEventListener('dblclick', (e) => {
				if (!this.isMultiSelectMode && !e.target.classList.contains('delete-btn')) {
					e.stopPropagation();
					// 防止文本被选中
					window.getSelection().removeAllRanges();
					this.copyNoteToClipboard(note.id);
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

		// 绑定复选框事件
		if (this.isMultiSelectMode) {
			document.querySelectorAll('.checkbox input[type="checkbox"]').forEach(checkbox => {
				checkbox.addEventListener('change', (e) => {
					e.stopPropagation();
					this.toggleNoteSelection(checkbox.dataset.id);
				});
			});
		}
	}

	toggleMultiSelectMode() {
		if (this.isMultiSelectMode) {
			// 退出多选模式
			this.exitMultiSelectMode();
		} else {
			// 进入多选模式
			this.isMultiSelectMode = true;
			this.selectedNoteIds.clear();
			document.querySelector('.multi-select-btn').textContent = '取消';
			this.showBatchActionsInEditor();
		}
		
		this.updateSelectedCount();
		this.renderNoteList();
	}

	exitMultiSelectMode() {
		this.isMultiSelectMode = false;
		this.selectedNoteIds.clear();
		document.querySelector('.multi-select-btn').textContent = '多选';
		this.hideBatchActionsInEditor();
		this.updateSelectedCount();
		this.renderNoteList();
	}

	showBatchActionsInEditor() {
		// 隐藏笔记编辑器，显示批量操作界面
		const editorEl = document.getElementById('note-editor');
		const emptyStateEl = document.getElementById('empty-state');
		
		// 保存原始内容
		this.originalEditorContent = editorEl.innerHTML;
		
		// 替换为批量操作界面
			editorEl.innerHTML = `
				<div style="display: flex; flex-direction: column; gap: 20px; height: 100%; justify-content: center; align-items: center;">
					<h2>多选模式</h2>
					<p style="color: #666; text-align: center;">点击左侧笔记选项卡进行选择</p>
					<div style="display: flex; gap: 12px; margin: 20px 0;">
						<span id="selected-count" style="font-size: 16px; color: #333; font-weight: bold;">已选择 0 项</span>
					</div>
					<div style="display: flex; gap: 12px;">
						<button id="batch-delete-btn" style="padding: 10px 24px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">删除选中</button>
					</div>
				</div>
			`;
			
			// 绑定按钮事件
			document.getElementById('batch-delete-btn').addEventListener('click', () => {
				this.batchDeleteNotes();
			});
	}

	hideBatchActionsInEditor() {
		// 恢复笔记编辑器
		const editorEl = document.getElementById('note-editor');
		if (this.originalEditorContent) {
			editorEl.innerHTML = this.originalEditorContent;
			this.originalEditorContent = null;
			
			// 重新绑定事件
			document.getElementById('note-title').addEventListener('input', () => {
				this.saveCurrentNote();
			});
			
			document.getElementById('note-title').addEventListener('dblclick', (e) => {
				e.preventDefault();
				e.stopPropagation();
				// 防止文本被选中
				window.getSelection().removeAllRanges();
				if (this.currentNoteId) {
					this.copyNoteToClipboard(this.currentNoteId);
				}
			});
			
			document.getElementById('note').addEventListener('input', () => {
				this.saveCurrentNote();
			});
		}
	}

	toggleNoteSelection(noteId) {
		if (this.selectedNoteIds.has(noteId)) {
			this.selectedNoteIds.delete(noteId);
		} else {
			this.selectedNoteIds.add(noteId);
		}
		this.updateSelectedCount();
		this.renderNoteList();
	}

	updateSelectedCount() {
		const count = this.selectedNoteIds.size;
		const selectedCountEl = document.getElementById('selected-count');
		if (selectedCountEl) {
			selectedCountEl.textContent = `已选择 ${count} 项`;
		}
	}

	batchDeleteNotes() {
		if (this.selectedNoteIds.size === 0) return;

		if (confirm(`确定要删除选中的 ${this.selectedNoteIds.size} 条笔记吗？`)) {
			// 过滤掉选中的笔记
			this.notes = this.notes.filter(note => !this.selectedNoteIds.has(note.id));
			
			// 更新当前选中的笔记
			if (this.selectedNoteIds.has(this.currentNoteId)) {
				this.currentNoteId = this.notes.length > 0 ? this.notes[0].id : null;
			}
			
			this.selectedNoteIds.clear();
			this.saveNotes();
			this.updateSelectedCount();
			this.renderNoteList();
			
			// 退出多选模式，恢复笔记编辑器
			this.exitMultiSelectMode();
			
			this.updateEditorVisibility();
			this.loadCurrentNote();
		}
	}

	copyNoteToClipboard(noteId) {
		const note = this.notes.find(note => note.id === noteId);
		if (!note) return;

		// 检查笔记内容是否为空
		if (!note.content || note.content.trim() === '') {
			// 显示复制失败的提示
			this.showCopyFailure();
			return;
		}

		// 构建要复制的内容，包含标题和内容
		const noteContent = `${note.title}\n\n${note.content}`;

		// 使用Clipboard API复制内容
		navigator.clipboard.writeText(noteContent)
			.then(() => {
				// 显示复制成功的提示
				this.showCopySuccess(note.title);
			})
			.catch(err => {
				console.error('无法复制内容: ', err);
				// 显示复制失败的提示
				this.showCopyFailure();
			});
	}

	showCopySuccess(noteTitle) {
		// 创建提示元素
		const toast = document.createElement('div');
		toast.style.position = 'fixed';
		toast.style.top = '20px';
		toast.style.right = '20px';
		toast.style.padding = '12px 20px';
		toast.style.backgroundColor = '#4CAF50';
		toast.style.color = 'white';
		toast.style.borderRadius = '4px';
		toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
		toast.style.zIndex = '1000';
		toast.style.transition = 'opacity 0.3s ease';
		toast.textContent = `笔记 "${noteTitle}" 已复制到剪贴板`;

		// 添加到页面
		document.body.appendChild(toast);

		// 3秒后移除
		setTimeout(() => {
			toast.style.opacity = '0';
			setTimeout(() => {
				document.body.removeChild(toast);
			}, 300);
		}, 3000);
	}

	showCopyFailure() {
		// 创建提示元素
		const toast = document.createElement('div');
		toast.style.position = 'fixed';
		toast.style.top = '20px';
		toast.style.right = '20px';
		toast.style.padding = '12px 20px';
		toast.style.backgroundColor = '#f44336';
		toast.style.color = 'white';
		toast.style.borderRadius = '4px';
		toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
		toast.style.zIndex = '1000';
		toast.style.transition = 'opacity 0.3s ease';
		toast.textContent = '复制失败：笔记内容为空';

		// 添加到页面
		document.body.appendChild(toast);

		// 3秒后移除
		setTimeout(() => {
			toast.style.opacity = '0';
			setTimeout(() => {
				document.body.removeChild(toast);
			}, 300);
		}, 3000);
	}
}

// 初始化笔记管理器
new NoteManager();