import { jsPDF } from 'jspdf';
import { Appointment } from '@/types/divination';

const wrapText = (text: string, maxChars: number): string[] => {
  if (!text) return [];
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur.trim()) lines.push(cur.trim());
      cur = w;
    } else {
      cur += ' ' + w;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
};

const labelPos = (p: string): string => {
  const map: Record<string, string> = {
    top: 'Topo (Espiritual)',
    left: 'Esquerda (Sombra)',
    center: 'Centro (Essência)',
    right: 'Direita (Dons)',
    base: 'Base (Fundação)'
  };
  return map[p] || p;
};

export const generatePDF = (appointment: Appointment, pixInfo: { pix: string; pixLabel: string }) => {
  const doc = new jsPDF();
  let y = 20;

  const drawText = (text: string, size = 12, options: { isBold?: boolean; color?: [number, number, number] } = {}) => {
    if (options.isBold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    
    if (options.color) doc.setTextColor(...options.color);
    else doc.setTextColor(0, 0, 0);
    
    doc.setFontSize(size);
    doc.text(text, 15, y);
    y += size * 0.5 + 2;
  };

  // Header
  drawText('✨ Sistema Divinatório — Cruz dos Odùs', 16, { isBold: true, color: [37, 99, 235] });
  y += 2;

  // Client info
  drawText(`Cliente: ${appointment.client_name}`, 12, { isBold: true });
  drawText(`WhatsApp: ${appointment.client_whatsapp}`, 11);
  drawText(`Nasc.: ${appointment.client_birthdate}`, 11);
  drawText(`Jogo: ${appointment.game_type_name} — R$ ${appointment.valor}`, 11);
  drawText(`Data/Hora: ${(() => {
    const [year, month, day] = appointment.scheduled_date.split('-');
    return `${day}/${month}/${year}`;
  })()} — ${appointment.scheduled_time}`, 11);

  y += 6;
  drawText('--- Cruz dos 5 Odùs ---', 12, { isBold: true });
  y += 6;

  // Cruz layout
  drawText(`Topo: ${appointment.cruz.top.number} — ${appointment.cruz.top.name}`, 12, { isBold: true });
  drawText(`Esquerda: ${appointment.cruz.left.number} — ${appointment.cruz.left.name}`, 11);
  drawText(`Centro: ${appointment.cruz.center.number} — ${appointment.cruz.center.name}`, 11);
  drawText(`Direita: ${appointment.cruz.right.number} — ${appointment.cruz.right.name}`, 11);
  drawText(`Base: ${appointment.cruz.base.number} — ${appointment.cruz.base.name}`, 12, { isBold: true });

  y += 8;
  drawText('--- Detalhes completos dos Odùs ---', 12, { isBold: true });
  y += 6;

  // Details for each position
  const positions: Array<keyof typeof appointment.cruz> = ['top', 'left', 'center', 'right', 'base'];
  
  for (const pos of positions) {
    const o = appointment.cruz[pos];
    if (!o) continue;

    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    drawText(`${labelPos(pos)} — ${o.name} (${o.number})`, 12, { isBold: true });
    drawText(`Ícone: ${o.icon || ''}  |  Significado: ${o.short || ''}`, 10);
    
    // Description with wrapping
    const descLines = wrapText(o.descricao || o.short || '', 80);
    for (const line of descLines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      drawText(line, 10);
    }

    drawText(`Òrìṣà(s): ${(o.orixas || []).join(', ')}`, 10);
    
    if (o.ebos && o.ebos.length) {
      drawText('Ebós:', 10, { isBold: true });
      for (const e of o.ebos) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        drawText(`- ${e}`, 10);
      }
    }
    y += 6;
  }

  // Footer with payment info
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  drawText('--- Informações de Pagamento ---', 11, { isBold: true });
  drawText(`Chave PIX: ${pixInfo.pix} (${pixInfo.pixLabel || ''})`, 10);

  // Save
  const filenameSafe = (appointment.client_name || 'agendamento').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
  doc.save(`Cruz_Odu_${filenameSafe}.pdf`);
};
