const ALLOWED_EXTERNAL_HOSTS = ['res.cloudinary.com'];
const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

export function normalizarUrlRecursoConfiavel(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  const trimmedUrl = url.trim();
  const normalizedUrl = trimmedUrl.toLowerCase();

  if (BLOCKED_PROTOCOLS.some(protocol => normalizedUrl.startsWith(protocol))) {
    return null;
  }

  if (trimmedUrl.startsWith('/assets/')) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith('assets/')) {
    return `/${trimmedUrl}`;
  }

  if (trimmedUrl.startsWith('blob:')) {
    return trimmedUrl;
  }

  return normalizarHttpConfiavel(trimmedUrl);
}

function normalizarHttpConfiavel(url: string): string | null {
  try {
    const baseOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsedUrl = new URL(url, baseOrigin);

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    const isSameOrigin = typeof window !== 'undefined' && parsedUrl.origin === window.location.origin;
    const isAllowedExternalHost = parsedUrl.protocol === 'https:'
      && ALLOWED_EXTERNAL_HOSTS.includes(parsedUrl.hostname);

    return isSameOrigin || isAllowedExternalHost ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}
