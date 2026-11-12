import QRCode from 'qrcode';
import paymentConfig from '../shared/payment-config.json';

function tlv(tag, value) {
  const length = String(value.length).padStart(2, '0');
  if (value.length > 99) throw new Error('Dữ liệu QR thanh toán vượt quá độ dài cho phép.');
  return `${tag}${length}${value}`;
}

function crc16(payload) {
  let crc = 0xffff;
  for (const character of payload) {
    crc ^= character.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function createVietQrPayload(amount, reference) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Số tiền thanh toán không hợp lệ.');
  if (!/^WD-[A-Z0-9]{10}$/.test(reference)) throw new Error('Mã đơn hàng không hợp lệ.');

  const merchantAccount = tlv('00', 'A000000727')
    + tlv('01', tlv('00', paymentConfig.bankBin)
      + tlv('01', paymentConfig.accountNumber)
      + tlv('02', 'QRIBFTTA'));
  const transferReference = tlv('62', tlv('05', reference));
  const payload = `000201010212${tlv('38', merchantAccount)}520400005303704${tlv('54', String(amount))}5802VN${transferReference}6304`;
  return `${payload}${crc16(payload)}`;
}

export function createVietQrImage(amount, reference) {
  return QRCode.toDataURL(createVietQrPayload(amount, reference), {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280
  });
}

export function createOrderId() {
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  return `WD-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export { paymentConfig };
