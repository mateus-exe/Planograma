/**
 * scheduler.js
 * Algoritmo central de geração de cronograma para o 'Planograma'
 */

/**
 * Utilitários para manipulação de tempo e datas
 */
const TimeUtils = {
  /**
   * Converte um horário 'HH:MM' para minutos desde a meia-noite
   * @param {string} timeStr - Horário no formato 'HH:MM'
   * @returns {number} Minutos totais desde a meia-noite
   */
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  },

  /**
   * Converte minutos desde a meia-noite para uma string de horário 'HH:MM'
   * @param {number} minutes - Minutos totais
   * @returns {string} Horário formatado em 'HH:MM'
   */
  minutesToTime(minutes) {
    // Normalizar para lidar com tempos além das 24h
    const normalizedMinutes = minutes % (24 * 60);
    const h = Math.floor(normalizedMinutes / 60);
    const m = normalizedMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  },

  /**
   * Retorna um array com 7 strings de data no formato ISO para a semana correspondente
   * @param {string} mondayDate - Data ISO da segunda-feira
   * @returns {string[]} Array de 7 strings de data (YYYY-MM-DD)
   */
  getWeekDates(mondayDate) {
    const base = new Date(`${mondayDate}T12:00:00`); // Previne problemas de timezone
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(base);
      current.setDate(base.getDate() + i);
      dates.push(current.toISOString().split('T')[0]);
    }
    return dates;
  },

  /**
   * Retorna o dia da semana numérico a partir da data
   * (0=Domingo, 1=Segunda, ..., 6=Sábado)
   * @param {string} dateStr - Data no formato YYYY-MM-DD
   * @returns {number} Dia da semana (0-6)
   */
  getDayOfWeek(dateStr) {
    const date = new Date(`${dateStr}T12:00:00`);
    return date.getDay();
  }
};

window.Scheduler = {
  /**
   * Gera um cronograma semanal baseado nas atividades recorrentes e tarefas pendentes
   * @param {Object} config - Configurações do usuário (acordar, dormir, diasUteis, intervaloMinimo)
   * @param {Array} atividadesFixas - Array de atividades recorrentes configuradas
   * @param {Array} tarefas - Array de tarefas pendentes
   * @param {string} semanaInicio - String de data (ISO) da segunda-feira da semana
   * @returns {Object} Objeto do cronograma gerado contendo os blocos agendados e estatísticas
   */
  gerarCronograma(config, atividadesFixas, tarefas, semanaInicio) {
    const datasSemana = TimeUtils.getWeekDates(semanaInicio);
    const blocos = []; 
    const naoAgendadas = [];

    // Configurações padrão caso ausentes
    const intervaloMinimo = config.intervaloMinimo || 0;
    const acordar = config.acordar || '08:00';
    const dormir = config.dormir || '22:00';

    // 1. Construir a grade da semana com as atividades recorrentes
    const ocupadosPorDia = {};
    datasSemana.forEach(dataStr => {
      ocupadosPorDia[dataStr] = [];
      const diaDaSemana = TimeUtils.getDayOfWeek(dataStr);

      atividadesFixas.forEach(atividade => {
        // Verifica se a atividade recorrente ocorre neste dia
        if (atividade.dias && atividade.dias.includes(diaDaSemana)) {
          const blocoFixa = {
            id: `fixa_${atividade.id}_${dataStr}`,
            tipo: 'fixa',
            nome: atividade.nome,
            cor: atividade.cor || '#cbd5e1',
            data: dataStr,
            dia: diaDaSemana,
            horaInicio: atividade.horaInicio,
            horaFim: atividade.horaFim,
            descricao: atividade.descricao || ''
          };
          blocos.push(blocoFixa);

          ocupadosPorDia[dataStr].push({
            inicio: TimeUtils.timeToMinutes(atividade.horaInicio),
            fim: TimeUtils.timeToMinutes(atividade.horaFim)
          });
        }
      });
    });

    // 2. Ordenar tarefas por prioridade, prazo e duração
    const pesosPrioridade = { alta: 3, media: 2, baixa: 1 };

    const tarefasOrdenadas = [...tarefas].filter(t => !t.concluida).sort((a, b) => {
      const pesoA = pesosPrioridade[a.prioridade] || 1;
      const pesoB = pesosPrioridade[b.prioridade] || 1;

      // Ordenação primária: Prioridade
      if (pesoA !== pesoB) {
        return pesoB - pesoA;
      }

      // Ordenação secundária: Prazo mais próximo (earliest deadline first)
      if (a.prazo && b.prazo) {
        return new Date(a.prazo).getTime() - new Date(b.prazo).getTime();
      } else if (a.prazo) {
        return -1;
      } else if (b.prazo) {
        return 1;
      }

      // Ordenação terciária: Duração mais curta primeiro (encaixa melhor)
      return a.duracao - b.duracao;
    });

    // 3. Alocar as tarefas nos slots livres
    for (const tarefa of tarefasOrdenadas) {
      let duracaoRestante = tarefa.duracao;
      const blocosAlocadosTemp = [];
      let sucessoNaAlocacao = false;

      // Filtrar dias possíveis considerando prazo
      const prazoTime = tarefa.prazo ? new Date(`${tarefa.prazo}T23:59:59`).getTime() : Infinity;
      const diasPossiveis = datasSemana.filter((dataStr) => {
        const dateTime = new Date(`${dataStr}T00:00:00`).getTime();
        return dateTime <= prazoTime;
      });

      // Balanceamento de carga: ordenar dias pelo total de minutos já ocupados (crescente)
      // Isso distribui as tarefas entre os dias, evitando sobrecarregar um único dia.
      diasPossiveis.sort((a, b) => {
        const cargaA = this.calcularMinutosOcupados(ocupadosPorDia[a] || []);
        const cargaB = this.calcularMinutosOcupados(ocupadosPorDia[b] || []);

        // Se config.diasUteis estiver ativo, penalizar fins de semana na ordenação
        if (config.diasUteis) {
          const diaA = TimeUtils.getDayOfWeek(a);
          const diaB = TimeUtils.getDayOfWeek(b);
          const isAFimSemana = diaA === 0 || diaA === 6;
          const isBFimSemana = diaB === 0 || diaB === 6;
          if (isAFimSemana && !isBFimSemana) return 1;
          if (!isAFimSemana && isBFimSemana) return -1;
        }

        return cargaA - cargaB;
      });

      if (tarefa.divisivel) {
        // Tentar dividir em blocos de no mínimo 30 min ou o tempo restante se for menor
        for (const dataStr of diasPossiveis) {
          if (duracaoRestante <= 0) break;

          const slotsLivres = this.encontrarSlotsLivres(ocupadosPorDia[dataStr], acordar, dormir, intervaloMinimo);
          
          for (const slot of slotsLivres) {
            if (duracaoRestante <= 0) break;

            const blocoMinimo = Math.min(30, duracaoRestante);

            if (slot.duracaoMinutos >= blocoMinimo) {
              const tempoAlocado = Math.min(duracaoRestante, slot.duracaoMinutos);
              
              const novoBloco = {
                data: dataStr,
                inicioMin: slot.inicioMin,
                fimMin: slot.inicioMin + tempoAlocado
              };
              
              blocosAlocadosTemp.push(novoBloco);
              ocupadosPorDia[dataStr].push({ inicio: novoBloco.inicioMin, fim: novoBloco.fimMin });
              duracaoRestante -= tempoAlocado;
            }
          }
        }
        
        if (duracaoRestante === 0) {
          sucessoNaAlocacao = true;
        }

      } else {
        // Tarefas não divisíveis: achar um único slot inteiro
        for (const dataStr of diasPossiveis) {
          if (sucessoNaAlocacao) break;

          const slotsLivres = this.encontrarSlotsLivres(ocupadosPorDia[dataStr], acordar, dormir, intervaloMinimo);
          const slotApto = slotsLivres.find(s => s.duracaoMinutos >= duracaoRestante);

          if (slotApto) {
            const novoBloco = {
              data: dataStr,
              inicioMin: slotApto.inicioMin,
              fimMin: slotApto.inicioMin + duracaoRestante
            };
            blocosAlocadosTemp.push(novoBloco);
            ocupadosPorDia[dataStr].push({ inicio: novoBloco.inicioMin, fim: novoBloco.fimMin });
            sucessoNaAlocacao = true;
            duracaoRestante = 0;
          }
        }
      }

      // Finalizando alocação ou revertendo
      if (sucessoNaAlocacao) {
        blocosAlocadosTemp.forEach((alocado, index) => {
          const sufixoDivisivel = (tarefa.divisivel && blocosAlocadosTemp.length > 1) ? ` (Parte ${index + 1}/${blocosAlocadosTemp.length})` : '';
          
          blocos.push({
            id: `tarefa_${tarefa.id}_${alocado.data}_${index}`,
            tarefaId: tarefa.id,
            tipo: 'tarefa',
            nome: tarefa.nome + sufixoDivisivel,
            cor: tarefa.cor || '#3b82f6',
            data: alocado.data,
            dia: TimeUtils.getDayOfWeek(alocado.data),
            horaInicio: TimeUtils.minutesToTime(alocado.inicioMin),
            horaFim: TimeUtils.minutesToTime(alocado.fimMin),
            descricao: tarefa.descricao || ''
          });
        });
      } else {
        // Reverter ocupações parciais do dia
        blocosAlocadosTemp.forEach(alocado => {
          ocupadosPorDia[alocado.data] = ocupadosPorDia[alocado.data].filter(
            b => !(b.inicio === alocado.inicioMin && b.fim === alocado.fimMin)
          );
        });

        naoAgendadas.push({
          tarefa,
          motivo: 'Não há blocos de tempo livres suficientes antes do prazo da tarefa.'
        });
      }
    }

    return {
      semanaInicio,
      blocos,
      naoAgendadas,
      estatisticas: this.getEstatisticas(blocos, tarefas)
    };
  },

  /**
   * Calcula o total de minutos ocupados em um dia com base nos blocos já alocados
   * @param {Array} blocosOcupados - Blocos já agendados. Formato: [{inicio: number, fim: number}]
   * @returns {number} Total de minutos ocupados
   */
  calcularMinutosOcupados(blocosOcupados) {
    return (blocosOcupados || []).reduce((total, bloco) => total + Math.max(0, bloco.fim - bloco.inicio), 0);
  },

  /**
   * Encontra todos os slots livres em um dia específico, considerando ocupações
   * @param {Array} blocosOcupados - Blocos já agendados naquele dia. Formato: [{inicio: number, fim: number}]
   * @param {string} acordar - Horário de acordar (ex: '08:00')
   * @param {string} dormir - Horário de dormir (ex: '22:00')
   * @param {number} intervaloMinimo - Intervalo mínimo entre as atividades (em minutos)
   * @returns {Array} Array de slots livres { inicio: 'HH:MM', fim: 'HH:MM', duracaoMinutos: number, inicioMin: number, fimMin: number }
   */
  encontrarSlotsLivres(blocosOcupados, acordar, dormir, intervaloMinimo) {
    const inicioDia = TimeUtils.timeToMinutes(acordar);
    let fimDia = TimeUtils.timeToMinutes(dormir);
    
    // Tratar caso a hora de dormir seja após a meia-noite
    if (fimDia <= inicioDia) {
      fimDia += 24 * 60;
    }

    const ocupadosOrdenados = [...(blocosOcupados || [])].sort((a, b) => a.inicio - b.inicio);
    const slotsLivres = [];
    let tempoAtual = inicioDia;

    for (const bloco of ocupadosOrdenados) {
      // Se há espaço antes do próximo bloco começar
      if (bloco.inicio > tempoAtual) {
        const espacoDisponivel = bloco.inicio - tempoAtual;
        
        // Deixamos um intervalo livre antes de iniciar o próximo bloco fixado
        if (espacoDisponivel > intervaloMinimo) {
          slotsLivres.push({
            inicio: TimeUtils.minutesToTime(tempoAtual),
            fim: TimeUtils.minutesToTime(bloco.inicio - intervaloMinimo),
            inicioMin: tempoAtual,
            fimMin: bloco.inicio - intervaloMinimo,
            duracaoMinutos: espacoDisponivel - intervaloMinimo
          });
        }
      }
      // O próximo tempo disponível será após este bloco + o intervalo de descanso obrigatório
      tempoAtual = Math.max(tempoAtual, bloco.fim + intervaloMinimo);
    }

    // Calcular o espaço restante até a hora de dormir
    if (tempoAtual < fimDia) {
      slotsLivres.push({
        inicio: TimeUtils.minutesToTime(tempoAtual),
        fim: TimeUtils.minutesToTime(fimDia),
        inicioMin: tempoAtual,
        fimMin: fimDia,
        duracaoMinutos: fimDia - tempoAtual
      });
    }

    return slotsLivres;
  },

  /**
   * Verifica se há conflito de tempo entre dois blocos
   * @param {Object} bloco1 - Objeto com inicio e fim ('HH:MM')
   * @param {Object} bloco2 - Objeto com inicio e fim ('HH:MM')
   * @returns {boolean} Verdadeiro se sobrepõem
   */
  verificarConflito(bloco1, bloco2) {
    const i1 = TimeUtils.timeToMinutes(bloco1.horaInicio);
    const f1 = TimeUtils.timeToMinutes(bloco1.horaFim);
    const i2 = TimeUtils.timeToMinutes(bloco2.horaInicio);
    const f2 = TimeUtils.timeToMinutes(bloco2.horaFim);

    return i1 < f2 && i2 < f1;
  },

  /**
   * Calcula as horas totais livres disponíveis em um determinado dia
   * @param {string} dia - Data formato YYYY-MM-DD
   * @param {Array} atividadesFixas - Atividades recorrentes para descontar
   * @param {Object} config - Configurações do usuário
   * @returns {number} Horas livres como ponto flutuante
   */
  calcularHorasLivres(dia, atividadesFixas, config) {
    const diaDaSemana = TimeUtils.getDayOfWeek(dia);
    const ocupadosDia = [];

    atividadesFixas.forEach(atividade => {
      if (atividade.dias && atividade.dias.includes(diaDaSemana)) {
        ocupadosDia.push({
          inicio: TimeUtils.timeToMinutes(atividade.horaInicio),
          fim: TimeUtils.timeToMinutes(atividade.horaFim)
        });
      }
    });

    const intervalo = config.intervaloMinimo || 0;
    const slotsLivres = this.encontrarSlotsLivres(ocupadosDia, config.acordar, config.dormir, intervalo);
    
    const minutosTotaisLivres = slotsLivres.reduce((acc, slot) => acc + slot.duracaoMinutos, 0);
    return minutosTotaisLivres / 60;
  },

  /**
   * Retorna um resumo estatístico do cronograma gerado
   * @param {Array} blocos - Lista de todos os blocos agendados
   * @param {Array} tarefas - Lista de todas as tarefas pendentes
   * @returns {Object} Estatísticas gerais
   */
  getEstatisticas(blocos, tarefas) {
    const blocosTarefas = blocos.filter(b => b.tipo === 'tarefa');
    
    // Contar IDs únicos de tarefas agendadas
    const idsAgendados = new Set(blocosTarefas.map(b => b.tarefaId));
    
    const totalMinutosAlocados = blocosTarefas.reduce((total, bloco) => {
      return total + (TimeUtils.timeToMinutes(bloco.horaFim) - TimeUtils.timeToMinutes(bloco.horaInicio));
    }, 0);

    const percentualAgendamento = tarefas.length > 0 
      ? Math.round((idsAgendados.size / tarefas.length) * 100) 
      : 100;

    return {
      totalTarefas: tarefas.length,
      tarefasAgendadas: idsAgendados.size,
      percentualAgendamento,
      horasTotaisAlocadas: (totalMinutosAlocados / 60).toFixed(1)
    };
  }
};
