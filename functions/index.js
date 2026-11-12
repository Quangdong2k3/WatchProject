const crypto = require('node:crypto');
const { Resend } = require('resend');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https');
const catalog = require('../shared/catalog.json');
const paymentConfig = require('../shared/payment-config.json');

initializeApp();

const db = getFirestore();
const resendApiKey = defineSecret('RESEND_API_KEY');
const resendFromEmail = defineString('RESEND_FROM_EMAIL');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function validateText(value, label, maxLength, required = true) {
  if (typeof value !== 'string') throw new Error(`${label} không hợp lệ.`);
  const cleanValue = value.trim();
  if ((required && !cleanValue) || cleanValue.length > maxLength) {
    throw new Error(`${label} không hợp lệ.`);
  }
  return cleanValue;
}

function getCatalogItem(id) {
  if (typeof id !== 'string') throw new Error('Sản phẩm không hợp lệ.');
  const match = id.match(/^([a-z]+)-(\d+)(?:[-_][a-z0-9_-]+)?$/i);
  if (!match) throw new Error('Sản phẩm không hợp lệ.');

  const [, collectionKey, modelNumberText] = match;
  const collection = catalog[collectionKey.toLowerCase()];
  const modelNumber = Number(modelNumberText);
  if (!collection || !Number.isSafeInteger(modelNumber) || modelNumber < 1) {
    throw new Error('Sản phẩm không tồn tại.');
  }

  return {
    id,
    brand: collection.brand,
    name: `${collection.prefix} ${String(modelNumber).padStart(2, '0')}`,
    price: collection.basePrice + ((modelNumber - 1) % 4) * 125000
  };
}

function validateOrder(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Dữ liệu đơn hàng không hợp lệ.');
  const orderId = validateText(body.orderId, 'Mã đơn hàng', 13);
  if (!/^WD-[A-F0-9]{10}$/.test(orderId)) throw new Error('Mã đơn hàng không hợp lệ.');

  const customer = body.customer;
  if (!customer || typeof customer !== 'object' || Array.isArray(customer)) {
    throw new Error('Thông tin khách hàng không hợp lệ.');
  }

  const name = validateText(customer.name, 'Họ tên', 120);
  const phone = validateText(customer.phone, 'Số điện thoại', 24);
  if (!/^[+0-9(). -]{9,24}$/.test(phone)) throw new Error('Số điện thoại không hợp lệ.');
  const email = validateText(customer.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email không hợp lệ.');
  const address = validateText(customer.address, 'Địa chỉ', 500);
  const note = validateText(customer.note || '', 'Ghi chú', 500, false);

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 30) {
    throw new Error('Danh sách sản phẩm không hợp lệ.');
  }

  const items = body.items.map((item) => {
    if (!item || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new Error('Số lượng sản phẩm không hợp lệ.');
    }
    return { ...getCatalogItem(item.id), quantity: item.quantity };
  });
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isSafeInteger(total) || total < 1) throw new Error('Tổng tiền đơn hàng không hợp lệ.');

  return { orderId, customer: { name, phone, email, address, note }, items, total };
}

function formatPrice(value) {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

function renderOrderEmail(order) {
  const rows = order.items.map((item) => (
    `<tr><td>${escapeHtml(item.brand)} ${escapeHtml(item.name)} × ${item.quantity}</td><td>${formatPrice(item.price * item.quantity)}</td></tr>`
  )).join('');
  const note = order.customer.note ? `<p><strong>Ghi chú:</strong> ${escapeHtml(order.customer.note)}</p>` : '';
  const details = `
    <p><strong>Mã đơn:</strong> ${escapeHtml(order.orderCode)}</p>
    <p><strong>Khách hàng:</strong> ${escapeHtml(order.customer.name)}</p>
    <p><strong>Số điện thoại:</strong> ${escapeHtml(order.customer.phone)}</p>
    <p><strong>Email:</strong> ${escapeHtml(order.customer.email)}</p>
    <p><strong>Địa chỉ giao hàng:</strong> ${escapeHtml(order.customer.address)}</p>
    ${note}
    <table style="border-collapse:collapse;width:100%" cellpadding="8"><tbody>${rows}</tbody></table>
    <p><strong>Tổng cộng:</strong> ${formatPrice(order.total)}</p>
    <h3>Chuyển khoản VietinBank</h3>
    <p><strong>Số tài khoản:</strong> ${paymentConfig.accountNumber}</p>
    <p><strong>Chủ tài khoản:</strong> ${escapeHtml(paymentConfig.accountName)}</p>
    <p><strong>Nội dung chuyển khoản:</strong> ${escapeHtml(order.orderCode)}</p>
    <p>Đơn hàng đang chờ cửa hàng đối soát giao dịch. Email này không phải xác nhận đã thanh toán.</p>
  `;
  return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211d"><h2>Đơn hàng WATCH DAK</h2>${details}</div>`;
}

async function sendOrderEmails(order, emailStatus) {
  const resend = new Resend(resendApiKey.value());
  const html = renderOrderEmail(order);
  const recipients = [
    { key: 'customer', to: order.customer.email, subject: `WATCH DAK - Đã nhận đơn ${order.orderCode}` },
    { key: 'store', to: paymentConfig.storeEmail, subject: `Đơn hàng mới ${order.orderCode}` }
  ];

  for (const recipient of recipients) {
    if (emailStatus[recipient.key]) continue;
    const result = await resend.emails.send({
      from: resendFromEmail.value(),
      to: recipient.to,
      subject: recipient.subject,
      html
    });
    if (result.error) {
      console.error(`Resend failed for ${recipient.key} notification`, result.error);
      continue;
    }
    emailStatus[recipient.key] = true;
  }

  return emailStatus;
}

function responseOrder(order, emailStatus) {
  return {
    orderCode: order.orderCode,
    total: order.total,
    emailsSent: emailStatus.customer && emailStatus.store
  };
}

exports.createOrder = onRequest({
  region: 'asia-southeast1',
  cors: true,
  secrets: [resendApiKey]
}, async (request, response) => {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Phương thức gửi yêu cầu không được hỗ trợ.' });
    return;
  }

  let orderInput;
  try {
    orderInput = validateOrder(request.body);
  } catch (validationError) {
    response.status(400).json({ error: validationError.message });
    return;
  }

  const orderRef = db.collection('orders').doc(orderInput.orderId);
  try {
    let orderSnapshot = await orderRef.get();
    let order;
    let emailStatus;

    if (orderSnapshot.exists) {
      order = orderSnapshot.data();
      if (order.customer.email !== orderInput.customer.email || order.total !== orderInput.total
        || JSON.stringify(order.items) !== JSON.stringify(orderInput.items)) {
        response.status(409).json({ error: 'Mã đơn hàng đã được sử dụng cho thông tin khác.' });
        return;
      }
      emailStatus = order.emailStatus || { customer: false, store: false };
    } else {
      order = {
        ...orderInput,
        orderCode: `WD-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
        status: 'pending_payment',
        createdAt: FieldValue.serverTimestamp()
      };
      emailStatus = { customer: false, store: false };
      await orderRef.create({ ...order, emailStatus });
    }

    emailStatus = await sendOrderEmails(order, emailStatus);
    await orderRef.set({ emailStatus, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    response.status(200).json(responseOrder(order, emailStatus));
  } catch (error) {
    console.error('Unable to process order', error);
    response.status(500).json({ error: 'Chưa thể xử lý đơn hàng. Vui lòng thử lại hoặc liên hệ cửa hàng.' });
  }
});
