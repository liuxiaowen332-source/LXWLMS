/**
 * Course Assignment Manager - Core Application Logic
 * Powered by AI-Human Collaboration
 */

// ==========================================================================
// 1. STATE & STORAGE MANAGEMENT
// ==========================================================================

let state = {
  assignments: [],
  tempSubtasks: [],
  currentEditId: null,
  theme: 'dark'
};

// Course color registry to maintain visual consistency
const courseColors = {};

// Default dummy data if LocalStorage is empty (to showcase the app at first glance)
const initialDummyAssignments = [
  {
    id: 'demo-1',
    title: '算法设计与分析 - 动态规划论文阅读报告',
    course: '算法设计与分析',
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString().slice(0, 16), // 12 hours from now
    priority: 'high',
    estHours: 4,
    description: '撰写关于《背包问题及其近似算法优化》的读书报告。要求：\n1. 至少对比三种不同的DP优化策略。\n2. 字数不少于1500字。\n3. LMS系统提交PDF文件。',
    completed: false,
    subtasks: [
      { id: 'sub-1-1', text: '通读论文并做核心公式推导', completed: true },
      { id: 'sub-1-2', text: '使用 Markdown 撰写草稿结构', completed: false },
      { id: 'sub-1-3', text: '排版并导出 PDF 上传', completed: false }
    ],
    courseColor: '#ef4444'
  },
  {
    id: 'demo-2',
    title: '计算机网络 - 编写简易 TCP 聊天室',
    course: '计算机网络',
    deadline: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 2.5 days from now
    priority: 'medium',
    estHours: 6.5,
    description: '使用 Python/Java 编写一个多线程 TCP 聊天程序，支持多人同时在线发送消息，并在终端中显示加入/退出日志。包含基本的异常处理。',
    completed: false,
    subtasks: [
      { id: 'sub-2-1', text: '编写服务器端 Socket 监听逻辑', completed: true },
      { id: 'sub-2-2', text: '编写客户端 GUI 或命令行交互', completed: true },
      { id: 'sub-2-3', text: '本地测试多客户端并发稳定性', completed: false }
    ],
    courseColor: '#3b82f6'
  },
  {
    id: 'demo-3',
    title: '软件工程 - 需求规格说明书 (SRS) 终稿',
    course: '软件工程',
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // 6 days from now
    priority: 'low',
    estHours: 3,
    description: '小组协同完成在线商城系统的 SRS 交付件。需要包含 UML 用例图、活动图及状态图。本人的任务是负责“购物车与支付模块”。',
    completed: true,
    subtasks: [
      { id: 'sub-3-1', text: '绘制购物车模块用例图', completed: true },
      { id: 'sub-3-2', text: '汇总组内成员模块形成终稿文档', completed: true }
    ],
    courseColor: '#10b981'
  }
];

// Helper to generate distinct HSL colors for courses based on name hashing
function getCourseColor(courseName) {
  if (courseColors[courseName]) {
    return courseColors[courseName];
  }

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < courseName.length; i++) {
    hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map hash to HSL hue (0 - 360) and keep saturation & lightness premium
  const hue = Math.abs(hash % 360);
  const color = `hsl(${hue}, 75%, 55%)`;
  courseColors[courseName] = color;
  return color;
}

// Load state from LocalStorage
function loadState() {
  const stored = localStorage.getItem('course_assignment_state');
  if (stored) {
    try {
      state = JSON.parse(stored);
      // Ensure state structure matches
      if (!Array.isArray(state.assignments)) state.assignments = [];
      if (!state.theme) state.theme = 'dark';
    } catch (e) {
      console.error('Failed to parse localStorage data, resetting to dummy data', e);
      state.assignments = [...initialDummyAssignments];
    }
  } else {
    // Inject initial dummy data for a gorgeous start
    state.assignments = [...initialDummyAssignments];
    saveState();
  }

  // Rebuild course colors from loaded data
  state.assignments.forEach(item => {
    if (item.course) {
      item.courseColor = getCourseColor(item.course);
    }
  });

  // Apply saved theme
  document.body.className = state.theme === 'light' ? 'light-theme' : 'dark-theme';
}

// Save state to LocalStorage
function saveState() {
  localStorage.setItem('course_assignment_state', JSON.stringify(state));
}

// ==========================================================================
// 2. CHART.JS CONFIGURATION & UPDATE
// ==========================================================================

let priorityChartInstance = null;
let courseChartInstance = null;

function initOrUpdateCharts() {
  const activeAssignments = state.assignments;
  
  // Calculate priority counts
  const priorityCounts = { high: 0, medium: 0, low: 0 };
  activeAssignments.forEach(item => {
    if (!item.completed) {
      priorityCounts[item.priority]++;
    }
  });

  // Calculate course task counts
  const courseCounts = {};
  activeAssignments.forEach(item => {
    if (!item.completed) {
      courseCounts[item.course] = (courseCounts[item.course] || 0) + 1;
    }
  });

  const isDark = state.theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#9ca3af' : '#64748b';

  // 1. Priority Doughnut Chart
  const ctxPriority = document.getElementById('priorityChart').getContext('2d');
  const priorityData = [priorityCounts.high, priorityCounts.medium, priorityCounts.low];
  
  if (priorityChartInstance) {
    priorityChartInstance.data.datasets[0].data = priorityData;
    priorityChartInstance.options.plugins.legend.labels.color = textColor;
    priorityChartInstance.update();
  } else {
    priorityChartInstance = new Chart(ctxPriority, {
      type: 'doughnut',
      data: {
        labels: ['高优先级', '中优先级', '低优先级'],
        datasets: [{
          data: priorityData,
          backgroundColor: [
            'rgba(244, 63, 94, 0.85)',
            'rgba(251, 191, 36, 0.85)',
            'rgba(52, 211, 153, 0.85)'
          ],
          borderColor: isDark ? '#1a1c29' : '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              font: { family: 'Inter', size: 11 },
              color: textColor
            }
          },
          title: {
            display: true,
            text: '未完成任务优先级分布',
            color: textColor,
            font: { family: 'Outfit', size: 13, weight: 'bold' }
          }
        },
        cutout: '65%'
      }
    });
  }

  // 2. Course Bar Chart
  const ctxCourse = document.getElementById('courseChart').getContext('2d');
  const courseLabels = Object.keys(courseCounts);
  const courseData = Object.values(courseCounts);
  const courseColorsList = courseLabels.map(label => getCourseColor(label));

  if (courseChartInstance) {
    courseChartInstance.data.labels = courseLabels;
    courseChartInstance.data.datasets[0].data = courseData;
    courseChartInstance.data.datasets[0].backgroundColor = courseColorsList;
    courseChartInstance.options.scales.x.ticks.color = textColor;
    courseChartInstance.options.scales.x.grid.color = gridColor;
    courseChartInstance.options.scales.y.ticks.color = textColor;
    courseChartInstance.options.scales.y.grid.color = gridColor;
    courseChartInstance.options.plugins.title.color = textColor;
    courseChartInstance.update();
  } else {
    courseChartInstance = new Chart(ctxCourse, {
      type: 'bar',
      data: {
        labels: courseLabels,
        datasets: [{
          label: '作业数量',
          data: courseData,
          backgroundColor: courseColorsList,
          borderRadius: 6,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { 
              color: textColor, 
              stepSize: 1,
              font: { family: 'Inter', size: 10 } 
            }
          }
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: '未完成课程作业统计',
            color: textColor,
            font: { family: 'Outfit', size: 13, weight: 'bold' }
          }
        }
      }
    });
  }
}

// ==========================================================================
// 3. STATS & INDICATORS CALCULATION
// ==========================================================================

function updateStatistics() {
  const total = state.assignments.length;
  const completed = state.assignments.filter(t => t.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Update counters
  document.getElementById('stats-total-count').textContent = total;
  document.getElementById('stats-completed-count').textContent = completed;
  document.getElementById('stats-pending-count').textContent = pending;
  document.getElementById('completion-percentage').textContent = `${percentage}%`;

  // Update linear progress bar
  document.getElementById('linear-progress-fill').style.width = `${percentage}%`;

  // Update circular gauge
  const progressCircle = document.getElementById('completion-gauge');
  const circumference = 2 * Math.PI * 40; // 251.2
  const offset = circumference - (percentage / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;

  // Time metrics
  const totalEst = state.assignments.reduce((sum, item) => sum + Number(item.estHours || 0), 0);
  const completedEst = state.assignments.filter(t => t.completed).reduce((sum, item) => sum + Number(item.estHours || 0), 0);
  document.getElementById('time-total-est').textContent = `${totalEst}h`;
  document.getElementById('time-completed-est').textContent = `${completedEst}h`;

  // Re-render chart info
  initOrUpdateCharts();
}

// Generate remaining time and badge style based on deadline ISO string
function calculateDeadlineUrgency(deadlineStr) {
  const deadline = new Date(deadlineStr);
  const now = new Date();
  const diffMs = deadline - now;
  const isOverdue = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  // Calculate day/hour remaining
  const diffHours = Math.floor(absDiff / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  let timeText = '';
  if (isOverdue) {
    timeText = diffDays > 0 
      ? `已逾期 ${diffDays}天 ${remainingHours}小时` 
      : `已逾期 ${diffHours}小时`;
  } else {
    timeText = diffDays > 0 
      ? `剩 ${diffDays}天 ${remainingHours}小时` 
      : `剩 ${diffHours}小时`;
  }

  // Urgency logic
  if (isOverdue) {
    return {
      class: 'urgency-overdue',
      text: '已逾期',
      timeText: timeText,
      icon: 'alert-circle'
    };
  } else if (diffMs < 24 * 60 * 60 * 1000) { // < 24h
    return {
      class: 'urgency-imminent',
      text: '24小时内截止',
      timeText: timeText,
      icon: 'clock'
    };
  } else if (diffMs < 3 * 24 * 60 * 60 * 1000) { // < 3 days
    return {
      class: 'urgency-soon',
      text: '3天内截止',
      timeText: timeText,
      icon: 'calendar-clock'
    };
  } else {
    return {
      class: 'urgency-normal',
      text: '进行中',
      timeText: timeText,
      icon: 'calendar'
    };
  }
}

// ==========================================================================
// 4. RENDERING INTERACTION LOGIC (DOM CONTROLLER)
// ==========================================================================

function populateFilterCourses() {
  const courseFilter = document.getElementById('filter-course');
  const courseDatalist = document.getElementById('courses-datalist');
  const savedVal = courseFilter.value;

  // Find unique courses
  const uniqueCourses = [...new Set(state.assignments.map(item => item.course))].filter(Boolean);

  // Re-build select
  courseFilter.innerHTML = '<option value="all">所有课程</option>';
  uniqueCourses.sort().forEach(course => {
    const option = document.createElement('option');
    option.value = course;
    option.textContent = course;
    courseFilter.appendChild(option);
  });

  // Re-build datalist
  courseDatalist.innerHTML = '';
  uniqueCourses.forEach(course => {
    const option = document.createElement('option');
    option.value = course;
    courseDatalist.appendChild(option);
  });

  // Keep selection if exists
  if (uniqueCourses.includes(savedVal)) {
    courseFilter.value = savedVal;
  } else {
    courseFilter.value = 'all';
  }
}

function renderAssignmentsList() {
  const container = document.getElementById('assignment-list-container');
  const emptyView = document.getElementById('empty-state-view');
  
  // Filter settings
  const searchQuery = document.getElementById('search-input').value.toLowerCase().trim();
  const filterCourse = document.getElementById('filter-course').value;
  const filterPriority = document.getElementById('filter-priority').value;
  const filterStatus = document.getElementById('filter-status').value;
  const sortBy = document.getElementById('sort-by').value;

  // Filter logic
  let filtered = state.assignments.filter(item => {
    // 1. Search filter
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery) ||
      item.course.toLowerCase().includes(searchQuery) ||
      (item.description && item.description.toLowerCase().includes(searchQuery));
    
    // 2. Course filter
    const matchesCourse = filterCourse === 'all' || item.course === filterCourse;

    // 3. Priority filter
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;

    // 4. Status filter
    let matchesStatus = true;
    if (filterStatus === 'pending') matchesStatus = !item.completed;
    if (filterStatus === 'completed') matchesStatus = item.completed;

    return matchesSearch && matchesCourse && matchesPriority && matchesStatus;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortBy === 'deadline-asc') {
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (sortBy === 'deadline-desc') {
      return new Date(b.deadline) - new Date(a.deadline);
    }
    if (sortBy === 'priority-desc') {
      const priorityWeights = { high: 3, medium: 2, low: 1 };
      return priorityWeights[b.priority] - priorityWeights[a.priority];
    }
    if (sortBy === 'est-desc') {
      return b.estHours - a.estHours;
    }
    return 0;
  });

  // Display counters
  document.getElementById('visible-tasks-count').textContent = `${filtered.length} 个任务`;

  // Render cards
  const existingCards = container.querySelectorAll('.assignment-card');
  existingCards.forEach(card => card.remove());

  if (filtered.length === 0) {
    emptyView.style.display = 'flex';
    return;
  }

  emptyView.style.display = 'none';

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = `glass-card assignment-card ${item.completed ? 'completed' : ''}`;
    card.style.borderLeftColor = item.courseColor;
    card.setAttribute('data-id', item.id);

    // Calculate time metrics
    const urgency = calculateDeadlineUrgency(item.deadline);

    // Subtasks progress calculation
    const totalSub = item.subtasks ? item.subtasks.length : 0;
    const completedSub = item.subtasks ? item.subtasks.filter(s => s.completed).length : 0;
    const subtaskPct = totalSub === 0 ? 0 : Math.round((completedSub / totalSub) * 100);

    // Dynamic formatting for dates
    const dateFormatted = new Date(item.deadline).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Subtask HTML template
    let subtaskHtml = '';
    if (totalSub > 0) {
      const itemsHtml = item.subtasks.map(s => `
        <li class="card-subtask-item ${s.completed ? 'completed' : ''}" data-sub-id="${s.id}">
          <input type="checkbox" ${s.completed ? 'checked' : ''}>
          <span>${escapeHtml(s.text)}</span>
        </li>
      `).join('');

      subtaskHtml = `
        <div class="card-subtasks-area">
          <div class="subtask-progress-summary">
            <span>子任务进度 (${completedSub}/${totalSub})</span>
            <span>${subtaskPct}%</span>
          </div>
          <div class="subtask-progress-bar">
            <div class="subtask-progress-fill" style="width: ${subtaskPct}%"></div>
          </div>
          <ul class="card-subtask-list">
            ${itemsHtml}
          </ul>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-main-content">
        <div class="checkbox-container">
          <div class="custom-checkbox ${item.completed ? 'checked' : ''}" title="标记完成状态">
            <i data-lucide="check"></i>
          </div>
        </div>
        <div class="task-core-details">
          <div class="task-top-meta">
            <span class="course-tag" style="background-color: ${item.courseColor}">${escapeHtml(item.course)}</span>
            <span class="priority-tag priority-${item.priority}">
              ${item.priority === 'high' ? '🔥 高' : item.priority === 'medium' ? '⚡ 中' : '💤 低'}
            </span>
          </div>
          <h4 class="assignment-title">${escapeHtml(item.title)}</h4>
          <p class="assignment-desc">${escapeHtml(item.description || '无详细描述')}</p>
          ${item.description && item.description.split('\n').length > 2 || (item.description && item.description.length > 80) ? 
            `<button class="toggle-desc-btn">显示全部描述</button>` : ''}
          
          ${subtaskHtml}

          <div class="card-footer-meta">
            <div class="meta-group text-muted">
              <i data-lucide="clock"></i>
              <span>预估耗时: ${item.estHours} 小时</span>
            </div>
            
            <div class="deadline-badge ${urgency.class}">
              <i data-lucide="${urgency.icon}"></i>
              <span>${urgency.text} (${dateFormatted})</span>
              <strong style="margin-left:4px;">${urgency.timeText}</strong>
            </div>

            <div class="card-actions-wrapper">
              <button class="edit-btn" title="编辑作业"><i data-lucide="edit-3"></i></button>
              <button class="delete-btn" title="删除作业"><i data-lucide="trash-2"></i></button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  // Re-trigger icon rendering
  lucide.createIcons();

  // Attach card-specific listeners (for description toggle, edit, delete, complete, and subtask updates)
  attachCardListeners();
}

// Escape HTML utility to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================================
// 5. INTERACTIVE EVENT HANDLERS (Card Actions)
// ==========================================================================

function attachCardListeners() {
  const container = document.getElementById('assignment-list-container');

  // 1. Toggle main assignment completion
  container.querySelectorAll('.custom-checkbox').forEach(chk => {
    chk.addEventListener('click', (e) => {
      const card = e.target.closest('.assignment-card');
      const id = card.getAttribute('data-id');
      const assignment = state.assignments.find(item => item.id === id);
      
      if (assignment) {
        assignment.completed = !assignment.completed;
        // Optionally mark all subtasks complete when parent is marked complete
        if (assignment.completed && assignment.subtasks) {
          assignment.subtasks.forEach(s => s.completed = true);
        }
        
        saveState();
        updateStatistics();
        renderAssignmentsList();
      }
    });
  });

  // 2. Toggle subtask completion
  container.querySelectorAll('.card-subtask-item input[type="checkbox"]').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const subtaskItem = e.target.closest('.card-subtask-item');
      const subId = subtaskItem.getAttribute('data-sub-id');
      const card = e.target.closest('.assignment-card');
      const id = card.getAttribute('data-id');
      const assignment = state.assignments.find(item => item.id === id);

      if (assignment && assignment.subtasks) {
        const subtask = assignment.subtasks.find(s => s.id === subId);
        if (subtask) {
          subtask.completed = e.target.checked;
          
          // Auto-mark assignment complete if all subtasks are complete (optional design, let's keep it manual or auto?)
          // For UX, if checking a subtask, we update percentage and save. We don't force parent complete unless desired.
          saveState();
          updateStatistics();
          renderAssignmentsList();
        }
      }
    });
  });

  // 3. Edit assignment modal opening
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.assignment-card');
      const id = card.getAttribute('data-id');
      openModalForEdit(id);
    });
  });

  // 4. Delete assignment
  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.assignment-card');
      const id = card.getAttribute('data-id');
      
      // Beautiful confirmation (custom UI or standard window alert)
      if (confirm('确定要删除这门课程的作业任务吗？此操作无法撤销。')) {
        // Add delete slide-out transition
        card.style.transform = 'translateX(100px)';
        card.style.opacity = '0';
        card.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
          state.assignments = state.assignments.filter(item => item.id !== id);
          saveState();
          populateFilterCourses();
          updateStatistics();
          renderAssignmentsList();
        }, 300);
      }
    });
  });

  // 5. Expandable description toggle
  container.querySelectorAll('.toggle-desc-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const desc = e.target.previousElementSibling;
      desc.classList.toggle('expanded');
      e.target.textContent = desc.classList.contains('expanded') ? '收起描述' : '显示全部描述';
    });
  });
}

// ==========================================================================
// 6. MODAL SYSTEM & SUBTASK FORMS
// ==========================================================================

const modal = document.getElementById('assignment-modal');
const form = document.getElementById('assignment-form');

function openModal(isEdit = false) {
  modal.classList.add('show');
  document.getElementById('modal-title').textContent = isEdit ? '编辑作业属性' : '添加新作业';
  lucide.createIcons();
}

function closeModal() {
  modal.classList.remove('show');
  form.reset();
  state.tempSubtasks = [];
  state.currentEditId = null;
  renderTempSubtasks();
}

function renderTempSubtasks() {
  const list = document.getElementById('subtask-temp-list');
  list.innerHTML = '';
  
  state.tempSubtasks.forEach((text, index) => {
    const li = document.createElement('li');
    li.className = 'subtask-temp-item';
    li.innerHTML = `
      <span>${escapeHtml(text)}</span>
      <button type="button" data-index="${index}"><i data-lucide="trash-2"></i></button>
    `;
    list.appendChild(li);
  });
  
  lucide.createIcons();

  // Attach delete buttons for temporary subtasks
  list.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = e.target.closest('button').getAttribute('data-index');
      state.tempSubtasks.splice(index, 1);
      renderTempSubtasks();
    });
  });
}

function openModalForEdit(id) {
  const item = state.assignments.find(t => t.id === id);
  if (!item) return;

  state.currentEditId = id;
  
  // Fill inputs
  document.getElementById('edit-assignment-id').value = item.id;
  document.getElementById('form-title').value = item.title;
  document.getElementById('form-course').value = item.course;
  document.getElementById('form-deadline').value = item.deadline;
  document.getElementById('form-priority').value = item.priority;
  document.getElementById('form-est').value = item.estHours;
  document.getElementById('form-desc').value = item.description || '';

  // Copy subtasks
  state.tempSubtasks = item.subtasks ? item.subtasks.map(s => s.text) : [];
  renderTempSubtasks();

  openModal(true);
}

// Add Subtask button event inside modal
document.getElementById('add-subtask-btn').addEventListener('click', () => {
  const input = document.getElementById('new-subtask-input');
  const text = input.value.trim();
  if (text) {
    state.tempSubtasks.push(text);
    input.value = '';
    renderTempSubtasks();
  }
});

// Form submission handler
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('form-title').value.trim();
  const course = document.getElementById('form-course').value.trim();
  const deadline = document.getElementById('form-deadline').value;
  const priority = document.getElementById('form-priority').value;
  const estHours = parseFloat(document.getElementById('form-est').value) || 2;
  const description = document.getElementById('form-desc').value.trim();

  // Ensure course color is defined
  const courseColor = getCourseColor(course);

  if (state.currentEditId) {
    // Edit flow
    const index = state.assignments.findIndex(t => t.id === state.currentEditId);
    if (index !== -1) {
      const oldAssignment = state.assignments[index];
      
      // Preserve subtask completion state when editing
      const updatedSubtasks = state.tempSubtasks.map(text => {
        const existing = oldAssignment.subtasks ? oldAssignment.subtasks.find(s => s.text === text) : null;
        return {
          id: existing ? existing.id : 'sub-' + Date.now() + Math.random().toString(36).substr(2, 4),
          text: text,
          completed: existing ? existing.completed : false
        };
      });

      state.assignments[index] = {
        ...oldAssignment,
        title,
        course,
        deadline,
        priority,
        estHours,
        description,
        courseColor,
        subtasks: updatedSubtasks
      };
    }
  } else {
    // Create flow
    const newAssignment = {
      id: 'task-' + Date.now(),
      title,
      course,
      deadline,
      priority,
      estHours,
      description,
      completed: false,
      courseColor,
      subtasks: state.tempSubtasks.map(text => ({
        id: 'sub-' + Date.now() + Math.random().toString(36).substr(2, 4),
        text: text,
        completed: false
      }))
    };
    state.assignments.push(newAssignment);
  }

  saveState();
  closeModal();
  populateFilterCourses();
  updateStatistics();
  renderAssignmentsList();
});

// ==========================================================================
// 7. BACKUP IMPORT & EXPORT LOGIC
// ==========================================================================

// JSON Export
document.getElementById('export-btn').addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.assignments, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute("download", `assignments_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

// Trigger import file input
document.getElementById('import-btn-trigger').addEventListener('click', () => {
  document.getElementById('import-file-input').click();
});

// Parse imported JSON file
document.getElementById('import-file-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const importedTasks = JSON.parse(evt.target.result);
      if (Array.isArray(importedTasks)) {
        // Simple structural validation
        const isValid = importedTasks.every(t => t.title && t.course && t.deadline && t.priority);
        if (isValid) {
          if (confirm(`成功读取 ${importedTasks.length} 个任务。是否覆盖当前作业数据？`)) {
            state.assignments = importedTasks;
            // Regenerate colors
            state.assignments.forEach(item => {
              item.courseColor = getCourseColor(item.course);
            });
            saveState();
            populateFilterCourses();
            updateStatistics();
            renderAssignmentsList();
            alert('数据导入成功！');
          }
        } else {
          alert('导入失败：数据结构不完整，请确保包含标题、课程、截止日及优先级。');
        }
      } else {
        alert('导入失败：JSON文件不是一个合法的作业数组。');
      }
    } catch (err) {
      alert('导入失败：非法的 JSON 文件格式。');
      console.error(err);
    }
    // Clear value to allow same-file selection
    e.target.value = '';
  };
  reader.readAsText(file);
});

// ==========================================================================
// 8. GLOBAL INITIALIZATION & GENERAL EVENTS
// ==========================================================================

// Theme toggling
document.getElementById('theme-toggle-btn').addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.className = state.theme === 'light' ? 'light-theme' : 'dark-theme';
  
  // Re-render charts to adjust styles and grid colors
  initOrUpdateCharts();
  saveState();
});

// Open modal triggers
document.getElementById('add-assignment-btn').addEventListener('click', () => {
  openModal(false);
});
document.getElementById('close-modal-btn').addEventListener('click', closeModal);
document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);

// Close modal on background click
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

// Setup filters and searches
document.getElementById('search-input').addEventListener('input', renderAssignmentsList);
document.getElementById('filter-course').addEventListener('change', renderAssignmentsList);
document.getElementById('filter-priority').addEventListener('change', renderAssignmentsList);
document.getElementById('filter-status').addEventListener('change', renderAssignmentsList);
document.getElementById('sort-by').addEventListener('change', renderAssignmentsList);

// Timer to dynamically update countdown and warnings every minute
setInterval(() => {
  // Only redraw deadlines by changing contents if we aren't editing
  if (!modal.classList.contains('show')) {
    renderAssignmentsList();
  }
}, 60000);

// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  populateFilterCourses();
  updateStatistics();
  renderAssignmentsList();
});
