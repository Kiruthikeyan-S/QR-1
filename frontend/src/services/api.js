/**
 * API Service for QR Reader System
 * Handles communication with the FastAPI backend and includes offline client-side fallback parsing.
 */

const API_BASE = '/api';

export const scanImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/scan/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to scan image' }));
    throw new Error(err.detail || 'Failed to scan image');
  }

  return response.json();
};

export const parseRawData = async (rawData) => {
  try {
    const response = await fetch(`${API_BASE}/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_data: rawData }),
    });

    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.warn('Backend parse failed, using client-side fallback:', err);
  }

  // Client-side fallback if server is unreachable
  return clientSideParse(rawData);
};

export const generateQR = async (qrType, params, fillColor = '#0f172a', backColor = '#ffffff') => {
  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qr_type: qrType,
      params,
      fill_color: fillColor,
      back_color: backColor,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to generate QR' }));
    throw new Error(err.detail || 'Failed to generate QR');
  }

  return response.json();
};

export const getSampleQRs = async () => {
  const response = await fetch(`${API_BASE}/sample-qrs`);
  if (!response.ok) {
    throw new Error('Failed to fetch sample QR codes');
  }
  return response.json();
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Robust client-side fallback parser for offline or quick camera scans
 */
export const clientSideParse = (raw) => {
  const s = (raw || '').trim();
  if (!s) {
    return {
      raw_data: '',
      data_type: 'text',
      title: 'Empty QR',
      summary: 'No data contained',
      icon: 'AlertCircle',
      badge_color: 'gray',
      parsed_details: { text: '' },
      actions: [],
      validation_status: 'warning',
    };
  }

  // UPI
  if (s.startsWith('upi://pay')) {
    const url = new URL(s);
    const pa = url.searchParams.get('pa') || '';
    const pn = url.searchParams.get('pn') || '';
    const am = url.searchParams.get('am') || '';
    const cu = url.searchParams.get('cu') || 'INR';
    const tn = url.searchParams.get('tn') || '';

    return {
      raw_data: s,
      data_type: 'upi',
      title: `UPI Payment: ${pn || pa}`,
      summary: am ? `Pay ₹${am} to ${pn || pa}` : `Pay to ${pn || pa}`,
      icon: 'CreditCard',
      badge_color: 'emerald',
      parsed_details: { payee_vpa: pa, payee_name: pn, amount: am, currency: cu, note: tn, deep_link: s },
      actions: [
        { id: 'pay', label: am ? `Pay ₹${am}` : 'Pay with UPI App', icon: 'CreditCard', action_type: 'upi_pay', payload: s, primary: true },
        { id: 'copy_vpa', label: 'Copy UPI ID', icon: 'Copy', action_type: 'copy', payload: pa },
      ],
      validation_status: 'valid',
    };
  }

  // WiFi
  if (s.toUpperCase().startsWith('WIFI:')) {
    const content = s.slice(5);
    const tokens = content.split(';');
    const details = { ssid: '', auth_type: 'WPA', password: '', hidden: false };
    tokens.forEach((t) => {
      if (t.startsWith('S:')) details.ssid = t.slice(2);
      else if (t.startsWith('T:')) details.auth_type = t.slice(2) || 'nopass';
      else if (t.startsWith('P:')) details.password = t.slice(2);
      else if (t.startsWith('H:')) details.hidden = t.slice(2).toLowerCase() === 'true';
    });

    return {
      raw_data: s,
      data_type: 'wifi',
      title: `WiFi: ${details.ssid || 'Network'}`,
      summary: `SSID: ${details.ssid} | Security: ${details.auth_type}`,
      icon: 'Wifi',
      badge_color: 'blue',
      parsed_details: details,
      actions: [
        ...(details.password ? [{ id: 'pwd', label: 'Copy Password', icon: 'Key', action_type: 'copy', payload: details.password, primary: true }] : []),
        { id: 'ssid', label: 'Copy SSID', icon: 'Wifi', action_type: 'copy', payload: details.ssid },
      ],
      validation_status: 'valid',
    };
  }

  // vCard
  if (s.toUpperCase().includes('BEGIN:VCARD')) {
    const fnMatch = s.match(/FN:(.*?)(?:\r?\n|$)/i);
    const orgMatch = s.match(/ORG:(.*?)(?:\r?\n|$)/i);
    const telMatch = s.match(/TEL[^:]*:(.*?)(?:\r?\n|$)/i);
    const emailMatch = s.match(/EMAIL[^:]*:(.*?)(?:\r?\n|$)/i);
    const name = fnMatch ? fnMatch[1].trim() : 'Contact';
    const org = orgMatch ? orgMatch[1].trim() : '';
    const phone = telMatch ? telMatch[1].trim() : '';
    const email = emailMatch ? emailMatch[1].trim() : '';

    return {
      raw_data: s,
      data_type: 'contact',
      title: name,
      summary: [org, phone, email].filter(Boolean).join(' • ') || 'vCard Contact',
      icon: 'User',
      badge_color: 'purple',
      parsed_details: {
        name,
        organization: org,
        phones: phone ? [{ type: 'Phone', number: phone }] : [],
        emails: email ? [{ type: 'Email', email }] : [],
        vcf_data: s,
      },
      actions: [
        { id: 'save_vcf', label: 'Save Contact (.vcf)', icon: 'UserPlus', action_type: 'download', payload: s, primary: true },
        ...(phone ? [{ id: 'call', label: `Call ${phone}`, icon: 'Phone', action_type: 'call', payload: phone }] : []),
        ...(email ? [{ id: 'email', label: `Email ${email}`, icon: 'Mail', action_type: 'email', payload: email }] : []),
      ],
      validation_status: 'valid',
    };
  }

  // URL
  if (s.startsWith('http://') || s.startsWith('https://') || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(s)) {
    const url = s.startsWith('http') ? s : `https://${s}`;
    let domain = '';
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url;
    }

    return {
      raw_data: s,
      data_type: 'url',
      title: `Link: ${domain}`,
      summary: url,
      icon: 'Globe',
      badge_color: 'sky',
      parsed_details: { url, domain, is_secure: url.startsWith('https://') },
      actions: [
        { id: 'open', label: 'Open Link', icon: 'ExternalLink', action_type: 'link', payload: url, primary: true },
        { id: 'copy', label: 'Copy URL', icon: 'Copy', action_type: 'copy', payload: url },
      ],
      validation_status: 'valid',
    };
  }

  // Email
  if (s.toLowerCase().startsWith('mailto:')) {
    const email = s.slice(7).split('?')[0];
    return {
      raw_data: s,
      data_type: 'email',
      title: `Email: ${email}`,
      summary: `Send email to ${email}`,
      icon: 'Mail',
      badge_color: 'indigo',
      parsed_details: { to: email, mailto_url: s },
      actions: [
        { id: 'send', label: 'Compose Email', icon: 'Mail', action_type: 'email', payload: s, primary: true },
        { id: 'copy', label: 'Copy Email', icon: 'Copy', action_type: 'copy', payload: email },
      ],
      validation_status: 'valid',
    };
  }

  // Plain Text fallback
  return {
    raw_data: s,
    data_type: 'text',
    title: 'Text Content',
    summary: s.length > 80 ? `${s.slice(0, 80)}...` : s,
    icon: 'FileText',
    badge_color: 'slate',
    parsed_details: { text: s, char_count: s.length, word_count: s.split(/\s+/).filter(Boolean).length },
    actions: [{ id: 'copy', label: 'Copy Text', icon: 'Copy', action_type: 'copy', payload: s, primary: true }],
    validation_status: 'valid',
  };
};
