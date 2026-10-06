// === Planograna - Módulo Principal ===
// Inicializa a aplicação e conecta todos os módulos

(function () {
  'use strict';

  const App = {
    /**
     * Inicializa a aplicação
     */
    init() {
      try {
        console.log('Inicializando Planograna...');

        // 1. Inicializar módulo UI
        if (window.UI) UI.init();

        // 2. Configurar event listeners
        this.setupEventListeners();

        // 3. Tratar primeira visita
        this.handleFirstVisit();

        // 4. Tratar rotas baseadas na URL atual (hash)
        this.handleRouting();

        // 5. Atualizar interface com dados armazenados
        this.refreshAll();

        // 6. Ocultar tela de carregamento
        this.hideLoadingScreen();

        console.log('Planograna inicializado com sucesso.');
      } catch (error) {
        console.error('Erro na inicialização:', error);
        if (window.UI) {
          UI.showToast('Erro ao inicializar a aplicação.', 'error');
        }
      }
    },

    /**
     * Oculta a tela de carregamento
     */
    hideLoadingScreen() {
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.4s ease-out';
        setTimeout(() => {
          loadingScreen.style.display = 'none';
        }, 400);
      }
    },

    /**
     * Configura todos os event listeners
     */
    setupEventListeners() {
      // === DELEGAÇÃO DE CLIQUES NO BODY ===
      document.body.addEventListener('click', (e) => {
        try {
          // Navegação da sidebar
          if (e.target.closest('[data-nav]')) {
            e.preventDefault();
            const nav = e.target.closest('[data-nav]');
            const targetSection = nav.getAttribute('data-nav');
            window.location.hash = targetSection;
          }

          // Alternar menu lateral (mobile)
          if (e.target.closest('#menu-toggle') || e.target.closest('.mobile-menu-btn')) {
            if (window.UI) UI.toggleSidebar();
          }

          // Toggle de tema
          if (e.target.closest('#btn-theme-toggle')) {
            if (window.UI) UI.toggleTheme();
          }

          // Gerar Cronograma
          if (e.target.closest('#btn-gerar-cronograma')) {
            if (window.UI) UI.handleGerarCronograma();
          }

          // Exportar/Imprimir Cronograma
          if (e.target.closest('#btn-export-cronograma')) {
            if (window.UI) UI.handleExport();
          }

          // Exportar para ICS (mês inteiro)
          if (e.target.closest('#btn-export-ics')) {
            if (window.generateICS) {
              window.generateICS();
              if (window.UI) UI.showToast('Mês inteiro exportado para .ics!', 'success');
            }
          }

          // Navegação de semana
          if (e.target.closest('#btn-prev-week')) {
            if (window.UI) UI.navigateWeek(-1);
          }
          if (e.target.closest('#btn-next-week')) {
            if (window.UI) UI.navigateWeek(1);
          }
          if (e.target.closest('#btn-today')) {
            if (window.UI) UI.goToToday();
          }

          // Alternar visão semanal/diária
          if (e.target.closest('#btn-view-semanal')) {
            if (window.UI) UI.toggleView('semanal');
          }
          if (e.target.closest('#btn-view-diario')) {
            if (window.UI) UI.toggleView('diario');
          }
          if (e.target.closest('#btn-view-mensal')) {
            if (window.UI) UI.toggleView('mensal');
          }

          // Exportar dados
          if (e.target.closest('#btn-export-data')) {
            if (window.UI) UI.handleExportData();
          }

          // Importar dados
          if (e.target.closest('#btn-import-data')) {
            if (window.UI) UI.handleImportData();
          }

          // Carregar dados de exemplo
          if (e.target.closest('#btn-load-sample')) {
            this.loadSampleData();
          }

          // Limpar dados
          if (e.target.closest('#btn-clear-data')) {
            if (window.UI) UI.handleClearData();
          }

        } catch (error) {
          console.error('Erro no processamento do clique:', error);
          if (window.UI) UI.showToast('Ocorreu um erro ao processar a ação.', 'error');
        }
      });

      // === SUBMISSÃO DE FORMULÁRIOS ===
      document.body.addEventListener('submit', (e) => {
        try {
          e.preventDefault();

          // Formulário de Atividade Recorrente
          if (e.target.id === 'atividade-form') {
            if (window.UI) UI.handleAddAtividade(e.target);
          }

          // Formulário de Tarefa
          if (e.target.id === 'tarefa-form') {
            if (window.UI) UI.handleAddTarefa(e.target);
          }

          // Formulário de Edição de Atividade
          if (e.target.id === 'edit-atividade-form') {
            if (window.UI) UI.handleEditAtividade(e.target);
          }

          // Formulário de Edição de Tarefa
          if (e.target.id === 'edit-tarefa-form') {
            if (window.UI) UI.handleEditTarefa(e.target);
          }

          // Formulário de Configurações
          if (e.target.id === 'config-form') {
            if (window.UI) UI.handleSaveConfig(e.target);
          }

          // Formulário de Boas-vindas
          if (e.target.id === 'welcome-form') {
            const nome = new FormData(e.target).get('nome')?.trim() || 'Usuário';
            const config = Storage.getConfig();
            config.nome = nome;
            Storage.saveConfig(config);
            UI.closeModal('welcome-modal');
            UI.showToast(`Bem-vindo(a), ${nome}! 🎉`, 'success');
            this.refreshAll();
          }

        } catch (error) {
          console.error('Erro ao submeter formulário:', error);
          if (window.UI) UI.showToast('Erro ao processar formulário.', 'error');
        }
      });

      // === FILTROS E ORDENAÇÃO DE TAREFAS ===
      ['filter-prioridade', 'filter-status', 'sort-tarefas'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('change', () => {
            if (window.UI) UI.renderTarefas();
          });
        }
      });

      // === IMPORTAÇÃO DE ARQUIVO ===
      const importInput = document.getElementById('import-file-input');
      if (importInput) {
        importInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            if (window.UI) UI.processImportFile(e.target.files[0]);
            e.target.value = ''; // Resetar para permitir reimportação
          }
        });
      }

      // === HASH CHANGE (Navegação) ===
      window.addEventListener('hashchange', () => {
        this.handleRouting();
      });

      // === ATALHOS DE TECLADO ===
      document.addEventListener('keydown', (e) => {
        this.handleKeyboardShortcuts(e);
      });

      // === SINCRONIZAÇÃO ENTRE ABAS ===
      window.addEventListener('storage', () => {
        this.refreshAll();
      });

      // === ATUALIZAR DADOS QUANDO STORAGE MUDA ===
      if (window.Storage) {
        Storage.onChange(() => {
          // Atualizar seção atual se não for a que disparou a mudança
        });
      }
    },

    /**
     * Trata rotas baseadas no hash da URL
     */
    handleRouting() {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      const validSections = ['dashboard', 'atividades-fixas', 'tarefas', 'cronograma', 'configuracoes'];
      const section = validSections.includes(hash) ? hash : 'dashboard';
      if (window.UI) UI.navigateTo(section);
    },

    /**
     * Trata primeira visita do usuário
     */
    handleFirstVisit() {
      const config = Storage.getConfig();
      if (!config.nome && !localStorage.getItem('Planograna_config')) {
        // Primeira visita - mostrar modal de boas-vindas
        setTimeout(() => {
          if (window.UI) UI.openModal('welcome-modal');
        }, 500);
      }
    },

    /**
     * Atualiza todos os dados na tela
     */
    refreshAll() {
      if (window.UI) {
        const section = UI.getCurrentSection ? UI.getCurrentSection() : 'dashboard';
        UI.renderSection(section);
      }
    },

    /**
     * Trata atalhos de teclado
     */
    handleKeyboardShortcuts(e) {
      // Escape: fechar qualquer modal aberto
      if (e.key === 'Escape') {
        if (window.UI) UI.closeAllModals();
      }

      // Ctrl+N: ir para adicionar tarefa
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        window.location.hash = 'tarefas';
      }

      // Ctrl+G: gerar cronograma
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        window.location.hash = 'cronograma';
        setTimeout(() => {
          if (window.UI) UI.handleGerarCronograma();
        }, 300);
      }

      // Ctrl+1 a 5: navegação rápida
      if (e.ctrlKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        const sections = ['dashboard', 'atividades-fixas', 'tarefas', 'cronograma', 'configuracoes'];
        const idx = parseInt(e.key) - 1;
        window.location.hash = sections[idx];
      }
    },

    /**
     * Carrega dados de exemplo para demonstração
     */
    loadSampleData() {
      UI.showConfirmation('Isso adicionará dados de exemplo. Deseja continuar?', () => {
        try {
          // Atividades Recorrentes de exemplo
          Storage.addAtividadeFixa({
            nome: 'Trabalho',
            categoria: 'trabalho',
            dias: [1, 2, 3, 4, 5],
            horaInicio: '08:00',
            horaFim: '17:00',
            cor: '#6366f1'
          });

          Storage.addAtividadeFixa({
            nome: 'Faculdade',
            categoria: 'faculdade',
            dias: [1, 3, 5],
            horaInicio: '19:00',
            horaFim: '22:30',
            cor: '#ec4899'
          });

          Storage.addAtividadeFixa({
            nome: 'Academia',
            categoria: 'esporte',
            dias: [2, 4],
            horaInicio: '06:00',
            horaFim: '07:00',
            cor: '#22c55e'
          });

          // Tarefas de exemplo
          Storage.addTarefa({
            nome: 'Estudar Cálculo',
            descricao: 'Capítulos 1-5 do livro, foco em derivadas',
            prioridade: 'alta',
            duracao: 120,
            prazo: '2026-10-12',
            categoria: 'estudo',
            divisivel: true
          });

          Storage.addTarefa({
            nome: 'Relatório do Projeto',
            descricao: 'Finalizar relatório de progresso do projeto final',
            prioridade: 'alta',
            duracao: 90,
            prazo: '2026-10-10',
            categoria: 'projeto',
            divisivel: false
          });

          Storage.addTarefa({
            nome: 'Ler Artigo Científico',
            descricao: 'Artigo sobre inteligência artificial aplicada',
            prioridade: 'media',
            duracao: 45,
            prazo: '2026-10-15',
            categoria: 'estudo',
            divisivel: false
          });

          Storage.addTarefa({
            nome: 'Organizar Notas',
            descricao: 'Reorganizar caderno digital de anotações',
            prioridade: 'baixa',
            duracao: 30,
            prazo: '',
            categoria: 'pessoal',
            divisivel: false
          });

          Storage.addTarefa({
            nome: 'Preparar Apresentação',
            descricao: 'Slides para seminário de quarta-feira',
            prioridade: 'alta',
            duracao: 60,
            prazo: '2026-10-08',
            categoria: 'projeto',
            divisivel: true
          });

          Storage.addTarefa({
            nome: 'Exercícios de Programação',
            descricao: 'Lista 3 de exercícios de algoritmos',
            prioridade: 'media',
            duracao: 60,
            prazo: '2026-10-14',
            categoria: 'estudo',
            divisivel: true
          });

          UI.showToast('Dados de exemplo carregados com sucesso! 🎉', 'success');
          this.refreshAll();
        } catch (error) {
          console.error('Erro ao carregar dados de exemplo:', error);
          UI.showToast('Erro ao carregar dados de exemplo.', 'error');
        }
      });
    }
  };

  // Inicializar quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', () => App.init());

  // Expor para debugging
  window.App = App;
})();
