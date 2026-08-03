import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { jsPDF } from 'jspdf'
import type { CustomerOrder, SalesSession } from '../types/domain'
import { dateThai, thaiQuantity } from './format'

const WIDTH = 576
const PADDING = 32
const LINE_HEIGHT = 34
const TEAR_SPACE = LINE_HEIGHT * 6

export async function shareReceiptPdf(session: SalesSession, order: CustomerOrder) {
  const canvas = renderReceipt(session, order)
  const pageHeightMm = canvas.height / 7.2
  const pdf = new jsPDF({ unit: 'mm', format: [80, pageHeightMm] })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 80, pageHeightMm)
  const filename = `ใบเสร็จ-${session.name}-${order.customerName}.pdf`.replace(/[\\/:*?"<>|]/g, '-')

  if (Capacitor.isNativePlatform()) {
    const data = pdf.output('datauristring').split(',')[1]
    const file = await Filesystem.writeFile({
      path: `PorkShopReceipts/${filename}`,
      data,
      directory: Directory.Documents,
      recursive: true,
    })
    await Share.share({
      title: 'ใบเสร็จรับเงิน',
      text: `ใบเสร็จ ${session.name}`,
      files: [file.uri],
      dialogTitle: 'พิมพ์หรือส่งใบเสร็จ',
    })
    return
  }

  pdf.save(filename)
}

export async function shareSessionReceiptPdf(session: SalesSession) {
  const canvas = renderSessionReceipt(session)
  const pageHeightMm = canvas.height / 7.2
  const pdf = new jsPDF({ unit: 'mm', format: [80, pageHeightMm] })
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 80, pageHeightMm)
  const filename = `สรุปการขาย-${session.name}.pdf`.replace(/[\\/:*?"<>|]/g, '-')

  if (Capacitor.isNativePlatform()) {
    const data = pdf.output('datauristring').split(',')[1]
    const file = await Filesystem.writeFile({
      path: `PorkShopReceipts/${filename}`,
      data,
      directory: Directory.Documents,
      recursive: true,
    })
    await Share.share({
      title: 'สรุปรายการขาย',
      text: `สรุปรายการขาย ${session.name}`,
      files: [file.uri],
      dialogTitle: 'พิมพ์หรือส่งสรุปรายการขาย',
    })
    return
  }

  pdf.save(filename)
}

function renderReceipt(session: SalesSession, order: CustomerOrder) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = 8000
  const context = canvas.getContext('2d')!
  let y = PADDING
  context.fillStyle = '#111'
  context.font = '700 36px "Noto Sans Thai", sans-serif'
  context.textAlign = 'center'
  context.fillText('จรัสพรหมูสด', WIDTH / 2, y)
  y += 43
  context.font = '26px "Noto Sans Thai", sans-serif'
  context.fillText('ใบสรุปรายการขาย', WIDTH / 2, y)
  y += 46
  context.textAlign = 'left'
  context.font = '25px "Noto Sans Thai", sans-serif'
  y = drawText(context, `วันที่: ${dateThai(session.openedAt)}`, y)
  y = drawText(context, `เลขที่รายการ: ${session.name}`, y)
  y = drawText(context, `ลูกค้า: ${order.customerName}`, y + 8)
  y += 8
  context.strokeStyle = '#555'
  context.setLineDash([5, 4])
  context.beginPath(); context.moveTo(PADDING, y); context.lineTo(WIDTH - PADDING, y); context.stroke()
  context.setLineDash([])
  y += 34

  for (const line of order.lines) {
    context.font = '26px "Noto Sans Thai", sans-serif' //700
    y = drawText(context, line.productName, y)
    context.font = '25px "Noto Sans Thai", sans-serif'
    y = drawText(context, `${thaiQuantity(line.quantity)} × ${receiptMoney(line.pricePerKg)}`, y)
    context.textAlign = 'right'
    context.font = '26px "Noto Sans Thai", sans-serif' //700
    context.fillText(receiptMoney(line.total), WIDTH - PADDING, y - LINE_HEIGHT)
    context.textAlign = 'left'
    y += 9
  }

  context.strokeStyle = '#555'
  context.setLineDash([5, 4])
  context.beginPath(); context.moveTo(PADDING, y); context.lineTo(WIDTH - PADDING, y); context.stroke()
  context.setLineDash([])
  y += 42
  const total = order.lines.reduce((sum, line) => sum + line.total, 0)
  context.font = '700 30px "Noto Sans Thai", sans-serif'
  context.fillText('ยอดรวม', PADDING, y)
  context.textAlign = 'right'
  context.fillText(receiptMoney(total), WIDTH - PADDING, y)
  context.textAlign = 'center'
  context.font = '24px "Noto Sans Thai", sans-serif'
  y += 46
  context.fillText('ขอบคุณที่ใช้บริการ', WIDTH / 2, y)
  y += 22 + TEAR_SPACE
  drawDivider(context, y)

  const finalHeight = y + PADDING
  const trimmed = document.createElement('canvas')
  trimmed.width = WIDTH
  trimmed.height = finalHeight
  trimmed.getContext('2d')!.drawImage(canvas, 0, 0)
  return trimmed
}

function renderSessionReceipt(session: SalesSession) {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = 30000
  const context = canvas.getContext('2d')!
  let y = PADDING
  context.fillStyle = '#111'
  context.font = '700 36px "Noto Sans Thai", sans-serif'
  context.textAlign = 'center'
  context.fillText('จรัสพรหมูสด', WIDTH / 2, y)
  y += 43
  context.font = '26px "Noto Sans Thai", sans-serif'
  context.fillText('สรุปรายการขายทั้งหมด', WIDTH / 2, y)
  y += 46
  context.textAlign = 'left'
  context.font = '25px "Noto Sans Thai", sans-serif'
  y = drawText(context, `วันที่: ${dateThai(session.openedAt)}`, y)
  y = drawText(context, `เลขที่รายการ: ${session.name}`, y)
  y += 8

  for (const order of session.orders) {
    drawDivider(context, y)
    y += 36
    context.font = '700 25px "Noto Sans Thai", sans-serif'
    y = drawText(context, `ลูกค้า: ${order.customerName}`, y)
    for (const line of order.lines) {
      context.font = '26px "Noto Sans Thai", sans-serif' //700
      y = drawText(context, line.productName, y)
      context.font = '25px "Noto Sans Thai", sans-serif'
      y = drawText(context, `${thaiQuantity(line.quantity)} × ${receiptMoney(line.pricePerKg)}`, y)
      context.textAlign = 'right'
      context.font = '26px "Noto Sans Thai", sans-serif' //700
      context.fillText(receiptMoney(line.total), WIDTH - PADDING, y - LINE_HEIGHT)
      context.textAlign = 'left'
      y += 9
    }
    const customerTotal = order.lines.reduce((sum, line) => sum + line.total, 0)
    context.font = '700 25px "Noto Sans Thai", sans-serif'
    context.fillText('รวมลูกค้า', PADDING, y)
    context.textAlign = 'right'
    context.fillText(receiptMoney(customerTotal), WIDTH - PADDING, y)
    context.textAlign = 'left'
    y += 42
  }

  drawDivider(context, y)
  y += 42
  const grandTotal = session.orders.flatMap(order => order.lines).reduce((sum, line) => sum + line.total, 0)
  context.font = '700 30px "Noto Sans Thai", sans-serif'
  context.fillText('ยอดรวมทั้งรายการ', PADDING, y)
  context.textAlign = 'right'
  context.fillText(receiptMoney(grandTotal), WIDTH - PADDING, y)
  context.textAlign = 'center'
  context.font = '24px "Noto Sans Thai", sans-serif'
  y += 46
  context.fillText('ขอบคุณที่ใช้บริการ', WIDTH / 2, y)
  y += 22 + TEAR_SPACE
  drawDivider(context, y)

  const trimmed = document.createElement('canvas')
  trimmed.width = WIDTH
  trimmed.height = y + PADDING
  trimmed.getContext('2d')!.drawImage(canvas, 0, 0)
  return trimmed
}

function drawDivider(context: CanvasRenderingContext2D, y: number) {
  context.strokeStyle = '#555'
  context.setLineDash([5, 4])
  context.beginPath(); context.moveTo(PADDING, y); context.lineTo(WIDTH - PADDING, y); context.stroke()
  context.setLineDash([])
}

function receiptMoney(amount: number) {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(amount)
}

function drawText(context: CanvasRenderingContext2D, text: string, y: number) {
  const words = text.split(' ')
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (context.measureText(candidate).width > WIDTH - PADDING * 2 && line) {
      context.fillText(line, PADDING, y)
      y += LINE_HEIGHT
      line = word
    } else line = candidate
  }
  context.fillText(line, PADDING, y)
  return y + LINE_HEIGHT
}
