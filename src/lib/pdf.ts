import { jsPDF } from 'jspdf';
import { setorOf, cfgOf, calcPts, fd, fn, inR, td } from './utils';

export function gerarPDF(
    mes: string,
    users: any[],
    regs: any[],
    fats: any[],
    set: any[],
    cfg: any,
    sectorConfigs: any,
    bonus: any,
    metaHistory: any[]
) {
    if (!mes) return false;
    const [ano, mesN] = mes.split('-');
    const mesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesNome = mesNomes[+mesN - 1] + ' ' + ano;
    const mS = `${ano}-${mesN}-01`;
    const mE = `${ano}-${mesN}-${new Date(+ano, +mesN, 0).getDate()}`;

    const collabs = users.filter(u => u.role !== 'sup');

    // Montar dados de produtividade do mês
    const prodData = collabs.map(u => {
        const c = cfgOf(u.id, cfg, set, sectorConfigs, mes, metaHistory);
        const ur = regs.filter(r => r.uid === u.id && inR(r.d, mS, mE));
        const tot = ur.reduce((s: number, r: any) => s + (r.a || 0) + (r.c || 0), 0);
        const at = ur.reduce((s: number, r: any) => s + (r.a || 0), 0);
        const co = ur.reduce((s: number, r: any) => s + (r.c || 0), 0);
        const pts = calcPts(u.id, regs, cfg, set, sectorConfigs, bonus, metaHistory);
        const nivel = tot >= c.xm ? 'Maxima' : tot >= c.mm ? 'Media' : tot >= c.nm ? 'Minima' : 'Abaixo';
        
        let setorNome = '—';
        const userSetor = setorOf(u.id, set, mes, metaHistory);
        if (userSetor) setorNome = userSetor.nome;

        return {
            nome: u.name,
            cargo: u.cargo || '',
            tot, at, co, pts, nivel,
            metaX: c.xm, metaM: c.mm,
            xpm: c.xpm, mpm: c.mpm,
            setor: setorNome
        };
    }).sort((a, b) => b.pts - a.pts);

    // Montar dados de faturamento
    const fatData = set.map(s => {
        const sf = fats.filter(f => f.sid === s.id && inR(f.d, mS, mE));
        const tot = sf.reduce((a, f) => a + (f.v || 0), 0);
        const pct = s.meta ? Math.round((tot / s.meta) * 100) : 0;
        const cbs = (s.colaboradores || []).map((id: string) => (collabs.find(u => u.id === id) || {}).name).filter(Boolean);
        return { nome: s.nome, tot, meta: s.meta || 0, pct, cbs };
    }).sort((a, b) => b.tot - a.tot);

    buildPDF(mesNome, mS, mE, prodData, fatData, cfg, mesNome);
    return true;
}

function buildPDF(mesNome: string, mS: string, mE: string, prodData: any[], fatData: any[], cfg: any, titulo: string) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const G = { dark: '#14532d', mid: '#16a34a', light: '#dcfce7', gold: '#f59e0b', amber: '#92400e', gray: '#64748b', lgray: '#f1f5f9', white: '#ffffff', black: '#0f172a', red: '#ef4444', warn: '#f97316' };

    // Helpers
    const fc2 = (v: number) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fn2 = (v: number) => Number(v).toLocaleString('pt-BR');
    const hex2rgb = (h: string) => { const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16); return [r, g, b]; };
    const setFill = (c: string) => { const [r, g, b] = hex2rgb(c); doc.setFillColor(r, g, b); };
    const setTxt = (c: string) => { const [r, g, b] = hex2rgb(c); doc.setTextColor(r, g, b); };
    const setDraw = (c: string) => { const [r, g, b] = hex2rgb(c); doc.setDrawColor(r, g, b); };

    let y = 0; // cursor

    // ── PÁGINA 1: CAPA + PRODUTIVIDADE ──
    setFill(G.dark); doc.rect(0, 0, W, 42, 'F');
    setFill(G.mid); doc.rect(0, 38, W, 4, 'F');

    setTxt(G.white);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text('LABORATÓRIO HEMOLAB', 14, 16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Dr. Alexson Carvalho', 14, 23);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('RELATÓRIO ESTRATÉGICO MENSAL', 14, 32);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(titulo, 14, 38.5);

    const hoje = new Date().toLocaleDateString('pt-BR');
    doc.setFontSize(8); setTxt(G.light);
    doc.text('Gerado em: ' + hoje, W - 14, 32, { align: 'right' });
    doc.text('Período: ' + fd(mS) + ' a ' + fd(mE), W - 14, 37, { align: 'right' });

    y = 52;

    // ── SEÇÃO 1: RANKING DE PRODUTIVIDADE ──
    setFill(G.mid); doc.roundedRect(14, y, W - 28, 8, 2, 2, 'F');
    setTxt(G.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('  RANKING DE PRODUTIVIDADE — ' + titulo.toUpperCase(), 14, y + 5.5);
    y += 14;

    if (prodData.length === 0) {
        setTxt(G.gray); doc.setFont('helvetica', 'italic'); doc.setFontSize(10);
        doc.text('Nenhum colaborador cadastrado.', 14, y); y += 10;
    } else {
        const cols = [14, 14 + 38, 14 + 38 + 20, 14 + 38 + 20 + 20, 14 + 38 + 20 + 20 + 24, 14 + 38 + 20 + 20 + 24 + 22, 14 + 38 + 20 + 20 + 24 + 22 + 28];
        const cH = ['Colaborador', 'Cargo', 'Setor', 'Produção', 'Pontos', 'Meta Máx.', 'Nível'];

        setFill(G.lgray); doc.rect(14, y, W - 28, 7, 'F');
        setDraw('#e2e8f0'); doc.setLineWidth(0.3); doc.rect(14, y, W - 28, 7, 'S');
        setTxt(G.gray); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        cH.forEach((h, i) => doc.text(h, cols[i] + 1, y + 4.8));
        y += 7;

        prodData.forEach((u, idx) => {
            const rowH = 8;
            if (idx % 2 === 0) { setFill('#f8fafc'); doc.rect(14, y, W - 28, rowH, 'F'); }
            if (idx === 0) { setFill('#fef3c7'); doc.rect(14, y, W - 28, rowH, 'F'); }
            if (idx === 1) { setFill('#f1f5f9'); doc.rect(14, y, W - 28, rowH, 'F'); }
            if (idx === 2) { setFill('#fff7ed'); doc.rect(14, y, W - 28, rowH, 'F'); }

            setDraw('#e2e8f0'); doc.setLineWidth(0.2); doc.rect(14, y, W - 28, rowH, 'S');

            const rnkClr = idx === 0 ? G.gold : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : G.gray;
            setFill(rnkClr); doc.roundedRect(14.5, y + 1.5, 5, 5, 1, 1, 'F');
            setTxt(G.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
            doc.text(String(idx + 1), 17, y + 5.3, { align: 'center' });

            doc.setFontSize(8.5);
            setTxt(G.black); doc.setFont('helvetica', 'bold');
            doc.text(u.nome.substring(0, 18), cols[0] + 6, y + 5.2);
            doc.setFont('helvetica', 'normal'); setTxt(G.gray); doc.setFontSize(7.5);
            doc.text(u.cargo.substring(0, 12), cols[1] + 1, y + 5.2);
            doc.text(u.setor.substring(0, 10), cols[2] + 1, y + 5.2);
            setTxt(G.black); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
            doc.text(fn2(u.tot), cols[3] + 1, y + 5.2);

            setTxt(G.amber);
            doc.text('* ' + fn2(u.pts), cols[4] + 1, y + 5.2);
            setTxt(G.gray); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
            doc.text(fn2(u.metaX), cols[5] + 1, y + 5.2);

            const nClr = u.nivel === 'Maxima' ? G.gold : u.nivel === 'Media' ? G.mid : u.nivel === 'Minima' ? G.red : G.gray;
            const nTxt = u.nivel === 'Maxima' ? 'MAXIMA' : u.nivel === 'Media' ? 'MEDIA' : u.nivel === 'Minima' ? 'MINIMA' : 'ABAIXO';
            setFill(nClr); doc.roundedRect(cols[6], y + 2, 18, 4, 1, 1, 'F');
            setTxt(G.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(6.5);
            doc.text(nTxt, cols[6] + 9, y + 5, { align: 'center' });

            y += rowH;
            if (y > H - 40) { doc.addPage(); y = 20; }
        });
    }

    y += 10;

    // Top performers resumo
    const top3 = prodData.slice(0, 3);
    if (top3.length) {
        setFill(G.lgray); doc.roundedRect(14, y, W - 28, 7, 2, 2, 'F');
        setTxt(G.dark); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('TOP 3 COLABORADORES DO MES — ' + titulo.toUpperCase(), 14 + 3, y + 5);
        y += 10;
        const medals = ['1o LUGAR', '2o LUGAR', '3o LUGAR'];
        const mClrs = [G.gold, '#94a3b8', '#b45309'];
        const tw = (W - 28 - 12) / 3;
        top3.forEach((u, i) => {
            const bx = 14 + i * (tw + 6);
            setFill(G.white); doc.roundedRect(bx, y, tw, 26, 3, 3, 'F');
            setDraw(mClrs[i]); doc.setLineWidth(0.7); doc.roundedRect(bx, y, tw, 26, 3, 3, 'S');
            setFill(mClrs[i]); doc.roundedRect(bx, y, tw, 7, 3, 3, 'F');
            doc.rect(bx, y + 4, tw, 3, 'F');
            setTxt(G.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
            doc.text(medals[i], bx + tw / 2, y + 5.2, { align: 'center' });
            setTxt(G.black); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
            doc.text(u.nome.substring(0, 16), bx + tw / 2, y + 13, { align: 'center' });
            setTxt(G.gray); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
            doc.text(u.cargo, bx + tw / 2, y + 18, { align: 'center' });
            setTxt(G.amber); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
            doc.text('* ' + fn2(u.pts) + ' pts  |  ' + fn2(u.tot) + ' prod.', bx + tw / 2, y + 23, { align: 'center' });
        });
        y += 34;
    }

    // ── PÁGINA 2: FATURAMENTO ──
    if (y > H - 80 || fatData.length > 0) {
        doc.addPage(); y = 20;
    }

    setFill(G.dark); doc.roundedRect(14, y, W - 28, 8, 2, 2, 'F');
    setTxt(G.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('  RANKING DE FATURAMENTO POR SETOR — ' + titulo.toUpperCase(), 14, y + 5.5);
    y += 14;

    if (fatData.length === 0) {
        setTxt(G.gray); doc.setFont('helvetica', 'italic'); doc.setFontSize(10);
        doc.text('Nenhum setor cadastrado ou sem registros neste mes.', 14, y); y += 10;
    } else {
        const totalGeral = fatData.reduce((s, f) => s + f.tot, 0);
        const totalMeta = fatData.reduce((s, f) => s + f.meta, 0);
        setFill(G.lgray); doc.roundedRect(14, y, W - 28, 14, 2, 2, 'F');
        setTxt(G.dark); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text('TOTAL GERAL DO MES:', 17, y + 5.5);
        doc.setFontSize(13); setTxt(G.mid);
        doc.text(fc2(totalGeral), 17 + 45, y + 5.5);
        doc.setFontSize(8); setTxt(G.gray); doc.setFont('helvetica', 'normal');
        doc.text('Meta: ' + fc2(totalMeta) + '   Atingido: ' + Math.round(totalGeral / totalMeta * 100 || 0) + '%', 17, y + 11);
        y += 20;

        fatData.forEach((s, idx) => {
            if (y > H - 45) { doc.addPage(); y = 20; }
            const cH = 32, barW = W - 28 - 90;
            const posClr = s.pct >= 100 ? G.mid : s.pct >= 70 ? G.warn : G.red;

            setFill(G.white); doc.roundedRect(14, y, W - 28, cH, 3, 3, 'F');
            setDraw(s.pct >= 100 ? G.mid : s.pct >= 70 ? G.warn : G.red);
            doc.setLineWidth(0.4); doc.roundedRect(14, y, W - 28, cH, 3, 3, 'S');

            setFill(posClr); doc.roundedRect(14, y, 8, cH, 3, 3, 'F');
            doc.rect(17, y, 5, cH, 'F');
            setTxt(G.white); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
            doc.text(String(idx + 1), 18, y + cH / 2 + 1, { align: 'center' });

            setTxt(G.black); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
            doc.text(s.nome, 26, y + 8);
            setTxt(G.gray); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
            doc.text('Colaboradores: ' + (s.cbs.join(', ') || '—'), 26, y + 13.5);

            setTxt(posClr); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
            doc.text(fc2(s.tot), W - 14, y + 10, { align: 'right' });
            setTxt(G.gray); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
            doc.text('Meta: ' + fc2(s.meta), W - 14, y + 16, { align: 'right' });

            const barX = 26, barY = y + 20, bH = 5;
            setFill('#e2e8f0'); doc.roundedRect(barX, barY, barW, bH, 2, 2, 'F');
            const fill = Math.min(1, s.pct / 100);
            if (fill > 0) { setFill(posClr); doc.roundedRect(barX, barY, barW * fill, bH, 2, 2, 'F'); }
            setTxt(posClr); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
            doc.text(s.pct + '%', barX + barW + 4, barY + 4);

            y += cH + 6;
        });
    }

    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        setFill(G.dark); doc.rect(0, H - 10, W, 10, 'F');
        setTxt(G.light); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        doc.text('HemoLab — Dr. Alexson Carvalho  |  Relatório Estratégico ' + titulo, 14, H - 4);
        doc.text('Página ' + p + ' de ' + totalPages, W - 14, H - 4, { align: 'right' });
    }

    doc.save('Relatorio_HemoLab_' + titulo.replace(' ', '_') + '.pdf');
}
