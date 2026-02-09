// Aplicar máscara de CPF
const cpfInput = document.getElementById('cpf');

cpfInput.addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    e.target.value = value;
});

// Função para formatar data por extenso
function formatarDataExtenso(dataString) {
    const meses = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];

    const data = new Date(dataString + 'T00:00:00');
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const ano = data.getFullYear();

    return `${dia} de ${mes} de ${ano}`;
}

// Função para formatar data no formato dd/mm/yyyy
function formatarData(dataString) {
    const data = new Date(dataString + 'T00:00:00');
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

// Função para obter data atual
function obterDataAtual() {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();

    return `${dia}/${mes}/${ano}`;
}

// Função para converter imagem em base64
function getImageDataURL(imagePath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = imagePath;
    });
}

// Gerar PDF
async function gerarPDF(dados) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    try {
        // Adicionar logo
        const logoData = await getImageDataURL('logo.png');
        const logoWidth = 40;
        const logoHeight = 40;
        const logoX = (210 - logoWidth) / 2; // Centralizar
        doc.addImage(logoData, 'PNG', logoX, 20, logoWidth, logoHeight);
    } catch (error) {
        console.warn('Não foi possível carregar a logo:', error);
    }

    // Informações do CIAF
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text('CIAF - Centro Integrado de Atendimento à Saúde da Mulher', 105, 66, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('R. João Gama, 115 - São Benedito, Pindamonhangaba - SP, 12410-260', 105, 71, { align: 'center' });
    doc.text('(12) 3648-1518', 105, 75, { align: 'center' });

    // Configurações de fonte para título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);

    // Título
    doc.text('DECLARAÇÃO DE COMPARECIMENTO', 105, 88, { align: 'center' });

    // Linha decorativa
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.5);
    doc.line(40, 93, 170, 93);

    // Corpo do texto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);

    const margemEsquerda = 30;
    const margemDireita = 180;
    const larguraTexto = margemDireita - margemEsquerda;

    let y = 110;

    // Texto da declaração
    const texto = `Declaramos para os devidos fins que ${dados.nome}, portador(a) do CPF ${dados.cpf}, permaneceu em nossa unidade no dia ${formatarData(dados.data)} das ${dados.horaEntrada} às ${dados.horaSaida} para ${dados.motivo}.`;

    const linhas = doc.splitTextToSize(texto, larguraTexto);
    doc.text(linhas, margemEsquerda, y);

    y += linhas.length * 7 + 20;

    // Localidade e data
    const dataAtual = obterDataAtual();
    doc.text(`Pindamonhangaba, ${dataAtual}`, margemEsquerda, y);

    y += 30;

    // Linha de assinatura
    doc.line(70, y, 140, y);
    y += 7;

    doc.setFontSize(10);
    doc.text('Assinatura e Carimbo do Responsável', 105, y, { align: 'center' });

    // Rodapé
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text('Prefeitura Municipal de Pindamonhangaba - Secretaria de Saúde', 105, 280, { align: 'center' });

    // Salvar PDF
    const nomeArquivo = `Declaracao_${dados.nome.replace(/\s+/g, '_')}_${dados.data}.pdf`;
    doc.save(nomeArquivo);
}

// Manipular envio do formulário
document.getElementById('certificateForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    // Coletar dados do formulário
    const dados = {
        nome: document.getElementById('nome').value,
        cpf: document.getElementById('cpf').value,
        data: document.getElementById('data').value,
        horaEntrada: document.getElementById('horaEntrada').value,
        horaSaida: document.getElementById('horaSaida').value,
        motivo: document.querySelector('input[name="motivo"]:checked').value
    };

    // Validar se todos os campos estão preenchidos
    if (!dados.nome || !dados.cpf || !dados.data || !dados.horaEntrada || !dados.horaSaida) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    // Validar CPF (verificar se tem 11 dígitos)
    const cpfNumeros = dados.cpf.replace(/\D/g, '');
    if (cpfNumeros.length !== 11) {
        alert('Por favor, digite um CPF válido com 11 dígitos!');
        return;
    }

    // Validar horários
    if (dados.horaEntrada >= dados.horaSaida) {
        alert('O horário de saída deve ser posterior ao horário de entrada!');
        return;
    }

    // Gerar PDF
    try {
        await gerarPDF(dados);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    }
});

// Definir data de hoje como padrão
document.getElementById('data').valueAsDate = new Date();
