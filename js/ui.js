/**
 * ui.js - Módulo de Interface do Usuário
 * Planograma - Controlador de toda a manipulação do DOM e interações visuais
 */

(function () {
  'use strict';

  // Dias da semana abreviados
  const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DIAS_COMPLETOS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Mapa de categorias com emojis
  const CATEGORIA_EMOJI = {
    trabalho: '💼', faculdade: '🎓', curso: '📚', esporte: '🏃',
    saude: '❤️', estudo: '📖', pessoal: '👤', projeto: '🚀',
    exercicio: '🏋️', outro: '📌'
  };

  // Estado local do módulo
  let currentSection = 'dashboard';
  let currentWeekStart = getMonday(new Date());
  let currentView = 'semanal'; // 'semanal' ou 'diario'
  let currentDayIndex = new Date().getDay(); // Para visão diária
  let confirmCallback = null;

  // ===================== FUNÇÕES AUXILIARES =====================

  /**
   * Retorna a segunda-feira da semana de uma data
   */
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Formata data para exibição (dd/mm/aaaa)
   */
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  /**
   * Formata data para exibição curta (dd/mm)
   */
  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const [, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  }

  /**
   * Retorna string ISO de uma data (YYYY-MM-DD)
   */
  function toISODate(date) {
    return date.toISOString().split('T')[0];
  }

  /**
   * Retorna o badge HTML de prioridade
   */
  function getPriorityBadge(prioridade) {
    const map = {
      alta: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold priority-alta">ALTA</span>',
      media: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold priority-media">MÉDIA</span>',
      baixa: '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold priority-baixa">BAIXA</span>'
    };
    return map[prioridade] || map.media;
  }

  /**
   * Retorna saudação baseada na hora do dia
   */
  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  /**
   * Converte minutos em texto legível
   */
  function minutesToReadable(min) {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${m}min` : `${h}h`;
  }

  // ===================== MÓDULO UI =====================

  const UI = {

    // === INICIALIZAÇÃO ===
    init() {
      this.setupColorPickers();
      this.applyTheme();
    },

    // === NAVEGAÇÃO ===
    /**
     * Navega para uma seção específica
     */
    navigateTo(section) {
      // Esconder todas as seções
      document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
      });

      // Mostrar seção alvo
      const target = document.getElementById(section);
      if (target) {
        target.classList.add('active');
        // Re-trigger animação
        target.classList.remove('fade-in');
        void target.offsetWidth;
        target.classList.add('fade-in');
      }

      // Atualizar nav ativa
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        item.classList.remove('text-slate-400');
        if (item.getAttribute('data-nav') === section) {
          item.classList.add('active');
        } else {
          item.classList.add('text-slate-400');
        }
      });

      currentSection = section;

      // Renderizar conteúdo da seção
      this.renderSection(section);

      // Fechar sidebar no mobile
      this.closeSidebar();

      // Atualizar hash
      window.location.hash = section;
    },

    /**
     * Renderiza o conteúdo de uma seção
     */
    renderSection(section) {
      switch (section) {
        case 'dashboard': this.renderDashboard(); break;
        case 'atividades-fixas': this.renderAtividadesFixas(); break;
        case 'tarefas': this.renderTarefas(); break;
        case 'cronograma': this.renderCronograma(); break;
        case 'configuracoes': this.renderConfiguracoes(); break;
      }
    },

    // === SIDEBAR (Mobile) ===
    toggleSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
      } else {
        this.closeSidebar();
      }
    },

    closeSidebar() {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      if (window.innerWidth < 1024) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
      }
    },

    // === DASHBOARD ===
    renderDashboard() {
      const config = Storage.getConfig();
      const tarefas = Storage.getTarefas();
      const atividadesFixas = Storage.getAtividadesFixas();
      const cronograma = Storage.getCronograma();

      // Saudação
      const nome = config.nome || '';
      const greetingEl = document.getElementById('greeting');
      const greetingSubEl = document.getElementById('greeting-sub');
      if (greetingEl) {
        greetingEl.textContent = `${getGreeting()}${nome ? ', ' + nome : ''}! 👋`;
      }
      if (greetingSubEl) {
        greetingSubEl.textContent = 'Confira seu dia de hoje';
      }

      // Estatísticas
      const total = tarefas.length;
      const concluidas = tarefas.filter(t => t.concluida).length;
      const pendentes = total - concluidas;

      document.getElementById('stat-total').textContent = total;
      document.getElementById('stat-concluidas').textContent = concluidas;
      document.getElementById('stat-pendentes').textContent = pendentes;

      // Horas livres hoje
      if (window.Scheduler) {
        const hojeDateStr = toISODate(new Date());
        let horasLivres = Scheduler.calcularHorasLivres(hojeDateStr, atividadesFixas, config);
        
        // Descontar tarefas agendadas para hoje
        if (cronograma && cronograma.blocos) {
          const tarefasHoje = cronograma.blocos.filter(b => b.data === hojeDateStr && b.tipo === 'tarefa');
          const minutosTarefas = tarefasHoje.reduce((total, b) => {
            const h1 = parseInt(b.horaInicio.split(':')[0]);
            const m1 = parseInt(b.horaInicio.split(':')[1]);
            const h2 = parseInt(b.horaFim.split(':')[0]);
            const m2 = parseInt(b.horaFim.split(':')[1]);
            return total + ((h2 * 60 + m2) - (h1 * 60 + m1));
          }, 0);
          horasLivres = Math.max(0, horasLivres - (minutosTarefas / 60));
        }
        
        document.getElementById('stat-horas-livres').textContent =
          typeof horasLivres === 'number' ? `${horasLivres.toFixed(1)}h` : '-';
      }

      // Data de hoje
      const todayDateEl = document.getElementById('today-date');
      if (todayDateEl) {
        const now = new Date();
        todayDateEl.textContent = `${DIAS_COMPLETOS[now.getDay()]}, ${now.toLocaleDateString('pt-BR')}`;
      }

      // Timeline de hoje
      this.renderTodayTimeline(atividadesFixas, cronograma);
    },

    /**
     * Renderiza a mini-timeline do dia atual
     */
    renderTodayTimeline(atividadesFixas, cronograma) {
      const container = document.getElementById('today-timeline');
      if (!container) return;

      const hoje = new Date().getDay();
      const blocos = [];

      // Atividades recorrentes de hoje
      atividadesFixas.forEach(a => {
        if (a.dias && a.dias.includes(hoje)) {
          blocos.push({
            nome: a.nome,
            horaInicio: a.horaInicio,
            horaFim: a.horaFim,
            cor: a.cor || '#6366f1',
            tipo: 'fixo'
          });
        }
      });

      // Tarefas agendadas para hoje
      if (cronograma && cronograma.blocos) {
        cronograma.blocos.forEach(b => {
          if (b.dia === hoje && b.tipo === 'tarefa') {
            blocos.push({
              nome: b.nome,
              horaInicio: b.horaInicio,
              horaFim: b.horaFim,
              cor: b.cor || '#f59e0b',
              tipo: 'tarefa'
            });
          }
        });
      }

      // Ordenar por hora
      blocos.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      if (blocos.length === 0) {
        container.innerHTML = '<p class="text-slate-500 text-sm text-center py-6">Nenhuma atividade agendada para hoje.</p>';
        return;
      }

      container.innerHTML = blocos.map(b => `
        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
          <div class="w-1 h-10 rounded-full" style="background: ${b.cor}"></div>
          <div class="flex-1">
            <p class="text-sm font-medium text-white">${b.nome}</p>
            <p class="text-xs text-slate-400">${b.horaInicio} - ${b.horaFim}</p>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full ${b.tipo === 'fixo' ? 'bg-brand-600/20 text-brand-300' : 'bg-amber-600/20 text-amber-300'}">${b.tipo === 'fixo' ? 'Fixo' : 'Tarefa'}</span>
        </div>
      `).join('');
    },

    // === ATIVIDADES RECORRENTES ===
    renderAtividadesFixas() {
      const atividades = Storage.getAtividadesFixas();
      const container = document.getElementById('atividades-lista');
      if (!container) return;

      if (atividades.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 text-slate-500 col-span-full">
            <i class="fas fa-calendar-plus text-4xl mb-3 block"></i>
            <p>Nenhuma atividade recorrente cadastrada ainda.</p>
            <p class="text-sm mt-1">Comece adicionando suas atividades recorrentes acima.</p>
          </div>`;
        return;
      }

      container.innerHTML = atividades.map(a => {
        const diasStr = (a.dias || []).map(d => DIAS_ABREV[d]).join(', ');
        const emoji = CATEGORIA_EMOJI[a.categoria] || '📌';
        return `
          <div class="task-card bg-slate-900 border border-slate-800 rounded-xl p-4 group" data-id="${a.id}">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-10 rounded-full" style="background: ${a.cor || '#6366f1'}"></div>
                <div>
                  <h4 class="font-medium text-white text-sm">${a.nome}</h4>
                  <p class="text-xs text-slate-400 mt-0.5">${emoji} ${a.categoria ? a.categoria.charAt(0).toUpperCase() + a.categoria.slice(1) : ''}</p>
                </div>
              </div>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="UI.openEditAtividade('${a.id}')" class="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition" title="Editar">
                  <i class="fas fa-pen text-xs"></i>
                </button>
                <button onclick="UI.handleDeleteAtividade('${a.id}')" class="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition" title="Excluir">
                  <i class="fas fa-trash text-xs"></i>
                </button>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-4 text-xs text-slate-400">
              <span><i class="fas fa-clock mr-1"></i>${a.horaInicio} - ${a.horaFim}</span>
              <span><i class="fas fa-calendar mr-1"></i>${diasStr}</span>
            </div>
          </div>`;
      }).join('');
    },

    /**
     * Trata o envio do formulário de nova atividade recorrente
     */
    handleAddAtividade(form) {
      const formData = new FormData(form);
      const nome = formData.get('nome')?.trim();
      const categoria = formData.get('categoria');
      const horaInicio = formData.get('horaInicio');
      const horaFim = formData.get('horaFim');
      const cor = formData.get('cor') || '#6366f1';

      // Coletar dias marcados
      const dias = [];
      form.querySelectorAll('input[name="dias"]:checked').forEach(cb => {
        dias.push(parseInt(cb.value));
      });

      // Validações
      if (!nome) {
        this.showToast('Preencha o nome da atividade.', 'warning');
        return false;
      }
      if (dias.length === 0) {
        this.showToast('Selecione pelo menos um dia da semana.', 'warning');
        return false;
      }
      if (!horaInicio || !horaFim) {
        this.showToast('Preencha os horários de início e término.', 'warning');
        return false;
      }
      if (horaInicio >= horaFim) {
        this.showToast('O horário de início deve ser antes do término.', 'warning');
        return false;
      }

      Storage.addAtividadeFixa({ nome, categoria, dias, horaInicio, horaFim, cor });
      form.reset();
      // Resetar cor selecionada
      form.querySelector('input[name="cor"]').value = '#6366f1';
      this.setupColorPickers();
      this.showToast('Atividade adicionada com sucesso!', 'success');
      this.renderAtividadesFixas();
      return true;
    },

    /**
     * Abre modal de edição de atividade
     */
    openEditAtividade(id) {
      const atividades = Storage.getAtividadesFixas();
      const atividade = atividades.find(a => a.id === id);
      if (!atividade) return;

      const form = document.getElementById('edit-atividade-form');
      form.querySelector('[name="id"]').value = atividade.id;
      form.querySelector('[name="nome"]').value = atividade.nome;
      form.querySelector('[name="categoria"]').value = atividade.categoria;
      form.querySelector('[name="horaInicio"]').value = atividade.horaInicio;
      form.querySelector('[name="horaFim"]').value = atividade.horaFim;
      form.querySelector('[name="cor"]').value = atividade.cor || '#6366f1';

      // Marcar dias
      form.querySelectorAll('input[name="dias"]').forEach(cb => {
        cb.checked = (atividade.dias || []).includes(parseInt(cb.value));
      });

      // Selecionar cor
      const colorPicker = document.getElementById('edit-color-picker-atividade');
      colorPicker.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === (atividade.cor || '#6366f1'));
      });

      this.openModal('edit-atividade-modal');
    },

    /**
     * Trata o envio do formulário de edição de atividade
     */
    handleEditAtividade(form) {
      const formData = new FormData(form);
      const id = formData.get('id');
      const nome = formData.get('nome')?.trim();
      const categoria = formData.get('categoria');
      const horaInicio = formData.get('horaInicio');
      const horaFim = formData.get('horaFim');
      const cor = formData.get('cor') || '#6366f1';

      const dias = [];
      form.querySelectorAll('input[name="dias"]:checked').forEach(cb => {
        dias.push(parseInt(cb.value));
      });

      if (!nome || dias.length === 0 || !horaInicio || !horaFim) {
        this.showToast('Preencha todos os campos obrigatórios.', 'warning');
        return false;
      }

      Storage.updateAtividadeFixa(id, { nome, categoria, dias, horaInicio, horaFim, cor });
      this.closeModal('edit-atividade-modal');
      this.showToast('Atividade atualizada!', 'success');
      this.renderAtividadesFixas();
      return true;
    },

    /**
     * Trata exclusão de atividade recorrente
     */
    handleDeleteAtividade(id) {
      this.showConfirmation('Deseja realmente excluir esta atividade?', () => {
        Storage.deleteAtividadeFixa(id);
        this.showToast('Atividade excluída.', 'success');
        this.renderAtividadesFixas();
      });
    },

    // === TAREFAS ===
    renderTarefas() {
      let tarefas = Storage.getTarefas();
      const container = document.getElementById('tarefas-lista');
      if (!container) return;

      // Aplicar filtros
      const filterPrioridade = document.getElementById('filter-prioridade')?.value;
      const filterStatus = document.getElementById('filter-status')?.value;
      const sortBy = document.getElementById('sort-tarefas')?.value || 'prioridade';

      if (filterPrioridade) {
        tarefas = tarefas.filter(t => t.prioridade === filterPrioridade);
      }
      if (filterStatus === 'pendente') {
        tarefas = tarefas.filter(t => !t.concluida);
      } else if (filterStatus === 'concluida') {
        tarefas = tarefas.filter(t => t.concluida);
      }

      // Ordenar
      const prioridadeOrdem = { alta: 0, media: 1, baixa: 2 };
      switch (sortBy) {
        case 'prioridade':
          tarefas.sort((a, b) => (prioridadeOrdem[a.prioridade] || 1) - (prioridadeOrdem[b.prioridade] || 1));
          break;
        case 'prazo':
          tarefas.sort((a, b) => (a.prazo || '9999') .localeCompare(b.prazo || '9999'));
          break;
        case 'nome':
          tarefas.sort((a, b) => a.nome.localeCompare(b.nome));
          break;
        case 'duracao':
          tarefas.sort((a, b) => (a.duracao || 0) - (b.duracao || 0));
          break;
      }

      if (tarefas.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 text-slate-500">
            <i class="fas fa-clipboard-list text-4xl mb-3 block"></i>
            <p>Nenhuma tarefa encontrada.</p>
            <p class="text-sm mt-1">Adicione tarefas que você precisa encaixar na rotina.</p>
          </div>`;
        return;
      }

      container.innerHTML = tarefas.map(t => {
        const emoji = CATEGORIA_EMOJI[t.categoria] || '📌';
        const prazoStr = t.prazo ? formatDate(t.prazo) : '';
        const isOverdue = t.prazo && !t.concluida && t.prazo < toISODate(new Date());
        return `
          <div class="task-card bg-slate-900 border border-slate-800 rounded-xl p-4 group ${t.concluida ? 'opacity-60' : ''}" data-id="${t.id}">
            <div class="flex items-start gap-3">
              <button onclick="UI.handleToggleTarefa('${t.id}')" class="mt-0.5 w-5 h-5 rounded border-2 ${t.concluida ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-brand-400'} flex items-center justify-center transition-colors flex-shrink-0">
                ${t.concluida ? '<i class="fas fa-check text-[10px] text-white"></i>' : ''}
              </button>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-medium text-sm ${t.concluida ? 'line-through text-slate-500' : 'text-white'}">${t.nome}</h4>
                  ${getPriorityBadge(t.prioridade)}
                  ${t.divisivel ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">Divisível</span>' : ''}
                </div>
                ${t.descricao ? `<p class="text-xs text-slate-400 mt-1 truncate">${t.descricao}</p>` : ''}
                <div class="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span>${emoji} ${t.categoria ? t.categoria.charAt(0).toUpperCase() + t.categoria.slice(1) : ''}</span>
                  <span><i class="fas fa-clock mr-1"></i>${minutesToReadable(t.duracao || 0)}</span>
                  ${prazoStr ? `<span class="${isOverdue ? 'text-red-400 font-medium' : ''}"><i class="fas fa-flag mr-1"></i>${prazoStr}${isOverdue ? ' (atrasada)' : ''}</span>` : ''}
                </div>
              </div>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onclick="UI.openEditTarefa('${t.id}')" class="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition" title="Editar">
                  <i class="fas fa-pen text-xs"></i>
                </button>
                <button onclick="UI.handleDeleteTarefa('${t.id}')" class="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition" title="Excluir">
                  <i class="fas fa-trash text-xs"></i>
                </button>
              </div>
            </div>
          </div>`;
      }).join('');
    },

    /**
     * Trata o envio do formulário de nova tarefa
     */
    handleAddTarefa(form) {
      const formData = new FormData(form);
      const nome = formData.get('nome')?.trim();
      const descricao = formData.get('descricao')?.trim() || '';
      const prioridade = formData.get('prioridade') || 'media';
      const categoria = formData.get('categoria') || 'outro';
      const prazo = formData.get('prazo') || '';
      const divisivel = form.querySelector('[name="divisivel"]')?.checked || false;

      let duracao = parseInt(formData.get('duracao')) || 0;
      const unidade = formData.get('duracao-unidade');
      if (unidade === 'hora') duracao *= 60;

      if (!nome) {
        this.showToast('Preencha o nome da tarefa.', 'warning');
        return false;
      }
      if (duracao < 5) {
        this.showToast('A duração mínima é de 5 minutos.', 'warning');
        return false;
      }

      Storage.addTarefa({ nome, descricao, prioridade, duracao, prazo, categoria, divisivel });
      form.reset();
      this.showToast('Tarefa adicionada com sucesso!', 'success');
      this.renderTarefas();
      return true;
    },

    /**
     * Abre modal de edição de tarefa
     */
    openEditTarefa(id) {
      const tarefas = Storage.getTarefas();
      const tarefa = tarefas.find(t => t.id === id);
      if (!tarefa) return;

      const form = document.getElementById('edit-tarefa-form');
      form.querySelector('[name="id"]').value = tarefa.id;
      form.querySelector('[name="nome"]').value = tarefa.nome;
      form.querySelector('[name="descricao"]').value = tarefa.descricao || '';
      form.querySelector('[name="prioridade"]').value = tarefa.prioridade;
      form.querySelector('[name="categoria"]').value = tarefa.categoria;
      form.querySelector('[name="duracao"]').value = tarefa.duracao;
      form.querySelector('[name="prazo"]').value = tarefa.prazo || '';
      form.querySelector('[name="divisivel"]').checked = tarefa.divisivel || false;

      this.openModal('edit-tarefa-modal');
    },

    /**
     * Trata o envio do formulário de edição de tarefa
     */
    handleEditTarefa(form) {
      const formData = new FormData(form);
      const id = formData.get('id');
      const nome = formData.get('nome')?.trim();
      const descricao = formData.get('descricao')?.trim() || '';
      const prioridade = formData.get('prioridade');
      const categoria = formData.get('categoria');
      const duracao = parseInt(formData.get('duracao')) || 0;
      const prazo = formData.get('prazo') || '';
      const divisivel = form.querySelector('[name="divisivel"]')?.checked || false;

      if (!nome || duracao < 5) {
        this.showToast('Preencha todos os campos obrigatórios.', 'warning');
        return false;
      }

      Storage.updateTarefa(id, { nome, descricao, prioridade, categoria, duracao, prazo, divisivel });
      this.closeModal('edit-tarefa-modal');
      this.showToast('Tarefa atualizada!', 'success');
      this.renderTarefas();
      return true;
    },

    /**
     * Alterna conclusão de tarefa
     */
    handleToggleTarefa(id) {
      Storage.toggleTarefaConcluida(id);
      this.renderTarefas();
      // Atualizar dashboard se visível
      if (currentSection === 'dashboard') this.renderDashboard();
    },

    /**
     * Trata exclusão de tarefa
     */
    handleDeleteTarefa(id) {
      this.showConfirmation('Deseja realmente excluir esta tarefa?', () => {
        Storage.deleteTarefa(id);
        this.showToast('Tarefa excluída.', 'success');
        this.renderTarefas();
      });
    },

    // === CRONOGRAMA ===
    renderCronograma() {
      this.updateWeekLabel();
      const cronograma = Storage.getCronograma();
      const atividadesFixas = Storage.getAtividadesFixas();
      const config = Storage.getConfig();

      if (currentView === 'semanal') {
        this.renderWeeklyGrid(cronograma, atividadesFixas, config);
      } else if (currentView === 'mensal') {
        this.renderMonthlyGrid(cronograma, atividadesFixas, config);
      } else {
        this.renderDailyView(cronograma, atividadesFixas, config);
      }
    },

    /**
     * Atualiza o label da semana exibida
     */
    updateWeekLabel() {
      const label = document.getElementById('week-label');
      if (!label) return;
      if (currentView === 'mensal') {
        const midWeek = new Date(currentWeekStart);
        midWeek.setDate(midWeek.getDate() + 3);
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        label.textContent = `${meses[midWeek.getMonth()]} ${midWeek.getFullYear()}`;
      } else {
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 6);
        label.textContent = `${formatDateShort(toISODate(currentWeekStart))} - ${formatDateShort(toISODate(end))}`;
      }

      // Atualizar cabeçalho com datas
      const header = document.getElementById('schedule-header');
      if (header) {
        if (currentView === 'mensal') {
          const innerGrid = header.querySelector('.grid-cols-7');
          const cells = innerGrid ? innerGrid.children : [];
          for (let i = 0; i < 7; i++) {
            if (!cells[i]) continue;
            const dayIdx = i === 6 ? 0 : i + 1;
            cells[i].innerHTML = `
              <span class="text-slate-300 font-medium">${DIAS_ABREV[dayIdx]}</span>
            `;
          }
          // hide the time column header
          const timeHeader = header.querySelector('.w-\\[80px\\]') || header.firstElementChild;
          if (timeHeader && timeHeader.classList.contains('flex-shrink-0')) {
            timeHeader.style.display = 'none';
          }
        } else {
          // Selecionar os 7 cells de dias (filhos diretos do inner grid-cols-7)
          const innerGrid = header.querySelector('.grid-cols-7');
          const cells = innerGrid ? innerGrid.children : [];
          for (let i = 0; i < 7; i++) {
            if (!cells[i]) continue;
            const dayDate = new Date(currentWeekStart);
            dayDate.setDate(dayDate.getDate() + i);
            const isToday = toISODate(dayDate) === toISODate(new Date());
            // i=0 é Seg (dia 1) ... i=6 é Dom (dia 0)
            const dayIdx = i === 6 ? 0 : i + 1;
            cells[i].innerHTML = `
              <span class="${isToday ? 'text-brand-400 font-bold' : ''}">${DIAS_ABREV[dayIdx]}</span>
              <span class="block text-[10px] ${isToday ? 'text-brand-300' : 'text-slate-500'}">${formatDateShort(toISODate(dayDate))}</span>
            `;
          }
          const timeHeader = header.querySelector('.w-\\[80px\\]') || header.firstElementChild;
          if (timeHeader && timeHeader.classList.contains('flex-shrink-0')) {
            timeHeader.style.display = 'block';
          }
        }
      }

      // Atualizar botões de vista
      document.getElementById('btn-view-semanal')?.classList.toggle('bg-brand-600', currentView === 'semanal');
      document.getElementById('btn-view-semanal')?.classList.toggle('bg-slate-800', currentView !== 'semanal');
      document.getElementById('btn-view-semanal')?.classList.toggle('text-white', currentView === 'semanal');
      document.getElementById('btn-view-semanal')?.classList.toggle('text-slate-400', currentView !== 'semanal');
      document.getElementById('btn-view-diario')?.classList.toggle('bg-brand-600', currentView === 'diario');
      document.getElementById('btn-view-diario')?.classList.toggle('bg-slate-800', currentView !== 'diario');
      document.getElementById('btn-view-diario')?.classList.toggle('text-white', currentView === 'diario');
      document.getElementById('btn-view-diario')?.classList.toggle('text-slate-400', currentView !== 'diario');
      document.getElementById('btn-view-mensal')?.classList.toggle('bg-brand-600', currentView === 'mensal');
      document.getElementById('btn-view-mensal')?.classList.toggle('bg-slate-800', currentView !== 'mensal');
      document.getElementById('btn-view-mensal')?.classList.toggle('text-white', currentView === 'mensal');
      document.getElementById('btn-view-mensal')?.classList.toggle('text-slate-400', currentView !== 'mensal');
    },

    /**
     * Renderiza a grade semanal do cronograma
     */
    renderWeeklyGrid(cronograma, atividadesFixas, config) {
      const body = document.getElementById('schedule-body');
      if (!body) return;

      const acordar = config.acordar || '06:00';
      const dormir = config.dormir || '23:00';
      const startHour = parseInt(acordar.split(':')[0]);
      const endHour = parseInt(dormir.split(':')[0]) + 1;
      const totalHours = endHour - startHour;
      const rowHeight = 48; // pixels por hora

      // Construir grade de horários
      let gridHTML = '<div class="relative min-w-[800px]" style="height: ' + (totalHours * rowHeight) + 'px">';

      // Linhas de hora
      for (let h = startHour; h < endHour; h++) {
        const top = (h - startHour) * rowHeight;
        gridHTML += `
          <div class="absolute left-0 right-0 flex" style="top: ${top}px; height: ${rowHeight}px;">
            <div class="w-[80px] flex-shrink-0 text-[11px] text-slate-500 pr-3 text-right pt-0.5 border-r border-slate-800">${String(h).padStart(2, '0')}:00</div>
            <div class="flex-1 grid grid-cols-7 border-b border-slate-800/50">
              ${Array(7).fill('<div class="border-r border-slate-800/30"></div>').join('')}
            </div>
          </div>`;
      }

      // Função para converter hora em posição Y
      const timeToY = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return ((h - startHour) + m / 60) * rowHeight;
      };

      // Renderizar blocos de atividades recorrentes
      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + i);
        weekDates.push(toISODate(d));
      }

      atividadesFixas.forEach(a => {
        (a.dias || []).forEach(dia => {
          // Mapear dia (0=Dom...6=Sáb) para coluna (0=Seg...6=Dom)
          let colIndex = dia === 0 ? 6 : dia - 1;
          const top = timeToY(a.horaInicio);
          const bottom = timeToY(a.horaFim);
          const height = bottom - top;
          const left = 80 + colIndex * ((100 - 80) / 7); // Aproximação
          gridHTML += `
            <div class="schedule-block absolute rounded-lg px-2 py-1 overflow-hidden text-white text-[11px] font-medium"
              style="top: ${top}px; height: ${Math.max(height, 20)}px; left: calc(80px + ${colIndex} * calc((100% - 80px) / 7) + 2px); width: calc(calc((100% - 80px) / 7) - 4px); background: ${a.cor || '#6366f1'}; opacity: 0.9;"
              title="${a.nome} (${a.horaInicio} - ${a.horaFim})">
              <span class="block truncate">${a.nome}</span>
              ${height > 30 ? `<span class="block text-[10px] opacity-75">${a.horaInicio} - ${a.horaFim}</span>` : ''}
            </div>`;
        });
      });

      // Renderizar blocos de tarefas agendadas
      if (cronograma && cronograma.blocos) {
        cronograma.blocos.forEach(b => {
          if (b.tipo === 'tarefa') {
            let colIndex = b.dia === 0 ? 6 : b.dia - 1;
            const top = timeToY(b.horaInicio);
            const bottom = timeToY(b.horaFim);
            const height = bottom - top;
            gridHTML += `
              <div class="schedule-block absolute rounded-lg px-2 py-1 overflow-hidden text-white text-[11px] font-medium border-2 border-dashed"
                style="top: ${top}px; height: ${Math.max(height, 20)}px; left: calc(80px + ${colIndex} * calc((100% - 80px) / 7) + 2px); width: calc(calc((100% - 80px) / 7) - 4px); background: ${b.cor || '#f59e0b'}90; border-color: ${b.cor || '#f59e0b'};"
                title="${b.nome} (${b.horaInicio} - ${b.horaFim})">
                <span class="block truncate">${b.nome}</span>
                ${height > 30 ? `<span class="block text-[10px] opacity-75">${b.horaInicio} - ${b.horaFim}</span>` : ''}
              </div>`;
          }
        });
      }

      // Indicador de hora atual
      const now = new Date();
      const todayStr = toISODate(now);
      const todayColIdx = weekDates.indexOf(todayStr);
      if (todayColIdx >= 0) {
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const startMinutes = startHour * 60;
        if (nowMinutes >= startMinutes && nowMinutes <= endHour * 60) {
          const nowY = ((nowMinutes - startMinutes) / 60) * rowHeight;
          gridHTML += `
            <div class="absolute left-[80px] right-0 flex items-center z-20 pointer-events-none" style="top: ${nowY}px">
              <div class="w-2 h-2 rounded-full bg-red-500"></div>
              <div class="flex-1 h-[2px] bg-red-500 opacity-60"></div>
            </div>`;
        }
      }

      gridHTML += '</div>';
      body.innerHTML = gridHTML;
    },

    /**
     * Renderiza a visão diária
     */
    renderDailyView(cronograma, atividadesFixas, config) {
      const body = document.getElementById('schedule-body');
      if (!body) return;

      const acordar = config.acordar || '06:00';
      const dormir = config.dormir || '23:00';
      const startHour = parseInt(acordar.split(':')[0]);
      const endHour = parseInt(dormir.split(':')[0]) + 1;

      // Pegar dia atual selecionado
      const dayDate = new Date(currentWeekStart);
      dayDate.setDate(dayDate.getDate() + currentDayIndex);
      const dayOfWeek = dayDate.getDay();

      let html = `<div class="p-4"><h3 class="text-lg font-semibold text-white mb-4">${DIAS_COMPLETOS[dayOfWeek]}, ${formatDate(toISODate(dayDate))}</h3>`;

      // Blocos do dia
      const dayBlocks = [];
      atividadesFixas.forEach(a => {
        if ((a.dias || []).includes(dayOfWeek)) {
          dayBlocks.push({ nome: a.nome, horaInicio: a.horaInicio, horaFim: a.horaFim, cor: a.cor || '#6366f1', tipo: 'fixo', categoria: a.categoria });
        }
      });
      if (cronograma && cronograma.blocos) {
        cronograma.blocos.filter(b => b.dia === dayOfWeek && b.tipo === 'tarefa').forEach(b => {
          dayBlocks.push({ nome: b.nome, horaInicio: b.horaInicio, horaFim: b.horaFim, cor: b.cor || '#f59e0b', tipo: 'tarefa' });
        });
      }

      dayBlocks.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

      if (dayBlocks.length === 0) {
        html += '<p class="text-slate-500 text-sm text-center py-8">Nenhuma atividade para este dia.</p>';
      } else {
        html += '<div class="space-y-2">';
        dayBlocks.forEach(b => {
          html += `
            <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition-colors">
              <div class="w-1.5 h-14 rounded-full" style="background: ${b.cor}"></div>
              <div class="flex-1">
                <p class="font-medium text-white">${b.nome}</p>
                <p class="text-sm text-slate-400">${b.horaInicio} - ${b.horaFim}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full ${b.tipo === 'fixo' ? 'bg-brand-600/20 text-brand-300' : 'bg-amber-600/20 text-amber-300'}">${b.tipo === 'fixo' ? 'Fixo' : 'Tarefa'}</span>
            </div>`;
        });
        html += '</div>';
      }

      // Navegação de dias
      html += `
        <div class="flex justify-center gap-2 mt-6">
          ${Array.from({ length: 7 }, (_, i) => {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + i);
            const isActive = i === currentDayIndex;
            return `<button onclick="UI.selectDay(${i})" class="px-3 py-2 rounded-lg text-xs font-medium ${isActive ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'} transition-colors">${DIAS_ABREV[d.getDay()]}<br>${formatDateShort(toISODate(d))}</button>`;
          }).join('')}
        </div>`;

      html += '</div>';
      body.innerHTML = html;
    },

    /**
     * Seleciona um dia na visão diária
     */
    selectDay(index) {
      currentDayIndex = index;
      this.renderCronograma();
    },

    /**
     * Gera o cronograma
     */
    handleGerarCronograma() {
      const config = Storage.getConfig();
      const atividadesFixas = Storage.getAtividadesFixas();
      const tarefas = Storage.getTarefas().filter(t => !t.concluida);

      if (tarefas.length === 0) {
        this.showToast('Adicione tarefas pendentes para gerar o cronograma.', 'warning');
        return;
      }

      const semanaInicio = toISODate(currentWeekStart);
      const resultado = Scheduler.gerarCronograma(config, atividadesFixas, tarefas, semanaInicio);

      Storage.saveCronograma(resultado);

      const totalAlocadas = resultado.blocos ? resultado.blocos.filter(b => b.tipo === 'tarefa').length : 0;
      const naoAlocadas = resultado.naoAgendadas ? resultado.naoAgendadas.length : 0;

      this.renderCronograma();

      if (naoAlocadas > 0) {
        this.showToast(`Cronograma gerado! ${totalAlocadas} bloco(s) alocado(s). ${naoAlocadas} tarefa(s) não couberam.`, 'warning');
      } else {
        this.showToast(`Cronograma gerado com sucesso! ${totalAlocadas} bloco(s) alocado(s).`, 'success');
      }
    },

    /**
     * Navega entre semanas
     */
    navigateWeek(direction) {
      if (currentView === 'mensal') {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + 3); // Quinta-feira sempre cai no mês correto
        d.setMonth(d.getMonth() + direction);
        currentWeekStart = getMonday(d);
      } else {
        currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
      }
      this.renderCronograma();
    },

    /**
     * Alterna visão semanal/diária/mensal
     */
    toggleView(view) {
      currentView = view;
      if (view === 'diario') {
        // Começar no dia atual da semana
        const today = new Date();
        const diff = Math.floor((today - currentWeekStart) / (1000 * 60 * 60 * 24));
        currentDayIndex = Math.max(0, Math.min(6, diff));
      }
      this.renderCronograma();
    },

    /**
     * Renderiza a visão mensal
     */
    renderMonthlyGrid(cronograma, atividadesFixas, config) {
      const body = document.getElementById('schedule-body');
      if (!body) return;

      const midWeek = new Date(currentWeekStart);
      midWeek.setDate(midWeek.getDate() + 3);
      const year = midWeek.getFullYear();
      const month = midWeek.getMonth();
      
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);
      
      let startDay = new Date(firstDayOfMonth);
      let dayOfWeek = startDay.getDay(); // 0 = Sunday, 1 = Monday
      let offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startDay.setDate(startDay.getDate() - offset);
      
      let totalDays = (lastDayOfMonth.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24) + 1;
      let totalWeeks = Math.ceil(totalDays / 7);

      let gridHTML = '<div class="flex flex-col min-h-[600px] border-l border-slate-800 bg-slate-900">';
      
      let currentDate = new Date(startDay);
      for (let w = 0; w < totalWeeks; w++) {
        gridHTML += '<div class="flex flex-1 border-b border-slate-800 min-h-[120px]">';
        for (let d = 0; d < 7; d++) {
          const dateStr = toISODate(currentDate);
          const isCurrentMonth = currentDate.getMonth() === month;
          const isToday = dateStr === toISODate(new Date());
          
          let dayActivities = '';
          const dayIndex = currentDate.getDay();
          atividadesFixas.forEach(a => {
            if (a.dias && a.dias.includes(dayIndex)) {
              dayActivities += `<div class="text-[10px] truncate text-white rounded px-1.5 py-0.5 mt-1 font-medium bg-opacity-90" style="background:${a.cor || '#6366f1'}">${a.nome}</div>`;
            }
          });
          
          if (cronograma && cronograma.blocos) {
            cronograma.blocos.forEach(b => {
              if (b.data === dateStr && b.tipo === 'tarefa') {
                dayActivities += `<div class="text-[10px] truncate text-white rounded px-1.5 py-0.5 mt-1 border border-dashed font-medium" style="border-color:${b.cor || '#f59e0b'}; background:${b.cor || '#f59e0b'}40;">${b.nome}</div>`;
              }
            });
          }

          gridHTML += `
            <div class="flex-1 p-2 border-r border-slate-800 ${isCurrentMonth ? '' : 'bg-slate-900/50'}">
              <div class="text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : (isCurrentMonth ? 'text-slate-300' : 'text-slate-600')}">
                ${currentDate.getDate()}
              </div>
              <div class="space-y-1 overflow-y-auto max-h-[80px] pr-1">
                ${dayActivities}
              </div>
            </div>`;
          currentDate.setDate(currentDate.getDate() + 1);
        }
        gridHTML += '</div>';
      }
      gridHTML += '</div>';
      body.innerHTML = gridHTML;
    },

    /**
     * Vai para a semana atual
     */
    goToToday() {
      currentWeekStart = getMonday(new Date());
      currentDayIndex = 0;
      const today = new Date();
      const diff = Math.floor((today - currentWeekStart) / (1000 * 60 * 60 * 24));
      currentDayIndex = Math.max(0, Math.min(6, diff));
      this.renderCronograma();
    },

    /**
     * Exportar/imprimir cronograma
     */
    handleExport() {
      window.print();
    },

    // === CONFIGURAÇÕES ===
    renderConfiguracoes() {
      const config = Storage.getConfig();
      const form = document.getElementById('config-form');
      if (!form) return;

      form.querySelector('[name="nome"]').value = config.nome || '';
      form.querySelector('[name="acordar"]').value = config.acordar || '06:00';
      form.querySelector('[name="dormir"]').value = config.dormir || '23:00';
      form.querySelector('[name="intervaloMinimo"]').value = config.intervaloMinimo || 15;

      // Marcar dias úteis
      form.querySelectorAll('[name="diasUteis"]').forEach(cb => {
        cb.checked = (config.diasUteis || [1, 2, 3, 4, 5]).includes(parseInt(cb.value));
      });

      // Tema
      const temaToggle = document.getElementById('config-tema-toggle');
      if (temaToggle) {
        temaToggle.checked = (config.tema || 'dark') === 'dark';
      }
    },

    /**
     * Salva configurações
     */
    handleSaveConfig(form) {
      const formData = new FormData(form);
      const nome = formData.get('nome')?.trim() || '';
      const acordar = formData.get('acordar') || '06:00';
      const dormir = formData.get('dormir') || '23:00';
      const intervaloMinimo = parseInt(formData.get('intervaloMinimo')) || 15;

      const diasUteis = [];
      form.querySelectorAll('[name="diasUteis"]:checked').forEach(cb => {
        diasUteis.push(parseInt(cb.value));
      });

      const tema = 'dark';

      Storage.saveConfig({ nome, acordar, dormir, intervaloMinimo, diasUteis, tema });
      this.applyTheme();
      this.showToast('Configurações salvas!', 'success');
    },

    /**
     * Limpa todos os dados
     */
    handleClearData() {
      this.showConfirmation('Isso apagará TODOS os seus dados. Tem certeza?', () => {
        Storage.clearAll();
        this.showToast('Todos os dados foram apagados.', 'success');
        this.renderSection(currentSection);
      });
    },

    /**
     * Exporta dados como JSON
     */
    handleExportData() {
      const data = Storage.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Planograma_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('Dados exportados com sucesso!', 'success');
    },

    /**
     * Importa dados de JSON
     */
    handleImportData() {
      const input = document.getElementById('import-file-input');
      if (input) input.click();
    },

    processImportFile(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const success = Storage.importData(e.target.result);
          if (success) {
            this.showToast('Dados importados com sucesso!', 'success');
            this.renderSection(currentSection);
          } else {
            this.showToast('Erro: arquivo de dados inválido.', 'error');
          }
        } catch (err) {
          this.showToast('Erro ao importar: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    },

    // === TEMA ===
    applyTheme() {
      const html = document.documentElement;
      html.classList.add('dark');
      document.body.classList.remove('bg-gray-50', 'text-gray-900');
      document.body.classList.add('bg-slate-950', 'text-slate-200');
    },

    toggleTheme() {
      // Light mode removed
    },

    // === MODAIS ===
    openModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
      }
    },

    closeModal(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
      }
    },

    closeAllModals() {
      document.querySelectorAll('.modal-overlay').forEach(m => {
        m.classList.add('hidden');
        m.classList.remove('flex');
      });
      document.body.style.overflow = '';
    },

    /**
     * Mostra diálogo de confirmação
     */
    showConfirmation(message, onConfirm) {
      const msgEl = document.getElementById('confirm-message');
      if (msgEl) msgEl.textContent = message;
      confirmCallback = onConfirm;

      const btn = document.getElementById('confirm-ok-btn');
      if (btn) {
        // Remover listeners antigos clonando o botão
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
          if (confirmCallback) confirmCallback();
          this.closeModal('confirm-modal');
          confirmCallback = null;
        });
      }

      this.openModal('confirm-modal');
    },

    // === TOASTS ===
    showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const colors = {
        success: 'bg-green-600 border-green-500',
        error: 'bg-red-600 border-red-500',
        warning: 'bg-amber-600 border-amber-500',
        info: 'bg-brand-600 border-brand-500'
      };
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };

      const toast = document.createElement('div');
      toast.className = `${colors[type] || colors.info} border text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 slide-in-right text-sm`;
      toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span class="flex-1">${message}</span>
        <button class="text-white/70 hover:text-white transition" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
      `;
      container.appendChild(toast);

      // Auto-remover após 4 segundos
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.3s';
          setTimeout(() => toast.remove(), 300);
        }
      }, 4000);
    },

    // === COLOR PICKERS ===
    setupColorPickers() {
      document.querySelectorAll('#color-picker-atividade, #edit-color-picker-atividade').forEach(picker => {
        picker.querySelectorAll('.color-option').forEach(opt => {
          opt.addEventListener('click', function () {
            picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            // Atualizar input hidden
            const form = this.closest('form');
            if (form) {
              const input = form.querySelector('input[name="cor"]');
              if (input) input.value = this.dataset.color;
            }
          });
        });
      });
    },

    // === UTILIDADES PÚBLICAS ===
    formatDate,
    formatTime(timeStr) { return timeStr || ''; },
    getPriorityBadge,
    getCurrentSection() { return currentSection; },
    getCurrentWeekStart() { return currentWeekStart; },
  };

  // Expor globalmente
  window.UI = UI;
})();
