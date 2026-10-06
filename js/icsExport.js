/**
 * icsExport.js
 * Módulo responsável por exportar o cronograma gerado para o formato iCalendar (.ics)
 */

/**
 * Retorna a data da segunda-feira (YYYY-MM-DD) de uma semana que contém a data fornecida.
 * @param {Date} date
 * @returns {string}
 */
function _getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().split('T')[0];
}

/**
 * Retorna todas as segundas-feiras do mês do cronograma ou do mês atual,
 * de modo a cobrir todos os dias daquele mês.
 * @param {string|null} semanaInicio - Data de início do cronograma salvo (YYYY-MM-DD)
 * @returns {string[]} Array de strings YYYY-MM-DD representando cada segunda-feira
 */
function _getMondaysOfMonth(semanaInicio) {
    // Determina o mês de referência: usa o mês do cronograma salvo ou o mês atual
    const ref = semanaInicio ? new Date(`${semanaInicio}T12:00:00`) : new Date();
    const year = ref.getFullYear();
    const month = ref.getMonth(); // 0-indexed

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);

    // Segunda-feira da semana que contém o primeiro dia do mês
    const firstMonday = _getMonday(firstDay);

    const mondays = [];
    const current = new Date(`${firstMonday}T12:00:00`);

    // Avança semana a semana enquanto o início da semana ainda não passou do último dia do mês
    while (current <= lastDay) {
        mondays.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 7);
    }

    return mondays;
}

/**
 * Adiciona um bloco ao conteúdo ICS, retornando a string VEVENT.
 * @param {Object} bloco
 * @param {string} dtstamp - Timestamp da geração (formato ICS)
 * @returns {string}
 */
function _blocoToVEvent(bloco, dtstamp) {
    const dataStr = bloco.data.replace(/-/g, '');
    const startStr = bloco.horaInicio.replace(':', '') + '00';
    const endStr = bloco.horaFim.replace(':', '') + '00';

    // Formato local sem fuso horário (floating time), para assumir o fuso horário local do usuário
    const dtStart = dataStr + 'T' + startStr;
    const dtEnd = dataStr + 'T' + endStr;

    let vevent = "BEGIN:VEVENT\r\n";
    vevent += `UID:${bloco.id || (Date.now() + Math.random())}@planograma\r\n`;
    vevent += `DTSTAMP:${dtstamp}\r\n`;
    vevent += `DTSTART:${dtStart}\r\n`;
    vevent += `DTEND:${dtEnd}\r\n`;
    vevent += `SUMMARY:${bloco.nome}\r\n`;
    if (bloco.descricao) {
        vevent += `DESCRIPTION:${bloco.descricao}\r\n`;
    }
    vevent += "END:VEVENT\r\n";
    return vevent;
}

/**
 * Gera e baixa um arquivo .ics cobrindo o mês inteiro do cronograma.
 * Itera por todas as semanas do mês, gerando o cronograma para cada uma
 * e combinando todos os blocos em um único arquivo.
 */
window.generateICS = function() {
    if (!window.Scheduler || !window.Storage) {
        if (window.UI) UI.showToast('Erro interno: módulos necessários não encontrados.', 'error');
        return;
    }

    const config = Storage.getConfig();
    const atividadesFixas = Storage.getAtividadesFixas();
    const tarefas = Storage.getTarefas();
    const cronogramaAtual = Storage.getCronograma();

    // Usa a semana do cronograma salvo como referência do mês, ou o mês atual
    const semanaRef = cronogramaAtual ? cronogramaAtual.semanaInicio : null;
    const mondays = _getMondaysOfMonth(semanaRef);

    if (mondays.length === 0) {
        if (window.UI) UI.showToast('Não foi possível determinar as semanas do mês.', 'warning');
        return;
    }

    // Determina nome do mês para o arquivo
    const ref = semanaRef ? new Date(`${semanaRef}T12:00:00`) : new Date();
    const nomeMes = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        .replace(' de ', '-').replace(' ', '-');

    const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Planograma//Cronograma//PT\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";

    // Rastreia UIDs já adicionados para evitar duplicatas em semanas sobrepostas
    const uidsAdicionados = new Set();

    mondays.forEach(monday => {
        // Gera o cronograma desta semana do zero
        const cronSemana = Scheduler.gerarCronograma(config, atividadesFixas, tarefas, monday);

        (cronSemana.blocos || []).forEach(bloco => {
            // Só exporta blocos que caem dentro do mês de referência
            const blocoData = new Date(`${bloco.data}T12:00:00`);
            const mesRef = ref.getMonth();
            const anoRef = ref.getFullYear();
            if (blocoData.getMonth() !== mesRef || blocoData.getFullYear() !== anoRef) return;

            // Evita UIDs duplicados
            const uid = `${bloco.id || (bloco.data + bloco.horaInicio + bloco.nome)}`;
            if (uidsAdicionados.has(uid)) return;
            uidsAdicionados.add(uid);

            icsContent += _blocoToVEvent(bloco, dtstamp);
        });
    });

    icsContent += "END:VCALENDAR\r\n";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronograma_${nomeMes}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
