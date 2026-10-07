import api from '../api/client';

/**
 * Universal PDF helper for Cryo Scientific ERP.
 * Fetches PDF using authenticated Axios client with Bearer token,
 * creates an in-memory Object URL blob, and safely opens or downloads it.
 */
export const openPdfDocument = async (url, filename = 'document.pdf') => {
  try {
    const res = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Try opening in new tab
    const newWindow = window.open(blobUrl, '_blank');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // If browser blocked popup, trigger immediate direct download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Failed to open PDF via authenticated blob stream:', error);
    // Secondary fallback: open URL with query token
    const token = localStorage.getItem('cryo_erp_token');
    const separator = url.includes('?') ? '&' : '?';
    const targetUrl = token ? `${url}${separator}token=${encodeURIComponent(token)}` : url;
    window.open(targetUrl, '_blank');
  }
};

export default openPdfDocument;
