/**
 * Módulo de Gerenciamento de Armazenamento Local (localStorage)
 * App: Planograma
 * Responsável por gerenciar a persistência de dados no navegador.
 */

(function() {
  const PREFIX = 'Planograna_';
  const KEYS = {
    CONFIG: PREFIX + 'config',
    ATIVIDADES: PREFIX + 'atividades_fixas',
    TAREFAS: PREFIX + 'tarefas',
    CRONOGRAMA: PREFIX + 'cronograma',
    POSTITS: PREFIX + 'postits'
  };

  const listeners = [];

  const Storage = {
    // === EVENTOS ===
    /**
     * Registra um callback para ser chamado quando os dados mudarem.
     * @param {Function} callback 
     */
    onChange(callback) {
      if (typeof callback === 'function') {
        listeners.push(callback);
      }
    },

    /**
     * Notifica todos os ouvintes registrados sobre uma mudança.
     */
    _notify(area) {
      listeners.forEach(callback => callback(area));
    },

    // Funções utilitárias internas
    _getItem(key, defaultValue) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error(`Erro ao ler ${key} do localStorage:`, e);
        return defaultValue;
      }
    },

    _setItem(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Erro ao salvar ${key} no localStorage:`, e);
        throw new Error('Não foi possível salvar os dados no navegador. Verifique o espaço disponível e tente novamente.');
      }
    },

    _generateId(prefix) {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    },

    // === CONFIGURAÇÕES DO USUÁRIO ===
    /**
     * Retorna o objeto de configuração do usuário.
     * @returns {Object}
     */
    getConfig() {
      const defaultConfig = {
        nome: '',
        acordar: '06:00',
        dormir: '23:00',
        diasUteis: [1, 2, 3, 4, 5],
        intervaloMinimo: 15,
        tema: 'dark'
      };
      const config = this._getItem(KEYS.CONFIG, {});
      return { ...defaultConfig, ...config };
    },

    /**
     * Salva o objeto de configuração do usuário.
     * @param {Object} config 
     */
    saveConfig(config) {
      if (!config || typeof config !== 'object') {
        throw new Error('Configuração inválida.');
      }
      this._setItem(KEYS.CONFIG, { ...this.getConfig(), ...config });
      this._notify('config');
    },

    // === ATIVIDADES RECORRENTES ===
    /**
     * Retorna o array de atividades recorrentes.
     * @returns {Array}
     */
    getAtividadesFixas() {
      return this._getItem(KEYS.ATIVIDADES, []);
    },

    /**
     * Adiciona uma nova atividade recorrente.
     * @param {Object} atividade 
     * @returns {Object} Atividade com id gerado
     */
    addAtividadeFixa(atividade) {
      if (!atividade.nome || !atividade.horaInicio || !atividade.horaFim || !Array.isArray(atividade.dias)) {
        throw new Error('Dados da atividade recorrente incompletos ou inválidos.');
      }
      const atividades = this.getAtividadesFixas();
      const novaAtividade = {
        ...atividade,
        id: this._generateId('af'),
        criadoEm: new Date().toISOString()
      };
      atividades.push(novaAtividade);
      this._setItem(KEYS.ATIVIDADES, atividades);
      this._notify('atividades');
      return novaAtividade;
    },

    /**
     * Atualiza uma atividade recorrente existente.
     * @param {string} id 
     * @param {Object} data 
     */
    updateAtividadeFixa(id, data) {
      const atividades = this.getAtividadesFixas();
      const index = atividades.findIndex(a => a.id === id);
      if (index !== -1) {
        atividades[index] = { ...atividades[index], ...data };
        this._setItem(KEYS.ATIVIDADES, atividades);
        this._notify('atividades');
      } else {
        throw new Error('Atividade Recorrente não encontrada.');
      }
    },

    /**
     * Remove uma atividade recorrente pelo id.
     * @param {string} id 
     */
    deleteAtividadeFixa(id) {
      const atividades = this.getAtividadesFixas();
      const novaLista = atividades.filter(a => a.id !== id);
      if (atividades.length !== novaLista.length) {
        this._setItem(KEYS.ATIVIDADES, novaLista);
        this._notify('atividades');
      }
    },

    // === TAREFAS ===
    /**
     * Retorna o array de tarefas.
     * @returns {Array}
     */
    getTarefas() {
      return this._getItem(KEYS.TAREFAS, []);
    },

    /**
     * Adiciona uma nova tarefa.
     * @param {Object} tarefa 
     * @returns {Object} Tarefa com id gerado
     */
    addTarefa(tarefa) {
      if (!tarefa.nome || typeof tarefa.duracao !== 'number') {
        throw new Error('Dados da tarefa incompletos ou inválidos.');
      }
      const tarefas = this.getTarefas();
      const novaTarefa = {
        descricao: '',
        prioridade: 'media',
        prazo: '',
        categoria: 'outro',
        divisivel: true,
        ...tarefa,
        concluida: false,
        id: this._generateId('tf'),
        criadoEm: new Date().toISOString()
      };
      tarefas.push(novaTarefa);
      this._setItem(KEYS.TAREFAS, tarefas);
      this._notify('tarefas');
      return novaTarefa;
    },

    /**
     * Atualiza uma tarefa existente.
     * @param {string} id 
     * @param {Object} data 
     */
    updateTarefa(id, data) {
      const tarefas = this.getTarefas();
      const index = tarefas.findIndex(t => t.id === id);
      if (index !== -1) {
        tarefas[index] = { ...tarefas[index], ...data };
        this._setItem(KEYS.TAREFAS, tarefas);
        this._notify('tarefas');
      } else {
        throw new Error('Tarefa não encontrada.');
      }
    },

    /**
     * Remove uma tarefa pelo id.
     * @param {string} id 
     */
    deleteTarefa(id) {
      const tarefas = this.getTarefas();
      const novaLista = tarefas.filter(t => t.id !== id);
      if (tarefas.length !== novaLista.length) {
        this._setItem(KEYS.TAREFAS, novaLista);
        this._notify('tarefas');
      }
    },

    /**
     * Alterna o status de conclusão de uma tarefa.
     * @param {string} id 
     */
    toggleTarefaConcluida(id) {
      const tarefas = this.getTarefas();
      const index = tarefas.findIndex(t => t.id === id);
      if (index !== -1) {
        tarefas[index].concluida = !tarefas[index].concluida;
        this._setItem(KEYS.TAREFAS, tarefas);
        this._notify('tarefas');
      } else {
        throw new Error('Tarefa não encontrada.');
      }
    },

    // === CRONOGRAMA GERADO ===
    /**
     * Retorna o cronograma gerado ou null se não houver.
     * @returns {Object|null}
     */
    getCronograma() {
      return this._getItem(KEYS.CRONOGRAMA, null);
    },

    /**
     * Salva o cronograma gerado.
     * @param {Object} cronograma 
     */
    saveCronograma(cronograma) {
      if (!cronograma || !cronograma.semanaInicio || !Array.isArray(cronograma.blocos)) {
        throw new Error('Formato de cronograma inválido.');
      }
      const novoCronograma = {
        ...cronograma,
        geradoEm: new Date().toISOString()
      };
      this._setItem(KEYS.CRONOGRAMA, novoCronograma);
      this._notify('cronograma');
    },

    // === POST-ITS DOS EVENTOS ===
    getPostits() {
      const postits = this._getItem(KEYS.POSTITS, []);
      if (!Array.isArray(postits)) return [];
      return postits.filter(postit => postit && typeof postit.id === 'string' && typeof postit.eventoId === 'string')
        .map(postit => ({
          ...postit,
          texto: typeof postit.texto === 'string' ? postit.texto.slice(0, 500) : '',
          cor: /^#[0-9a-f]{6}$/i.test(postit.cor || '') ? postit.cor : '#fef08a'
        }));
    },

    getPostitsDoEvento(eventoId) {
      return this.getPostits().filter(postit => postit.eventoId === eventoId)
        .sort((a, b) => (Number(a.ordem) || 0) - (Number(b.ordem) || 0));
    },

    addPostit(postit) {
      if (!postit || typeof postit.eventoId !== 'string' || !postit.eventoId) {
        throw new Error('Evento inválido para o post-it.');
      }
      const novoPostit = {
        id: this._generateId('postit'),
        eventoId: postit.eventoId,
        texto: typeof postit.texto === 'string' ? postit.texto.slice(0, 500) : '',
        cor: /^#[0-9a-f]{6}$/i.test(postit.cor || '') ? postit.cor : '#fef08a',
        ordem: this.getPostitsDoEvento(postit.eventoId).length,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };
      const postits = this.getPostits();
      postits.push(novoPostit);
      this._setItem(KEYS.POSTITS, postits);
      this._notify('postits');
      return novoPostit;
    },

    updatePostit(id, data) {
      const postits = this.getPostits();
      const index = postits.findIndex(postit => postit.id === id);
      if (index === -1) throw new Error('Post-it não encontrado.');
      const atualizacao = {};
      if (typeof data.texto === 'string') atualizacao.texto = data.texto.slice(0, 500);
      if (typeof data.cor === 'string' && /^#[0-9a-f]{6}$/i.test(data.cor)) atualizacao.cor = data.cor;
      postits[index] = { ...postits[index], ...atualizacao, atualizadoEm: new Date().toISOString() };
      this._setItem(KEYS.POSTITS, postits);
      this._notify('postits');
      return postits[index];
    },

    deletePostit(id) {
      const postits = this.getPostits();
      const novaLista = postits.filter(postit => postit.id !== id);
      if (novaLista.length !== postits.length) {
        this._setItem(KEYS.POSTITS, novaLista);
        this._notify('postits');
      }
    },

    reorderPostits(eventoId, orderedIds) {
      if (!Array.isArray(orderedIds)) return;
      const ordemPorId = new Map(orderedIds.map((id, index) => [id, index]));
      const postits = this.getPostits().map(postit => postit.eventoId === eventoId && ordemPorId.has(postit.id)
        ? { ...postit, ordem: ordemPorId.get(postit.id), atualizadoEm: new Date().toISOString() }
        : postit);
      this._setItem(KEYS.POSTITS, postits);
      this._notify('postits');
    },

    // === UTILIDADES ===
    /**
     * Exporta todos os dados como uma string JSON.
     * @returns {string}
     */
    exportData() {
      const data = {
        config: this.getConfig(),
        atividadesFixas: this.getAtividadesFixas(),
        tarefas: this.getTarefas(),
        cronograma: this.getCronograma(),
        postits: this.getPostits()
      };
      return JSON.stringify(data);
    },

    /**
     * Importa dados a partir de uma string JSON, validando a estrutura.
     * @param {string} jsonString 
     */
    importData(jsonString) {
      try {
        const data = JSON.parse(jsonString);
        
        // Validação mínima para garantir que é um objeto de exportação válido
        if (typeof data !== 'object' || data === null) {
          throw new Error('Formato inválido');
        }

        if (data.config) this._setItem(KEYS.CONFIG, data.config);
        if (Array.isArray(data.atividadesFixas)) this._setItem(KEYS.ATIVIDADES, data.atividadesFixas);
        if (Array.isArray(data.tarefas)) this._setItem(KEYS.TAREFAS, data.tarefas);
        if (data.cronograma) this._setItem(KEYS.CRONOGRAMA, data.cronograma);
        if (Array.isArray(data.postits)) this._setItem(KEYS.POSTITS, data.postits);
        
        this._notify('all');
      } catch (e) {
        console.error(e);
        throw new Error('Falha ao importar dados. O formato do arquivo é inválido ou corrompido.');
      }
    },

    /**
     * Limpa todos os dados armazenados, resetando o app.
     */
    clearAll() {
      localStorage.removeItem(KEYS.CONFIG);
      localStorage.removeItem(KEYS.ATIVIDADES);
      localStorage.removeItem(KEYS.TAREFAS);
      localStorage.removeItem(KEYS.CRONOGRAMA);
      localStorage.removeItem(KEYS.POSTITS);
      this._notify('all');
    }
  };

  // Expõe o objeto globalmente
  window.Storage = Storage;

})();
